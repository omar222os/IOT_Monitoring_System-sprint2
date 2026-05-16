package com.example.iotmonitoring.sensor.traffic;

import com.example.iotmonitoring.alert.AlertSseService;
import com.example.iotmonitoring.settings.Settings;
import com.example.iotmonitoring.settings.SettingsRepository;
import com.example.iotmonitoring.settings.SensorType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@Slf4j
public class TrafficSensorService {

    private final TrafficSensorRepository repository;
    private final SettingsRepository settingsRepository;
    private final AlertSseService alertSseService;

    public TrafficSensorService(TrafficSensorRepository repository, SettingsRepository settingsRepository, AlertSseService alertSseService) {
        this.repository = repository;
        this.settingsRepository = settingsRepository;
        this.alertSseService = alertSseService;
    }

    public TrafficSensorData save(TrafficSensorRequest req) {
        TrafficSensorData data = new TrafficSensorData();
        data.setLocation(req.location());
        data.setTimestamp(req.timestamp());
        data.setTrafficDensity(req.trafficDensity());
        data.setAvgSpeed(req.avgSpeed());
        data.setCongestionLevel(req.congestionLevel());
        TrafficSensorData saved = repository.save(data);

        log.info("[RCV←] TRAFFIC | {} | density={}, speed={}, congestion={}",
                req.location(), req.trafficDensity(), req.avgSpeed(), req.congestionLevel());

        List<Settings> rules = settingsRepository.findByType(SensorType.TRAFFIC);
        alertSseService.check(SensorType.TRAFFIC, "trafficDensity", req.trafficDensity(),
                req.location(), req.timestamp(), rules);
        alertSseService.check(SensorType.TRAFFIC, "avgSpeed", req.avgSpeed(),
                req.location(), req.timestamp(), rules);
        alertSseService.pushReading(SensorType.TRAFFIC, saved);

        return saved;
    }

    public List<TrafficSensorData> getHistory(int limit) {
        return repository.findAllByOrderByTimestampDesc(PageRequest.of(0, limit));
    }
}
