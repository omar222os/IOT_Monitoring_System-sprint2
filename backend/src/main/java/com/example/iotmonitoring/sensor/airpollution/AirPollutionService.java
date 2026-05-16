package com.example.iotmonitoring.sensor.airpollution;

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
public class AirPollutionService {

    private final AirPollutionRepository repository;
    private final SettingsRepository settingsRepository;
    private final AlertSseService alertSseService;

    public AirPollutionService(AirPollutionRepository repository, SettingsRepository settingsRepository, AlertSseService alertSseService) {
        this.repository = repository;
        this.settingsRepository = settingsRepository;
        this.alertSseService = alertSseService;
    }

    public AirPollutionSensorData save(AirPollutionRequest req) {
        AirPollutionSensorData data = new AirPollutionSensorData();
        data.setLocation(req.location());
        data.setTimestamp(req.timestamp());
        data.setPm25(req.pm25());
        data.setPm10(req.pm10());
        data.setCo(req.co());
        data.setNo2(req.no2());
        data.setSo2(req.so2());
        data.setOzone(req.ozone());
        data.setPollutionLevel(req.pollutionLevel());
        AirPollutionSensorData saved = repository.save(data);

        log.info("[RCV←] AIR_POLLUTION | {} | pm25={}, pm10={}, co={}, no2={}, so2={}, ozone={}, level={}",
                req.location(), req.pm25(), req.pm10(), req.co(), req.no2(), req.so2(), req.ozone(), req.pollutionLevel());

        List<Settings> rules = settingsRepository.findByType(SensorType.AIR_POLLUTION);
        alertSseService.check(SensorType.AIR_POLLUTION, "co", req.co(),
                req.location(), req.timestamp(), rules);
        alertSseService.check(SensorType.AIR_POLLUTION, "ozone", req.ozone(),
                req.location(), req.timestamp(), rules);
        alertSseService.pushReading(SensorType.AIR_POLLUTION, saved);

        return saved;
    }

    public List<AirPollutionSensorData> getHistory(int limit) {
        return repository.findAllByOrderByTimestampDesc(PageRequest.of(0, limit));
    }
}
