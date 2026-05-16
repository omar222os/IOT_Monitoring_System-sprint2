import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Bus, Lightbulb, Wind } from 'lucide-angular';
import { Subscription, forkJoin } from 'rxjs';
import { CongestionLevel, CongestionThresholds, SensorCardComponent } from '../../components/sensor-card/sensor-card.component';
import { ModalColumn, SensorDetailModalComponent, SensorModalData } from '../../components/sensor-detail-modal/sensor-detail-modal.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AirPollutionHistoryItem, SensorHistoryService, StreetLightHistoryItem, TrafficHistoryItem } from '../../services/sensor-history.service';
import { SettingRule, SettingsService } from '../../services/settings.service';
import { AirPollutionReading, SseService, StreetLightReading, TrafficReading } from '../../services/sse.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, SensorCardComponent, SensorDetailModalComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly BusIcon = Bus;
  readonly WindIcon = Wind;
  readonly LightbulbIcon = Lightbulb;

  readonly pollMs = 15_000;

  historyLoaded = false;
  activeModal: SensorModalData | null = null;
  noHistoryError = '';

  // Full history rows (for modal)
  private trafficRows: TrafficHistoryItem[] = [];
  private airRows: AirPollutionHistoryItem[] = [];
  private lightRows: StreetLightHistoryItem[] = [];

  // SSE pushed values
  pushedDensity?: number;
  pushedSpeed?: number;
  pushedCo?: number;
  pushedOzone?: number;
  pushedPm25?: number;
  pushedPm10?: number;
  pushedNo2?: number;
  pushedSo2?: number;
  pushedBrightness?: number;
  pushedPower?: number;

  private sseSub?: Subscription;

  private readonly levels: CongestionLevel[] = ['low', 'medium', 'high', 'critical'];

  // ── Traffic ──
  densityHistory: number[] = [];
  speedHistory:   number[] = [];
  initialDensity = 0;
  initialSpeed   = 0;
  densityCongestion: CongestionThresholds = { medium: 40, high: 70, critical: 95 };
  speedCongestion:   CongestionThresholds = { medium: 60, high: 35, critical: 20 };

  private trafficCards: [CongestionLevel, CongestionLevel] = ['low', 'low'];
  trafficCongestion: CongestionLevel = 'low';

  onTrafficCongestion(index: 0 | 1, level: CongestionLevel) {
    this.trafficCards[index] = level;
    const iA = this.levels.indexOf(this.trafficCards[0]);
    const iB = this.levels.indexOf(this.trafficCards[1]);
    this.trafficCongestion = this.levels[Math.max(iA, iB)];
  }
  get trafficCongestionLabel() { return this.capitalize(this.trafficCongestion); }

  // ── Air Pollution ──
  coHistory:    number[] = [];
  ozoneHistory: number[] = [];
  pm25History:  number[] = [];
  pm10History:  number[] = [];
  no2History:   number[] = [];
  so2History:   number[] = [];
  initialCo    = 0;
  initialOzone = 0;
  initialPm25  = 0;
  initialPm10  = 0;
  initialNo2   = 0;
  initialSo2   = 0;
  coCongestion:    CongestionThresholds = { medium: 5,  high: 15,  critical: 30  };
  ozoneCongestion: CongestionThresholds = { medium: 55, high: 85,  critical: 120 };
  pm25Congestion:  CongestionThresholds = { medium: 12, high: 35,  critical: 55  };
  pm10Congestion:  CongestionThresholds = { medium: 54, high: 154, critical: 250 };
  no2Congestion:   CongestionThresholds = { medium: 53, high: 100, critical: 150 };
  so2Congestion:   CongestionThresholds = { medium: 35, high: 75,  critical: 185 };

  private airCards: [CongestionLevel, CongestionLevel] = ['low', 'low'];
  airPollutionLevel: CongestionLevel = 'low';

  onAirCongestion(index: 0 | 1, level: CongestionLevel) {
    this.airCards[index] = level;
    const iA = this.levels.indexOf(this.airCards[0]);
    const iB = this.levels.indexOf(this.airCards[1]);
    this.airPollutionLevel = this.levels[Math.max(iA, iB)];
  }
  get airPollutionLevelLabel() { return this.capitalize(this.airPollutionLevel); }

  // ── Street Lights ──
  brightnessHistory: number[] = [];
  powerHistory:      number[] = [];
  initialBrightness = 0;
  initialPower      = 0;
  brightnessCongestion: CongestionThresholds = { medium: 40, high: 70,  critical: 90  };
  powerCongestion:      CongestionThresholds = { medium: 100, high: 200, critical: 300 };

  streetLightsOn = true;
  onBrightnessValue(value: number) { this.streetLightsOn = value > 5; }
  get streetLightsStatusLabel() { return this.streetLightsOn ? 'On' : 'Off'; }

  constructor(private sseService: SseService, private historyService: SensorHistoryService, private settingsService: SettingsService, private cdr: ChangeDetectorRef) {}

  // Per-metric range bounds derived from user alert settings.
  // Default = full sensor measurement range → always "In Range" when no rule is configured.
  private readonly defaultRanges: Record<string, { min: number; max: number }> = {
    trafficDensity:   { min: 0,  max: 120 },
    avgSpeed:         { min: 5,  max: 130 },
    co:               { min: 0,  max: 50  },
    ozone:            { min: 0,  max: 200 },
    brightnessLevel:  { min: 0,  max: 100 },
    powerConsumption: { min: 0,  max: 300 },
  };

  ranges: Record<string, { min: number; max: number }> = { ...this.defaultRanges };

  ngOnInit() {
    this.sseService.connect();

    // Load user alert rules to drive the "In Range / Above / Below" status on each card
    this.settingsService.fetchAll().subscribe({
      next: rules => this.applyRulesToRanges(rules),
      error: () => { /* keep defaults */ }
    });

    this.sseSub = this.sseService.readings$.subscribe(event => {
      if (event.sensorType === 'TRAFFIC') {
        const d = event.data as TrafficReading;
        this.pushedDensity = d.trafficDensity;
        this.pushedSpeed   = d.avgSpeed;
        this.trafficRows    = [...this.trafficRows, d].slice(-20);
        this.densityHistory = [...this.densityHistory, d.trafficDensity].slice(-20);
        this.speedHistory   = [...this.speedHistory, d.avgSpeed].slice(-20);
      } else if (event.sensorType === 'AIR_POLLUTION') {
        const d = event.data as AirPollutionReading;
        this.pushedCo    = d.co;
        this.pushedOzone = d.ozone;
        this.pushedPm25  = d.pm25;
        this.pushedPm10  = d.pm10;
        this.pushedNo2   = d.no2;
        this.pushedSo2   = d.so2;
        this.airRows      = [...this.airRows, d].slice(-20);
        this.coHistory    = [...this.coHistory, d.co].slice(-20);
        this.ozoneHistory = [...this.ozoneHistory, d.ozone].slice(-20);
        this.pm25History  = [...this.pm25History,  d.pm25].slice(-20);
        this.pm10History  = [...this.pm10History,  d.pm10].slice(-20);
        this.no2History   = [...this.no2History,   d.no2].slice(-20);
        this.so2History   = [...this.so2History,   d.so2].slice(-20);
      } else if (event.sensorType === 'STREET_LIGHT') {
        const d = event.data as StreetLightReading;
        this.pushedBrightness = d.brightnessLevel;
        this.pushedPower      = d.powerConsumption;
        this.lightRows         = [...this.lightRows, d].slice(-20);
        this.brightnessHistory = [...this.brightnessHistory, d.brightnessLevel].slice(-20);
        this.powerHistory      = [...this.powerHistory, d.powerConsumption].slice(-20);
      }
      this.cdr.detectChanges();
    });

    forkJoin({
      traffic: this.historyService.getTrafficHistory(20),
      air:     this.historyService.getAirPollutionHistory(20),
      light:   this.historyService.getStreetLightHistory(20),
    }).subscribe({
      next: ({ traffic, air, light }) => {
        // Sort by timestamp ascending (oldest → newest) so chart reads left-to-right
        const trafficAsc = [...traffic].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        this.trafficRows   = trafficAsc;
        this.densityHistory = trafficAsc.map(r => r.trafficDensity);
        this.speedHistory   = trafficAsc.map(r => r.avgSpeed);
        if (trafficAsc.length) {
          const latest = trafficAsc[trafficAsc.length - 1];
          this.initialDensity = latest.trafficDensity;
          this.initialSpeed   = latest.avgSpeed;
        }

        const airAsc = [...air].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        this.airRows   = airAsc;
        this.coHistory    = airAsc.map(r => r.co);
        this.ozoneHistory = airAsc.map(r => r.ozone);
        this.pm25History  = airAsc.map(r => r.pm25);
        this.pm10History  = airAsc.map(r => r.pm10);
        this.no2History   = airAsc.map(r => r.no2);
        this.so2History   = airAsc.map(r => r.so2);
        if (airAsc.length) {
          const latest = airAsc[airAsc.length - 1];
          this.initialCo    = latest.co;
          this.initialOzone = latest.ozone;
          this.initialPm25  = latest.pm25;
          this.initialPm10  = latest.pm10;
          this.initialNo2   = latest.no2;
          this.initialSo2   = latest.so2;
        }

        const lightAsc = [...light].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        this.lightRows         = lightAsc;
        this.brightnessHistory = lightAsc.map(r => r.brightnessLevel);
        this.powerHistory      = lightAsc.map(r => r.powerConsumption);
        if (lightAsc.length) {
          const latest = lightAsc[lightAsc.length - 1];
          this.initialBrightness = latest.brightnessLevel;
          this.initialPower      = latest.powerConsumption;
        }

        this.historyLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        // Show cards with default zero values if history fetch fails
        this.historyLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.sseSub?.unsubscribe();
    this.sseService.disconnect();
  }

  private showNoHistory(label: string) {
    this.noHistoryError = `No history available for ${label} yet. Wait for the next reading.`;
    this.cdr.detectChanges();
    setTimeout(() => { this.noHistoryError = ''; this.cdr.detectChanges(); }, 3000);
  }

  openDensityModal() {
    if (!this.trafficRows.length) { this.showNoHistory('Traffic'); return; }
    const latest = this.trafficRows[this.trafficRows.length - 1];
    this.activeModal = {
      title: 'Traffic Density',
      location: latest.location,
      icon: this.BusIcon,
      shortId: 'tr-01',
      deviceId: latest.id,
      columns: [
        { label: 'TRAFFIC DENSITY', unit: 'veh/min', decimals: 0, key: 'trafficDensity' } as ModalColumn,
      ],
      rows: this.trafficRows,
    };
    this.cdr.detectChanges();
  }

  openSpeedModal() {
    if (!this.trafficRows.length) { this.showNoHistory('Traffic'); return; }
    const latest = this.trafficRows[this.trafficRows.length - 1];
    this.activeModal = {
      title: 'Average Speed',
      location: latest.location,
      icon: this.BusIcon,
      shortId: 'tr-02',
      deviceId: latest.id,
      columns: [
        { label: 'AVG SPEED', unit: 'km/h', decimals: 1, key: 'avgSpeed' } as ModalColumn,
      ],
      rows: this.trafficRows,
    };
    this.cdr.detectChanges();
  }

  openCoModal() {
    if (!this.airRows.length) { this.showNoHistory('Air Pollution'); return; }
    const latest = this.airRows[this.airRows.length - 1];
    this.activeModal = {
      title: 'Carbon Monoxide',
      location: latest.location,
      icon: this.WindIcon,
      shortId: 'ap-01',
      deviceId: latest.id,
      columns: [
        { label: 'CO', unit: 'ppm', decimals: 1, key: 'co' } as ModalColumn,
      ],
      rows: this.airRows,
    };
    this.cdr.detectChanges();
  }

  openOzoneModal() {
    if (!this.airRows.length) { this.showNoHistory('Air Pollution'); return; }
    const latest = this.airRows[this.airRows.length - 1];
    this.activeModal = {
      title: 'Ozone',
      location: latest.location,
      icon: this.WindIcon,
      shortId: 'ap-02',
      deviceId: latest.id,
      columns: [
        { label: 'OZONE', unit: 'ppb', decimals: 0, key: 'ozone' } as ModalColumn,
      ],
      rows: this.airRows,
    };
    this.cdr.detectChanges();
  }

  openPm25Modal() {
    if (!this.airRows.length) { this.showNoHistory('Air Pollution'); return; }
    const latest = this.airRows[this.airRows.length - 1];
    this.activeModal = {
      title: 'PM2.5',
      location: latest.location,
      icon: this.WindIcon,
      shortId: 'ap-03',
      deviceId: latest.id,
      columns: [
        { label: 'PM2.5', unit: 'µg/m³', decimals: 1, key: 'pm25' } as ModalColumn,
      ],
      rows: this.airRows,
    };
    this.cdr.detectChanges();
  }

  openPm10Modal() {
    if (!this.airRows.length) { this.showNoHistory('Air Pollution'); return; }
    const latest = this.airRows[this.airRows.length - 1];
    this.activeModal = {
      title: 'PM10',
      location: latest.location,
      icon: this.WindIcon,
      shortId: 'ap-04',
      deviceId: latest.id,
      columns: [
        { label: 'PM10', unit: 'µg/m³', decimals: 1, key: 'pm10' } as ModalColumn,
      ],
      rows: this.airRows,
    };
    this.cdr.detectChanges();
  }

  openNo2Modal() {
    if (!this.airRows.length) { this.showNoHistory('Air Pollution'); return; }
    const latest = this.airRows[this.airRows.length - 1];
    this.activeModal = {
      title: 'Nitrogen Dioxide',
      location: latest.location,
      icon: this.WindIcon,
      shortId: 'ap-05',
      deviceId: latest.id,
      columns: [
        { label: 'NO₂', unit: 'ppb', decimals: 1, key: 'no2' } as ModalColumn,
      ],
      rows: this.airRows,
    };
    this.cdr.detectChanges();
  }

  openSo2Modal() {
    if (!this.airRows.length) { this.showNoHistory('Air Pollution'); return; }
    const latest = this.airRows[this.airRows.length - 1];
    this.activeModal = {
      title: 'Sulfur Dioxide',
      location: latest.location,
      icon: this.WindIcon,
      shortId: 'ap-06',
      deviceId: latest.id,
      columns: [
        { label: 'SO₂', unit: 'ppb', decimals: 1, key: 'so2' } as ModalColumn,
      ],
      rows: this.airRows,
    };
    this.cdr.detectChanges();
  }

  openBrightnessModal() {
    if (!this.lightRows.length) { this.showNoHistory('Street Light'); return; }
    const latest = this.lightRows[this.lightRows.length - 1];
    this.activeModal = {
      title: 'Brightness',
      location: latest.location,
      icon: this.LightbulbIcon,
      shortId: 'sl-01',
      deviceId: latest.id,
      columns: [
        { label: 'BRIGHTNESS', unit: '%', decimals: 0, key: 'brightnessLevel' } as ModalColumn,
      ],
      rows: this.lightRows,
    };
    this.cdr.detectChanges();
  }

  openPowerModal() {
    if (!this.lightRows.length) { this.showNoHistory('Street Light'); return; }
    const latest = this.lightRows[this.lightRows.length - 1];
    this.activeModal = {
      title: 'Power Consumption',
      location: latest.location,
      icon: this.LightbulbIcon,
      shortId: 'sl-02',
      deviceId: latest.id,
      columns: [
        { label: 'POWER', unit: 'W', decimals: 0, key: 'powerConsumption' } as ModalColumn,
      ],
      rows: this.lightRows,
    };
    this.cdr.detectChanges();
  }

  closeModal() {
    this.activeModal = null;
    this.cdr.detectChanges();
  }

  private applyRulesToRanges(rules: SettingRule[]) {
    // Start from defaults so metrics without rules stay "In Range"
    const r: Record<string, { min: number; max: number }> = {};
    for (const [k, v] of Object.entries(this.defaultRanges)) {
      r[k] = { ...v };
    }
    for (const rule of rules) {
      const m = rule.metric;
      if (!r[m]) continue;
      if (rule.alertType === 'ABOVE') {
        r[m].max = rule.thresholdValue;
      } else if (rule.alertType === 'BELOW') {
        r[m].min = rule.thresholdValue;
      }
    }
    this.ranges = r;
    this.cdr.detectChanges();
  }

  private capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
}

