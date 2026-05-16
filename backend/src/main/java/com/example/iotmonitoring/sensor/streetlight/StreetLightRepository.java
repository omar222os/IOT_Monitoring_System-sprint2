package com.example.iotmonitoring.sensor.streetlight;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StreetLightRepository extends JpaRepository<StreetLightSensorData, String> {
    List<StreetLightSensorData> findAllByOrderByTimestampDesc(Pageable pageable);
}
