package com.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ActivityFeedEntryDTO {
    private String adminUsername;
    private String action;
    private String entityType;
    private String entityId;
    private String details;
    private LocalDateTime timestamp;
}
