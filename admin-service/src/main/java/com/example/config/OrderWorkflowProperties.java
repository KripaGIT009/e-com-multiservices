package com.example.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "workflow.order")
public class OrderWorkflowProperties {

    private Map<String, Integer> actionPriority = new LinkedHashMap<>();

    public OrderWorkflowProperties() {
        actionPriority.put("SHIP_ORDER", 100);
        actionPriority.put("MARK_DELIVERED", 95);
        actionPriority.put("RESERVE_INVENTORY", 90);
        actionPriority.put("CONFIRM_PAYMENT", 85);
        actionPriority.put("ISSUE_REFUND", 50);
        actionPriority.put("CANCEL_ORDER", 10);
    }

    public Map<String, Integer> getActionPriority() {
        return actionPriority;
    }

    public void setActionPriority(Map<String, Integer> actionPriority) {
        this.actionPriority = actionPriority;
    }
}
