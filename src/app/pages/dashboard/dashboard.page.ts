import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Subscription } from 'rxjs';
import { AddExpenseComponent } from '../../modals/add-expense/add-expense.component';
import { AddIncomeComponent } from '../../modals/add-income/add-income.component';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { DatabaseService } from '../../services/database.service';
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
export class DashboardPage implements OnInit, OnDestroy {
  monthlyIncome: number = 0;
  monthlyExpenses: number = 0;
  balance: number = 0;
  activeInstallments: number = 0;
  currentMonth: string = '';

  installments: Installment[] = [];
  expenses: Expense[] = [];
  isLoading: boolean = false;
  currentUserId: number | null = null;

  private themeSubscription?: Subscription;

  constructor(
    private modalController: ModalController,
    private expenseService: ExpenseService,
    private authService: AuthService,
    private themeService: ThemeService,
    private alertController: AlertController,
    private databaseService: DatabaseService
  ) { }

  async ngOnInit() {
    this.setCurrentMonth();

    // Suscribirse a cambios de tema
    this.themeSubscription = this.themeService.darkMode$.subscribe();
  }

  async ionViewWillEnter() {
    // Garantizar que la base de datos esté inicializada
    await this.databaseService.ensureInitialized();

    // Obtener usuario autenticado
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.currentUserId = currentUser.id;
      this.monthlyIncome = currentUser.monthlyIncome || 0;
      await this.loadExpenses();
    }
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  async loadExpenses() {
    if (!this.currentUserId) {
      return;
    }

    this.isLoading = true;

    try {
      // Cargar todos los gastos del usuario
      const allExpenses = await this.expenseService.getExpensesByUser(this.currentUserId);

      // Calcular gastos totales del mes actual
      this.monthlyExpenses = this.calculateMonthlyExpenses(allExpenses);

      // Cargar cuotas activas
      const activeInstallmentsData = await this.expenseService.getActiveInstallments(this.currentUserId);
      this.installments = this.mapExpensesToInstallments(activeInstallmentsData);
      this.activeInstallments = this.installments.length;

      // Cargar historial de gastos (últimos gastos sin cuotas)
      this.expenses = this.getRecentExpenses(allExpenses, 10);

      this.calculateBalance();
    } catch (error) {
      // Error loading expenses
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
    return '$' + new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getProgressPercentage(installment: Installment): number {
    return (installment.paid / installment.total) * 100;
  }

  getChartPercentage(): number {
    // Calculate spent percentage (gastos / ingresos * 100)
    if (this.monthlyIncome === 0) return 0;
    return Math.min((this.monthlyExpenses / this.monthlyIncome) * 100, 100);
  }

  getChartDasharray(): string {
    // Calculate the circumference of the circle (2 * pi * r)
    // For radius 45: 2 * PI * 45 = 282.6
    const percentage = this.getChartPercentage();
    const circumference = 282.6;
    const filled = (percentage / 100) * circumference;
    return `${filled} ${circumference}`;
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
      // Actualizar el ingreso mensual
      if (data && data.amount) {
        this.monthlyIncome = data.amount;
        this.calculateBalance();
      }
    }
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Estación de servicio': 'flame-outline',
      'Internet': 'wifi-outline',
      'Tarjeta Galicia': 'card-outline',
      'Tarjeta Naranja': 'card-outline',
      'Salidas': 'restaurant-outline',
      'Seguro': 'shield-checkmark-outline',
      'Otros': 'ellipsis-horizontal-outline'
    };
    return icons[category] || 'pricetag-outline';
  }

  getCategoryIconClass(category: string): string {
    const classes: { [key: string]: string } = {
      'Estación de servicio': 'icon-orange',
      'Internet': 'icon-blue',
      'Tarjeta Galicia': 'icon-purple',
      'Tarjeta Naranja': 'icon-red',
      'Salidas': 'icon-green',
      'Seguro': 'icon-blue',
      'Otros': 'icon-gray'
    };
    return classes[category] || 'icon-blue';
  }

  getCategoryProgressClass(category: string): string {
    const classes: { [key: string]: string } = {
      'Estación de servicio': 'progress-orange',
      'Internet': 'progress-primary',
      'Tarjeta Galicia': 'progress-purple',
      'Tarjeta Naranja': 'progress-red',
      'Salidas': 'progress-green',
      'Seguro': 'progress-primary',
      'Otros': 'progress-gray'
    };
    return classes[category] || 'progress-primary';
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Estación de servicio': '#FF9500',
      'Internet': '#22acd0',
      'Tarjeta Galicia': '#AF52DE',
      'Tarjeta Naranja': '#FF3B30',
      'Salidas': '#34C759',
      'Seguro': '#22acd0',
      'Otros': '#8E8E93'
    };
    return colors[category] || '#007AFF';
  }

  getExpenseIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Estación de servicio': 'flame-outline',
      'Internet': 'wifi-outline',
      'Tarjeta Galicia': 'card-outline',
      'Tarjeta Naranja': 'card-outline',
      'Salidas': 'restaurant-outline',
      'Seguro': 'shield-checkmark-outline',
      'Otros': 'ellipsis-horizontal-outline'
    };
    return icons[category] || 'pricetag-outline';
  }

  getExpenseIconClass(category: string): string {
    const classes: { [key: string]: string } = {
      'Estación de servicio': 'icon-orange',
      'Internet': 'icon-blue',
      'Tarjeta Galicia': 'icon-purple',
      'Tarjeta Naranja': 'icon-red',
      'Salidas': 'icon-green',
      'Seguro': 'icon-blue',
      'Otros': 'icon-gray'
    };
    return classes[category] || 'icon-blue';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = dateObj.toDateString() === today.toDateString();
    const isYesterday = dateObj.toDateString() === yesterday.toDateString();

    if (isToday) {
      return 'Hoy';
    } else if (isYesterday) {
      return 'Ayer';
    } else {
      return dateObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: dateObj.getFullYear() === today.getFullYear() ? undefined : 'numeric'
      });
    }
  }

  private getRecentExpenses(expenses: Expense[], limit: number): Expense[] {
    return expenses
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  async deleteInstallment(installment: Installment, slidingItem: any) {
    // Feedback háptico ligero al iniciar swipe
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Haptics not available
    }

    // Alert de confirmación estilo iOS
    const alert = await this.alertController.create({
      header: 'Eliminar Cuota',
      message: `¿Estás seguro de que deseas eliminar "${installment.name}"? Esta acción no se puede deshacer.`,
      cssClass: 'ios-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            // Cerrar el sliding item
            slidingItem.close();
          }
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              // Feedback háptico más fuerte al confirmar eliminación
              await Haptics.impact({ style: ImpactStyle.Medium });
            } catch (error) {
              // Haptics not available
            }

            // Eliminar el gasto de la base de datos
            try {
              await this.expenseService.deleteExpense(Number(installment.id));

              // Cerrar el sliding item con animación
              await slidingItem.close();

              // Recargar los datos
              await this.loadExpenses();
            } catch (error) {

              // Mostrar error al usuario
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message: 'No se pudo eliminar la cuota. Por favor, intenta nuevamente.',
                cssClass: 'ios-alert',
                buttons: ['OK']
              });
              await errorAlert.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }
}
