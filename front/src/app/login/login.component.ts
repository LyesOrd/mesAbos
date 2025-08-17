import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputGroupModule } from 'primeng/inputgroup';
import { environment } from '../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    DividerModule,
    InputGroupModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent implements AfterViewInit {
  email = '';
  password = '';
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  ngAfterViewInit() {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (res: any) => this.handleGoogle(res),
    });
    const btn = document.getElementById('googleBtn');
    if (btn) {
      google.accounts.id.renderButton(btn, {
        theme: 'outline',
        size: 'large',
      });
    }
  }

  private async handleGoogle(response: any) {
    try {
      await this.auth.googleLogin(response.credential);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error = 'Connexion Google échouée';
    }
  }

  async submit() {
    this.error = null;
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error = 'Identifiants invalides';
    }
  }
}
