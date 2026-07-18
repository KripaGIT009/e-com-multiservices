package com.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardSummaryDTO {
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long todayOrders;
    private long pendingOrders;
    private long totalUsers;
    private long newUsersThisWeek;
    private long totalProducts;
    private long lowStockCount;
    private double paymentSuccessRate;
    private long totalRefunds;
    private List<String> warnings;
}
