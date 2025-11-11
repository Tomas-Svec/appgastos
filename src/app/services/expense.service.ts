import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Expense } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  constructor(private databaseService: DatabaseService) { }

  async createExpense(expense: Expense): Promise<number> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
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
      const result = await this.databaseService.run(query, values);

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
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
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
      const result = await this.databaseService.query(query, [userId]);

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
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
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
      const result = await this.databaseService.query(query, [userId]);

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
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
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
      await this.databaseService.run(query, [paidInstallments, expenseId]);
      console.log('Expense installment updated');
    } catch (error) {
      console.error('Error updating expense installment:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId: number): Promise<void> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
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
      await this.databaseService.run(query, [expenseId]);
      console.log('Expense deleted');
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  async deleteAllExpensesByUser(userId: number): Promise<void> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const expenses: Expense[] = JSON.parse(localStorage.getItem('expenses') || '[]');
      const filteredExpenses = expenses.filter(e => e.userId !== userId);
      localStorage.setItem('expenses', JSON.stringify(filteredExpenses));
      console.log('All user expenses deleted');
      return;
    }

    // Native SQLite implementation
    const query = `
      DELETE FROM expenses WHERE userId = ?;
    `;

    try {
      await this.databaseService.run(query, [userId]);
      console.log('All user expenses deleted');
    } catch (error) {
      console.error('Error deleting all expenses:', error);
      throw error;
    }
  }
}
