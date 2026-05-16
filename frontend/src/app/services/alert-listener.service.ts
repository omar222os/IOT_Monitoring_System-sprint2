import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from './notification.service';
import { SettingRule, SettingsService } from './settings.service';
import { SseAlertEvent, SseService } from './sse.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class AlertListenerService implements OnDestroy {
  private sub?: Subscription;
  private userRules: SettingRule[] = [];

  private readonly categoryMap: Record<string, string> = {
    TRAFFIC: 'Traffic', AIR_POLLUTION: 'Air Pollution', STREET_LIGHT: 'Street Light',
  };
  private readonly metricLabel: Record<string, string> = {
    trafficDensity: 'Traffic density', avgSpeed: 'Avg speed',
    co: 'CO', ozone: 'Ozone',
    brightnessLevel: 'Brightness', powerConsumption: 'Power consumption',
  };
  private readonly unitMap: Record<string, string> = {
    trafficDensity: 'veh/min', avgSpeed: 'km/h',
    co: 'ppm', ozone: 'ppb',
    brightnessLevel: '%', powerConsumption: 'W',
  };

  constructor(
    private sseService: SseService,
    private notificationService: NotificationService,
    private toastService: ToastService,
    private settingsService: SettingsService
  ) {}

  start() {
    if (this.sub) return;
    this.settingsService.fetchAll().subscribe({
      next: (rules) => { this.userRules = rules; },
      error: () => { this.userRules = []; }
    });
    this.sseService.connect();
    this.sub = this.sseService.alerts$.subscribe(alert => {
      if (!this.belongsToUser(alert)) return;
      const n = this.toNotification(alert);
      this.notificationService.add(n);
      this.toastService.show(
        n.type,
        n.title,
        `${n.value} at ${n.location}`,
      );
    });
  }

  refreshRules() {
    this.settingsService.fetchAll().subscribe({
      next: (rules) => { this.userRules = rules; },
      error: () => { this.userRules = []; }
    });
  }

  private belongsToUser(alert: SseAlertEvent): boolean {
    return this.userRules.some(rule =>
      rule.type === alert.sensorType &&
      rule.metric === alert.metric &&
      rule.alertType === alert.alertType &&
      Math.abs(rule.thresholdValue - alert.thresholdValue) < 0.01
    );
  }

  stop() {
    this.sub?.unsubscribe();
    this.sub = undefined;
  }

  ngOnDestroy() { this.stop(); }

  private toNotification(a: SseAlertEvent) {
    const dir = a.alertType === 'ABOVE' ? 'exceeded high threshold' : 'dropped below threshold';
    return {
      type: (a.alertType === 'ABOVE' ? 'critical' : 'warning') as 'critical' | 'warning',
      category: this.categoryMap[a.sensorType] ?? a.sensorType,
      title: `${this.metricLabel[a.metric] ?? a.metric} ${dir}`,
      location: a.location,
      value: `${a.actualValue.toFixed(1)} ${this.unitMap[a.metric] ?? ''}`.trim(),
    };
  }
}
