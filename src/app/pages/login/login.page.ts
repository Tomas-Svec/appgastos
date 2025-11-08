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
      this.router.navigate(['/dashboard']);
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

  async loginWithBiometric() {
    const loading = await this.loadingController.create({
      message: 'Autenticando...'
    });

    await loading.present();

    try {
      const user = await this.authService.loginWithBiometric();
      await loading.dismiss();

      if (user) {
        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      await loading.dismiss();

      // Si no hay credenciales guardadas, mostrar mensaje
      if (error.message?.includes('No hay credenciales guardadas')) {
        await this.showAlert(
          'Sin credenciales',
          'Debes crear una cuenta o iniciar sesión primero para usar autenticación biométrica'
        );
      } else {
        console.log('Biometric authentication error:', error);
        await this.showAlert('Error', 'Error al autenticar con biometría');
      }
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
