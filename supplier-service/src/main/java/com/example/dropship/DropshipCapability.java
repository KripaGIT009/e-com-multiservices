package com.example.dropship;

/** What a dropship adapter can actually do against its partner. */
public enum DropshipCapability {
    ORDER_SUBMISSION,
    STATUS_POLLING,
    WEBHOOKS,
    STOCK_SYNC
}
