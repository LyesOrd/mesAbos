import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { NavbarComponent } from '../shared/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  message = 'Bonjour !';

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    const token = this.auth.getToken();
    this.http
      .get<{ message: string }>('/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((res) => (this.message = res.message));
  }
}
