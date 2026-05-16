import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SettingRule {
  id: string;
  type: 'TRAFFIC' | 'AIR_POLLUTION' | 'STREET_LIGHT';
  metric: string;
  thresholdValue: number;
  alertType: 'ABOVE' | 'BELOW';
  createdAt: string;
}

export interface CreateSettingRule {
  type: string;
  metric: string;
  thresholdValue: number;
  alertType: 'ABOVE' | 'BELOW';
}

export interface UpdateSettingRule {
  metric: string;
  thresholdValue: number;
  alertType: 'ABOVE' | 'BELOW';
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private http: HttpClient) {}

  fetchAll(): Observable<SettingRule[]> {
    return this.http.get<SettingRule[]>('/api/settings', { withCredentials: true });
  }

  create(rule: CreateSettingRule): Observable<SettingRule> {
    return this.http.post<SettingRule>('/api/settings', rule, { withCredentials: true });
  }

  update(id: string, rule: UpdateSettingRule): Observable<SettingRule> {
    return this.http.put<SettingRule>(`/api/settings/${id}`, rule, { withCredentials: true });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/settings/${id}`, { withCredentials: true });
  }
}
