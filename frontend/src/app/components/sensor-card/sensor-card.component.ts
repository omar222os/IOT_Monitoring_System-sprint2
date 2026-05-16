import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type RangeStatus = 'in-range' | 'above' | 'below';
export type CongestionLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CongestionThresholds {
  medium: number;  // value at or above this = medium
  high: number;    // value at or above this = high
  critical: number;
}

@Component({
  selector: 'app-sensor-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './sensor-card.component.html',
  styleUrls: ['./sensor-card.component.css']
})
export class SensorCardComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() title = '';
  @Input() location = '';
  @Input() sensorId = '';
  @Input() deviceId = '';
  @Input() icon: any = null;

  @Input() valueLabel = 'Reading';
  @Input() unit = '';
  @Input() initialValue = 0;
  @Input() minVal = 0;
  @Input() maxVal = 100;
  @Input() decimals = 0;
  @Input() initialHistory: number[] = [];

  /** Safe operating range — values outside are flagged Above/Below */
  @Input() rangeMin = 0;
  @Input() rangeMax = 100;

  /** Thresholds for the congestion label (ascending: higher value = worse) */
  @Input() congestionThresholds: CongestionThresholds = { medium: 30, high: 60, critical: 90 };
  /** Set true when lower value = worse congestion (e.g. speed) */
  @Input() invertCongestion = false;

  /** How often the poll bar completes a full cycle and a new reading is fetched (ms). */
  @Input() pollIntervalMs = 60_000;

  /** When set by parent (from SSE), immediately pushes this value to the chart. */
  @Input() pushedValue?: number;

  /** When false, hides the In Range / Above / Below status row */
  @Input() showStatus = true;

  @Output() congestionChange = new EventEmitter<CongestionLevel>();
  @Output() valueChange = new EventEmitter<number>();

  liveValue = 0;
  rangeStatus: RangeStatus = 'in-range';
  congestion: CongestionLevel = 'low';
  livePoints: number[] = [];
  pollProgress = 0;
  isAnimating = false;
  slideX = 0;
  updatedAgoText = 'Just now';

  private stepPx = 0;
  private clockTimer: any;
  private lastRefreshTime = 0;
  private resizeObserver?: ResizeObserver;
  chartWidth = 320;

  constructor(private cdr: ChangeDetectorRef, private elRef: ElementRef) {}

  ngOnInit() {
    this.liveValue = this.initialValue;
    this.rangeStatus = this.computeRangeStatus(this.liveValue);
    this.congestion = this.computeCongestion(this.liveValue);
    this.livePoints = this.initialHistory.length
      ? [...this.initialHistory]
      : [this.initialValue];
    this.lastRefreshTime = Date.now();
    // emit initial values so the parent has a value from the start
    setTimeout(() => {
      this.congestionChange.emit(this.congestion);
      this.valueChange.emit(this.liveValue);
    });

    // Clock tick: keeps "updated X ago" label current
    this.clockTimer = setInterval(() => {
      const now = Date.now();
      const secondsAgo = Math.floor((now - this.lastRefreshTime) / 1000);
      this.updatedAgoText = secondsAgo < 10 ? 'Just now'
        : secondsAgo < 60 ? `${secondsAgo}s ago`
        : `${Math.floor(secondsAgo / 60)}m ago`;
      this.cdr.detectChanges();
    }, 1000);
  }

  ngAfterViewInit() {
    const el = this.elRef.nativeElement.querySelector('.chart-area');
    if (el && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        const w = Math.floor(entries[0]?.contentRect.width ?? 320);
        if (w > 0 && w !== this.chartWidth) {
          this.chartWidth = w;
          this.cdr.detectChanges();
        }
      });
      this.resizeObserver.observe(el);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pushedValue'] && !changes['pushedValue'].firstChange
        && changes['pushedValue'].currentValue != null) {
      const val: number = changes['pushedValue'].currentValue;
      const factor = Math.pow(10, this.decimals);
      this.liveValue = Math.round(val * factor) / factor;
      this.rangeStatus = this.computeRangeStatus(this.liveValue);
      this.congestion = this.computeCongestion(this.liveValue);
      this.lastRefreshTime = Date.now();
      this.updatedAgoText = 'Just now';
      this.congestionChange.emit(this.congestion);
      this.valueChange.emit(this.liveValue);
      this.pushToChart(this.liveValue);
    }
  }

  ngOnDestroy() {
    clearInterval(this.clockTimer);
    this.resizeObserver?.disconnect();
  }

  private pushToChart(value: number) {
    const n = this.livePoints.length;
    this.stepPx = this.chartWidth / Math.max(n - 1, 1);

    // Step 1: append new point, position at 0, no transition — let browser paint this
    this.livePoints = [...this.livePoints, value];
    this.isAnimating = false;
    this.slideX = 0;
    this.cdr.detectChanges();

    // Step 2: two rAFs so the browser has committed the paint before we animate
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this.isAnimating = true;
      this.slideX = -this.stepPx;
      this.cdr.detectChanges();
    }));

    // Step 3: after transition finishes, drop oldest point and snap back (invisible since path is identical)
    setTimeout(() => {
      this.livePoints = this.livePoints.slice(1);
      this.isAnimating = false;
      this.slideX = 0;
      this.cdr.detectChanges();
    }, 520);
  }

  private computeRangeStatus(val: number): RangeStatus {
    if (val > this.rangeMax) return 'above';
    if (val < this.rangeMin) return 'below';
    return 'in-range';
  }

  private computeCongestion(val: number): CongestionLevel {
    const { medium, high, critical } = this.congestionThresholds;
    if (this.invertCongestion) {
      if (val <= critical) return 'critical';
      if (val <= high) return 'high';
      if (val <= medium) return 'medium';
      return 'low';
    }
    if (val >= critical) return 'critical';
    if (val >= high) return 'high';
    if (val >= medium) return 'medium';
    return 'low';
  }

  get rangeStatusLabel(): string {
    if (this.rangeStatus === 'in-range') return 'In Range';
    return this.rangeStatus.charAt(0).toUpperCase() + this.rangeStatus.slice(1);
  }

  get congestionLabel(): string {
    return this.congestion.charAt(0).toUpperCase() + this.congestion.slice(1);
  }

  get lastDotX(): number {
    return this.isAnimating ? this.chartWidth + this.stepPx : this.chartWidth;
  }

  get lastDotY(): number {
    const pts = this.livePoints;
    if (!pts.length) return 32;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    const last = pts[pts.length - 1];
    return 64 - ((last - min) / range) * 56 - 4;
  }

  get svgGroupTransform(): string {
    return `translateX(${this.slideX.toFixed(1)}px)`;
  }

  get svgGroupTransition(): string {
    return this.isAnimating ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
  }

  get svgPath(): string {
    const pts = this.livePoints;
    if (!pts.length) return '';
    const w = this.isAnimating ? this.chartWidth + this.stepPx : this.chartWidth;
    const h = 64;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    const step = w / (pts.length - 1);
    return pts
      .map((p, i) => {
        const x = i * step;
        const y = h - ((p - min) / range) * (h - 8) - 4;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }
}
