import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  constructor(private http: HttpClient) {}

  updateFrequency(type: string, intervalSeconds: number): Observable<void> {
    return this.http.put<void>('/api/simulator/frequency', { type, intervalSeconds }, { withCredentials: true });
  }
}
