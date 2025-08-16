import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { MenuModule } from 'primeng/menu';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    StyleClassModule,
    MenubarModule,
    MenuModule,
    RouterLink,
  ],
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  mobileItems = [
    { label: 'Accueil', url: '#hero' },
    { label: 'Fonctionnalités', url: '#features' },
    { label: 'Tarifs', url: '#pricing' },
    { label: 'Contact', url: '#contact' },
  ];

  userItems = [
    { label: 'Profil', routerLink: '/dashboard' },
    { label: 'Déconnexion', command: () => this.logout() },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
