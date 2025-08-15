import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'token';

  constructor(private http: HttpClient) {}

  async login(email: string, password: string) {
    const res = await this.http
      .post<{ token: string }>('http://localhost:3000/auth/login', {
        email,
        password,
      })
      .toPromise();
    localStorage.setItem(this.tokenKey, res!.token);
  }

  async register(name: string, email: string, password: string) {
    return this.http
      .post('http://localhost:3000/auth/register', { name, email, password })
      .toPromise();
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }
}
