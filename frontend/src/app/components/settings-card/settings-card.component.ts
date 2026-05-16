import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

export interface SliderConfig {
  metric: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  low: number;
  high: number;
  alertAbove?: boolean;
  alertBelow?: boolean;
  existingAboveId?: string;
  existingBelowId?: string;
}

export interface SliderSaveState {
  metric: string;
  lowValue: number;
  highValue: number;
  alertAbove: boolean;
  alertBelow: boolean;
  existingAboveId?: string;
  existingBelowId?: string;
}

interface SliderState {
  config: SliderConfig;
  lowValue: number;
  highValue: number;
  lowInput: number;
  highInput: number;
  inputError: string;
  options: Options;
  alertAbove: boolean;
  alertBelow: boolean;
  _initLow: number;
  _initHigh: number;
  _initAlertAbove: boolean;
  _initAlertBelow: boolean;
}

@Component({
  selector: 'app-settings-card',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, NgxSliderModule],
  templateUrl: './settings-card.component.html',
  styleUrls: ['./settings-card.component.css']
})
export class SettingsCardComponent implements OnInit, OnChanges {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon: any = null;
  @Input() sliders: SliderConfig[] = [];
  @Input() saving = false;
  @Input() frequency: number = 30;
  @Output() saveClick = new EventEmitter<SliderSaveState[]>();
  @Output() frequencySave = new EventEmitter<number>();

  sliderStates: SliderState[] = [];
  isDirty = false;
  frequencyInput: number = 30;
  frequencyDirty = false;

  ngOnInit() {
    this.initStates();
    this.frequencyInput = this.frequency;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sliders'] && !changes['sliders'].firstChange && !this.saving) {
      this.initStates();
    }
    if (changes['frequency'] && !changes['frequency'].firstChange) {
      this.frequencyInput = this.frequency;
      this.frequencyDirty = false;
    }
  }

  private initStates() {
    this.sliderStates = this.sliders.map(s => ({
      config: s,
      lowValue: s.low,
      highValue: s.high,
      lowInput: s.low,
      highInput: s.high,
      inputError: '',
      alertAbove: s.alertAbove ?? false,
      alertBelow: s.alertBelow ?? false,
      _initLow: s.low,
      _initHigh: s.high,
      _initAlertAbove: s.alertAbove ?? false,
      _initAlertBelow: s.alertBelow ?? false,
      options: {
        floor: s.min,
        ceil: s.max,
        step: 0.5,
        noSwitching: true,
        showOuterSelectionBars: false,
      } as Options
    }));
    this.isDirty = false;
  }

  checkDirty() {
    this.isDirty = this.sliderStates.some(s =>
      s.lowValue !== s._initLow ||
      s.highValue !== s._initHigh ||
      s.alertAbove !== s._initAlertAbove ||
      s.alertBelow !== s._initAlertBelow
    );
  }

  reset() {
    this.sliderStates.forEach(s => {
      s.lowValue = s._initLow;
      s.highValue = s._initHigh;
      s.lowInput = s._initLow;
      s.highInput = s._initHigh;
      s.inputError = '';
      s.alertAbove = s._initAlertAbove;
      s.alertBelow = s._initAlertBelow;
    });
    this.isDirty = false;
  }

  commit() {
    this.sliderStates.forEach(s => {
      s._initLow = s.lowValue;
      s._initHigh = s.highValue;
      s._initAlertAbove = s.alertAbove;
      s._initAlertBelow = s.alertBelow;
    });
    this.isDirty = false;
  }

  onSaveClick() {
    if (this.hasErrors) return;
    const states: SliderSaveState[] = this.sliderStates.map(s => ({
      metric: s.config.metric,
      lowValue: s.lowValue,
      highValue: s.highValue,
      alertAbove: s.alertAbove,
      alertBelow: s.alertBelow,
      existingAboveId: s.config.existingAboveId,
      existingBelowId: s.config.existingBelowId,
    }));
    this.saveClick.emit(states);
  }

  get hasErrors(): boolean {
    return this.sliderStates.some(s => !!s.inputError);
  }

  onSliderChange(state: SliderState): void {
    state.lowInput = state.lowValue;
    state.highInput = state.highValue;
    state.inputError = '';
    if (state.lowValue === 0) state.alertBelow = false;
    this.checkDirty();
  }

  onLowInputChange(state: SliderState): void {
    const val = Number(state.lowInput);
    if (isNaN(val) || val < state.config.min || val > state.config.max) {
      state.inputError = `Must be ${state.config.min}–${state.config.max}`;
      return;
    }
    if (val > state.highValue) {
      state.inputError = 'Min must be ≤ Max';
      return;
    }
    state.inputError = '';
    state.lowValue = val;
    this.checkDirty();
  }

  onHighInputChange(state: SliderState): void {
    const val = Number(state.highInput);
    if (isNaN(val) || val < state.config.min || val > state.config.max) {
      state.inputError = `Must be ${state.config.min}–${state.config.max}`;
      return;
    }
    if (val < state.lowValue) {
      state.inputError = 'Max must be ≥ Min';
      return;
    }
    state.inputError = '';
    state.highValue = val;
    this.checkDirty();
  }

  onFrequencyInputChange(): void {
    this.frequencyDirty = Number(this.frequencyInput) !== this.frequency;
  }

  onFrequencySave(): void {
    const val = Number(this.frequencyInput);
    if (val >= 1) {
      this.frequencySave.emit(val);
    }
  }
}
