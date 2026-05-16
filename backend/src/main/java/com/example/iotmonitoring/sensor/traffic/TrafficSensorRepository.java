package com.example.iotmonitoring.sensor.traffic;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrafficSensorRepository extends JpaRepository<TrafficSensorData, String> {
    List<TrafficSensorData> findAllByOrderByTimestampDesc(Pageable pageable);
}
