import { Injectable, signal, effect } from '@angular/core';

const STORAGE_KEY = 'tm_theme';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  mode = signal<ThemeMode>('dark');

  constructor() {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) as ThemeMode | null : null;
    if (saved === 'light' || saved === 'dark') this.mode.set(saved);
    effect(() => {
      const m = this.mode();
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.classList.toggle('dark', m === 'dark');
      }
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, m);
    });
  }

  toggle() { this.mode.set(this.mode() === 'dark' ? 'light' : 'dark'); }
}
