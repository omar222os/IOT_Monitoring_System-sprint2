package com.example.iotmonitoring.settings;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<List<Settings>> getAll() {
        return ResponseEntity.ok(settingsService.getAll());
    }

    @PostMapping
    public ResponseEntity<Settings> create(@RequestBody CreateSettingRequest req) {
        if (req == null || req.type() == null || req.metric() == null
                || req.metric().isBlank() || req.alertType() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(settingsService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Settings> update(@PathVariable String id, @RequestBody UpdateSettingRequest req) {
        return ResponseEntity.ok(settingsService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        settingsService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

record CreateSettingRequest(SensorType type, String metric, float thresholdValue, AlertType alertType) {}
record UpdateSettingRequest(String metric, float thresholdValue, AlertType alertType) {}