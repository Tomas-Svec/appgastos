import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Audit } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuditService {

  constructor(private databaseService: DatabaseService) { }

  async createAudit(audit: Audit): Promise<number> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const audits: Audit[] = JSON.parse(localStorage.getItem('audits') || '[]');

      const newAudit: Audit = {
        id: audits.length > 0 ? Math.max(...audits.map(a => a.id || 0)) + 1 : 1,
        userId: audit.userId,
        entityType: audit.entityType,
        entityId: audit.entityId,
        action: audit.action,
        oldValue: audit.oldValue,
        newValue: audit.newValue,
        description: audit.description,
        createdAt: new Date().toISOString()
      };

      audits.push(newAudit);
      localStorage.setItem('audits', JSON.stringify(audits));
      console.log('Audit created with ID:', newAudit.id);
      return newAudit.id!;
    }

    // Native SQLite implementation
    const query = `
      INSERT INTO audits (userId, entityType, entityId, action, oldValue, newValue, description)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
      audit.userId,
      audit.entityType,
      audit.entityId,
      audit.action,
      audit.oldValue || null,
      audit.newValue || null,
      audit.description
    ];

    try {
      const result = await this.databaseService.run(query, values);

      if (result.changes && result.changes.lastId) {
        console.log('Audit created with ID:', result.changes.lastId);
        return result.changes.lastId;
      }

      throw new Error('Failed to create audit');
    } catch (error) {
      console.error('Error creating audit:', error);
      throw error;
    }
  }

  async getAuditsByUser(userId: number, limit: number = 50): Promise<Audit[]> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const audits: Audit[] = JSON.parse(localStorage.getItem('audits') || '[]');
      return audits
        .filter(a => a.userId === userId)
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
        .slice(0, limit);
    }

    // Native SQLite implementation
    const query = `
      SELECT * FROM audits WHERE userId = ? ORDER BY createdAt DESC LIMIT ?;
    `;

    try {
      const result = await this.databaseService.query(query, [userId, limit]);

      if (result.values && result.values.length > 0) {
        return result.values as Audit[];
      }

      return [];
    } catch (error) {
      console.error('Error getting audits by user:', error);
      throw error;
    }
  }

  async getAuditsByEntity(entityType: string, entityId: number): Promise<Audit[]> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const audits: Audit[] = JSON.parse(localStorage.getItem('audits') || '[]');
      return audits
        .filter(a => a.entityType === entityType && a.entityId === entityId)
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    }

    // Native SQLite implementation
    const query = `
      SELECT * FROM audits WHERE entityType = ? AND entityId = ? ORDER BY createdAt DESC;
    `;

    try {
      const result = await this.databaseService.query(query, [entityType, entityId]);

      if (result.values && result.values.length > 0) {
        return result.values as Audit[];
      }

      return [];
    } catch (error) {
      console.error('Error getting audits by entity:', error);
      throw error;
    }
  }

  async getRecentAudits(userId: number, days: number = 7): Promise<Audit[]> {
    await this.databaseService.ensureInitialized();

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    const dateLimitStr = dateLimit.toISOString();

    // Web implementation
    if (this.databaseService.isWeb) {
      const audits: Audit[] = JSON.parse(localStorage.getItem('audits') || '[]');
      return audits
        .filter(a => a.userId === userId && new Date(a.createdAt || '') >= dateLimit)
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    }

    // Native SQLite implementation
    const query = `
      SELECT * FROM audits
      WHERE userId = ? AND createdAt >= ?
      ORDER BY createdAt DESC;
    `;

    try {
      const result = await this.databaseService.query(query, [userId, dateLimitStr]);

      if (result.values && result.values.length > 0) {
        return result.values as Audit[];
      }

      return [];
    } catch (error) {
      console.error('Error getting recent audits:', error);
      throw error;
    }
  }

  async getAuditsByAction(userId: number, action: string): Promise<Audit[]> {
    await this.databaseService.ensureInitialized();

    // Web implementation
    if (this.databaseService.isWeb) {
      const audits: Audit[] = JSON.parse(localStorage.getItem('audits') || '[]');
      return audits
        .filter(a => a.userId === userId && a.action === action)
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    }

    // Native SQLite implementation
    const query = `
      SELECT * FROM audits WHERE userId = ? AND action = ? ORDER BY createdAt DESC;
    `;

    try {
      const result = await this.databaseService.query(query, [userId, action]);

      if (result.values && result.values.length > 0) {
        return result.values as Audit[];
      }

      return [];
    } catch (error) {
      console.error('Error getting audits by action:', error);
      throw error;
    }
  }
}
