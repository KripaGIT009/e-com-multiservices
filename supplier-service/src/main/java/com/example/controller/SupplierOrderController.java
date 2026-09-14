package com.example.controller;

import com.example.dto.SupplierOrderDtos.DispatchRequest;
import com.example.dto.SupplierOrderDtos.DispatchResponse;
import com.example.dto.SupplierOrderDtos.StatusUpdateRequest;
import com.example.dto.SupplierOrderDtos.SupplierOrderResponse;
import com.example.service.SupplierOrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/supplier-orders")
public class SupplierOrderController {

    private final SupplierOrderService supplierOrders;

    public SupplierOrderController(SupplierOrderService supplierOrders) {
        this.supplierOrders = supplierOrders;
    }

    /** Idempotent: 200 whether supplier orders were created now or already existed. */
    @PostMapping("/dispatch")
    public DispatchResponse dispatch(@Valid @RequestBody DispatchRequest request) {
        return supplierOrders.dispatch(request.orderId());
    }

    @GetMapping
    public List<SupplierOrderResponse> list(@RequestParam(name = "status", required = false) String status,
                                            @RequestParam(name = "partnerCode", required = false) String partnerCode) {
        return supplierOrders.list(status, partnerCode);
    }

    @GetMapping("/{id}")
    public SupplierOrderResponse get(@PathVariable("id") Long id) {
        return supplierOrders.get(id);
    }

    @GetMapping("/order/{orderId}")
    public List<SupplierOrderResponse> forOrder(@PathVariable("orderId") Long orderId) {
        return supplierOrders.forOrder(orderId);
    }

    @PutMapping("/{id}/status")
    public SupplierOrderResponse updateStatus(@PathVariable("id") Long id,
                                              @Valid @RequestBody StatusUpdateRequest request) {
        return supplierOrders.updateStatus(id, request);
    }

    @PostMapping("/{id}/retry")
    public SupplierOrderResponse retry(@PathVariable("id") Long id) {
        return supplierOrders.retry(id);
    }
}
