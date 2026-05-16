CREATE DATABASE IF NOT EXISTS monitoring;
USE monitoring;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS traffic_sensors_data (
    id VARCHAR(36) PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    timestamp DATETIME NOT NULL,
    traffic_density INT NOT NULL,
    avg_speed FLOAT NOT NULL,
    congestion_level VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS air_pollution_sensors_data (
    id VARCHAR(36) PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    timestamp DATETIME NOT NULL,
    pm2_5 FLOAT,
    pm10 FLOAT,
    co FLOAT,
    no2 FLOAT,
    so2 FLOAT,
    ozone FLOAT,
    pollution_level VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS street_light_sensors_data (
    id VARCHAR(36) PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    timestamp DATETIME NOT NULL,
    brightness_level INT NOT NULL,
    power_consumption FLOAT NOT NULL,
    status VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    metric VARCHAR(100) NOT NULL,
    threshold_value FLOAT NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_email) REFERENCES users(email)
);

CREATE TABLE IF NOT EXISTS fired_alerts (
    id VARCHAR(36) PRIMARY KEY,
    sensor_type VARCHAR(50) NOT NULL,
    metric VARCHAR(100) NOT NULL,
    actual_value FLOAT NOT NULL,
    threshold_value FLOAT NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    fired_at DATETIME NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_email) REFERENCES users(email)
);
