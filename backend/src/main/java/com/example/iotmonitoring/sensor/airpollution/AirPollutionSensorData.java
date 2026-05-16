package com.example.iotmonitoring.sensor.airpollution;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "air_pollution_sensors_data")
@Getter @Setter @NoArgsConstructor
public class AirPollutionSensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "pm2_5")
    private float pm25;

    private float pm10;
    private float co;
    private float no2;
    private float so2;
    private float ozone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PollutionLevel pollutionLevel;
}
