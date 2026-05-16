package com.example.iotmonitoring.settings;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.iotmonitoring.user.User;
import com.example.iotmonitoring.user.UserRepository;

@Service
public class SettingsService {
    private final SettingsRepository settingsRepository;
    private final UserRepository userRepository;

    public SettingsService(SettingsRepository settingsRepository, UserRepository userRepository) {
        this.settingsRepository = settingsRepository;
        this.userRepository = userRepository;
    }

    public List<Settings> getAll() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
        return settingsRepository.findByUserEmail(email);
    }

    public Settings create(CreateSettingRequest req) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
        Settings settings = new Settings();
        settings.setType(req.type());
        settings.setMetric(req.metric());
        settings.setThresholdValue(req.thresholdValue());
        settings.setAlertType(req.alertType());
        settings.setCreatedAt(LocalDateTime.now());
        settings.setUser(user);
        return settingsRepository.save(settings);
    }

    public Settings update(String settingId, UpdateSettingRequest req) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Settings settings = settingsRepository.findById(settingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "setting not found"));
        if (!settings.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "access denied");
        }
        settings.setMetric(req.metric());
        settings.setThresholdValue(req.thresholdValue());
        settings.setAlertType(req.alertType());
        return settingsRepository.save(settings);
    }

    public void delete(String settingId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Settings settings = settingsRepository.findById(settingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "setting not found"));
        if (!settings.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "access denied");
        }
        settingsRepository.delete(settings);
    }
}