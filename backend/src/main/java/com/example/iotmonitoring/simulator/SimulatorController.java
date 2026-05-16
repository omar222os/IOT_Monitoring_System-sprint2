package com.example.iotmonitoring.simulator;

import com.example.iotmonitoring.settings.SensorType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/simulator")
public class SimulatorController {

    private final SimulatorScheduler scheduler;

    public SimulatorController(SimulatorScheduler scheduler) {
        this.scheduler = scheduler;
    }

    @PutMapping("/frequency")
    public void updateFrequency(@Valid @RequestBody FrequencyRequest req) {
        scheduler.updateFrequency(req.type(), req.intervalSeconds());
    }
}

record FrequencyRequest(
        @NotNull SensorType type,
        @Min(1) long intervalSeconds
) {}