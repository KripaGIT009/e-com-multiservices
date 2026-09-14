package com.example.service;

import com.example.domain.AllocationStrategy;
import com.example.domain.AssignmentReason;
import com.example.domain.FulfilmentModel;
import com.example.dto.QuoteRequest;
import com.example.dto.QuoteResponse;
import com.example.entity.AllocationSettings;
import com.example.entity.CourierRule;
import com.example.entity.DeliveryPartner;
import com.example.repository.AllocationSettingsRepository;
import com.example.repository.CourierRuleRepository;
import com.example.repository.DeliveryPartnerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * The single place a courier is chosen (docs/commerce-architecture.md §6). Checkout, Admin
 * → Fulfilment, Seller Central and the admin probe all call this, so the courier a preview
 * shows is the courier that gets assigned.
 *
 * Decision order, first match wins: MANUAL → RULE → DEFAULT → STRATEGY → NONE.
 */
@Service
public class CourierAllocationService {

    private final DeliveryPartnerRepository partners;
    private final CourierRuleRepository rules;
    private final AllocationSettingsRepository settings;

    public CourierAllocationService(DeliveryPartnerRepository partners, CourierRuleRepository rules,
                                    AllocationSettingsRepository settings) {
        this.partners = partners;
        this.rules = rules;
        this.settings = settings;
    }

    @Transactional(readOnly = true)
    public QuoteResponse quote(QuoteRequest request) {
        if (request == null) throw badRequest("A request body is required");
        String pincode = request.deliveryPincode() == null ? "" : request.deliveryPincode().trim();
        if (!pincode.matches("\\d{6}")) throw badRequest("deliveryPincode must be a 6-digit pincode");
        FulfilmentModel model = request.fulfilmentModel() == null || request.fulfilmentModel().isBlank()
            ? FulfilmentModel.FIRST_PARTY
            : FulfilmentModel.parse(request.fulfilmentModel())
                .orElseThrow(() -> badRequest("Unknown fulfilmentModel " + request.fulfilmentModel()));
        boolean cod = Boolean.TRUE.equals(request.cod());

        AllocationSettings policy = settings.findById(model.name())
            .orElseGet(() -> AllocationSettings.defaultsFor(model.name()));
        AllocationStrategy strategy = policy.effectiveStrategy();

        List<DeliveryPartner> all = partners.findAll();
        List<DeliveryPartner> candidates = all.stream()
            .filter(p -> p.isActive() && p.servesPincode(pincode) && (!cod || p.supportsCod()))
            .sorted(comparator(strategy))
            .toList();
        List<QuoteResponse.Candidate> candidateView = candidates.stream().map(QuoteResponse.Candidate::of).toList();

        // 1. Manual choice. A choice that cannot be honoured is reported, never silently replaced.
        String rejected = null;
        String preferred = request.preferredPartnerCode();
        if (preferred != null && !preferred.isBlank()) {
            String code = preferred.trim();
            Optional<DeliveryPartner> chosen = candidate(candidates, code);
            if (!policy.manualOverrideAllowed()) {
                rejected = "Manual courier selection is disabled for " + model.name();
            } else if (chosen.isPresent()) {
                DeliveryPartner p = chosen.get();
                return result(p, AssignmentReason.MANUAL, null, null,
                    p.getName() + ": chosen manually", null, candidateView);
            } else {
                rejected = whyNotCandidate(all, code, pincode, cod);
            }
        }

        // 2. Rules — this model's or any model's, by priority (unnumbered last), then id.
        List<CourierRule> ordered = rules.findAll().stream()
            .filter(CourierRule::isEnabled)
            .filter(r -> r.getFulfilmentModel() == null || r.getFulfilmentModel().isBlank()
                      || r.getFulfilmentModel().trim().equalsIgnoreCase(model.name()))
            .sorted(Comparator.comparing(CourierRule::getPriority, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(CourierRule::getId, Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
        for (CourierRule rule : ordered) {
            Optional<DeliveryPartner> target = candidate(candidates, rule.getPartnerCode());
            if (target.isEmpty()) continue;
            String matched = match(rule, pincode, request.deliveryState());
            if (matched == null) continue;
            DeliveryPartner p = target.get();
            return result(p, AssignmentReason.RULE, rule.getId(), rule.getName(),
                p.getName() + ": rule " + rule.getName() + " matched " + matched, rejected, candidateView);
        }

        // 3. The model's default courier.
        String defaultCode = policy.getDefaultPartnerCode();
        if (defaultCode != null && !defaultCode.isBlank()) {
            Optional<DeliveryPartner> def = candidate(candidates, defaultCode);
            if (def.isPresent()) {
                DeliveryPartner p = def.get();
                return result(p, AssignmentReason.DEFAULT, null, null,
                    p.getName() + ": default courier for " + model.name(), rejected, candidateView);
            }
        }

        // 4. Strategy over whatever is left. Candidates are already sorted by it.
        if (!candidates.isEmpty()) {
            DeliveryPartner p = candidates.get(0);
            String explanation = p.getName() + ": " + describe(strategy) + " available courier (" + strategy.name() + ")";
            if (defaultCode != null && !defaultCode.isBlank()) {
                explanation += "; default " + defaultCode.trim() + " is not available for " + pincode;
            }
            return result(p, AssignmentReason.STRATEGY, null, null, explanation, rejected, candidateView);
        }

        // 5. Nobody can take it. The order is still created, with no courier.
        String none = "No active courier serves " + pincode + (cod ? " with cash on delivery" : "");
        return new QuoteResponse(null, AssignmentReason.NONE.name(), null, null, none, rejected, candidateView);
    }

    /** Human reason a manually chosen code is not a candidate. */
    private static String whyNotCandidate(List<DeliveryPartner> all, String code, String pincode, boolean cod) {
        Optional<DeliveryPartner> found = candidate(all, code);
        if (found.isEmpty()) return "Unknown courier " + code;
        DeliveryPartner p = found.get();
        if (!p.isActive()) return p.getName() + " is disabled";
        if (!p.servesPincode(pincode)) return p.getName() + " does not serve " + pincode;
        if (cod && !p.supportsCod()) return p.getName() + " does not support cash on delivery";
        return p.getName() + " is not available";
    }

    /** What matched, for the explanation — or null. Prefixes are checked before states. */
    static String match(CourierRule rule, String pincode, String deliveryState) {
        for (String prefix : rule.prefixList()) {
            if (pincode.startsWith(prefix)) return "pincode prefix " + prefix;
        }
        if (deliveryState != null && !deliveryState.isBlank()) {
            String state = deliveryState.trim();
            for (String s : rule.stateList()) {
                if (s.equalsIgnoreCase(state)) return "state " + s;
            }
        }
        return null;
    }

    static Comparator<DeliveryPartner> comparator(AllocationStrategy strategy) {
        Comparator<DeliveryPartner> days = Comparator.comparing(DeliveryPartner::getEstimatedDays,
            Comparator.nullsLast(Comparator.<Integer>naturalOrder()));
        Comparator<DeliveryPartner> rate = Comparator.comparing(DeliveryPartner::getBaseRate,
            Comparator.nullsLast(Comparator.<BigDecimal>naturalOrder()));
        Comparator<DeliveryPartner> priority = Comparator.comparingInt(DeliveryPartner::effectivePriority);
        Comparator<DeliveryPartner> byCode = Comparator.comparing(DeliveryPartner::getCode,
            Comparator.nullsLast(Comparator.<String>naturalOrder()));
        Comparator<DeliveryPartner> primary = switch (strategy) {
            case FASTEST -> days.thenComparing(rate);
            case CHEAPEST -> rate.thenComparing(days);
            case PRIORITY -> priority.thenComparing(days);
        };
        return primary.thenComparing(byCode);
    }

    private static String describe(AllocationStrategy strategy) {
        return switch (strategy) {
            case FASTEST -> "fastest";
            case CHEAPEST -> "cheapest";
            case PRIORITY -> "highest-priority";
        };
    }

    private static Optional<DeliveryPartner> candidate(List<DeliveryPartner> candidates, String code) {
        if (code == null) return Optional.empty();
        String wanted = code.trim();
        return candidates.stream().filter(p -> p.getCode() != null && p.getCode().equalsIgnoreCase(wanted)).findFirst();
    }

    private static QuoteResponse result(DeliveryPartner p, AssignmentReason reason, Long ruleId, String ruleName,
                                        String explanation, String rejected, List<QuoteResponse.Candidate> candidates) {
        return new QuoteResponse(QuoteResponse.Selected.of(p), reason.name(), ruleId, ruleName,
            explanation, rejected, candidates);
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
