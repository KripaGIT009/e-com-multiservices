package com.example.carrier;

import java.math.BigDecimal;

/** A carrier's own answer to "can you deliver this, for how much, how fast". */
public record LiveQuote(String courierName, BigDecimal rate, Integer estimatedDays) { }
