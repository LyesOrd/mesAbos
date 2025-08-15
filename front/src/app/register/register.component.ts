import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NavbarComponent,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    MessageModule,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirm = '';
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  async submit() {
    this.error = null;
    if (this.password !== this.confirm) {
      this.error = 'Passwords do not match';
      return;
    }
    try {
      await this.auth.register(this.name, this.email, this.password);
      this.router.navigate(['/login']);
    } catch {
      this.error = 'Registration failed';
    }
  }
}
