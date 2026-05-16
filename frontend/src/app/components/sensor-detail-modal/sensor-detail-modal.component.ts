import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    ViewChild,
} from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';

export interface ModalColumn {
  label: string;
  unit: string;
  decimals: number;
  key: string;
}

export interface SensorModalData {
  title: string;
  location: string;
  icon: any;
  shortId: string;
  deviceId: string;
  columns: ModalColumn[];
  /** Rows sorted oldest → newest */
  rows: Array<{ timestamp: string; [key: string]: any }>;
}

@Component({
  selector: 'app-sensor-detail-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './sensor-detail-modal.component.html',
  styleUrls: ['./sensor-detail-modal.component.css'],
})
export class SensorDetailModalComponent implements AfterViewInit {
  @Input() data!: SensorModalData;
  @Output() close = new EventEmitter<void>();

  @ViewChild('chartSvg') chartSvgRef!: ElementRef<SVGSVGElement>;

  readonly XIcon = X;
  readonly CHART_H = 180;
  readonly PAD_Y   = 14;

  svgWidth = 860;
  chartPoints: Array<{ x: number; y: number; values: Record<string, number> }> = [];
  svgPath = '';
  hoveredIndex: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  get tableRows(): Array<{ rowNum: number; item: Record<string, any> }> {
    return [...this.data.rows]
      .reverse()
      .map((item, i) => ({ rowNum: this.data.rows.length - i, item }));
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const el = this.chartSvgRef?.nativeElement;
      if (el?.clientWidth) this.svgWidth = el.clientWidth;
      this.buildChart();
      this.cdr.detectChanges();
    });
  }

  private buildChart() {
    const rows = this.data.rows;
    if (!rows.length) return;

    const key = this.data.columns[0].key;
    const vals = rows.map(r => Number(r[key]));
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const n = rows.length;
    const usableH = this.CHART_H - this.PAD_Y * 2;

    this.chartPoints = rows.map((r, i) => {
      const val = Number(r[key]);
      const x = n > 1 ? (i / (n - 1)) * this.svgWidth : this.svgWidth / 2;
      const y = this.CHART_H - this.PAD_Y - ((val - min) / range) * usableH;
      const values: Record<string, number> = {};
      this.data.columns.forEach(c => (values[c.key] = Number(r[c.key])));
      return { x, y, values };
    });

    this.svgPath =
      this.chartPoints.length > 1
        ? 'M ' + this.chartPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
        : '';
  }

  tooltipX(i: number): number {
    const pt = this.chartPoints[i];
    return pt.x > this.svgWidth - 170 ? pt.x - 162 : pt.x + 14;
  }

  tooltipY(i: number): number {
    const pt = this.chartPoints[i];
    const tooltipH = 22 + this.data.columns.length * 20;
    return Math.max(4, pt.y < this.CHART_H / 2 ? pt.y + 8 : pt.y - tooltipH - 6);
  }

  tooltipLines(i: number): Array<{ value: string; unit: string }> {
    return this.data.columns.map(c => ({
      value: this.chartPoints[i].values[c.key].toFixed(c.decimals),
      unit: c.unit,
    }));
  }

  onDotEnter(i: number) {
    this.hoveredIndex = i;
    this.cdr.detectChanges();
  }

  onDotLeave() {
    this.hoveredIndex = null;
    this.cdr.detectChanges();
  }

  timeAgo(ts: string): string {
    const normalized = /Z|[+-]\d{2}:\d{2}$/.test(ts) ? ts : ts + 'Z';
    const ms = Date.now() - new Date(normalized).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }
}
