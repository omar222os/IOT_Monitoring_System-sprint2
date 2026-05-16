import { Injectable, OnDestroy } from '@angular/core';
import { NotificationService } from './notification.service';
import { ToastService, ToastType } from './toast.service';

interface MockAlert {
  type: ToastType;
  title: string;
  message: string;
  category: string;
  notifTitle: string;
  location: string;
  value?: string;
}

const MOCK_ALERTS: MockAlert[] = [
  { type: 'warning',  title: 'Traffic Density Elevated',    message: 'Sensor SNS-TR-001 reports 74 veh/min — approaching high threshold.',  category: 'Traffic',       notifTitle: 'Traffic density approaching high threshold', location: 'Main St · SNS-TR-001', value: '74 veh/min' },
  { type: 'critical', title: 'CO Level Critical',           message: 'Sensor SNS-AP-001 detected CO at 31 ppm — exceeds safe limit.',        category: 'Air Pollution', notifTitle: 'CO crossed high threshold',                 location: 'Downtown station',    value: '31.0 ppm'  },
  { type: 'warning',  title: 'Average Speed Below Range',   message: 'Sensor SNS-TR-002 reports 28 km/h — below minimum safe speed.',        category: 'Traffic',       notifTitle: 'Avg speed dropped below low threshold',     location: 'Highway 101 · MM 22', value: '28.0 km/h' },
  { type: 'info',     title: 'Street Light Dimmed',         message: 'Sensor SNS-SL-001 brightness dropped to 22% — scheduled dimming.',     category: 'Street Light',  notifTitle: 'Brightness returned to nominal range',      location: 'Park Avenue',         value: '22.0 %'    },
  { type: 'critical', title: 'Ozone Level Critical',        message: 'Sensor SNS-AP-002 reports 128 ppb — exceeds safe threshold.',          category: 'Air Pollution', notifTitle: 'Ozone crossed high threshold',               location: 'East grid station',   value: '128 ppb'   },
  { type: 'warning',  title: 'Power Consumption High',      message: 'Sensor SNS-SL-002 drawing 218 W — approaching upper limit.',           category: 'Street Light',  notifTitle: 'Power consumption approaching high threshold', location: 'Elm Street',         value: '218 W'     },
  { type: 'info',     title: 'Traffic Density Normalised',  message: 'Sensor SNS-TR-001 returned to normal range — 45 veh/min.',             category: 'Traffic',       notifTitle: 'Traffic density returned to normal range',  location: 'Main St · SNS-TR-001', value: '45 veh/min' },
  { type: 'critical', title: 'Traffic Congestion Critical', message: 'Multiple sensors report critical congestion on Main St corridor.',      category: 'Traffic',       notifTitle: 'Traffic congestion critical',               location: 'Main St corridor',    value: undefined   },
];

@Injectable({ providedIn: 'root' })
export class AlertSimulatorService implements OnDestroy {
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(private toastService: ToastService, private notificationService: NotificationService) {}

  /** Call once at app startup to begin simulated alert stream. */
  start() {
    this.scheduleNext(500);
  }

  private scheduleNext(delayMs: number) {
    const t = setTimeout(() => {
      const alert = MOCK_ALERTS[Math.floor(Math.random() * MOCK_ALERTS.length)];
      this.toastService.show(alert.type, alert.title, alert.message);
      this.notificationService.add({
        type: alert.type,
        category: alert.category,
        title: alert.notifTitle,
        location: alert.location,
        value: alert.value,
      });
      this.scheduleNext(15000);
    }, delayMs);
    this.timers.push(t);
  }

  ngOnDestroy() {
    this.timers.forEach(clearTimeout);
  }
}
