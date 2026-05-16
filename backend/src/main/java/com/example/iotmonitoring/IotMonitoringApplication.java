package com.example.iotmonitoring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class IotMonitoringApplication {

    public static void main(String[] args) {
        SpringApplication.run(IotMonitoringApplication.class, args);
    }
}
