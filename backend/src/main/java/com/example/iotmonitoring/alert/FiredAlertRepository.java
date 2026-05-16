package com.example.iotmonitoring.alert;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FiredAlertRepository extends JpaRepository<FiredAlert, String> {
    List<FiredAlert> findByUserEmailOrderByFiredAtDesc(String userEmail);
}
