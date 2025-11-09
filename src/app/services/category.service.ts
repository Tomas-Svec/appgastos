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
      console.log('Category created with ID:', newCategory.id);
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
        console.log('Category created with ID:', result.changes.lastId);
        return result.changes.lastId;
      }

      throw new Error('Failed to create category');
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('La categoría ya existe');
      }
      console.error('Error creating category:', error);
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
      console.error('Error getting categories:', error);
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
      console.error('Error getting active categories:', error);
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
      console.error('Error getting category:', error);
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
        console.log('Category updated');
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
      console.log('Category updated');
    } catch (error) {
      console.error('Error updating category:', error);
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
      console.log('Category deleted');
      return;
    }

    // Native SQLite implementation
    const query = hardDelete
      ? `DELETE FROM categories WHERE id = ?;`
      : `UPDATE categories SET isActive = 0 WHERE id = ?;`;

    try {
      await this.databaseService.run(query, [categoryId]);
      console.log('Category deleted');
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  async initializeDefaultCategories(): Promise<void> {
    // Verificar si ya existen categorías
    const existingCategories = await this.getAllCategories();

    if (existingCategories.length > 0) {
      console.log('Categories already initialized');
      return;
    }

    // Categorías por defecto
    const defaultCategories = [
      { name: 'Comida', icon: 'restaurant', color: '#FF6B6B', isActive: true },
      { name: 'Transporte', icon: 'car', color: '#4ECDC4', isActive: true },
      { name: 'Entretenimiento', icon: 'game-controller', color: '#95E1D3', isActive: true },
      { name: 'Compras', icon: 'cart', color: '#FFE66D', isActive: true },
      { name: 'Salud', icon: 'fitness', color: '#A8E6CF', isActive: true },
      { name: 'Educación', icon: 'school', color: '#B4A7D6', isActive: true },
      { name: 'Servicios', icon: 'construct', color: '#FFB3BA', isActive: true },
      { name: 'Otros', icon: 'ellipsis-horizontal', color: '#BAB8B5', isActive: true }
    ];

    try {
      for (const category of defaultCategories) {
        await this.createCategory(category);
      }
      console.log('Default categories initialized successfully');
    } catch (error) {
      console.error('Error initializing default categories:', error);
      // No lanzar error para no interrumpir la inicialización de la base de datos
    }
  }
}
