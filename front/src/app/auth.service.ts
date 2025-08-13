import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'token';

  constructor(private http: HttpClient) {}

  async login(email: string, password: string) {
    const res = await this.http
      .post<{ token: string }>('/api/auth/login', { email, password })
      .toPromise();
    localStorage.setItem(this.tokenKey, res!.token);
  }

  async register(name: string, email: string, password: string) {
    return this.http
      .post('/api/auth/register', { name, email, password })
      .toPromise();
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }
}
