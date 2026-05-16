package com.example.iotmonitoring.settings;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SettingsRepository extends JpaRepository<Settings, String> {
    List<Settings> findByType(SensorType type);
    List<Settings> findByUserEmail(String email);
    List<Settings> findByTypeAndUserEmail(SensorType type, String email);
}
