package com.example.iotmonitoring.sensor.streetlight;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "street_light_sensors_data")
@Getter @Setter @NoArgsConstructor
public class StreetLightSensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private int brightnessLevel;

    @Column(nullable = false)
    private float powerConsumption;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SensorStatus status;
}
