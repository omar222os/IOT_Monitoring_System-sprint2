package com.example.iotmonitoring.sensor.streetlight;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sensors")
public class StreetLightController {

    private final StreetLightService service;

    public StreetLightController(StreetLightService service) {
        this.service = service;
    }

    @GetMapping("/street-light")
    public List<StreetLightSensorData> history(@RequestParam(defaultValue = "10") int limit) {
        return service.getHistory(limit);
    }

    @PostMapping("/street-light")
    public ResponseEntity<StreetLightSensorData> create(@Valid @RequestBody StreetLightRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(req));
    }
}

record StreetLightRequest(
        @NotBlank String location,
        @NotNull java.time.LocalDateTime timestamp,
        @Min(0) @Max(100) int brightnessLevel,
        @DecimalMin("0.0") @DecimalMax("1000.0") float powerConsumption,
        @NotNull SensorStatus status
) {}
