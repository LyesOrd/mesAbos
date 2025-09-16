import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      pButton
      type="button"
      [icon]="currentIcon()"
      class="p-button-text p-button-rounded"
      [title]="currentTitle()"
      (click)="toggleTheme()"
    ></button>
  `,
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  protected readonly isDarkMode = this.themeService.isDarkMode;

  protected readonly currentIcon = computed(() => {
    return this.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon';
  });

  protected readonly currentTitle = computed(() => {
    return this.isDarkMode()
      ? 'Basculer vers le mode clair'
      : 'Basculer vers le mode sombre';
  });

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
