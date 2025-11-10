import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NativeBiometric } from 'capacitor-native-biometric';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  async ngOnInit() {
    // Inicializar la base de datos
    await this.authService.initialize();

    // Verificar si el usuario ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/tabs/dashboard']);
    }

    this.checkBiometricAvailability();
  }

  async checkBiometricAvailability() {
    try {
      const result = await NativeBiometric.isAvailable();
      console.log('Biometric available:', result.isAvailable);
      console.log('Biometric type:', result.biometryType);
    } catch (error) {
      console.log('Biometric not available', error);
    }
  }

  async login() {
    // Validar campos
    if (!this.email.trim()) {
      await this.showAlert('Error', 'Por favor ingresa tu email o usuario');
      return;
    }

    if (!this.password.trim()) {
      await this.showAlert('Error', 'Por favor ingresa tu contraseña');
      return;
    }

    await this.performLogin(async () => {
      return await this.authService.login(this.email, this.password);
    }, 'Credenciales incorrectas');
  }

  async loginWithBiometric() {
    await this.performLogin(async () => {
      return await this.authService.loginWithBiometric();
    }, 'Error al autenticar con biometría', (error) => {
      // Manejo especial para credenciales no guardadas
      if (error.message?.includes('No hay credenciales guardadas')) {
        return {
          header: 'Sin credenciales',
          message: 'Debes crear una cuenta o iniciar sesión primero para usar autenticación biométrica'
        };
      }
      return null;
    });
  }

  // Método reutilizable para realizar login
  private async performLogin(
    loginFn: () => Promise<any>,
    defaultErrorMessage: string,
    customErrorHandler?: (error: any) => { header: string; message: string } | null
  ) {
    const loading = await this.loadingController.create({
      message: 'Autenticando...'
    });

    await loading.present();

    try {
      const user = await loginFn();
      await loading.dismiss();

      if (user) {
        this.router.navigate(['/tabs/dashboard']);
      } else {
        await this.showAlert('Error', defaultErrorMessage);
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Login error:', error);

      // Intentar manejador personalizado de errores
      if (customErrorHandler) {
        const customError = customErrorHandler(error);
        if (customError) {
          await this.showAlert(customError.header, customError.message);
          return;
        }
      }

      // Manejador de error por defecto
      await this.showAlert('Error', error.message || defaultErrorMessage);
    }
  }

  createAccount() {
    this.router.navigate(['/register']);
  }

  forgotPassword() {
    this.showAlert(
      'Recuperar contraseña',
      'La función de recuperación de contraseña estará disponible próximamente'
    );
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }
}
