import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';

import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';

// Preset vert personnalisé
const GreenPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: 'rgb(240, 253, 244)', // green-50
      100: 'rgb(220, 252, 231)', // green-100
      200: 'rgb(187, 247, 208)', // green-200
      300: 'rgb(134, 239, 172)', // green-300
      400: 'rgb(74, 222, 128)', // green-400
      500: 'rgb(34, 197, 94)', // green-500
      600: 'rgb(22, 163, 74)', // green-600
      700: 'rgb(21, 128, 61)', // green-700
      800: 'rgb(22, 101, 52)', // green-800
      900: 'rgb(20, 83, 45)', // green-900
      950: 'rgb(5, 46, 22)', // green-950
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: GreenPreset,
        options: {
          darkModeSelector: '.p-dark',
        },
      },
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
