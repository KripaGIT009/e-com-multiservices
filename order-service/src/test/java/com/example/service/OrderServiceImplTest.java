package com.example.service;

import com.example.OrderSaga;
import com.example.common.SagaEvent;
import com.example.dto.CreateOrderItemRequest;
import com.example.dto.CreateOrderRequest;
import com.example.dto.OrderDTO;
import com.example.dto.OrderItemDTO;
import com.example.dto.UpdateDeliveryRequest;
import com.example.entity.Order;
import com.example.entity.OrderItem;
import com.example.entity.OrderStatus;
import com.example.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private KafkaTemplate<String, SagaEvent> kafkaTemplate;
    @Mock
    private OrderSaga orderSaga;

    private OrderServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new OrderServiceImpl(orderRepository, kafkaTemplate, orderSaga);
        lenient().when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static CreateOrderItemRequest line(String productId, Long sellerId, String model, String partnerCode) {
        return CreateOrderItemRequest.builder()
                .productId(productId)
                .productName("Product " + productId)
                .quantity(2)
                .unitPrice(new BigDecimal("100.00"))
                .sellerId(sellerId)
                .fulfilmentModel(model)
                .fulfilmentPartnerCode(partnerCode)
                .build();
    }

    private static Order existingOrder() {
        return Order.builder()
                .id(5L)
                .orderNumber("ORD-TEST")
                .customerId("42")
                .status(OrderStatus.PENDING)
                .totalAmount(new BigDecimal("200.00"))
                .deliveryPartnerCode("DELHIVERY")
                .deliveryAssignmentReason("RULE")
                .items(new ArrayList<>())
                .build();
    }

    @Test
    void createSnapshotsFulfilmentFieldsAndAssignmentReason() {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .customerId("42")
                .deliveryPartnerCode("DELHIVERY")
                .deliveryAssignmentReason("RULE")
                .items(List.of(
                        line("1", null, "FIRST_PARTY", null),
                        line("2", 3L, "SELLER", null),
                        line("3", null, "DROPSHIP", "QIKINK")))
                .build();

        OrderDTO dto = service.createOrder(request);

        ArgumentCaptor<Order> saved = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(saved.capture());
        Order order = saved.getValue();
        assertThat(order.getDeliveryAssignmentReason()).isEqualTo("RULE");
        assertThat(order.getItems()).extracting(OrderItem::getFulfilmentModel)
                .containsExactly("FIRST_PARTY", "SELLER", "DROPSHIP");
        assertThat(order.getItems()).extracting(OrderItem::getFulfilmentPartnerCode)
                .containsExactly(null, null, "QIKINK");
        assertThat(order.getTotalAmount()).isEqualByComparingTo("600.00");

        assertThat(dto.getDeliveryAssignmentReason()).isEqualTo("RULE");
        assertThat(dto.getItems()).extracting(OrderItemDTO::getFulfilmentModel)
                .containsExactly("FIRST_PARTY", "SELLER", "DROPSHIP");
        assertThat(dto.getItems()).extracting(OrderItemDTO::getFulfilmentPartnerCode)
                .containsExactly(null, null, "QIKINK");
    }

    @Test
    void legacyLinesWithoutModelResolveFromSellerIdInDto() {
        Order order = existingOrder();
        order.getItems().add(OrderItem.builder().order(order).productId("1").productName("A")
                .quantity(1).unitPrice(BigDecimal.TEN).sellerId(9L).build());
        order.getItems().add(OrderItem.builder().order(order).productId("2").productName("B")
                .quantity(1).unitPrice(BigDecimal.TEN).build());
        when(orderRepository.findByIdWithItems(5L)).thenReturn(Optional.of(order));

        OrderDTO dto = service.getOrderById(5L);

        assertThat(dto.getItems()).extracting(OrderItemDTO::getFulfilmentModel)
                .containsExactly("SELLER", "FIRST_PARTY");
        // The stored row is not rewritten by reading it.
        assertThat(order.getItems()).extracting(OrderItem::getFulfilmentModel).containsOnlyNulls();
    }

    @Test
    void updateDeliveryPartnerPatchesReasonWhenSupplied() {
        Order order = existingOrder();
        when(orderRepository.findById(5L)).thenReturn(Optional.of(order));

        UpdateDeliveryRequest request = new UpdateDeliveryRequest();
        request.setDeliveryPartnerCode("BLUEDART");
        request.setDeliveryAssignmentReason("MANUAL");
        OrderDTO dto = service.updateDeliveryPartner(5L, request);

        assertThat(order.getDeliveryPartnerCode()).isEqualTo("BLUEDART");
        assertThat(order.getDeliveryAssignmentReason()).isEqualTo("MANUAL");
        assertThat(dto.getDeliveryAssignmentReason()).isEqualTo("MANUAL");
    }

    @Test
    void updateDeliveryPartnerKeepsReasonWhenNotSupplied() {
        Order order = existingOrder();
        when(orderRepository.findById(5L)).thenReturn(Optional.of(order));

        UpdateDeliveryRequest request = new UpdateDeliveryRequest();
        request.setDeliveryPartnerCode("BLUEDART");
        OrderDTO dto = service.updateDeliveryPartner(5L, request);

        assertThat(order.getDeliveryPartnerCode()).isEqualTo("BLUEDART");
        assertThat(order.getDeliveryAssignmentReason()).isEqualTo("RULE");
        assertThat(dto.getDeliveryAssignmentReason()).isEqualTo("RULE");
    }

    @Test
    void unknownOrderIdThrowsOrderNotFound() {
        when(orderRepository.findByIdWithItems(99L)).thenReturn(Optional.empty());
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());
        when(orderRepository.findByOrderNumber("ORD-NOPE")).thenReturn(Optional.empty());
        when(orderRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> service.getOrderById(99L)).isInstanceOf(OrderNotFoundException.class);
        assertThatThrownBy(() -> service.getOrderByNumber("ORD-NOPE")).isInstanceOf(OrderNotFoundException.class);
        assertThatThrownBy(() -> service.updateOrderStatus(99L, OrderStatus.SHIPPED))
                .isInstanceOf(OrderNotFoundException.class);
        assertThatThrownBy(() -> service.updateDeliveryPartner(99L, new UpdateDeliveryRequest()))
                .isInstanceOf(OrderNotFoundException.class);
        assertThatThrownBy(() -> service.deleteOrder(99L)).isInstanceOf(OrderNotFoundException.class);

        verify(orderRepository, never()).save(any());
        verify(orderRepository, never()).deleteById(any());
    }
}
