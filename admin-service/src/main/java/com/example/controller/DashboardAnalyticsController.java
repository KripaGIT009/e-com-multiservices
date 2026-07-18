package com.example.controller;

import com.example.dto.*;
import com.example.service.DashboardAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class DashboardAnalyticsController {

    private final DashboardAnalyticsService dashboardAnalyticsService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary() {
        log.info("Fetching dashboard summary");
        DashboardSummaryDTO summary = dashboardAnalyticsService.fetchDashboardSummary();
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/revenue")
    public ResponseEntity<List<TimeSeriesEntryDTO>> getRevenueTimeSeries(
            @RequestParam String period) {
        log.info("Fetching revenue time-series for period: {}", period);
        List<TimeSeriesEntryDTO> timeSeries = dashboardAnalyticsService.fetchRevenueTimeSeries(period);
        return ResponseEntity.ok(timeSeries);
    }

    @GetMapping("/orders/status-distribution")
    public ResponseEntity<List<StatusCountDTO>> getOrderStatusDistribution() {
        log.info("Fetching order status distribution");
        List<StatusCountDTO> distribution = dashboardAnalyticsService.fetchOrderStatusDistribution();
        return ResponseEntity.ok(distribution);
    }

    @GetMapping("/products/top-selling")
    public ResponseEntity<List<TopProductDTO>> getTopSellingProducts() {
        log.info("Fetching top selling products");
        List<TopProductDTO> topProducts = dashboardAnalyticsService.fetchTopSellingProducts();
        return ResponseEntity.ok(topProducts);
    }

    @GetMapping("/activity-feed")
    public ResponseEntity<List<ActivityFeedEntryDTO>> getActivityFeed() {
        log.info("Fetching activity feed");
        List<ActivityFeedEntryDTO> activityFeed = dashboardAnalyticsService.fetchActivityFeed();
        return ResponseEntity.ok(activityFeed);
    }
}
