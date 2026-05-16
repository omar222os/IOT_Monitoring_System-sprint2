package com.example.iotmonitoring.sensor.streetlight;

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
public class StreetLightService {

    private final StreetLightRepository repository;
    private final SettingsRepository settingsRepository;
    private final AlertSseService alertSseService;

    public StreetLightService(StreetLightRepository repository, SettingsRepository settingsRepository, AlertSseService alertSseService) {
        this.repository = repository;
        this.settingsRepository = settingsRepository;
        this.alertSseService = alertSseService;
    }

    public StreetLightSensorData save(StreetLightRequest req) {
        StreetLightSensorData data = new StreetLightSensorData();
        data.setLocation(req.location());
        data.setTimestamp(req.timestamp());
        data.setBrightnessLevel(req.brightnessLevel());
        data.setPowerConsumption(req.powerConsumption());
        data.setStatus(req.status());
        StreetLightSensorData saved = repository.save(data);

        log.info("[RCV←] STREET_LIGHT | {} | brightness={}, power={}, status={}",
                req.location(), req.brightnessLevel(), req.powerConsumption(), req.status());

        List<Settings> rules = settingsRepository.findByType(SensorType.STREET_LIGHT);
        alertSseService.check(SensorType.STREET_LIGHT, "brightnessLevel", req.brightnessLevel(),
                req.location(), req.timestamp(), rules);
        alertSseService.check(SensorType.STREET_LIGHT, "powerConsumption", req.powerConsumption(),
                req.location(), req.timestamp(), rules);
        alertSseService.pushReading(SensorType.STREET_LIGHT, saved);

        return saved;
    }

    public List<StreetLightSensorData> getHistory(int limit) {
        return repository.findAllByOrderByTimestampDesc(PageRequest.of(0, limit));
    }
}
