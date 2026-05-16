import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {

  private _profile$ = new BehaviorSubject<UserProfile | null>(null);
  readonly profile$ = this._profile$.asObservable();

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>('/api/users/me', { withCredentials: true }).pipe(
      tap(p => this._profile$.next(p))
    );
  }

  updateProfileCache(url: string): void {
    const current = this._profile$.value;
    if (current) this._profile$.next({ ...current, profilePicture: url });
  }

  updateProfilePicture(pictureUrl: string): Observable<string> {
    return this.http.patch('/api/users/picture', { pictureUrl }, {
      withCredentials: true,
      responseType: 'text'
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<string> {
    return this.http.post('/api/users/password', { currentPassword, newPassword }, {
      withCredentials: true,
      responseType: 'text'
    });
  }
}
