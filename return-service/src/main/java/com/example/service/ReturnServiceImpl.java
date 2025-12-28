package com.example.service;

import com.example.entity.Return;
import com.example.repository.ReturnRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ReturnServiceImpl implements IReturnService {

    @Autowired
    private ReturnRepository returnRepository;

    public Return createReturn(Long orderId, Long userId, String reason, BigDecimal refundAmount) {
        Return ret = new Return();
        ret.setOrderId(orderId);
        ret.setUserId(userId);
        ret.setReason(reason);
        ret.setRefundAmount(refundAmount);
        ret.setStatus("INITIATED");
        return returnRepository.save(ret);
    }

    public Return getReturn(Long returnId) {
        return returnRepository.findById(returnId).orElse(null);
    }

    public List<Return> getReturnsByUserId(Long userId) {
        return returnRepository.findByUserId(userId);
    }

    public List<Return> getReturnsByOrderId(Long orderId) {
        return returnRepository.findByOrderId(orderId);
    }

    public Return approveReturn(Long returnId) {
        Optional<Return> ret = returnRepository.findById(returnId);
        if (ret.isPresent()) {
            Return returnObj = ret.get();
            returnObj.setStatus("APPROVED");
            return returnRepository.save(returnObj);
        }
        return null;
    }

    public Return rejectReturn(Long returnId) {
        Optional<Return> ret = returnRepository.findById(returnId);
        if (ret.isPresent()) {
            Return returnObj = ret.get();
            returnObj.setStatus("REJECTED");
            return returnRepository.save(returnObj);
        }
        return null;
    }

    public Return processRefund(Long returnId) {
        Optional<Return> ret = returnRepository.findById(returnId);
        if (ret.isPresent()) {
            Return returnObj = ret.get();
            returnObj.setStatus("REFUNDED");
            return returnRepository.save(returnObj);
        }
        return null;
    }

    public List<Return> getPendingReturns() {
        return returnRepository.findByStatus("INITIATED");
    }
}
