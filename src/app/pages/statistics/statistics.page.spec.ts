import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatisticsPage } from './statistics.page';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';

describe('StatisticsPage', () => {
  let component: StatisticsPage;
  let fixture: ComponentFixture<StatisticsPage>;
  let expenseService: jasmine.SpyObj<ExpenseService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const expenseServiceSpy = jasmine.createSpyObj('ExpenseService', ['getExpensesByUser']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: { id: 1, email: 'test@example.com', monthlyIncome: 1000 }
    });

    await TestBed.configureTestingModule({
      imports: [StatisticsPage],
      providers: [
        { provide: ExpenseService, useValue: expenseServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatisticsPage);
    component = fixture.componentInstance;
    expenseService = TestBed.inject(ExpenseService) as jasmine.SpyObj<ExpenseService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with month period by default', () => {
    expect(component.selectedPeriod()).toBe('month');
  });

  it('should load expenses on init', async () => {
    const mockExpenses = [
      {
        id: 1,
        userId: 1,
        amount: 100,
        description: 'Test expense',
        category: 'Comida',
        createdAt: new Date().toISOString()
      }
    ];
    expenseService.getExpensesByUser.and.returnValue(Promise.resolve(mockExpenses));

    await component.ngOnInit();

    expect(expenseService.getExpensesByUser).toHaveBeenCalledWith(1);
    expect(component.expenses().length).toBe(1);
  });

  it('should change period when onPeriodChange is called', () => {
    component.onPeriodChange('week');
    expect(component.selectedPeriod()).toBe('week');

    component.onPeriodChange('year');
    expect(component.selectedPeriod()).toBe('year');
  });

  it('should calculate average daily expense correctly', async () => {
    const mockExpenses = [
      {
        id: 1,
        userId: 1,
        amount: 300,
        description: 'Test',
        category: 'Comida',
        createdAt: new Date().toISOString()
      }
    ];
    expenseService.getExpensesByUser.and.returnValue(Promise.resolve(mockExpenses));

    await component.ngOnInit();

    const average = component.averageDailyExpense();
    expect(average).toBeGreaterThan(0);
  });

  it('should calculate total expenses correctly', async () => {
    const mockExpenses = [
      {
        id: 1,
        userId: 1,
        amount: 100,
        description: 'Test 1',
        category: 'Comida',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        userId: 1,
        amount: 200,
        description: 'Test 2',
        category: 'Transporte',
        createdAt: new Date().toISOString()
      }
    ];
    expenseService.getExpensesByUser.and.returnValue(Promise.resolve(mockExpenses));

    await component.ngOnInit();

    const total = component.totalExpenses();
    expect(total).toBe(300);
  });

  it('should handle installment expenses correctly', async () => {
    const mockExpenses = [
      {
        id: 1,
        userId: 1,
        amount: 600,
        description: 'Test installment',
        category: 'Comida',
        hasInstallments: true,
        installments: 3,
        paidInstallments: 0,
        createdAt: new Date().toISOString()
      }
    ];
    expenseService.getExpensesByUser.and.returnValue(Promise.resolve(mockExpenses));

    await component.ngOnInit();

    const total = component.totalExpenses();
    expect(total).toBe(200); // 600 / 3 installments
  });

  it('should group expenses by category', async () => {
    const mockExpenses = [
      {
        id: 1,
        userId: 1,
        amount: 100,
        description: 'Food 1',
        category: 'Comida',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        userId: 1,
        amount: 150,
        description: 'Food 2',
        category: 'Comida',
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        userId: 1,
        amount: 50,
        description: 'Transport',
        category: 'Transporte',
        createdAt: new Date().toISOString()
      }
    ];
    expenseService.getExpensesByUser.and.returnValue(Promise.resolve(mockExpenses));

    await component.ngOnInit();

    const stats = component.categoryStats();
    expect(stats.length).toBe(2);
    expect(stats[0].name).toBe('Comida');
    expect(stats[0].amount).toBe(250);
    expect(stats[1].name).toBe('Transporte');
    expect(stats[1].amount).toBe(50);
  });

  it('should format currency correctly', () => {
    const formatted = component.formatCurrency(1234.56);
    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
    expect(formatted).toContain('56');
  });

  it('should return empty string for chart path when no data', () => {
    const path = component.getChartPath();
    expect(path).toBe('');
  });

  it('should return chart labels for week period', () => {
    component.onPeriodChange('week');
    const labels = component.getChartLabels();
    expect(labels.length).toBe(7);
  });

  it('should return chart labels for month period', () => {
    component.onPeriodChange('month');
    const labels = component.getChartLabels();
    expect(labels.length).toBe(5);
  });

  it('should return chart labels for year period', () => {
    component.onPeriodChange('year');
    const labels = component.getChartLabels();
    expect(labels.length).toBe(6);
  });
});
