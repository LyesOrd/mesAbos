import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Menubar, MenubarModule } from 'primeng/menubar';
import { BadgeModule } from 'primeng/badge';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    StyleClassModule,
    MenubarModule,
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
}
