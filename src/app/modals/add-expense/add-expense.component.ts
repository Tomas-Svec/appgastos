import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, PopoverController } from '@ionic/angular';
import { ExpenseService } from '../../services/expense.service';
import { CategoryService } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { Category } from '../../models';

interface Expense {
  userId?: number;
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

  categories: Category[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  showCategoryForm: boolean = false;
  newCategoryName: string = '';
  newCategoryIcon: string = 'pricetag-outline';

  constructor(
    private modalController: ModalController,
    private expenseService: ExpenseService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private toastController: ToastController,
    private popoverController: PopoverController
  ) { }

  async ngOnInit() {
    await this.loadCategories();

    // Establecer el userId del usuario autenticado
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.expense.userId = currentUser.id;
    }
  }

  async loadCategories() {
    try {
      this.categories = await this.categoryService.getActiveCategories();
      if (this.categories.length > 0) {
        this.expense.category = this.categories[0].name;
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      await this.showToast('Error al cargar categorías', 'danger');
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  async saveExpense() {
    this.errorMessage = '';

    // Validación básica
    if (!this.expense.description || this.expense.description.trim().length === 0) {
      this.errorMessage = 'Por favor ingresa una descripción';
      await this.showToast('Descripción requerida', 'warning');
      return;
    }

    if (this.expense.amount <= 0) {
      this.errorMessage = 'Por favor ingresa un monto válido';
      await this.showToast('Monto inválido', 'warning');
      return;
    }

    if (this.expense.hasInstallments && this.expense.installments < 2) {
      this.errorMessage = 'Debe tener al menos 2 cuotas';
      await this.showToast('Cuotas insuficientes', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      // Crear el gasto en la BD
      const expenseId = await this.expenseService.createExpense(this.expense as any);

      // Preparar datos para enviar
      const expenseData = {
        ...this.expense,
        id: expenseId,
        monthlyAmount: this.expense.hasInstallments
          ? this.expense.amount / this.expense.installments
          : this.expense.amount
      };

      await this.showToast('Gasto guardado correctamente', 'success');

      // Cerrar modal y enviar datos
      this.modalController.dismiss(expenseData);
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al guardar el gasto';
      await this.showToast(this.errorMessage, 'danger');
      console.error('Error saving expense:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // ============ GESTIÓN DE CATEGORÍAS ============

  toggleCategoryForm() {
    this.showCategoryForm = !this.showCategoryForm;
    if (!this.showCategoryForm) {
      this.newCategoryName = '';
      this.newCategoryIcon = 'pricetag-outline';
      this.errorMessage = '';
    }
  }

  async addCategory() {
    if (!this.newCategoryName || this.newCategoryName.trim().length === 0) {
      this.errorMessage = 'Por favor ingresa un nombre para la categoría';
      await this.showToast('Nombre requerido', 'warning');
      return;
    }

    // Verificar si ya existe
    if (this.categories.some(c => c.name.toLowerCase() === this.newCategoryName.toLowerCase())) {
      this.errorMessage = 'La categoría ya existe';
      await this.showToast('Categoría duplicada', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      const newCategory: Category = {
        name: this.newCategoryName,
        icon: this.newCategoryIcon,
        color: this.getRandomColor(),
        isActive: true
      };

      const categoryId = await this.categoryService.createCategory(newCategory);

      // Agregar la nueva categoría al listado
      newCategory.id = categoryId;
      this.categories.push(newCategory);
      this.expense.category = newCategory.name;

      this.newCategoryName = '';
      this.newCategoryIcon = 'pricetag-outline';
      this.showCategoryForm = false;

      await this.showToast('Categoría creada correctamente', 'success');
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al crear la categoría';
      await this.showToast(this.errorMessage, 'danger');
      console.error('Error creating category:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteCategory(categoryId: number | undefined, categoryName: string) {
    if (!categoryId) {
      await this.showToast('Error al eliminar', 'danger');
      return;
    }

    // Verificar si es la categoría seleccionada
    if (this.expense.category === categoryName) {
      await this.showToast('No puedes eliminar la categoría seleccionada', 'warning');
      return;
    }

    try {
      await this.categoryService.deleteCategory(categoryId, false); // Soft delete
      this.categories = this.categories.filter(c => c.id !== categoryId);
      await this.showToast('Categoría eliminada', 'success');
    } catch (error: any) {
      await this.showToast('Error al eliminar la categoría', 'danger');
      console.error('Error deleting category:', error);
    }
  }

  private getRandomColor(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#95E1D3', '#FFE66D', '#A8E6CF', '#B4A7D6', '#FFB3BA'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }
}
