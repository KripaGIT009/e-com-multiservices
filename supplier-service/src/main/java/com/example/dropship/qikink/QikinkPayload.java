package com.example.dropship.qikink;

import com.example.dropship.DropshipException;
import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderLine;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds the body of Qikink's {@code POST /api/order/create}.
 *
 * <p>Shapes follow Qikink's published API reference and an independent integration
 * write-up (see docs/commerce-architecture.md §8.2). Two rules there are easy to get
 * wrong and are enforced here: {@code order_number} may be at most 15 characters, and
 * {@code quantity}, {@code price} and {@code total_order_value} are JSON <em>strings</em>.
 */
final class QikinkPayload {

    static final int ORDER_NUMBER_MAX = 15;
    static final String GATEWAY_PREPAID = "Prepaid";

    private QikinkPayload() {
    }

    static Map<String, Object> build(SupplierOrder so, int searchFromMyProducts) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("order_number", orderNumber(so));
        // "1" = Qikink ships the parcel; our courier allocation is not involved.
        body.put("qikink_shipping", "1");
        // Checkout is Razorpay-only, so every supplier order is prepaid (§18).
        body.put("gateway", GATEWAY_PREPAID);

        BigDecimal total = BigDecimal.ZERO;
        List<Map<String, Object>> lines = new ArrayList<>();
        for (SupplierOrderLine line : so.getLines()) {
            if (line.getPartnerSku() == null || line.getPartnerSku().isBlank()) {
                throw new DropshipException("Line '" + line.getProductName() + "' has no Qikink SKU");
            }
            if (line.getUnitPrice() == null) {
                throw new DropshipException("Line '" + line.getProductName() + "' has no selling price");
            }
            int qty = line.getQuantity() == null ? 0 : line.getQuantity();
            BigDecimal lineValue = line.getUnitPrice().multiply(BigDecimal.valueOf(qty));
            total = total.add(lineValue);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("search_from_my_products", searchFromMyProducts);
            item.put("sku", line.getPartnerSku());
            item.put("quantity", Integer.toString(qty));
            item.put("price", money(line.getUnitPrice()));
            lines.add(item);
        }
        body.put("total_order_value", money(total));
        body.put("line_items", lines);
        body.put("shipping_address", address(so));
        return body;
    }

    /**
     * Our order number is the reference Qikink shows us back. A retry after a failed
     * placement gets a suffix so that, if the first attempt did reach Qikink after all,
     * the two are distinguishable rather than silently colliding.
     */
    static String orderNumber(SupplierOrder so) {
        String base = so.getOrderNumber() != null ? so.getOrderNumber() : "MIS-" + so.getOrderId();
        int attempt = so.getAttempts() == null ? 1 : so.getAttempts();
        String number = attempt > 1 ? base + "-" + attempt : base;
        return number.length() <= ORDER_NUMBER_MAX
            ? number
            : number.substring(number.length() - ORDER_NUMBER_MAX);
    }

    static Map<String, Object> address(SupplierOrder so) {
        String name = so.getShipToName() == null ? "" : so.getShipToName().trim();
        int split = name.indexOf(' ');
        String first = split < 0 ? name : name.substring(0, split);
        String last = split < 0 ? "" : name.substring(split + 1).trim();

        Map<String, Object> a = new LinkedHashMap<>();
        a.put("first_name", first);
        a.put("last_name", last);
        a.put("address1", nullToEmpty(so.getShipToLine1()));
        a.put("address2", nullToEmpty(so.getShipToLine2()));
        a.put("phone", nullToEmpty(so.getShipToPhone()));
        a.put("email", nullToEmpty(so.getShipToEmail()));
        a.put("city", nullToEmpty(so.getShipToCity()));
        a.put("zip", nullToEmpty(so.getShipToPostalCode()));
        a.put("province", nullToEmpty(so.getShipToState()));
        a.put("country_code", "IN");
        return a;
    }

    /** "799" rather than "799.00": the documented examples carry no decimals. */
    static String money(BigDecimal amount) {
        return amount.stripTrailingZeros().toPlainString();
    }

    private static String nullToEmpty(String v) {
        return v == null ? "" : v;
    }
}
