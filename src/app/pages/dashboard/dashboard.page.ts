import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { AddExpenseComponent } from '../../modals/add-expense/add-expense.component';
import { AddIncomeComponent } from '../../modals/add-income/add-income.component';

interface Installment {
  id: string;
  name: string;
  icon: string;
  iconClass: string;
  progressClass: string;
  monthlyAmount: number;
  paid: number;
  total: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DashboardPage implements OnInit {
  monthlyIncome: number = 5250.00;
  monthlyExpenses: number = 1830.50;
  balance: number = 3419.50;
  activeInstallments: number = 4;
  currentMonth: string = '';

  installments: Installment[] = [
    {
      id: '1',
      name: 'MacBook Pro 14"',
      icon: 'laptop-outline',
      iconClass: 'icon-blue',
      progressClass: 'progress-primary',
      monthlyAmount: 249.99,
      paid: 3,
      total: 12
    },
    {
      id: '2',
      name: 'Spotify Premium',
      icon: 'musical-notes-outline',
      iconClass: 'icon-green',
      progressClass: 'progress-green',
      monthlyAmount: 9.99,
      paid: 10,
      total: 12
    },
    {
      id: '3',
      name: 'Membresía Gym',
      icon: 'barbell-outline',
      iconClass: 'icon-purple',
      progressClass: 'progress-purple',
      monthlyAmount: 45.00,
      paid: 6,
      total: 6
    }
  ];

  constructor(private modalController: ModalController) { }

  ngOnInit() {
    this.setCurrentMonth();
    this.calculateBalance();
  }

  setCurrentMonth() {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const currentDate = new Date();
    this.currentMonth = months[currentDate.getMonth()];
  }

  calculateBalance() {
    this.balance = this.monthlyIncome - this.monthlyExpenses;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  getProgressPercentage(installment: Installment): number {
    return (installment.paid / installment.total) * 100;
  }

  getChartPercentage(): number {
    // Calculate spent percentage (gastos / ingresos * 100)
    return (this.monthlyExpenses / this.monthlyIncome) * 100;
  }

  async openExpenseModal() {
    const modal = await this.modalController.create({
      component: AddExpenseComponent,
      cssClass: 'bottom-sheet',
      breakpoints: [0, 0.8, 1],
      initialBreakpoint: 0.8
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      console.log('Expense data:', data);
      // Aquí procesarías los datos del gasto
      this.updateExpenses(data);
    }
  }

  async openIncomeModal() {
    const modal = await this.modalController.create({
      component: AddIncomeComponent,
      cssClass: 'bottom-sheet',
      breakpoints: [0, 0.5, 1],
      initialBreakpoint: 0.5
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      console.log('Income data:', data);
      // Aquí procesarías los datos del ingreso
      this.updateIncome(data);
    }
  }

  updateExpenses(expenseData: any) {
    // Lógica para actualizar gastos
    if (expenseData.hasInstallments) {
      this.installments.push({
        id: Date.now().toString(),
        name: expenseData.description,
        icon: this.getCategoryIcon(expenseData.category),
        iconClass: this.getCategoryIconClass(expenseData.category),
        progressClass: this.getCategoryProgressClass(expenseData.category),
        monthlyAmount: expenseData.amount / expenseData.installments,
        paid: 0,
        total: expenseData.installments
      });
    }

    this.monthlyExpenses += expenseData.monthlyAmount || expenseData.amount;
    this.calculateBalance();
  }

  getCategoryIconClass(category: string): string {
    const classes: { [key: string]: string } = {
      'Comida': 'icon-orange',
      'Transporte': 'icon-blue',
      'Entretenimiento': 'icon-purple',
      'Compras': 'icon-red',
      'Otros': 'icon-gray'
    };
    return classes[category] || 'icon-blue';
  }

  getCategoryProgressClass(category: string): string {
    const classes: { [key: string]: string } = {
      'Comida': 'progress-orange',
      'Transporte': 'progress-primary',
      'Entretenimiento': 'progress-purple',
      'Compras': 'progress-red',
      'Otros': 'progress-gray'
    };
    return classes[category] || 'progress-primary';
  }

  updateIncome(incomeData: any) {
    // Lógica para actualizar ingresos
    this.monthlyIncome = incomeData.amount;
    this.calculateBalance();
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Comida': 'restaurant-outline',
      'Transporte': 'car-outline',
      'Entretenimiento': 'game-controller-outline',
      'Compras': 'cart-outline',
      'Otros': 'ellipsis-horizontal-outline'
    };
    return icons[category] || 'card-outline';
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Comida': '#FF9500',
      'Transporte': '#5AC8FA',
      'Entretenimiento': '#AF52DE',
      'Compras': '#FF3B30',
      'Otros': '#8E8E93'
    };
    return colors[category] || '#007AFF';
  }
}
