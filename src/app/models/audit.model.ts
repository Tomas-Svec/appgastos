export interface Audit {
  id?: number;
  userId: number;
  entityType: string; // 'expense', 'user', 'category', etc.
  entityId: number;
  action: string; // 'create', 'update', 'delete'
  oldValue?: string; // JSON string
  newValue?: string; // JSON string
  description: string;
  createdAt?: string;
}
