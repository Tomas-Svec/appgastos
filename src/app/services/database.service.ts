import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private isDbReady: boolean = false;
  private platform: string = '';
  public isWeb: boolean = false;

  constructor() {
    this.platform = Capacitor.getPlatform();
    this.isWeb = this.platform === 'web';
  }

  private initializationPromise: Promise<void> | null = null;

  async initializeDatabase(): Promise<void> {
    // Si ya está inicializada, retornar inmediatamente
    if (this.isDbReady) {
      return;
    }

    // Si hay una inicialización en progreso, esperar a que termine
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Iniciar nueva inicialización
    this.initializationPromise = this.performInitialization();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    //('[DatabaseService] Starting initialization...');

    // En web, usar localStorage como fallback
    if (this.isWeb) {
      this.initializeWebStorage();
      this.isDbReady = true;
      //('[DatabaseService] ✓ Initialized (Web - localStorage)');
      return;
    }

    try {
      //('[DatabaseService] Creating SQLite connection...');
      // Crear o abrir la base de datos
      this.db = await this.sqlite.createConnection(
        'appgastos_db',
        false,
        'no-encryption',
        1,
        false
      );

      //('[DatabaseService] Opening database...');
      await this.db.open();

      //('[DatabaseService] Creating tables...');
      // Crear las tablas (esperar a que realmente terminen)
      await this.createTables();

      // Solo marcar como listo cuando TODO esté completo
      this.isDbReady = true;
      //('[DatabaseService] ✓ Initialized (Native SQLite) - Ready to use');
    } catch (error) {
      console.error('[DatabaseService] ✗ Initialization failed:', error);
      this.isDbReady = false;
      this.db = null;
      throw error;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.isDbReady) {
      await this.initializeDatabase();
    }
  }

  private initializeWebStorage(): void {
    // Inicializar estructura en localStorage si no existe
    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('expenses')) {
      localStorage.setItem('expenses', JSON.stringify([]));
    }
    if (!localStorage.getItem('categories')) {
      localStorage.setItem('categories', JSON.stringify([]));
    }
    if (!localStorage.getItem('audits')) {
      localStorage.setItem('audits', JSON.stringify([]));
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Tabla de usuarios
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        monthlyIncome REAL DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tabla de gastos
    const createExpensesTable = `
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        hasInstallments INTEGER DEFAULT 0,
        installments INTEGER DEFAULT 1,
        paidInstallments INTEGER DEFAULT 0,
        firstPaymentDate TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    // Tabla de categorías
    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        icon TEXT,
        color TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tabla de auditorías
    const createAuditsTable = `
      CREATE TABLE IF NOT EXISTS audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        entityType TEXT NOT NULL,
        entityId INTEGER NOT NULL,
        action TEXT NOT NULL,
        oldValue TEXT,
        newValue TEXT,
        description TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    try {
      await this.db.execute(createUsersTable);
      await this.db.execute(createExpensesTable);
      await this.db.execute(createCategoriesTable);
      await this.db.execute(createAuditsTable);

      // Pequeño delay para asegurar que SQLite termine de escribir
      await new Promise(resolve => setTimeout(resolve, 100));

      //('Tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // ============ MÉTODOS AUXILIARES PARA QUERIES ============

  async run(query: string, values?: any[]): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return await this.db.run(query, values);
  }

  async query(query: string, values?: any[]): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return await this.db.query(query, values);
  }

  async execute(query: string): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return await this.db.execute(query);
  }

  // ============ UTILIDADES ============

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isDbReady = false;
      //('Database closed');
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    try {
      await this.db!.execute('DROP TABLE IF EXISTS audits;');
      await this.db!.execute('DROP TABLE IF EXISTS expenses;');
      await this.db!.execute('DROP TABLE IF EXISTS categories;');
      await this.db!.execute('DROP TABLE IF EXISTS users;');
      await this.createTables();
      //('Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }
}
