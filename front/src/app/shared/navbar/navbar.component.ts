import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService, UserProfile } from '../../auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  imports: [
    CommonModule,
    ButtonModule,
    StyleClassModule,
    MenubarModule,
    MenuModule,
    RouterLink,
    NgOptimizedImage,
  ],
  styleUrls: ['./navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly profileSignal = toSignal(this.auth.getProfile(), {
    initialValue: null as UserProfile | null,
  });

  readonly isDark = this.themeService.isDarkMode;

  readonly mobileItems = [
    { label: 'Accueil', url: '#hero' },
    { label: 'Fonctionnalités', url: '#features' },
    { label: 'Tarifs', url: '#pricing' },
    { label: 'Contact', url: '#contact' },
  ];

  readonly userItems: MenuItem[] = [
    { label: 'Dashboard', routerLink: '/dashboard' },
    { label: 'Profil', routerLink: '/profile' },
    { label: 'Déconnexion', command: () => this.logout() },
  ];

  readonly avatarUrl = computed(() => {
    const profile = this.profileSignal();
    return profile?.avatarUrl ?? 'assets/avatar-placeholder.svg';
  });

  readonly avatarAlt = computed(() => {
    const profile = this.profileSignal();

    if (profile?.name) {
      return `Photo de profil de ${profile.name}`;
    }

    if (profile?.email) {
      return `Photo de profil de ${profile.email}`;
    }

    return 'Photo de profil';
  });

  readonly profileLabel = computed(() => {
    const profile = this.profileSignal();
    return profile?.name ?? profile?.email ?? 'Mon profil';
  });

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
