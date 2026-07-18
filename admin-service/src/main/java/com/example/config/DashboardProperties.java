package com.example.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "dashboard")
public class DashboardProperties {

    private int lowStockThreshold = 10;
    private int activityFeedLimit = 20;
    private int topProductsLimit = 10;
    private int downstreamTimeoutMs = 4000;

    public int getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(int lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public int getActivityFeedLimit() {
        return activityFeedLimit;
    }

    public void setActivityFeedLimit(int activityFeedLimit) {
        this.activityFeedLimit = activityFeedLimit;
    }

    public int getTopProductsLimit() {
        return topProductsLimit;
    }

    public void setTopProductsLimit(int topProductsLimit) {
        this.topProductsLimit = topProductsLimit;
    }

    public int getDownstreamTimeoutMs() {
        return downstreamTimeoutMs;
    }

    public void setDownstreamTimeoutMs(int downstreamTimeoutMs) {
        this.downstreamTimeoutMs = downstreamTimeoutMs;
    }
}
