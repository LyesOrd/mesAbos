import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, defer, firstValueFrom, map, of } from 'rxjs';

interface UserProfileResponse {
  id: string;
  email: string;
  name: string | null;
  avatar?: string | null;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'token';

  async login(email: string, password: string) {
    const res = await firstValueFrom(
      this.http.post<{ token: string }>('http://localhost:3000/auth/login', {
        email,
        password,
      })
    );
    localStorage.setItem(this.tokenKey, res.token);
  }

  async googleLogin(token: string) {
    const res = await firstValueFrom(
      this.http.post<{ token: string }>('http://localhost:3000/auth/google', {
        token,
      })
    );
    localStorage.setItem(this.tokenKey, res.token);
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

  async updateProfile(data: FormData) {
    return firstValueFrom(
      this.http.patch<UserProfile>('http://localhost:3000/users/me', data)
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

  getProfile(): Observable<UserProfile | null> {
    return defer(() => {
      if (!this.isLoggedIn()) {
        return of(null);
      }

      return this.http
        .get<UserProfileResponse>('http://localhost:3000/users/me')
        .pipe(
          map((profile) => ({
            ...profile,
            avatarUrl: profile.avatar ?? this.buildAvatarUrl(profile),
          })),
          catchError(() => of(null))
        );
    });
  }

  private buildAvatarUrl(profile: UserProfileResponse) {
    const reference =
      profile.name?.trim() || profile.email?.trim() || profile.id;

    if (!reference) {
      return 'assets/avatar-placeholder.svg';
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      reference
    )}&background=random&format=png`;
  }
}
