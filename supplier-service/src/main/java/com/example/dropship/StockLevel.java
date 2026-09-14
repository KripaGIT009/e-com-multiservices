package com.example.dropship;

/** Stock a partner reports for one of its SKUs. */
public record StockLevel(String partnerSku, int quantity) {
}
