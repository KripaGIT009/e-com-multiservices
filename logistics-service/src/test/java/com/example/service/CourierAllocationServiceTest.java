package com.example.service;

import com.example.dto.QuoteRequest;
import com.example.dto.QuoteResponse;
import com.example.entity.AllocationSettings;
import com.example.entity.CourierRule;
import com.example.entity.DeliveryPartner;
import com.example.repository.AllocationSettingsRepository;
import com.example.repository.CourierRuleRepository;
import com.example.repository.DeliveryPartnerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** The §6.4 worked example and the edges of the §6.3 decision order. */
class CourierAllocationServiceTest {

    private DeliveryPartnerRepository partnerRepo;
    private CourierRuleRepository ruleRepo;
    private AllocationSettingsRepository settingsRepo;
    private CourierAllocationService service;

    private DeliveryPartner delhivery, bluedart, dtdc, xpressbees, indiapost;
    private final List<CourierRule> rules = new ArrayList<>();
    private AllocationSettings firstParty;

    @BeforeEach
    void setUp() {
        partnerRepo = mock(DeliveryPartnerRepository.class);
        ruleRepo = mock(CourierRuleRepository.class);
        settingsRepo = mock(AllocationSettingsRepository.class);
        service = new CourierAllocationService(partnerRepo, ruleRepo, settingsRepo);

        delhivery = partner("DELHIVERY", "Delhivery", 3, "55.00", "");
        bluedart = partner("BLUEDART", "Blue Dart", 2, "95.00", "");
        dtdc = partner("DTDC", "DTDC", 4, "60.00", "1,2,3,4,5,6");
        xpressbees = partner("XPRESSBEES", "XpressBees", 4, "48.00", "");
        indiapost = partner("INDIAPOST", "India Post", 7, "35.00", "");
        when(partnerRepo.findAll()).thenReturn(List.of(delhivery, bluedart, dtdc, xpressbees, indiapost));

        rules.add(rule(4L, "South metros", "BLUEDART", "56,60,50", null, null, 10));
        rules.add(rule(5L, "North-east", "INDIAPOST", null,
            "Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, Sikkim", null, 20));
        when(ruleRepo.findAll()).thenReturn(rules);

        firstParty = AllocationSettings.defaultsFor("FIRST_PARTY");
        firstParty.setDefaultPartnerCode("DELHIVERY");
        firstParty.setFallbackStrategy("CHEAPEST");
        when(settingsRepo.findById("FIRST_PARTY")).thenReturn(Optional.of(firstParty));
        when(settingsRepo.findById("SELLER")).thenReturn(Optional.empty());
    }

    // ---- §6.4 worked example -------------------------------------------------------

    @Test
    void bengaluruMatchesSouthMetrosRule() {
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "560038", "Karnataka", null, false));
        assertEquals("BLUEDART", r.selected().code());
        assertEquals("RULE", r.reason());
        assertEquals(4L, r.ruleId());
        assertEquals("South metros", r.ruleName());
        assertEquals("Blue Dart: rule South metros matched pincode prefix 56", r.explanation());
        assertNull(r.manualOverrideRejected());
    }

    @Test
    void guwahatiMatchesNorthEastRuleByState() {
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "781001", "assam", null, false));
        assertEquals("INDIAPOST", r.selected().code());
        assertEquals("RULE", r.reason());
        assertEquals("North-east", r.ruleName());
    }

    @Test
    void delhiUsesTheDefault() {
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "110001", "Delhi", null, false));
        assertEquals("DELHIVERY", r.selected().code());
        assertEquals("DEFAULT", r.reason());
        assertNull(r.ruleId());
    }

    @Test
    void delhiManualPickWins() {
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "110001", "Delhi", "XPRESSBEES", false));
        assertEquals("XPRESSBEES", r.selected().code());
        assertEquals("MANUAL", r.reason());
        assertNull(r.manualOverrideRejected());
    }

    @Test
    void delhiWithDefaultDisabledFallsToCheapest() {
        delhivery.setActive(false);
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "110001", "Delhi", null, false));
        assertEquals("INDIAPOST", r.selected().code());
        assertEquals("STRATEGY", r.reason());
        assertTrue(r.candidates().stream().noneMatch(c -> c.code().equals("DELHIVERY")));
    }

    // ---- decision-order edges ------------------------------------------------------

    @Test
    void manualChoiceThatCannotServeIsRejectedWithReasonAndEvaluationContinues() {
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "794001", "Meghalaya", "DTDC", false));
        assertEquals("DTDC does not serve 794001", r.manualOverrideRejected());
        assertEquals("INDIAPOST", r.selected().code());
        assertEquals("RULE", r.reason());
    }

    @Test
    void manualRejectionReasonsNameTheProblem() {
        assertEquals("Unknown courier NOPE",
            service.quote(quote("FIRST_PARTY", "110001", null, "NOPE", false)).manualOverrideRejected());
        bluedart.setActive(false);
        assertEquals("Blue Dart is disabled",
            service.quote(quote("FIRST_PARTY", "110001", null, "BLUEDART", false)).manualOverrideRejected());
        xpressbees.setCodSupported(false);
        QuoteResponse cod = service.quote(quote("FIRST_PARTY", "110001", null, "XPRESSBEES", true));
        assertEquals("XpressBees does not support cash on delivery", cod.manualOverrideRejected());
        assertEquals("DEFAULT", cod.reason());
    }

    @Test
    void manualOverrideDisabledForTheModel() {
        firstParty.setAllowManualOverride(false);
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "110001", "Delhi", "XPRESSBEES", false));
        assertEquals("DELHIVERY", r.selected().code());
        assertEquals("DEFAULT", r.reason());
        assertEquals("Manual courier selection is disabled for FIRST_PARTY", r.manualOverrideRejected());
    }

    @Test
    void codExcludesPartnersWithoutCod() {
        delhivery.setCodSupported(false);
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "110001", "Delhi", null, true));
        assertEquals("STRATEGY", r.reason());
        assertEquals("INDIAPOST", r.selected().code());
        assertTrue(r.candidates().stream().noneMatch(c -> c.code().equals("DELHIVERY")));
    }

    @Test
    void ruleScopedToAnotherModelIsIgnored() {
        rules.get(0).setFulfilmentModel("SELLER");
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "560038", "Karnataka", null, false));
        assertEquals("DEFAULT", r.reason());

        QuoteResponse seller = service.quote(quote("SELLER", "560038", "Karnataka", null, false));
        assertEquals("RULE", seller.reason());
        assertEquals("BLUEDART", seller.selected().code());
    }

    @Test
    void inactiveRuleIsIgnored() {
        rules.get(0).setActive(false);
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "560038", "Karnataka", null, false));
        assertEquals("DEFAULT", r.reason());
    }

    @Test
    void ruleWhosePartnerIsNotACandidateIsSkipped() {
        bluedart.setActive(false);
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "560038", "Karnataka", null, false));
        assertEquals("DEFAULT", r.reason());
    }

    @Test
    void lowerPriorityNumberWinsAndNullPriorityRunsLast() {
        rules.add(rule(1L, "Unnumbered", "XPRESSBEES", "5", null, null, null));
        rules.add(rule(9L, "Bengaluru first", "DTDC", "560", null, null, 5));
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "560038", null, null, false));
        assertEquals("Bengaluru first", r.ruleName());
    }

    @Test
    void nullModelIsFirstPartyAndMissingSettingsMeanFastest() {
        assertEquals("DEFAULT", service.quote(quote(null, "110001", null, null, false)).reason());

        QuoteResponse seller = service.quote(quote("SELLER", "110001", null, null, false));
        assertEquals("STRATEGY", seller.reason());
        assertEquals("BLUEDART", seller.selected().code());
    }

    @Test
    void strategyTieBreaks() {
        firstParty.setDefaultPartnerCode(null);
        firstParty.setFallbackStrategy("FASTEST");
        bluedart.setActive(false);
        // Delhivery 3 days is fastest.
        assertEquals("DELHIVERY", service.quote(quote(null, "110001", null, null, false)).selected().code());

        firstParty.setFallbackStrategy("PRIORITY");
        indiapost.setPriority(1);
        assertEquals("INDIAPOST", service.quote(quote(null, "110001", null, null, false)).selected().code());

        // Equal priority (default 100) and equal days: DTDC vs XpressBees tie on days → code order.
        indiapost.setPriority(null);
        delhivery.setActive(false);
        indiapost.setActive(false);
        assertEquals("DTDC", service.quote(quote(null, "110001", null, null, false)).selected().code());
    }

    @Test
    void noCandidateGivesNone() {
        for (DeliveryPartner p : List.of(delhivery, bluedart, dtdc, xpressbees, indiapost)) p.setActive(false);
        QuoteResponse r = service.quote(quote("FIRST_PARTY", "110001", null, null, false));
        assertNull(r.selected());
        assertEquals("NONE", r.reason());
        assertTrue(r.candidates().isEmpty());
    }

    @Test
    void badPincodeIs400() {
        for (String bad : new String[] { null, "", "56003", "5600381", "56003A" }) {
            ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> service.quote(quote(null, bad, null, null, false)));
            assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
        }
    }

    // ---- fixtures ------------------------------------------------------------------

    private static QuoteRequest quote(String model, String pincode, String state, String preferred, boolean cod) {
        return new QuoteRequest(model, pincode, state, null, cod, preferred);
    }

    private static DeliveryPartner partner(String code, String name, int days, String rate, String prefixes) {
        return new DeliveryPartner(code, name, "https://t/{trackingNumber}", days, new BigDecimal(rate), prefixes);
    }

    private static CourierRule rule(Long id, String name, String partner, String prefixes, String states,
                                    String model, Integer priority) {
        CourierRule r = new CourierRule();
        r.setId(id);
        r.setName(name);
        r.setPartnerCode(partner);
        r.setPincodePrefixes(prefixes);
        r.setStates(states);
        r.setFulfilmentModel(model);
        r.setPriority(priority);
        r.setActive(true);
        return r;
    }
}
