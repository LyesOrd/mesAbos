import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  getProfile() {
    return firstValueFrom(
      this.http.get<UserProfile>(`${this.apiUrl}/users/me`)
    );
  }

  updateProfile(data: { name: string; avatarUrl?: string }) {
    return firstValueFrom(
      this.http.patch<UserProfile>(`${this.apiUrl}/users/me`, data)
    );
  }
}
