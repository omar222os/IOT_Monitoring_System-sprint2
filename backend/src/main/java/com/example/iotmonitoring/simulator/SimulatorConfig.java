package com.example.iotmonitoring.simulator;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.client.RestTemplate;

@Configuration
public class SimulatorConfig {

    @Bean
    public ThreadPoolTaskScheduler simulatorTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(3);
        scheduler.setThreadNamePrefix("simulator-");
        return scheduler;
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
