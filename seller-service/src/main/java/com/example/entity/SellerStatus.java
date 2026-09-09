package com.example.entity;

/**
 * A seller's standing on the marketplace.
 *
 * PENDING sellers can sign in and prepare their catalogue but cannot publish;
 * only APPROVED sellers have products visible to shoppers.
 */
public enum SellerStatus {
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    SUSPENDED
}
