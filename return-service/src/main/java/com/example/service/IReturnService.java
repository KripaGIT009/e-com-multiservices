package com.example.service;

import com.example.entity.Return;
import java.math.BigDecimal;
import java.util.List;

public interface IReturnService {
    Return createReturn(Long orderId, Long userId, String reason, BigDecimal refundAmount);
    Return getReturn(Long returnId);
    List<Return> getReturnsByUserId(Long userId);
    List<Return> getReturnsByOrderId(Long orderId);
    Return approveReturn(Long returnId);
    Return rejectReturn(Long returnId);
    Return processRefund(Long returnId);
    List<Return> getPendingReturns();
}
