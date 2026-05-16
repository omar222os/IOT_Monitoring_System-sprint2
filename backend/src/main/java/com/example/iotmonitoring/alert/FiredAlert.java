package com.example.iotmonitoring.alert;

import com.example.iotmonitoring.settings.AlertType;
import com.example.iotmonitoring.settings.SensorType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "fired_alerts")
@Getter @Setter @NoArgsConstructor
public class FiredAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SensorType sensorType;

    @Column(nullable = false)
    private String metric;

    @Column(nullable = false)
    private float actualValue;

    @Column(nullable = false)
    private float thresholdValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertType alertType;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private LocalDateTime firedAt;
}
