import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { AuthService } from '../../services/auth.service';
import { ExpenseService } from '../../services/expense.service';
import { ThemeService } from '../../services/theme.service';
import { User } from '../../models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ProfilePage implements OnInit {
  currentUser: User | null = null;
  darkMode: boolean = false;

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private themeService: ThemeService,
    private alertController: AlertController,
    private router: Router
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.darkMode = this.themeService.isDarkMode();
  }

  toggleDarkMode(event: any) {
    this.darkMode = event.detail.checked;
    this.themeService.toggleDarkMode(this.darkMode);

    // Haptic feedback
    try {
      Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.log('Haptics not available');
    }
  }

  async deleteAllData() {
    // Haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.log('Haptics not available');
    }

    const alert = await this.alertController.create({
      header: 'Borrar Todos los Gastos',
      message: '¿Estás seguro de que deseas eliminar TODOS tus gastos? Esta acción no se puede deshacer.',
      cssClass: 'ios-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar Todo',
          role: 'destructive',
          handler: async () => {
            try {
              await Haptics.impact({ style: ImpactStyle.Medium });
            } catch (error) {
              console.log('Haptics not available');
            }

            if (this.currentUser && this.currentUser.id) {
              try {
                await this.expenseService.deleteAllExpensesByUser(this.currentUser.id);

                const successAlert = await this.alertController.create({
                  header: 'Éxito',
                  message: 'Todos tus gastos han sido eliminados.',
                  cssClass: 'ios-alert',
                  buttons: ['OK']
                });
                await successAlert.present();
              } catch (error) {
                console.error('Error deleting all expenses:', error);

                const errorAlert = await this.alertController.create({
                  header: 'Error',
                  message: 'No se pudieron eliminar los gastos. Por favor, intenta nuevamente.',
                  cssClass: 'ios-alert',
                  buttons: ['OK']
                });
                await errorAlert.present();
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async logout() {
    // Haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.log('Haptics not available');
    }

    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      cssClass: 'ios-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          handler: async () => {
            try {
              await Haptics.impact({ style: ImpactStyle.Medium });
            } catch (error) {
              console.log('Haptics not available');
            }

            await this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  getUserInitials(): string {
    if (!this.currentUser || !this.currentUser.email) {
      return 'U';
    }

    const email = this.currentUser.email;
    const parts = email.split('@')[0].split('.');

    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return email[0].toUpperCase();
  }

  getUserDisplayName(): string {
    if (!this.currentUser || !this.currentUser.email) {
      return 'Usuario';
    }

    const email = this.currentUser.email;
    const username = email.split('@')[0];

    // Convertir a formato "Nombre Apellido"
    const parts = username.split('.');
    return parts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
