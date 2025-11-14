import { Component, OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { DatabaseService } from './services/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private themeService: ThemeService,
    private databaseService: DatabaseService
  ) {}

  async ngOnInit() {
    // Inicializar base de datos ANTES de cualquier otra operación
    try {
      await this.databaseService.initializeDatabase();
    } catch (error) {
      // Error handling
    }
  }
}
