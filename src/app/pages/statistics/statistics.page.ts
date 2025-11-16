import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { Expense } from '../../models';

interface CategoryStat {
  name: string;
  icon: string;
  iconClass: string;
  progressClass: string;
  amount: number;
  percentage: number;
}

interface ChartDataPoint {
  date: number;
  amount: number;
}

type PeriodType = 'week' | 'month' | 'year';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class StatisticsPage implements OnInit {
  // Signals para estado reactivo
  selectedPeriod = signal<PeriodType>('month');
  expenses = signal<Expense[]>([]);
  isLoading = signal<boolean>(false);

  // Computed values
  filteredExpenses = computed(() => {
    const period = this.selectedPeriod();
    const allExpenses = this.expenses();
    return this.filterExpensesByPeriod(allExpenses, period);
  });

  averageDailyExpense = computed(() => {
    const expenses = this.filteredExpenses();
    if (expenses.length === 0) return 0;

    const total = expenses.reduce((sum, e) => {
      // Considerar cuotas: solo el monto mensual correspondiente
      if (e.hasInstallments && e.installments && e.installments > 1) {
        return sum + (e.amount || 0) / e.installments;
      }
      return sum + (e.amount || 0);
    }, 0);

    const days = this.getActualDaysInPeriod(this.selectedPeriod());
    return total / days;
  });

  totalExpenses = computed(() => {
    return this.filteredExpenses().reduce((sum, e) => {
      // Considerar cuotas: solo el monto mensual correspondiente
      if (e.hasInstallments && e.installments && e.installments > 1) {
        return sum + (e.amount || 0) / e.installments;
      }
      return sum + (e.amount || 0);
    }, 0);
  });

  categoryStats = computed(() => {
    return this.calculateCategoryStats(this.filteredExpenses());
  });

  topCategory = computed(() => {
    const stats = this.categoryStats();
    return stats.length > 0 ? stats[0] : null;
  });

  chartData = computed(() => {
    return this.generateChartData(this.filteredExpenses(), this.selectedPeriod());
  });

  private currentUserId: number | null = null;

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService,
    private databaseService: DatabaseService
  ) {}

  async ngOnInit() {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.currentUserId = currentUser.id;
    }
  }

  /**
   * Lifecycle hook de Ionic que se ejecuta cada vez que la página está por entrar en vista.
   * Esto garantiza que los datos se recarguen cada vez que el usuario navega a esta página.
   */
  async ionViewWillEnter() {
    // Garantizar que la base de datos esté inicializada
    await this.databaseService.ensureInitialized();

    // Recargar datos cada vez que se entra a la página
    await this.loadExpenses();
  }

  async loadExpenses() {
    if (!this.currentUserId) return;

    this.isLoading.set(true);
    try {
      const allExpenses = await this.expenseService.getExpensesByUser(this.currentUserId);
      this.expenses.set(allExpenses);
    } catch (error) {
      // Error loading expenses
    } finally {
      this.isLoading.set(false);
    }
  }

  onPeriodChange(period: PeriodType) {
    this.selectedPeriod.set(period);
  }

  private filterExpensesByPeriod(expenses: Expense[], period: PeriodType): Expense[] {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.firstPaymentDate || expense.createdAt || '');
      return expenseDate >= startDate && expenseDate <= now;
    });
  }

  private getActualDaysInPeriod(period: PeriodType): number {
    const now = new Date();
    switch (period) {
      case 'week':
        return 7;
      case 'month':
        // Días reales del mes actual
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return daysInMonth;
      case 'year':
        // Días reales del año actual (365 o 366)
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        return Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      default:
        return 30;
    }
  }

  private calculateCategoryStats(expenses: Expense[]): CategoryStat[] {
    const categoryTotals = new Map<string, number>();

    // Calcular total considerando cuotas
    let total = 0;
    expenses.forEach(expense => {
      const category = expense.category || 'Otros';
      const current = categoryTotals.get(category) || 0;

      // Considerar cuotas: solo el monto mensual correspondiente
      let expenseAmount = expense.amount || 0;
      if (expense.hasInstallments && expense.installments && expense.installments > 1) {
        expenseAmount = expenseAmount / expense.installments;
      }

      categoryTotals.set(category, current + expenseAmount);
      total += expenseAmount;
    });

    const stats: CategoryStat[] = Array.from(categoryTotals.entries())
      .map(([name, amount]) => ({
        name,
        icon: this.getCategoryIcon(name),
        iconClass: this.getCategoryIconClass(name),
        progressClass: this.getCategoryProgressClass(name),
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return stats;
  }

  private generateChartData(expenses: Expense[], period: PeriodType): ChartDataPoint[] {
    const now = new Date();
    const points: ChartDataPoint[] = [];

    switch (period) {
      case 'week':
        // Un punto por día (7 puntos)
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          date.setHours(0, 0, 0, 0);

          const dayExpenses = this.getExpensesForDate(expenses, date);
          const amount = this.calculateExpensesAmount(dayExpenses);
          points.push({ date: date.getTime(), amount });
        }
        break;

      case 'month':
        // 5 puntos distribuidos en el mes (semanas aproximadas)
        const intervals = [0, 7, 14, 21, 28];
        for (const daysAgo of intervals.reverse()) {
          const date = new Date(now);
          date.setDate(now.getDate() - daysAgo);
          date.setHours(0, 0, 0, 0);

          // Agrupar gastos de +/- 3 días alrededor de esta fecha
          const rangeExpenses = this.getExpensesInRange(expenses, date, 3);
          const amount = this.calculateExpensesAmount(rangeExpenses);
          points.push({ date: date.getTime(), amount });
        }
        break;

      case 'year':
        // 6 puntos (cada 2 meses aproximadamente)
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - (i * 2));
          date.setHours(0, 0, 0, 0);

          // Agrupar gastos del mes
          const monthExpenses = this.getExpensesForMonth(expenses, date);
          const amount = this.calculateExpensesAmount(monthExpenses);
          points.push({ date: date.getTime(), amount });
        }
        break;
    }

    return points;
  }

  private getExpensesForDate(expenses: Expense[], date: Date): Expense[] {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.firstPaymentDate || expense.createdAt || '');
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() === date.getTime();
    });
  }

  private getExpensesInRange(expenses: Expense[], centerDate: Date, rangeDays: number): Expense[] {
    const startDate = new Date(centerDate);
    startDate.setDate(centerDate.getDate() - rangeDays);
    const endDate = new Date(centerDate);
    endDate.setDate(centerDate.getDate() + rangeDays);

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.firstPaymentDate || expense.createdAt || '');
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  private getExpensesForMonth(expenses: Expense[], date: Date): Expense[] {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.firstPaymentDate || expense.createdAt || '');
      return expenseDate.getMonth() === date.getMonth() &&
             expenseDate.getFullYear() === date.getFullYear();
    });
  }

  private calculateExpensesAmount(expenses: Expense[]): number {
    return expenses.reduce((sum, e) => {
      // Considerar cuotas: solo el monto mensual correspondiente
      if (e.hasInstallments && e.installments && e.installments > 1) {
        return sum + (e.amount || 0) / e.installments;
      }
      return sum + (e.amount || 0);
    }, 0);
  }

  formatCurrency(amount: number): string {
    return '$' + new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  getChartPath(): string {
    const data = this.chartData();
    if (data.length === 0) return '';

    // Si todos los valores son 0, mostrar una línea plana en el centro
    const amounts = data.map(d => d.amount);
    const maxAmount = Math.max(...amounts, 1);
    const hasData = amounts.some(a => a > 0);

    const width = 472;
    const height = 150;
    const padding = 10;

    if (!hasData) {
      // Línea plana en el centro si no hay datos
      const centerY = height / 2;
      return `M0,${centerY} L${width},${centerY}`;
    }

    const points = data.map((point, index) => {
      const x = data.length > 1 ? (index / (data.length - 1)) * width : width / 2;
      const normalizedAmount = point.amount / maxAmount;
      const y = height - (normalizedAmount * (height - padding * 2)) - padding;
      return { x, y };
    });

    // Crear un path suave
    let path = `M${points[0].x},${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }

    return path;
  }

  getChartAreaPath(): string {
    const data = this.chartData();
    if (data.length === 0) return '';

    const linePath = this.getChartPath();
    if (!linePath) return '';

    const width = 472;
    const height = 150;

    // Obtener el último punto X del path
    const lastPoint = data.length > 1 ? width : width / 2;

    return `${linePath} L${lastPoint},${height} L0,${height} Z`;
  }

  getChartLabels(): string[] {
    const period = this.selectedPeriod();
    const now = new Date();

    switch (period) {
      case 'week':
        // Días de la semana (últimos 7 días)
        const weekLabels: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
          weekLabels.push(dayName.charAt(0).toUpperCase());
        }
        return weekLabels;

      case 'month':
        // Días del mes (distribuidos)
        return ['1', '7', '14', '21', '28'];

      case 'year':
        // Meses del año (cada 2 meses)
        const monthLabels: string[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - (i * 2));
          const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
          monthLabels.push(monthName.charAt(0).toUpperCase());
        }
        return monthLabels;

      default:
        return ['1', '7', '14', '21', '28'];
    }
  }
}
