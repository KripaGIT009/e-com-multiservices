package com.example.dropship;

import com.example.entity.DropshipPartner;
import com.example.entity.SupplierOrder;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * How supplier-service talks to one kind of dropship partner (docs/commerce-architecture.md
 * §7.2). A partner row points at an adapter by {@link #key()}; every {@code @Component}
 * implementation is picked up by {@link DropshipAdapterRegistry}.
 *
 * <p>Only {@code MANUAL} exists. A partner-specific adapter is written only once that
 * partner has signed us up and supplied API documentation and sandbox credentials —
 * code written from marketing pages would look integrated and not be (P6). Credentials
 * come from the environment variables named in {@link #requiredEnvironment()}, never from
 * the database and never with a default value.
 */
public interface DropshipAdapter {

    /** Matches {@code DropshipPartner.integrationType}. */
    String key();

    String label();

    /** True when every credential this adapter needs is present. */
    boolean isConfigured();

    Set<DropshipCapability> capabilities();

    /** Environment variable names only — never their values. */
    List<String> requiredEnvironment();

    /** Places the order with the partner. Throws {@link DropshipException} on failure. */
    SubmissionResult submit(SupplierOrder order, DropshipPartner partner);

    default Optional<StatusUpdate> fetchStatus(String partnerOrderRef) {
        return Optional.empty();
    }

    default Optional<List<StockLevel>> fetchStock(List<String> partnerSkus) {
        return Optional.empty();
    }

    /** Empty means this partner has no webhook integration. */
    default Optional<WebhookEvent> parseWebhook(Map<String, String> headers, byte[] body) {
        return Optional.empty();
    }
}
