import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private databaseService: DatabaseService) { }

  async createUser(email: string, password: string): Promise<number> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
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
      const result = await this.databaseService.run(query, [email, password]);

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
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      return users.find(u => u.email === email) || null;
    }

    // Native SQLite implementation
    const query = `
      SELECT * FROM users WHERE email = ?;
    `;

    try {
      const result = await this.databaseService.query(query, [email]);

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
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
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
      await this.databaseService.run(query, [income, userId]);
      console.log('User income updated');
    } catch (error) {
      console.error('Error updating user income:', error);
      throw error;
    }
  }
}
