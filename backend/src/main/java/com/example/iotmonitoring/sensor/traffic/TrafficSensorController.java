package com.example.iotmonitoring.sensor.traffic;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sensors")
public class TrafficSensorController {

    private final TrafficSensorService service;

    public TrafficSensorController(TrafficSensorService service) {
        this.service = service;
    }

    @GetMapping("/traffic")
    public List<TrafficSensorData> history(@RequestParam(defaultValue = "10") int limit) {
        return service.getHistory(limit);
    }

    @PostMapping("/traffic")
    public ResponseEntity<TrafficSensorData> create(@Valid @RequestBody TrafficSensorRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(req));
    }
}

record TrafficSensorRequest(
        @NotBlank String location,
        @NotNull java.time.LocalDateTime timestamp,
        @Min(0) @Max(500) int trafficDensity,
        @DecimalMin("0.0") @DecimalMax("200.0") float avgSpeed,
        @NotNull CongestionLevel congestionLevel
) {}
