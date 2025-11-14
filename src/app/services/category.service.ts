import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Category } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private databaseService: DatabaseService) { }

  async createCategory(category: Category): Promise<number> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const categories: Category[] = JSON.parse(localStorage.getItem('categories') || '[]');

      // Verificar si el nombre ya existe
      if (categories.some(c => c.name.toLowerCase() === category.name.toLowerCase())) {
        throw new Error('La categoría ya existe');
      }

      const newCategory: Category = {
        id: categories.length > 0 ? Math.max(...categories.map(c => c.id || 0)) + 1 : 1,
        name: category.name,
        icon: category.icon,
        color: category.color,
        isActive: category.isActive !== undefined ? category.isActive : true,
        createdAt: new Date().toISOString()
      };

      categories.push(newCategory);
      localStorage.setItem('categories', JSON.stringify(categories));
      return newCategory.id!;
    }

    // Native SQLite implementation
    const query = `
      INSERT INTO categories (name, icon, color, isActive)
      VALUES (?, ?, ?, ?);
    `;

    const values = [
      category.name,
      category.icon || null,
      category.color || null,
      category.isActive !== undefined ? (category.isActive ? 1 : 0) : 1
    ];

    try {
      const result = await this.databaseService.run(query, values);

      if (result.changes && result.changes.lastId) {
        return result.changes.lastId;
      }

      throw new Error('Failed to create category');
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('La categoría ya existe');
      }
      throw error;
    }
  }

  async getAllCategories(): Promise<Category[]> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const categories: Category[] = JSON.parse(localStorage.getItem('categories') || '[]');
      return categories.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Native SQLite implementation
    const query = `
      SELECT * FROM categories ORDER BY name ASC;
    `;

    try {
      const result = await this.databaseService.query(query);

      if (result.values && result.values.length > 0) {
        return result.values.map((cat: any) => ({
          ...cat,
          isActive: cat.isActive === 1
        })) as Category[];
      }

      return [];
    } catch (error) {
      throw error;
    }
  }

  async getActiveCategories(): Promise<Category[]> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const categories: Category[] = JSON.parse(localStorage.getItem('categories') || '[]');
      return categories
        .filter(c => c.isActive)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Native SQLite implementation
    const query = `
      SELECT * FROM categories WHERE isActive = 1 ORDER BY name ASC;
    `;

    try {
      const result = await this.databaseService.query(query);

      if (result.values && result.values.length > 0) {
        return result.values.map((cat: any) => ({
          ...cat,
          isActive: true
        })) as Category[];
      }

      return [];
    } catch (error) {
      throw error;
    }
  }

  async getCategoryById(categoryId: number): Promise<Category | null> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const categories: Category[] = JSON.parse(localStorage.getItem('categories') || '[]');
      return categories.find(c => c.id === categoryId) || null;
    }

    // Native SQLite implementation
    const query = `
      SELECT * FROM categories WHERE id = ?;
    `;

    try {
      const result = await this.databaseService.query(query, [categoryId]);

      if (result.values && result.values.length > 0) {
        const cat = result.values[0];
        return {
          ...cat,
          isActive: cat.isActive === 1
        } as Category;
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  async updateCategory(categoryId: number, updates: Partial<Category>): Promise<void> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const categories: Category[] = JSON.parse(localStorage.getItem('categories') || '[]');
      const categoryIndex = categories.findIndex(c => c.id === categoryId);

      if (categoryIndex !== -1) {
        categories[categoryIndex] = {
          ...categories[categoryIndex],
          ...updates
        };
        localStorage.setItem('categories', JSON.stringify(categories));
      }
      return;
    }

    // Native SQLite implementation
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?');
      values.push(updates.icon);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.isActive !== undefined) {
      fields.push('isActive = ?');
      values.push(updates.isActive ? 1 : 0);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(categoryId);
    const query = `
      UPDATE categories SET ${fields.join(', ')} WHERE id = ?;
    `;

    try {
      await this.databaseService.run(query, values);
    } catch (error) {
      throw error;
    }
  }

  async deleteCategory(categoryId: number, hardDelete: boolean = false): Promise<void> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const categories: Category[] = JSON.parse(localStorage.getItem('categories') || '[]');

      if (hardDelete) {
        const filteredCategories = categories.filter(c => c.id !== categoryId);
        localStorage.setItem('categories', JSON.stringify(filteredCategories));
      } else {
        const categoryIndex = categories.findIndex(c => c.id === categoryId);
        if (categoryIndex !== -1) {
          categories[categoryIndex].isActive = false;
          localStorage.setItem('categories', JSON.stringify(categories));
        }
      }
      return;
    }

    // Native SQLite implementation
    const query = hardDelete
      ? `DELETE FROM categories WHERE id = ?;`
      : `UPDATE categories SET isActive = 0 WHERE id = ?;`;

    try {
      await this.databaseService.run(query, [categoryId]);
    } catch (error) {
      throw error;
    }
  }

  async initializeDefaultCategories(): Promise<void> {
    // Verificar si ya existen categorías
    const existingCategories = await this.getAllCategories();

    if (existingCategories.length > 0) {
      return;
    }

    // Categorías por defecto
    const defaultCategories = [
      { name: 'Estación de servicio', icon: 'flame', color: '#FF9500', isActive: true },
      { name: 'Internet', icon: 'wifi', color: '#22acd0', isActive: true },
      { name: 'Tarjeta Galicia', icon: 'card', color: '#AF52DE', isActive: true },
      { name: 'Tarjeta Naranja', icon: 'card', color: '#FF3B30', isActive: true },
      { name: 'Salidas', icon: 'restaurant', color: '#34C759', isActive: true },
      { name: 'Seguro', icon: 'shield-checkmark', color: '#22acd0', isActive: true },
      { name: 'Otros', icon: 'ellipsis-horizontal', color: '#8E8E93', isActive: true }
    ];

    try {
      for (const category of defaultCategories) {
        await this.createCategory(category);
      }
    } catch (error) {
      // No lanzar error para no interrumpir la inicialización de la base de datos
    }
  }
}
