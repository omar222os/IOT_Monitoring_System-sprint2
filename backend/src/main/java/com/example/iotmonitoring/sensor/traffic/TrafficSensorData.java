package com.example.iotmonitoring.sensor.traffic;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "traffic_sensors_data")
@Getter @Setter @NoArgsConstructor
public class TrafficSensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private int trafficDensity;

    @Column(nullable = false)
    private float avgSpeed;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CongestionLevel congestionLevel;
}
