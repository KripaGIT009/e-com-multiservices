package com.example.service;

import com.example.dto.CourierRuleRequest;
import com.example.dto.CourierRuleResponse;
import com.example.entity.CourierRule;
import com.example.entity.DeliveryPartner;
import com.example.repository.CourierRuleRepository;
import com.example.repository.DeliveryPartnerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class CourierRuleServiceTest {

    private CourierRuleRepository rules;
    private DeliveryPartnerRepository partners;
    private CourierRuleService service;

    @BeforeEach
    void setUp() {
        rules = mock(CourierRuleRepository.class);
        partners = mock(DeliveryPartnerRepository.class);
        service = new CourierRuleService(rules, partners);
        when(partners.findByCode(anyString())).thenReturn(Optional.empty());
        when(partners.findByCode("BLUEDART")).thenReturn(Optional.of(
            new DeliveryPartner("BLUEDART", "Blue Dart", null, 2, new BigDecimal("95.00"), "")));
        when(rules.save(any(CourierRule.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void validRuleIsNormalisedAndSaved() {
        CourierRuleResponse r = service.create(new CourierRuleRequest(
            "South metros", "bluedart", " 56, 60 ,50,", null, "first_party", 10, null));
        assertEquals("BLUEDART", r.partnerCode());
        assertEquals("56,60,50", r.pincodePrefixes());
        assertEquals("FIRST_PARTY", r.fulfilmentModel());
        assertTrue(r.active());
        assertNull(r.states());
    }

    @Test
    void statesAloneAreEnough() {
        CourierRuleResponse r = service.create(new CourierRuleRequest(
            "North-east", "BLUEDART", null, "Assam, Meghalaya", null, 20, true));
        assertEquals("Assam,Meghalaya", r.states());
        assertNull(r.fulfilmentModel());
    }

    @Test
    void unknownPartnerIs400() {
        assertBadRequest(new CourierRuleRequest("x", "NOPE", "56", null, null, 1, true));
    }

    @Test
    void neitherPrefixesNorStatesIs400() {
        assertBadRequest(new CourierRuleRequest("x", "BLUEDART", " , ", "", null, 1, true));
    }

    @Test
    void prefixMustBeOneToSixDigits() {
        assertBadRequest(new CourierRuleRequest("x", "BLUEDART", "56,ABC", null, null, 1, true));
        assertBadRequest(new CourierRuleRequest("x", "BLUEDART", "5600381", null, null, 1, true));
    }

    @Test
    void unknownModelAndMissingNameAre400() {
        assertBadRequest(new CourierRuleRequest("x", "BLUEDART", "56", null, "WHOLESALE", 1, true));
        assertBadRequest(new CourierRuleRequest(" ", "BLUEDART", "56", null, null, 1, true));
    }

    @Test
    void updateAppliesSameValidationAndKeepsActiveWhenOmitted() {
        CourierRule stored = new CourierRule();
        stored.setId(4L);
        stored.setActive(false);
        stored.setPriority(10);
        when(rules.findById(4L)).thenReturn(Optional.of(stored));

        assertThrows(ResponseStatusException.class, () -> service.update(4L,
            new CourierRuleRequest("x", "BLUEDART", "56A", null, null, null, null)));

        CourierRuleResponse r = service.update(4L,
            new CourierRuleRequest("South", "BLUEDART", null, "Karnataka", null, null, null));
        assertFalse(r.active());
        assertEquals(10, r.priority());
        assertNull(r.pincodePrefixes());
        assertEquals("Karnataka", r.states());
    }

    @Test
    void deletingUnknownRuleIs404() {
        when(rules.existsById(99L)).thenReturn(false);
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.delete(99L));
        assertEquals(HttpStatus.NOT_FOUND, e.getStatusCode());
    }

    private void assertBadRequest(CourierRuleRequest request) {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.create(request));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
        verify(rules, never()).save(any());
    }
}
