package com.example.service;

import com.example.common.SagaEvent;
import com.example.dto.PreferenceRequest;
import com.example.dto.SendNotificationRequest;
import com.example.entity.NotificationEvent;
import com.example.entity.NotificationPreference;
import com.example.entity.NotificationTemplate;
import com.example.repository.NotificationEventRepository;
import com.example.repository.NotificationPreferenceRepository;
import com.example.repository.NotificationTemplateRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class NotificationServiceImpl implements INotificationService {

    private final NotificationEventRepository events;
    private final NotificationTemplateRepository templates;
    private final NotificationPreferenceRepository preferences;
    private final KafkaTemplate<String, SagaEvent> kafka;
    private final ObjectMapper objectMapper;

    public NotificationServiceImpl(NotificationEventRepository events,
                                  NotificationTemplateRepository templates,
                                  NotificationPreferenceRepository preferences,
                                  KafkaTemplate<String, SagaEvent> kafka,
                                  ObjectMapper objectMapper) {
        this.events = events;
        this.templates = templates;
        this.preferences = preferences;
        this.kafka = kafka;
        this.objectMapper = objectMapper;
    }

    public NotificationEvent send(SendNotificationRequest request) {
        if (request.getChannel() == null || request.getTemplateCode() == null) {
            throw new IllegalArgumentException("Channel and templateCode are required");
        }

        boolean allowed = preferences.findByUserIdAndChannel(request.getUserId(), request.getChannel())
            .map(NotificationPreference::isEnabled)
            .orElse(true);
        String status = allowed ? "SENT" : "SKIPPED";

        NotificationTemplate template = templates.findByCode(request.getTemplateCode())
            .orElseGet(() -> defaultTemplate(request.getTemplateCode(), request.getChannel()));

        String payload = renderTemplate(template, request.getAttributes());
        NotificationEvent event = new NotificationEvent(
            request.getUserId(),
            request.getChannel(),
            template.getCode(),
            status,
            UUID.randomUUID().toString(),
            payload
        );
        NotificationEvent saved = events.save(event);
        publishNotificationEvent(request.getUserId(), template.getCode(), status, payload);
        return saved;
    }

    public NotificationPreference upsertPreference(PreferenceRequest request) {
        Optional<NotificationPreference> existing = preferences.findByUserIdAndChannel(request.getUserId(), request.getChannel());
        NotificationPreference pref = existing.orElseGet(() -> new NotificationPreference(request.getUserId(), request.getChannel(), request.isEnabled()));
        pref.setEnabled(request.isEnabled());
        return preferences.save(pref);
    }

    public java.util.List<NotificationEvent> getNotificationsByUser(Long userId) {
        return events.findByUserId(userId);
    }

    public NotificationEvent recordFromSaga(SagaEvent event) {
        String payload = event.data();
        if (payload == null) {
            payload = event.type();
        }
        NotificationEvent record = new NotificationEvent(null, "KAFKA", event.type(), "SENT", event.orderId(), payload);
        NotificationEvent saved = events.save(record);
        publishNotificationEvent(null, event.type(), "SENT", payload);
        return saved;
    }

    private NotificationTemplate defaultTemplate(String code, String channel) {
        NotificationTemplate template = new NotificationTemplate();
        template.setCode(code);
        template.setChannel(channel);
        template.setSubject("Notification: " + code);
        template.setBody("Event: " + code);
        return templates.save(template);
    }

    private String renderTemplate(NotificationTemplate template, Map<String, String> attributes) {
        String body = template.getBody();
        if (attributes != null) {
            for (Map.Entry<String, String> entry : attributes.entrySet()) {
                body = body.replace("{{" + entry.getKey() + "}}", entry.getValue());
            }
        }
        return body;
    }

    private void publishNotificationEvent(Long userId, String templateCode, String status, String payload) {
        try {
            String data = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "templateCode", templateCode,
                "status", status,
                "payload", payload,
                "timestamp", LocalDateTime.now().toString()
            ));
            kafka.send("notification-events", new SagaEvent(templateCode, "NotificationSent", data));
        } catch (JsonProcessingException e) {
            kafka.send("notification-events", new SagaEvent(templateCode, "NotificationSent", payload));
        }
    }
}
