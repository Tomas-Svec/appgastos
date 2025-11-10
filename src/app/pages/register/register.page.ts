import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  async ngOnInit() {
    // Inicializar la base de datos
    await this.authService.initialize();
  }

  async register() {
    // Validaciones
    if (!this.email || !this.password || !this.confirmPassword) {
      await this.showAlert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (this.password !== this.confirmPassword) {
      await this.showAlert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (this.password.length < 6) {
      await this.showAlert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creando cuenta...'
    });

    await loading.present();

    try {
      await this.authService.register(this.email, this.password);
      await loading.dismiss();

      await this.showAlert(
        'Cuenta creada',
        'Tu cuenta ha sido creada exitosamente',
        () => {
          this.router.navigate(['/tabs/dashboard']);
        }
      );
    } catch (error: any) {
      await loading.dismiss();
      await this.showAlert('Error', error.message || 'Error al crear la cuenta');
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private async showAlert(header: string, message: string, handler?: () => void) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: 'OK',
          handler
        }
      ]
    });

    await alert.present();
  }
}
