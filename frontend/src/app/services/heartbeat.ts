import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HeartbeatService {

  constructor(private http: HttpClient) {}

  check(): Observable<string> {
    return this.http.get('/heartbeat', { responseType: 'text' }).pipe(
      timeout(5000)
    );
  }
}
