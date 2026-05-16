import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TrafficHistoryItem {
  id: string;
  location: string;
  timestamp: string;
  trafficDensity: number;
  avgSpeed: number;
  congestionLevel: string;
}

export interface AirPollutionHistoryItem {
  id: string;
  location: string;
  timestamp: string;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  so2: number;
  ozone: number;
}

export interface StreetLightHistoryItem {
  id: string;
  location: string;
  timestamp: string;
  brightnessLevel: number;
  powerConsumption: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class SensorHistoryService {
  constructor(private http: HttpClient) {}

  getTrafficHistory(limit = 20): Observable<TrafficHistoryItem[]> {
    return this.http.get<TrafficHistoryItem[]>(`/api/sensors/traffic?limit=${limit}`, { withCredentials: true });
  }

  getAirPollutionHistory(limit = 20): Observable<AirPollutionHistoryItem[]> {
    return this.http.get<AirPollutionHistoryItem[]>(`/api/sensors/air-pollution?limit=${limit}`, { withCredentials: true });
  }

  getStreetLightHistory(limit = 20): Observable<StreetLightHistoryItem[]> {
    return this.http.get<StreetLightHistoryItem[]>(`/api/sensors/street-light?limit=${limit}`, { withCredentials: true });
  }
}
