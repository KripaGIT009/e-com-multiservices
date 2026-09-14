package com.example.service;

import com.example.domain.FulfilmentModel;
import com.example.dto.CourierRuleRequest;
import com.example.dto.CourierRuleResponse;
import com.example.entity.CourierRule;
import com.example.entity.DeliveryPartner;
import com.example.repository.CourierRuleRepository;
import com.example.repository.DeliveryPartnerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/**
 * CRUD for courier rules, with the §9.3 validation. A rule that could never match — no
 * prefixes and no states — or that points at a courier we do not have is refused rather
 * than stored, because allocation would skip it silently and nobody would know why.
 */
@Service
public class CourierRuleService {

    private final CourierRuleRepository rules;
    private final DeliveryPartnerRepository partners;

    public CourierRuleService(CourierRuleRepository rules, DeliveryPartnerRepository partners) {
        this.rules = rules;
        this.partners = partners;
    }

    @Transactional(readOnly = true)
    public List<CourierRuleResponse> list() {
        return rules.findAll().stream()
            .sorted(Comparator.comparing(CourierRule::getPriority, Comparator.nullsLast(Comparator.<Integer>naturalOrder()))
                .thenComparing(CourierRule::getId, Comparator.nullsLast(Comparator.<Long>naturalOrder())))
            .map(CourierRuleResponse::from)
            .toList();
    }

    @Transactional
    public CourierRuleResponse create(CourierRuleRequest request) {
        CourierRule rule = new CourierRule();
        apply(rule, request);
        rule.setPriority(request.priority());
        rule.setActive(request.active() == null || request.active());
        return CourierRuleResponse.from(rules.save(rule));
    }

    /**
     * Replaces the rule's matching fields (so prefixes can be swapped for states, or the
     * model cleared back to "any"); priority and active change only when supplied.
     */
    @Transactional
    public CourierRuleResponse update(Long id, CourierRuleRequest request) {
        CourierRule rule = rules.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Courier rule not found: " + id));
        apply(rule, request);
        if (request.priority() != null) rule.setPriority(request.priority());
        if (request.active() != null) rule.setActive(request.active());
        return CourierRuleResponse.from(rules.save(rule));
    }

    @Transactional
    public void delete(Long id) {
        if (!rules.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Courier rule not found: " + id);
        }
        rules.deleteById(id);
    }

    private void apply(CourierRule rule, CourierRuleRequest r) {
        if (r == null) throw badRequest("A request body is required");
        if (r.name() == null || r.name().isBlank()) throw badRequest("name is required");
        String name = r.name().trim();
        if (name.length() > 80) throw badRequest("name must be at most 80 characters");

        if (r.partnerCode() == null || r.partnerCode().isBlank()) throw badRequest("partnerCode is required");
        String code = r.partnerCode().trim().toUpperCase();
        DeliveryPartner partner = partners.findByCode(code)
            .orElseThrow(() -> badRequest("Unknown delivery partner " + code));

        List<String> prefixes = CourierRule.split(r.pincodePrefixes());
        for (String prefix : prefixes) {
            if (!prefix.matches("\\d{1,6}")) {
                throw badRequest("Pincode prefix '" + prefix + "' must be 1–6 digits");
            }
        }
        List<String> states = CourierRule.split(r.states());
        if (prefixes.isEmpty() && states.isEmpty()) {
            throw badRequest("A rule needs at least one pincode prefix or state");
        }
        String prefixCsv = String.join(",", prefixes);
        String stateCsv = String.join(",", states);
        if (prefixCsv.length() > 500 || stateCsv.length() > 500) {
            throw badRequest("pincodePrefixes and states must each be at most 500 characters");
        }

        String model = null;
        if (r.fulfilmentModel() != null && !r.fulfilmentModel().isBlank()) {
            model = FulfilmentModel.parse(r.fulfilmentModel())
                .orElseThrow(() -> badRequest("Unknown fulfilmentModel " + r.fulfilmentModel()))
                .name();
        }

        rule.setName(name);
        rule.setPartnerCode(partner.getCode());
        rule.setPincodePrefixes(prefixes.isEmpty() ? null : prefixCsv);
        rule.setStates(states.isEmpty() ? null : stateCsv);
        rule.setFulfilmentModel(model);
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
