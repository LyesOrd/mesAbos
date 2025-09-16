import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, ButtonModule, MenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center">
      <!-- Toggle simple pour mobile -->
      <button
        pButton
        type="button"
        [icon]="currentIcon()"
        class="p-button-text p-button-rounded md:hidden"
        [attr.aria-label]="toggleAriaLabel()"
        [title]="toggleTitle()"
        (click)="toggleTheme()"
      ></button>

      <!-- Menu déroulant pour desktop -->
      <div class="hidden md:block">
        <p-menu #themeMenu [model]="menuItems()" [popup]="true"></p-menu>
        <button
          pButton
          type="button"
          [icon]="currentIcon()"
          [label]="isMobile() ? '' : 'Thème'"
          class="p-button-text"
          [attr.aria-label]="menuAriaLabel()"
          [title]="menuTitle()"
          (click)="themeMenu.toggle($event)"
          [attr.aria-expanded]="menuExpanded()"
          [attr.aria-haspopup]="true"
        ></button>
      </div>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  // Signals pour l'état du composant
  private readonly _menuExpanded = signal(false);
  protected readonly isMobile = signal(false);

  // Computed signals pour la réactivité
  protected readonly currentTheme = this.themeService.theme;
  protected readonly isDarkMode = this.themeService.isDarkMode;

  protected readonly currentIcon = computed(() => {
    return this.themeService.getThemeIcon();
  });

  protected readonly toggleAriaLabel = computed(() => {
    const isDark = this.isDarkMode();
    return `Basculer vers le thème ${isDark ? 'clair' : 'sombre'}`;
  });

  protected readonly toggleTitle = computed(() => {
    const current = this.themeService.getThemeLabel();
    return `Thème actuel : ${current}. Cliquer pour changer`;
  });

  protected readonly menuAriaLabel = computed(() => {
    const current = this.themeService.getThemeLabel();
    return `Menu des thèmes. Thème actuel : ${current}`;
  });

  protected readonly menuTitle = computed(() => {
    return 'Choisir un thème';
  });

  protected readonly menuExpanded = computed(() => {
    return this._menuExpanded();
  });

  protected readonly menuItems = computed((): MenuItem[] => {
    const current = this.currentTheme();

    return [
      {
        label: 'Thème clair',
        icon: 'pi pi-sun',
        command: () => this.setTheme('light'),
        styleClass: current === 'light' ? 'p-menuitem-active' : '',
        title: 'Utiliser le thème clair',
      },
      {
        label: 'Thème sombre',
        icon: 'pi pi-moon',
        command: () => this.setTheme('dark'),
        styleClass: current === 'dark' ? 'p-menuitem-active' : '',
        title: 'Utiliser le thème sombre',
      },
      {
        label: 'Suivre le système',
        icon: 'pi pi-desktop',
        command: () => this.setTheme('system'),
        styleClass: current === 'system' ? 'p-menuitem-active' : '',
        title: 'Suivre les préférences du système',
      },
    ];
  });

  constructor() {
    // Détecter la taille d'écran
    this.detectMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.detectMobile());
    }
  }

  private detectMobile(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();

    // Annoncer le changement aux lecteurs d'écran
    this.announceThemeChange();
  }

  protected setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
    this._menuExpanded.set(false);

    // Annoncer le changement aux lecteurs d'écran
    this.announceThemeChange();
  }

  /**
   * Annonce le changement de thème aux technologies d'assistance
   */
  private announceThemeChange(): void {
    if (typeof document === 'undefined') return;

    const announcement = `Thème changé vers ${this.themeService.getThemeLabel()}`;

    // Créer un élément temporaire pour l'annonce
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;

    document.body.appendChild(announcer);

    // Supprimer l'élément après un délai
    setTimeout(() => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer);
      }
    }, 1000);
  }
}
