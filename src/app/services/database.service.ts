import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export interface User {
  id?: number;
  email: string;
  password: string;
  monthlyIncome?: number;
  createdAt?: string;
}

export interface Expense {
  id?: number;
  userId: number;
  description: string;
  category: string;
  amount: number;
  hasInstallments: boolean;
  installments?: number;
  paidInstallments?: number;
  firstPaymentDate?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private isDbReady: boolean = false;
  private platform: string = '';
  private isWeb: boolean = false;

  constructor() {
    this.platform = Capacitor.getPlatform();
    this.isWeb = this.platform === 'web';
  }

  async initializeDatabase(): Promise<void> {
    if (this.isDbReady) {
      return;
    }

    // En web, usar localStorage como fallback
    if (this.isWeb) {
      this.initializeWebStorage();
      this.isDbReady = true;
      console.log('Database initialized successfully (Web - localStorage)');
      return;
    }

    try {
      // Crear o abrir la base de datos
      this.db = await this.sqlite.createConnection(
        'appgastos_db',
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();

      // Crear las tablas
      await this.createTables();

      this.isDbReady = true;
      console.log('Database initialized successfully (Native SQLite)');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
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

    try {
      await this.db.execute(createUsersTable);
      await this.db.execute(createExpensesTable);
      console.log('Tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // ============ OPERACIONES DE USUARIOS ============

  async createUser(email: string, password: string): Promise<number> {
    if (!this.isDbReady) {
      await this.initializeDatabase();
    }

    // Web implementation
    if (this.isWeb) {
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

      // Verificar si el email ya existe
      if (users.some(u => u.email === email)) {
        throw new Error('El email ya está registrado');
      }

      const newUser: User = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1,
        email,
        password,
        monthlyIncome: 0,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      console.log('User created with ID:', newUser.id);
      return newUser.id!;
    }

    // Native SQLite implementation
    const query = `
      INSERT INTO users (email, password)
      VALUES (?, ?);
    `;

    try {
      const result = await this.db!.run(query, [email, password]);

      if (result.changes && result.changes.lastId) {
        console.log('User created with ID:', result.changes.lastId);
        return result.changes.lastId;
      }

      throw new Error('Failed to create user');
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('El email ya está registrado');
      }
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.isDbReady) {
      await this.initializeDatabase();
    }

    // Web implementation
    if (this.isWeb) {
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      return users.find(u => u.email === email) || null;
    }

    // Native SQLite implementation
    const query = `
      SELECT * FROM users WHERE email = ?;
    `;

    try {
      const result = await this.db!.query(query, [email]);

      if (result.values && result.values.length > 0) {
        return result.values[0] as User;
      }

      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async updateUserIncome(userId: number, income: number): Promise<void> {
    if (!this.isDbReady) {
      await this.initializeDatabase();
    }

    // Web implementation
    if (this.isWeb) {
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex !== -1) {
        users[userIndex].monthlyIncome = income;
        localStorage.setItem('users', JSON.stringify(users));
        console.log('User income updated');
      }
      return;
    }

    // Native SQLite implementation
    const query = `
      UPDATE users SET monthlyIncome = ? WHERE id = ?;
    `;

    try {
      await this.db!.run(query, [income, userId]);
      console.log('User income updated');
    } catch (error) {
      console.error('Error updating user income:', error);
      throw error;
    }
  }

  // ============ OPERACIONES DE GASTOS ============

  async createExpense(expense: Expense): Promise<number> {
    if (!this.isDbReady) {
      await this.initializeDatabase();
    }

    // Web implementation
    if (this.isWeb) {
      const expenses: Expense[] = JSON.parse(localStorage.getItem('expenses') || '[]');

      const newExpense: Expense = {
        id: expenses.length > 0 ? Math.max(...expenses.map(e => e.id || 0)) + 1 : 1,
        userId: expense.userId,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        hasInstallments: expense.hasInstallments,
        installments: expense.installments || 1,
        paidInstallments: expense.paidInstallments || 0,
        firstPaymentDate: expense.firstPaymentDate || new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      expenses.push(newExpense);
      localStorage.setItem('expenses', JSON.stringify(expenses));
      console.log('Expense created with ID:', newExpense.id);
      return newExpense.id!;
    }

    // Native SQLite implementation
    const query = `
      INSERT INTO expenses (
        userId, description, category, amount,
        hasInstallments, installments, paidInstallments, firstPaymentDate
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
      expense.userId,
      expense.description,
      expense.category,
      expense.amount,
      expense.hasInstallments ? 1 : 0,
      expense.installments || 1,
      expense.paidInstallments || 0,
      expense.firstPaymentDate || new Date().toISOString()
    ];

    try {
      const result = await this.db!.run(query, values);

      if (result.changes && result.changes.lastId) {
        console.log('Expense created with ID:', result.changes.lastId);
        return result.changes.lastId;
      }

      throw new Error('Failed to create expense');
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  async getExpensesByUser(userId: number): Promise<Expense[]> {
    if (!this.isDbReady) {
      await this.initializeDatabase();
    }

    // Web implementation
    if (this.isWeb) {
      const expenses: Expense[] = JSON.parse(localStorage.getItem('expenses') || '[]');
      return expenses
        .filter(e => e.userId === userId)
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    }

    // Native SQLite implementation
    const query = `
      SELECT * FROM expenses WHERE userId = ? ORDER BY createdAt DESC;
    `;

    try {
      const result = await this.db!.query(query, [userId]);

      if (result.values && result.values.length > 0) {
        return result.values as Expense[];
      }

      return [];
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  }

  async getActiveInstallments(userId: number): Promise<Expense[]> {
    if (!this.isDbReady) {
      await this.initializeDatabase();
    }

    // Web implementation
    if (this.isWeb) {
      const expenses: Expense[] = JSON.parse(localStorage.getItem('expenses') || '[]');
      return expenses
        .filter(e =>
          e.userId === userId &&
          e.hasInstallments &&
          (e.paidInstallments || 0) < (e.installments || 1)
        )
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    }

    // Native SQLite implementation
    const query = `
      SELECT * FROM expenses
      WHERE userId = ?
      AND hasInstallments = 1
      AND paidInstallments < installments
      ORDER BY createdAt DESC;
    `;

    try {
      const result = await this.db!.query(query, [userId]);

      if (result.values && result.values.length > 0) {
        return result.values as Expense[];
      }

      return [];
    } catch (error) {
      console.error('Error getting active installments:', error);
      throw error;
    }
  }

  async updateExpenseInstallment(expenseId: number, paidInstallments: number): Promise<void> {
    if (!this.isDbReady) {
      await this.initializeDatabase();
    }

    // Web implementation
    if (this.isWeb) {
      const expenses: Expense[] = JSON.parse(localStorage.getItem('expenses') || '[]');
      const expenseIndex = expenses.findIndex(e => e.id === expenseId);

      if (expenseIndex !== -1) {
        expenses[expenseIndex].paidInstallments = paidInstallments;
        localStorage.setItem('expenses', JSON.stringify(expenses));
        console.log('Expense installment updated');
      }
      return;
    }

    // Native SQLite implementation
    const query = `
      UPDATE expenses SET paidInstallments = ? WHERE id = ?;
    `;

    try {
      await this.db!.run(query, [paidInstallments, expenseId]);
      console.log('Expense installment updated');
    } catch (error) {
      console.error('Error updating expense installment:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId: number): Promise<void> {
    if (!this.isDbReady) {
      await this.initializeDatabase();
    }

    // Web implementation
    if (this.isWeb) {
      const expenses: Expense[] = JSON.parse(localStorage.getItem('expenses') || '[]');
      const filteredExpenses = expenses.filter(e => e.id !== expenseId);
      localStorage.setItem('expenses', JSON.stringify(filteredExpenses));
      console.log('Expense deleted');
      return;
    }

    // Native SQLite implementation
    const query = `
      DELETE FROM expenses WHERE id = ?;
    `;

    try {
      await this.db!.run(query, [expenseId]);
      console.log('Expense deleted');
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // ============ UTILIDADES ============

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isDbReady = false;
      console.log('Database closed');
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    try {
      await this.db!.execute('DROP TABLE IF EXISTS expenses;');
      await this.db!.execute('DROP TABLE IF EXISTS users;');
      await this.createTables();
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }
}
