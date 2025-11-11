import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-add-income',
  templateUrl: './add-income.component.html',
  styleUrls: ['./add-income.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AddIncomeComponent implements OnInit {
  monthlyIncome: number | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private modalController: ModalController,
    private authService: AuthService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    // Cargar el ingreso actual del usuario autenticado
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.monthlyIncome) {
      this.monthlyIncome = currentUser.monthlyIncome;
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  async saveIncome() {
    this.errorMessage = '';

    // Validación
    if (!this.monthlyIncome || this.monthlyIncome <= 0) {
      this.errorMessage = 'Por favor ingresa un monto válido mayor a 0';
      await this.showToast('Monto inválido', 'warning');
      return;
    }

    if (this.monthlyIncome > 999999) {
      this.errorMessage = 'El monto es demasiado grande';
      await this.showToast('Monto muy alto', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      // Actualizar el ingreso mensual del usuario
      await this.authService.updateMonthlyIncome(this.monthlyIncome!);

      await this.showToast('Ingreso guardado correctamente', 'success');

      // Cerrar el modal y enviar los datos
      this.modalController.dismiss({
        amount: this.monthlyIncome,
        success: true
      });
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al guardar el ingreso';
      await this.showToast(this.errorMessage, 'danger');
      console.error('Error saving income:', error);
    } finally {
      this.isLoading = false;
    }
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

  onIncomeFocus() {
    // Limpiar el campo si está en null o 0
    if (!this.monthlyIncome || this.monthlyIncome === 0) {
      this.monthlyIncome = null;
    }
  }
}
