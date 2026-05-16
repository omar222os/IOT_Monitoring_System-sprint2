import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

export interface TrafficReading {
  id: string; location: string; timestamp: string;
  trafficDensity: number; avgSpeed: number; congestionLevel: string;
}
export interface AirPollutionReading {
  id: string; location: string; timestamp: string;
  pm25: number; pm10: number; co: number; no2: number; so2: number; ozone: number;
  pollutionLevel: string;
}
export interface StreetLightReading {
  id: string; location: string; timestamp: string;
  brightnessLevel: number; powerConsumption: number; status: string;
}
export interface SseReadingEvent {
  sensorType: 'TRAFFIC' | 'AIR_POLLUTION' | 'STREET_LIGHT';
  data: TrafficReading | AirPollutionReading | StreetLightReading;
}
export interface SseAlertEvent {
  sensorType: string; metric: string;
  actualValue: number; thresholdValue: number;
  alertType: 'ABOVE' | 'BELOW'; location: string; timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SseService implements OnDestroy {
  private source?: EventSource;

  private _readings$ = new Subject<SseReadingEvent>();
  private _alerts$   = new Subject<SseAlertEvent>();

  readonly readings$ = this._readings$.asObservable();
  readonly alerts$   = this._alerts$.asObservable();

  constructor(private zone: NgZone) {}

  connect() {
    if (this.source) return;
    this.source = new EventSource('/api/alerts/stream', { withCredentials: true });

    this.source.addEventListener('reading', (e: MessageEvent) => {
      this.zone.run(() => this._readings$.next(JSON.parse(e.data)));
    });

    this.source.addEventListener('alert', (e: MessageEvent) => {
      this.zone.run(() => this._alerts$.next(JSON.parse(e.data)));
    });
  }

  disconnect() {
    this.source?.close();
    this.source = undefined;
  }

  ngOnDestroy() { this.disconnect(); }
}
