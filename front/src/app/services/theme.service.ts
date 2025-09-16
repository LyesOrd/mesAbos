import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _isDarkMode = signal<boolean>(false);

  readonly isDarkMode = this._isDarkMode.asReadonly();

  constructor() {
    // Charger le thème depuis localStorage ou utiliser le mode clair par défaut
    const savedTheme = localStorage.getItem('dark-mode');
    if (savedTheme) {
      this.setDarkMode(JSON.parse(savedTheme));
    }
  }

  toggleTheme(): void {
    this.setDarkMode(!this._isDarkMode());
  }

  setDarkMode(isDark: boolean): void {
    this._isDarkMode.set(isDark);

    // Appliquer la classe au document
    if (isDark) {
      document.documentElement.classList.add('p-dark');
    } else {
      document.documentElement.classList.remove('p-dark');
    }

    // Sauvegarder dans localStorage
    localStorage.setItem('dark-mode', JSON.stringify(isDark));
  }
}
