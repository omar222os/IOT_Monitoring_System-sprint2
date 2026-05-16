package com.example.iotmonitoring.sensor.airpollution;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AirPollutionRepository extends JpaRepository<AirPollutionSensorData, String> {
    List<AirPollutionSensorData> findAllByOrderByTimestampDesc(Pageable pageable);
}
