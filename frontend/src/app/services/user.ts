import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export interface SignupResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private user: any = null;

  constructor(private http: HttpClient) {}

  signup(payload: SignupPayload): Observable<SignupResponse> {
    return this.http.post<SignupResponse>('/auth/signup', payload, {
      withCredentials: true
    });
  }

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>('/auth/login', { email, password }, {
      withCredentials: true
    });
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1]));
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setUser(user: any) {
    this.user = user;
    if (user?.token) {
      localStorage.setItem('token', user.token);
    }
  }

  getUser() {
    return this.user;
  }

  clearUser() {
    this.user = null;
    localStorage.removeItem('token');
  }

  logout(): Observable<void> {
    return this.http.post<void>('/auth/logout', {}, { withCredentials: true });
  }
}