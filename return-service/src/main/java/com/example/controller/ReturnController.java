package com.example.controller;

import com.example.entity.Return;
import com.example.dto.ReturnRequest;
import com.example.service.IReturnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/returns")
public class ReturnController {

    @Autowired
    private IReturnService returnService;

    @PostMapping
    public ResponseEntity<Return> createReturn(@RequestBody ReturnRequest request) {
        Return ret = returnService.createReturn(
                request.getOrderId(),
                request.getUserId(),
                request.getReason(),
                request.getRefundAmount()
        );
        return new ResponseEntity<>(ret, HttpStatus.CREATED);
    }

    @GetMapping("/{returnId}")
    public ResponseEntity<Return> getReturn(@PathVariable Long returnId) {
        Return ret = returnService.getReturn(returnId);
        return ret != null ? new ResponseEntity<>(ret, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Return>> getReturnsByUser(@PathVariable Long userId) {
        List<Return> returns = returnService.getReturnsByUserId(userId);
        return new ResponseEntity<>(returns, HttpStatus.OK);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<Return>> getReturnsByOrder(@PathVariable Long orderId) {
        List<Return> returns = returnService.getReturnsByOrderId(orderId);
        return new ResponseEntity<>(returns, HttpStatus.OK);
    }

    @PutMapping("/{returnId}/approve")
    public ResponseEntity<Return> approveReturn(@PathVariable Long returnId) {
        Return ret = returnService.approveReturn(returnId);
        return ret != null ? new ResponseEntity<>(ret, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PutMapping("/{returnId}/reject")
    public ResponseEntity<Return> rejectReturn(@PathVariable Long returnId) {
        Return ret = returnService.rejectReturn(returnId);
        return ret != null ? new ResponseEntity<>(ret, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PutMapping("/{returnId}/refund")
    public ResponseEntity<Return> processRefund(@PathVariable Long returnId) {
        Return ret = returnService.processRefund(returnId);
        return ret != null ? new ResponseEntity<>(ret, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Return>> getPendingReturns() {
        List<Return> returns = returnService.getPendingReturns();
        return new ResponseEntity<>(returns, HttpStatus.OK);
    }
}
