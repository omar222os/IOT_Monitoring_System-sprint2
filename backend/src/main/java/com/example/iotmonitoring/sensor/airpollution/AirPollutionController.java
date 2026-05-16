package com.example.iotmonitoring.sensor.airpollution;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sensors")
public class AirPollutionController {

    private final AirPollutionService service;

    public AirPollutionController(AirPollutionService service) {
        this.service = service;
    }

    @GetMapping("/air-pollution")
    public List<AirPollutionSensorData> history(@RequestParam(defaultValue = "10") int limit) {
        return service.getHistory(limit);
    }

    @PostMapping("/air-pollution")
    public ResponseEntity<AirPollutionSensorData> create(@Valid @RequestBody AirPollutionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(req));
    }
}

record AirPollutionRequest(
        @NotBlank String location,
        @NotNull java.time.LocalDateTime timestamp,
        @DecimalMin("0.0") @DecimalMax("500.0") float pm25,
        @DecimalMin("0.0") @DecimalMax("600.0") float pm10,
        @DecimalMin("0.0") @DecimalMax("50.0") float co,
        @DecimalMin("0.0") @DecimalMax("500.0") float no2,
        @DecimalMin("0.0") @DecimalMax("500.0") float so2,
        @DecimalMin("0.0") @DecimalMax("300.0") float ozone,
        @NotNull PollutionLevel pollutionLevel
) {}
