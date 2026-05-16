import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

interface FiredAlert {
  sensorType: string;
  metric: string;
  actualValue: number;
  thresholdValue: number;
  alertType: 'ABOVE' | 'BELOW';
  location: string;
  firedAt: string;
}

const CATEGORY: Record<string, string> = {
  TRAFFIC: 'Traffic', AIR_POLLUTION: 'Air Pollution', STREET_LIGHT: 'Street Light',
};
const METRIC_LABEL: Record<string, string> = {
  trafficDensity: 'Traffic density', avgSpeed: 'Avg speed',
  co: 'CO', ozone: 'Ozone',
  brightnessLevel: 'Brightness', powerConsumption: 'Power consumption',
};
const UNIT: Record<string, string> = {
  trafficDensity: 'veh/min', avgSpeed: 'km/h',
  co: 'ppm', ozone: 'ppb',
  brightnessLevel: '%', powerConsumption: 'W',
};

export type NotificationType = 'warning' | 'critical' | 'info';

export interface Notification {
  id: number;
  type: NotificationType;
  category: string;
  title: string;
  location: string;
  timestamp: Date;
  read: boolean;
  value?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _store = new BehaviorSubject<Notification[]>([]);

  readonly notifications$ = this._store.asObservable();
  readonly unreadCount$ = this._store.pipe(map(ns => ns.filter(n => !n.read).length));

  constructor(private http: HttpClient) {}

  loadFromBackend() {
    this.http.get<FiredAlert[]>('/api/alerts').subscribe({
      next: (alerts) => {
        const loaded: Notification[] = alerts.map((a, i) => ({
          id: i,
          type: a.alertType === 'ABOVE' ? 'critical' : 'warning',
          category: CATEGORY[a.sensorType] ?? a.sensorType,
          title: `${METRIC_LABEL[a.metric] ?? a.metric} ${a.alertType === 'ABOVE' ? 'exceeded high threshold' : 'dropped below threshold'}`,
          location: a.location,
          timestamp: new Date(a.firedAt + 'Z'),
          read: true,
          value: `${a.actualValue.toFixed(1)} ${UNIT[a.metric] ?? ''}`.trim(),
        }));
        // Keep any unread real-time SSE alerts on top, then backend history
        const realtime = this._store.value.filter(n => !n.read);
        this._store.next([...realtime, ...loaded]);
      }
    });
  }

  add(partial: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const n: Notification = {
      ...partial,
      id: Date.now(),
      timestamp: new Date(),
      read: false,
    };
    this._store.next([n, ...this._store.value]);
  }

  markAllAsRead() {
    this._store.next(this._store.value.map(n => ({ ...n, read: true })));
  }

  clear() {
    this._store.next([]);
  }
}
