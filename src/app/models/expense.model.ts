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
