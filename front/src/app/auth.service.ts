import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'token';

  constructor(private http: HttpClient) {}

  async login(email: string, password: string) {
    const res = await firstValueFrom(
      this.http.post<{ token: string }>('http://localhost:3000/auth/login', {
        email,
        password,
      })
    );
    localStorage.setItem(this.tokenKey, res!.token);
  }

  async register(name: string, email: string, password: string) {
    return firstValueFrom(
      this.http.post('http://localhost:3000/auth/register', {
        name,
        email,
        password,
      })
    );
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  private isTokenExpired(token: string) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  isLoggedIn() {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }
}
