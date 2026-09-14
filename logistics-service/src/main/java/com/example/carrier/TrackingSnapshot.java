package com.example.carrier;

import java.time.LocalDateTime;

/** The carrier's current view of a consignment, in the carrier's own words. */
public record TrackingSnapshot(String awb, String carrierStatus, String location, LocalDateTime updatedAt) { }
