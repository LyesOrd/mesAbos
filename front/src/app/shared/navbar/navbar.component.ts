import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Menubar } from 'primeng/menubar';
import { BadgeModule } from 'primeng/badge';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  imports: [
    Menubar,
    BadgeModule,
    FormsModule,
    CommonModule,
    AvatarModule,
    AvatarGroupModule,
  ],
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  constructor(private router: Router) {}

  items = [
    {
      label: 'Accueil',
      icon: 'pi pi-home',
      command: () => this.scrollTo('home'),
    },
    {
      label: 'Fonctionnalités',
      icon: 'pi pi-cog',
      command: () => this.scrollTo('features'),
    },
    {
      label: 'Contact',
      icon: 'pi pi-envelope',
      command: () => this.scrollTo('contact'),
    },
  ];

  scrollTo(section: string) {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  }

  login() {
    // À personnaliser avec ta logique
    alert('Fonction de connexion ici');
  }
}
