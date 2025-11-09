import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { AddExpenseComponent } from '../../modals/add-expense/add-expense.component';
import { AddIncomeComponent } from '../../modals/add-income/add-income.component';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';
import { Expense } from '../../models';

interface Installment {
  id: string | number;
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
  monthlyIncome: number = 0;
  monthlyExpenses: number = 0;
  balance: number = 0;
  activeInstallments: number = 0;
  currentMonth: string = '';

  installments: Installment[] = [];
  isLoading: boolean = false;
  currentUserId: number | null = null;

  constructor(
    private modalController: ModalController,
    private expenseService: ExpenseService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    this.setCurrentMonth();

    // Obtener usuario autenticado
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.currentUserId = currentUser.id;
      this.monthlyIncome = currentUser.monthlyIncome || 0;
      await this.loadExpenses();
    }
  }

  async loadExpenses() {
    if (!this.currentUserId) return;

    this.isLoading = true;
    try {
      // Cargar todos los gastos del usuario
      const expenses = await this.expenseService.getExpensesByUser(this.currentUserId);

      // Calcular gastos totales del mes actual
      this.monthlyExpenses = this.calculateMonthlyExpenses(expenses);

      // Cargar cuotas activas
      const activeInstallmentsData = await this.expenseService.getActiveInstallments(this.currentUserId);
      this.installments = this.mapExpensesToInstallments(activeInstallmentsData);
      this.activeInstallments = this.installments.length;

      this.calculateBalance();
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private calculateMonthlyExpenses(expenses: Expense[]): number {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.firstPaymentDate || expense.createdAt || '');
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((total, expense) => {
        if (expense.hasInstallments) {
          return total + ((expense.amount || 0) / (expense.installments || 1));
        }
        return total + (expense.amount || 0);
      }, 0);
  }

  private mapExpensesToInstallments(expenses: Expense[]): Installment[] {
    return expenses
      .filter(e => e.hasInstallments && e.installments && e.installments > 1)
      .map(expense => ({
        id: expense.id || 0,
        name: expense.description,
        icon: this.getCategoryIcon(expense.category),
        iconClass: this.getCategoryIconClass(expense.category),
        progressClass: this.getCategoryProgressClass(expense.category),
        monthlyAmount: (expense.amount || 0) / (expense.installments || 1),
        paid: expense.paidInstallments || 0,
        total: expense.installments || 1
      }));
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
    if (data && data.success !== false) {
      console.log('Expense data:', data);
      // Recargar los datos del dashboard
      await this.loadExpenses();
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
    if (data && data.success !== false) {
      console.log('Income data:', data);
      // Actualizar el ingreso mensual
      if (data && data.amount) {
        this.monthlyIncome = data.amount;
        this.calculateBalance();
      }
    }
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Comida': 'restaurant-outline',
      'Transporte': 'car-outline',
      'Entretenimiento': 'game-controller-outline',
      'Compras': 'cart-outline',
      'Salud': 'fitness-outline',
      'Educación': 'school-outline',
      'Servicios': 'construct-outline',
      'Otros': 'ellipsis-horizontal-outline'
    };
    return icons[category] || 'pricetag-outline';
  }

  getCategoryIconClass(category: string): string {
    const classes: { [key: string]: string } = {
      'Comida': 'icon-orange',
      'Transporte': 'icon-blue',
      'Entretenimiento': 'icon-purple',
      'Compras': 'icon-red',
      'Salud': 'icon-green',
      'Educación': 'icon-purple',
      'Servicios': 'icon-orange',
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
      'Salud': 'progress-green',
      'Educación': 'progress-purple',
      'Servicios': 'progress-orange',
      'Otros': 'progress-gray'
    };
    return classes[category] || 'progress-primary';
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Comida': '#FF9500',
      'Transporte': '#5AC8FA',
      'Entretenimiento': '#AF52DE',
      'Compras': '#FF3B30',
      'Salud': '#34C759',
      'Educación': '#AF52DE',
      'Servicios': '#FF9500',
      'Otros': '#8E8E93'
    };
    return colors[category] || '#007AFF';
  }
}
