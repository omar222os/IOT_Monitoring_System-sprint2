package com.example.iotmonitoring.simulator;

import com.example.iotmonitoring.sensor.airpollution.PollutionLevel;
import com.example.iotmonitoring.sensor.streetlight.SensorStatus;
import com.example.iotmonitoring.sensor.traffic.CongestionLevel;
import com.example.iotmonitoring.settings.SensorType;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Component
@Slf4j
public class SimulatorScheduler {

    private static final HttpHeaders JSON_HEADERS;
    static {
        JSON_HEADERS = new HttpHeaders();
        JSON_HEADERS.setContentType(MediaType.APPLICATION_JSON);
    }

    private static final long DEFAULT_INTERVAL_SECONDS = 30L;
    private static final String[] LOCATIONS = {"Zone-A", "Zone-B", "Zone-C"};

    private final ThreadPoolTaskScheduler simulatorTaskScheduler;
    private final RestTemplate restTemplate;

    @Value("${simulator.base-url}")
    private String baseUrl;

    public SimulatorScheduler(ThreadPoolTaskScheduler simulatorTaskScheduler, RestTemplate restTemplate) {
        this.simulatorTaskScheduler = simulatorTaskScheduler;
        this.restTemplate = restTemplate;
    }

    private final Map<SensorType, ScheduledFuture<?>> futures = new ConcurrentHashMap<>();
    private final Random random = new Random();

    @PostConstruct
    public void start() {
        for (SensorType type : SensorType.values()) {
            schedule(type, DEFAULT_INTERVAL_SECONDS);
        }
        log.info("Simulator started — all sensors posting every {}s", DEFAULT_INTERVAL_SECONDS);
    }

    public void updateFrequency(SensorType type, long intervalSeconds) {
        ScheduledFuture<?> existing = futures.get(type);
        if (existing != null) existing.cancel(false);
        schedule(type, intervalSeconds);
        log.info("Simulator frequency updated: {} → {}s", type, intervalSeconds);
    }

    private void schedule(SensorType type, long intervalSeconds) {
        futures.put(type, simulatorTaskScheduler.scheduleAtFixedRate(() -> post(type), Duration.ofSeconds(intervalSeconds)));
    }

    private void post(SensorType type) {
        switch (type) {
            case TRAFFIC -> postTraffic();
            case AIR_POLLUTION -> postAirPollution();
            case STREET_LIGHT -> postStreetLight();
        }
    }

    private void postTraffic() {
        String location = randomLocation();
        int density = random.nextInt(550);
        float speed = 10.0f + random.nextFloat() * 110.0f;
        CongestionLevel level = congestionLevel(density);

        log.info("[SIM→] TRAFFIC | {} | density={}, speed={}, congestion={}", location, density, speed, level);
        send("/api/sensors/traffic", Map.of(
                "location", location,
                "timestamp", LocalDateTime.now().toString(),
                "trafficDensity", density,
                "avgSpeed", speed,
                "congestionLevel", level.name()
        ));
    }

    private void postAirPollution() {
        String location = randomLocation();
        float pm25 = random.nextFloat() * 550.0f;
        float pm10 = 10.0f + random.nextFloat() * 190.0f;
        float co = 0.5f + random.nextFloat() * 14.5f;
        float no2 = 10.0f + random.nextFloat() * 140.0f;
        float so2 = 5.0f + random.nextFloat() * 75.0f;
        float ozone = 20.0f + random.nextFloat() * 100.0f;
        PollutionLevel level = pollutionLevel(pm25);

        log.info("[SIM→] AIR_POLLUTION | {} | pm25={}, pm10={}, co={}, no2={}, so2={}, ozone={}, level={}", location, pm25, pm10, co, no2, so2, ozone, level);
        send("/api/sensors/air-pollution", Map.of(
                "location", location,
                "timestamp", LocalDateTime.now().toString(),
                "pm25", pm25, "pm10", pm10, "co", co, "no2", no2, "so2", so2, "ozone", ozone,
                "pollutionLevel", level.name()
        ));
    }

    private void postStreetLight() {
        String location = randomLocation();
        int brightness = random.nextInt(110);
        float power = 50.0f + random.nextFloat() * 300.0f;
        SensorStatus status = random.nextFloat() < 0.9f ? SensorStatus.ON : SensorStatus.OFF;

        log.info("[SIM→] STREET_LIGHT | {} | brightness={}, power={}, status={}", location, brightness, power, status);
        send("/api/sensors/street-light", Map.of(
                "location", location,
                "timestamp", LocalDateTime.now().toString(),
                "brightnessLevel", brightness,
                "powerConsumption", power,
                "status", status.name()
        ));
    }

    private void send(String path, Map<String, Object> body) {
        try {
            restTemplate.postForObject(baseUrl + path, new HttpEntity<>(body, JSON_HEADERS), Void.class);
        } catch (Exception e) {
            log.warn("Simulator failed to post to {}: {}", path, e.getMessage());
        }
    }

    private String randomLocation() {
        return LOCATIONS[random.nextInt(LOCATIONS.length)];
    }

    private CongestionLevel congestionLevel(int density) {
        if (density < 100) return CongestionLevel.LOW;
        if (density < 200) return CongestionLevel.MODERATE;
        if (density < 300) return CongestionLevel.HIGH;
        return CongestionLevel.SEVERE;
    }

    private PollutionLevel pollutionLevel(float pm25) {
        if (pm25 < 12) return PollutionLevel.GOOD;
        if (pm25 < 35) return PollutionLevel.MODERATE;
        if (pm25 < 55) return PollutionLevel.UNHEALTHY;
        if (pm25 < 150) return PollutionLevel.VERY_UNHEALTHY;
        return PollutionLevel.HAZARDOUS;
    }
}
