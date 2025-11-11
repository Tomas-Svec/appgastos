import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeSubject: BehaviorSubject<boolean>;
  public darkMode$: Observable<boolean>;

  constructor() {
    // Leer preferencia guardada o usar la del sistema
    const savedPreference = localStorage.getItem('darkMode');
    let initialDarkMode: boolean;

    if (savedPreference !== null) {
      initialDarkMode = savedPreference === 'true';
    } else {
      initialDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      localStorage.setItem('darkMode', initialDarkMode.toString());
    }

    this.darkModeSubject = new BehaviorSubject<boolean>(initialDarkMode);
    this.darkMode$ = this.darkModeSubject.asObservable();

    // Aplicar el tema inicial
    this.applyTheme(initialDarkMode);
  }

  toggleDarkMode(enabled: boolean): void {
    this.darkModeSubject.next(enabled);
    localStorage.setItem('darkMode', enabled.toString());
    this.applyTheme(enabled);
  }

  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }

  private applyTheme(darkMode: boolean): void {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
}
