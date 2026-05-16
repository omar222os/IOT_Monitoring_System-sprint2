package com.example.iotmonitoring.alert;

import com.example.iotmonitoring.settings.AlertType;
import com.example.iotmonitoring.settings.Settings;
import com.example.iotmonitoring.settings.SensorType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

record AlertEvent(
        SensorType sensorType,
        String metric,
        float actualValue,
        float thresholdValue,
        AlertType alertType,
        String location,
        LocalDateTime timestamp
) {}

record ReadingEvent(
        SensorType sensorType,
        Object data
) {}

@Service
@Slf4j
public class AlertSseService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final FiredAlertRepository firedAlertRepository;

    public AlertSseService(FiredAlertRepository firedAlertRepository) {
        this.firedAlertRepository = firedAlertRepository;
    }

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        return emitter;
    }

    public void check(SensorType type, String metric, float actualValue,
                      String location, LocalDateTime timestamp, List<Settings> rules) {
        for (Settings s : rules) {
            if (!s.getMetric().equals(metric)) continue;
            if (s.getAlertType() == AlertType.ABOVE && actualValue <= s.getThresholdValue()) continue;
            if (s.getAlertType() == AlertType.BELOW && actualValue >= s.getThresholdValue()) continue;

            log.warn("Threshold breach: {} {} {} {} (threshold={})",
                    type, metric, s.getAlertType(), actualValue, s.getThresholdValue());

            FiredAlert fired = new FiredAlert();
            fired.setUserEmail(s.getUser().getEmail());
            fired.setSensorType(type);
            fired.setMetric(metric);
            fired.setActualValue(actualValue);
            fired.setThresholdValue(s.getThresholdValue());
            fired.setAlertType(s.getAlertType());
            fired.setLocation(location);
            fired.setFiredAt(timestamp);
            firedAlertRepository.save(fired);

            send("alert", new AlertEvent(type, metric, actualValue, s.getThresholdValue(),
                    s.getAlertType(), location, timestamp));
        }
    }

    public List<FiredAlert> getAlerts(String userEmail) {
        return firedAlertRepository.findByUserEmailOrderByFiredAtDesc(userEmail);
    }

    public void pushReading(SensorType type, Object data) {
        send("reading", new ReadingEvent(type, data));
    }

    private void send(String eventName, Object payload) {
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }
}
