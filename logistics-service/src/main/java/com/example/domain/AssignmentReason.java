package com.example.domain;

/** Why a courier was assigned — recorded on the order as deliveryAssignmentReason. */
public enum AssignmentReason {
    MANUAL,
    RULE,
    DEFAULT,
    STRATEGY,
    NONE
}
