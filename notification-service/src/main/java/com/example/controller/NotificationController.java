package com.example.controller;

import com.example.dto.PreferenceRequest;
import com.example.dto.SendNotificationRequest;
import com.example.entity.NotificationEvent;
import com.example.entity.NotificationPreference;
import com.example.service.INotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class NotificationController {

    private final INotificationService notificationService;

    public NotificationController(INotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/notifications")
    public ResponseEntity<NotificationEvent> send(@RequestBody SendNotificationRequest request) {
        return ResponseEntity.ok(notificationService.send(request));
    }

    @PostMapping("/preferences")
    public ResponseEntity<NotificationPreference> preference(@RequestBody PreferenceRequest request) {
        return ResponseEntity.ok(notificationService.upsertPreference(request));
    }
}
