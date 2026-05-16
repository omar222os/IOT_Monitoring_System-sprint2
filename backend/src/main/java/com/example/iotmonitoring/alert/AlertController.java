package com.example.iotmonitoring.alert;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertSseService alertSseService;

    public AlertController(AlertSseService alertSseService) {
        this.alertSseService = alertSseService;
    }

    @GetMapping("/stream")
    public SseEmitter stream() {
        return alertSseService.subscribe();
    }

    @GetMapping
    public List<FiredAlert> getAlerts(Authentication authentication) {
        return alertSseService.getAlerts(authentication.getName());
    }
}
