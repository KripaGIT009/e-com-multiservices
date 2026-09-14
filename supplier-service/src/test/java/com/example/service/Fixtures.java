package com.example.service;

import com.example.client.OrderView;
import com.example.entity.DropshipListing;
import com.example.entity.DropshipPartner;
import com.example.entity.OnboardingStatus;
import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderLine;
import com.example.entity.SupplierOrderStatus;

import java.math.BigDecimal;
import java.util.List;

/** Test data shared by the service tests. */
final class Fixtures {

    private Fixtures() {
    }

    static OrderView.Address address() {
        return new OrderView.Address("Asha Rao", "12 MG Road", "Flat 4", "Bengaluru", "Karnataka", "560001", "9876543210");
    }

    static OrderView.Item dropship(String productId, String name, int qty, String price, String partnerCode) {
        return new OrderView.Item(null, productId, name, qty, new BigDecimal(price), "DROPSHIP", partnerCode);
    }

    static OrderView.Item firstParty(String productId, String name, int qty, String price) {
        return new OrderView.Item(null, productId, name, qty, new BigDecimal(price), "FIRST_PARTY", null);
    }

    static OrderView order(Long id, String status, List<OrderView.Item> items) {
        return new OrderView(id, "ORD-" + id, status, items, address());
    }

    static DropshipPartner partner(String code, String name, boolean active) {
        DropshipPartner p = new DropshipPartner();
        p.setCode(code);
        p.setName(name);
        p.setIntegrationType("MANUAL");
        p.setOnboardingStatus(OnboardingStatus.LIVE);
        p.setActive(active);
        return p;
    }

    static DropshipListing listing(long itemId, String partnerCode, String sku, String cost) {
        DropshipListing l = new DropshipListing();
        l.setId(itemId * 10);
        l.setItemId(itemId);
        l.setPartnerCode(partnerCode);
        l.setPartnerSku(sku);
        l.setCostPrice(new BigDecimal(cost));
        l.setActive(true);
        return l;
    }

    static SupplierOrder supplierOrder(Long id, SupplierOrderStatus status) {
        SupplierOrder so = new SupplierOrder();
        so.setId(id);
        so.setOrderId(7L);
        so.setOrderNumber("ORD-7");
        so.setPartnerCode("QIKINK");
        so.setStatus(status);
        so.setAttempts(1);
        so.setShipToName("Asha Rao");
        so.setShipToLine1("12 MG Road");
        so.setShipToPostalCode("560001");
        SupplierOrderLine line = new SupplierOrderLine();
        line.setItemId(101L);
        line.setProductName("Printed Tee");
        line.setQuantity(2);
        line.setUnitPrice(new BigDecimal("499.00"));
        so.addLine(line);
        return so;
    }
}
