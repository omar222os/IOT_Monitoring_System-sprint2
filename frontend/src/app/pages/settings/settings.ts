import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Car, Lightbulb, Wind } from 'lucide-angular';
import { forkJoin, Observable, of } from 'rxjs';
import { SettingsCardComponent, SliderConfig, SliderSaveState } from '../../components/settings-card/settings-card.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AlertListenerService } from '../../services/alert-listener.service';
import { SettingRule, SettingsService } from '../../services/settings.service';
import { SimulatorService } from '../../services/simulator.service';

const SLIDER_META: Record<string, { label: string; unit: string; min: number; max: number; defaultLow: number; defaultHigh: number }> = {
  'TRAFFIC.trafficDensity':        { label: 'Traffic density',          unit: 'veh/min', min: 0,  max: 120,  defaultLow: 0,  defaultHigh: 70  },
  'TRAFFIC.avgSpeed':              { label: 'Avg speed',                unit: 'km/h',    min: 0,  max: 130,  defaultLow: 25, defaultHigh: 110 },
  'AIR_POLLUTION.co':              { label: 'Carbon monoxide (CO)',      unit: 'ppm',     min: 0,  max: 50,   defaultLow: 0,  defaultHigh: 9   },
  'AIR_POLLUTION.ozone':           { label: 'Ozone (O₃)',               unit: 'ppb',     min: 0,  max: 200,  defaultLow: 0,  defaultHigh: 70  },
  'STREET_LIGHT.brightnessLevel':  { label: 'Brightness level',         unit: '%',       min: 0,  max: 100,  defaultLow: 20, defaultHigh: 100 },
  'STREET_LIGHT.powerConsumption': { label: 'Power consumption',        unit: 'W',       min: 0,  max: 500,  defaultLow: 50, defaultHigh: 250 },
};

const TYPE_METRICS: Record<string, string[]> = {
  TRAFFIC:       ['trafficDensity', 'avgSpeed'],
  AIR_POLLUTION: ['co', 'ozone'],
  STREET_LIGHT:  ['brightnessLevel', 'powerConsumption'],
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [SidebarComponent, SettingsCardComponent],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {
  readonly CarIcon = Car;
  readonly WindIcon = Wind;
  readonly LightbulbIcon = Lightbulb;

  loading = true;
  savingCard = [false, false, false];

  frequencies: Record<string, number> = {
    TRAFFIC: 30,
    AIR_POLLUTION: 30,
    STREET_LIGHT: 30,
  };

  trafficSliders: SliderConfig[] = [];
  airPollutionSliders: SliderConfig[] = [];
  streetLightsSliders: SliderConfig[] = [];

  constructor(private settingsService: SettingsService, private cdr: ChangeDetectorRef, private alertListener: AlertListenerService, private simulatorService: SimulatorService) {}

  ngOnInit() {
    this.loadSettings();
  }

  private loadSettings() {
    this.settingsService.fetchAll().subscribe({
      next: (rules) => {
        this.trafficSliders      = this.buildSliders('TRAFFIC', rules);
        this.airPollutionSliders = this.buildSliders('AIR_POLLUTION', rules);
        this.streetLightsSliders = this.buildSliders('STREET_LIGHT', rules);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (!this.trafficSliders.length) {
          this.trafficSliders      = this.buildSliders('TRAFFIC', []);
          this.airPollutionSliders = this.buildSliders('AIR_POLLUTION', []);
          this.streetLightsSliders = this.buildSliders('STREET_LIGHT', []);
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildSliders(type: string, rules: SettingRule[]): SliderConfig[] {
    const typeRules = rules.filter(r => r.type === type);
    return TYPE_METRICS[type].map(metric => {
      const meta  = SLIDER_META[`${type}.${metric}`];
      const above = typeRules.find(r => r.metric === metric && r.alertType === 'ABOVE');
      const below = typeRules.find(r => r.metric === metric && r.alertType === 'BELOW');
      return {
        metric,
        label:           meta.label,
        unit:            meta.unit,
        min:             meta.min,
        max:             meta.max,
        low:             below ? below.thresholdValue : meta.defaultLow,
        high:            above ? above.thresholdValue : meta.defaultHigh,
        alertAbove:      !!above,
        alertBelow:      !!below,
        existingAboveId: above?.id,
        existingBelowId: below?.id,
      };
    });
  }

  onSaveCard(type: 'TRAFFIC' | 'AIR_POLLUTION' | 'STREET_LIGHT', states: SliderSaveState[], cardIndex: number) {
    this.savingCard = this.savingCard.map((v, i) => i === cardIndex ? true : v);

    const ops: Observable<unknown>[] = [];

    for (const s of states) {
      // ABOVE rule
      if (s.alertAbove && s.existingAboveId) {
        ops.push(this.settingsService.update(s.existingAboveId, { metric: s.metric, thresholdValue: s.highValue, alertType: 'ABOVE' }));
      } else if (s.alertAbove && !s.existingAboveId) {
        ops.push(this.settingsService.create({ type, metric: s.metric, thresholdValue: s.highValue, alertType: 'ABOVE' }));
      } else if (!s.alertAbove && s.existingAboveId) {
        ops.push(this.settingsService.delete(s.existingAboveId));
      }

      // BELOW rule
      if (s.alertBelow && s.existingBelowId) {
        ops.push(this.settingsService.update(s.existingBelowId, { metric: s.metric, thresholdValue: s.lowValue, alertType: 'BELOW' }));
      } else if (s.alertBelow && !s.existingBelowId) {
        ops.push(this.settingsService.create({ type, metric: s.metric, thresholdValue: s.lowValue, alertType: 'BELOW' }));
      } else if (!s.alertBelow && s.existingBelowId) {
        ops.push(this.settingsService.delete(s.existingBelowId));
      }
    }

    const all$: Observable<unknown> = ops.length ? forkJoin(ops) : of(null);
    all$.subscribe({
      next: () => {
        this.savingCard = this.savingCard.map((v, i) => i === cardIndex ? false : v);
        this.cdr.detectChanges();
        this.loadSettings();
        this.alertListener.refreshRules();
      },
      error: () => {
        this.savingCard = this.savingCard.map((v, i) => i === cardIndex ? false : v);
        this.cdr.detectChanges();
      }
    });
  }

  onFrequencySave(type: 'TRAFFIC' | 'AIR_POLLUTION' | 'STREET_LIGHT', intervalSeconds: number) {
    this.simulatorService.updateFrequency(type, intervalSeconds).subscribe({
      next: () => {
        this.frequencies = { ...this.frequencies, [type]: intervalSeconds };
        this.cdr.detectChanges();
      }
    });
  }
}
