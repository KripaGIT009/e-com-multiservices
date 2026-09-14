package com.example.controller;

import com.example.dto.SupplierOrderDtos.SupplierOrderResponse;
import com.example.service.WebhookService;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Partner webhooks, forwarded by the BFF with the body untouched. The body is taken as
 * raw bytes so the adapter can verify the partner's signature over exactly what was sent
 * — re-serialised JSON would not match (CODE_REVIEW.md §2.9).
 */
@RestController
@RequestMapping("/api/dropship/webhooks")
public class WebhookController {

    private final WebhookService webhooks;

    public WebhookController(WebhookService webhooks) {
        this.webhooks = webhooks;
    }

    @PostMapping(value = "/{partnerCode}", consumes = "*/*")
    public SupplierOrderResponse receive(@PathVariable("partnerCode") String partnerCode,
                                         @RequestHeader Map<String, String> headers,
                                         @RequestBody(required = false) byte[] body) {
        // Header names are case-insensitive; normalise so adapters can look them up reliably.
        Map<String, String> normalised = new LinkedHashMap<>();
        headers.forEach((k, v) -> normalised.put(k.toLowerCase(), v));
        return webhooks.handle(partnerCode, normalised, body);
    }
}
