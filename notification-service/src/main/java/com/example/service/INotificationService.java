package com.example.service;

import com.example.dto.SendNotificationRequest;
import com.example.dto.PreferenceRequest;
import com.example.entity.NotificationEvent;
import com.example.entity.NotificationPreference;
import com.example.common.SagaEvent;
import java.util.List;

public interface INotificationService {
    NotificationEvent send(SendNotificationRequest request);
    List<NotificationEvent> getNotificationsByUser(Long userId);
    NotificationPreference upsertPreference(PreferenceRequest request);
    NotificationEvent recordFromSaga(SagaEvent event);
}
