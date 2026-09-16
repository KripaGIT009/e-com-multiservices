package com.example.dropship.qikink;

import com.example.dropship.DropshipException;
import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderLine;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class QikinkPayloadTest {

    @Test
    void orderNumberStaysWithinFifteenCharactersAndDistinguishesRetries() {
        SupplierOrder so = QikinkDropshipAdapterTest.order();
        assertThat(QikinkPayload.orderNumber(so)).isEqualTo("ORD-464E6912");

        so.setAttempts(2);
        assertThat(QikinkPayload.orderNumber(so)).isEqualTo("ORD-464E6912-2");

        so.setOrderNumber("ORD-VERY-LONG-NUMBER-XYZ");
        so.setAttempts(1);
        assertThat(QikinkPayload.orderNumber(so)).hasSize(15).endsWith("NUMBER-XYZ");
    }

    @Test
    void amountsAreStringsWithoutTrailingZeros() {
        assertThat(QikinkPayload.money(new BigDecimal("699.00"))).isEqualTo("699");
        assertThat(QikinkPayload.money(new BigDecimal("1234.50"))).isEqualTo("1234.5");
        assertThat(QikinkPayload.money(BigDecimal.ZERO)).isEqualTo("0");
    }

    @Test
    void singleWordNamesHaveAnEmptyLastName() {
        SupplierOrder so = QikinkDropshipAdapterTest.order();
        so.setShipToName("Madonna");
        Map<String, Object> a = QikinkPayload.address(so);
        assertThat(a).containsEntry("first_name", "Madonna").containsEntry("last_name", "");
    }

    @Test
    void aLineWithoutAPartnerSkuIsRefusedBeforeAnythingIsSent() {
        SupplierOrder so = QikinkDropshipAdapterTest.order();
        SupplierOrderLine bare = new SupplierOrderLine();
        bare.setProductName("Mystery item");
        bare.setQuantity(1);
        bare.setUnitPrice(BigDecimal.TEN);
        so.addLine(bare);
        assertThatThrownBy(() -> QikinkPayload.build(so, 1))
            .isInstanceOf(DropshipException.class)
            .hasMessageContaining("Mystery item");
    }
}
