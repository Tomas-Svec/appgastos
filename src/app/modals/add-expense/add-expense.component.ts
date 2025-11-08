import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';

interface Expense {
  description: string;
  category: string;
  amount: number;
  hasInstallments: boolean;
  installments: number;
  firstPaymentDate: string;
}

@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.component.html',
  styleUrls: ['./add-expense.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AddExpenseComponent implements OnInit {
  expense: Expense = {
    description: '',
    category: 'Comida',
    amount: 0,
    hasInstallments: false,
    installments: 1,
    firstPaymentDate: new Date().toISOString().split('T')[0]
  };

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  dismiss() {
    this.modalController.dismiss();
  }

  saveExpense() {
    // Validación básica
    if (!this.expense.description || this.expense.amount <= 0) {
      console.log('Por favor completa todos los campos');
      return;
    }

    // Preparar datos para enviar
    const expenseData = {
      ...this.expense,
      monthlyAmount: this.expense.hasInstallments
        ? this.expense.amount / this.expense.installments
        : this.expense.amount
    };

    // Cerrar modal y enviar datos
    this.modalController.dismiss(expenseData);
  }
}
