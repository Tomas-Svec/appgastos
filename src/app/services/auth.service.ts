import { Injectable } from '@angular/core';
import { DatabaseService, User } from './database.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private readonly BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

  constructor(private databaseService: DatabaseService) {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  async initialize(): Promise<void> {
    await this.databaseService.initializeDatabase();
  }

  // ============ REGISTRO ============

  async register(email: string, password: string): Promise<User> {
    try {
      // Validar formato de email
      if (!this.isValidEmail(email)) {
        throw new Error('Email inválido');
      }

      // Validar contraseña
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Hash de la contraseña (en producción, usar bcrypt o similar)
      const hashedPassword = await this.hashPassword(password);

      // Crear usuario en la base de datos
      const userId = await this.databaseService.createUser(email, hashedPassword);

      // Obtener el usuario creado
      const user = await this.databaseService.getUserByEmail(email);

      if (!user) {
        throw new Error('Error al crear el usuario');
      }

      // Guardar credenciales para biometría
      await this.saveBiometricCredentials(email, password);

      // Actualizar el estado de autenticación
      this.storeUser(user);
      this.currentUserSubject.next(user);

      return user;
    } catch (error: any) {
      console.error('Error in register:', error);
      throw error;
    }
  }

  // ============ LOGIN ============

  async login(email: string, password: string): Promise<User> {
    try {
      // Buscar usuario por email
      const user = await this.databaseService.getUserByEmail(email);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña
      const hashedPassword = await this.hashPassword(password);

      if (user.password !== hashedPassword) {
        throw new Error('Contraseña incorrecta');
      }

      // Guardar credenciales para biometría
      await this.saveBiometricCredentials(email, password);

      // Actualizar el estado de autenticación
      this.storeUser(user);
      this.currentUserSubject.next(user);

      return user;
    } catch (error: any) {
      console.error('Error in login:', error);
      throw error;
    }
  }

  // ============ LOGIN BIOMÉTRICO ============

  async loginWithBiometric(): Promise<User> {
    try {
      // Verificar si hay credenciales guardadas
      const credentials = await this.getBiometricCredentials();

      if (!credentials) {
        throw new Error('No hay credenciales guardadas para autenticación biométrica');
      }

      // Verificar disponibilidad de biometría
      const available = await NativeBiometric.isAvailable();

      if (!available.isAvailable) {
        // Si no hay biometría, intentar login con credenciales guardadas
        return await this.login(credentials.username, credentials.password);
      }

      // Solicitar autenticación biométrica
      await NativeBiometric.verifyIdentity({
        reason: 'Para iniciar sesión en la app',
        title: 'Autenticación',
        subtitle: 'Usa tu huella o Face ID',
        description: 'Autentícate para acceder a tus gastos'
      });

      // Si la biometría fue exitosa, hacer login con las credenciales guardadas
      return await this.login(credentials.username, credentials.password);
    } catch (error: any) {
      console.error('Error in biometric login:', error);

      // Si el usuario canceló la biometría, intentar con credenciales guardadas
      if (error.code === 10 || error.code === 13) {
        const credentials = await this.getBiometricCredentials();
        if (credentials) {
          return await this.login(credentials.username, credentials.password);
        }
      }

      throw error;
    }
  }

  // ============ LOGOUT ============

  async logout(): Promise<void> {
    this.removeStoredUser();
    this.currentUserSubject.next(null);
  }

  // ============ CREDENCIALES BIOMÉTRICAS ============

  private async saveBiometricCredentials(email: string, password: string): Promise<void> {
    try {
      // Verificar si la biometría está disponible
      const available = await NativeBiometric.isAvailable();

      if (available.isAvailable) {
        await NativeBiometric.setCredentials({
          username: email,
          password: password,
          server: this.BIOMETRIC_CREDENTIALS_KEY
        });
      }
    } catch (error) {
      console.warn('Could not save biometric credentials:', error);
      // No lanzar error, solo advertir
    }
  }

  private async getBiometricCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const credentials = await NativeBiometric.getCredentials({
        server: this.BIOMETRIC_CREDENTIALS_KEY
      });

      if (credentials && credentials.username && credentials.password) {
        return {
          username: credentials.username,
          password: credentials.password
        };
      }

      return null;
    } catch (error) {
      console.warn('Could not get biometric credentials:', error);
      return null;
    }
  }

  async deleteBiometricCredentials(): Promise<void> {
    try {
      await NativeBiometric.deleteCredentials({
        server: this.BIOMETRIC_CREDENTIALS_KEY
      });
    } catch (error) {
      console.warn('Could not delete biometric credentials:', error);
    }
  }

  // ============ ACTUALIZAR INGRESO MENSUAL ============

  async updateMonthlyIncome(income: number): Promise<void> {
    const user = this.currentUserValue;

    if (!user || !user.id) {
      throw new Error('Usuario no autenticado');
    }

    await this.databaseService.updateUserIncome(user.id, income);

    // Actualizar el usuario en el estado
    user.monthlyIncome = income;
    this.storeUser(user);
    this.currentUserSubject.next(user);
  }

  // ============ UTILIDADES ============

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async hashPassword(password: string): Promise<string> {
    // En producción, deberías usar bcrypt o una librería similar
    // Por ahora, usamos un hash simple con btoa
    return btoa(password);
  }

  isAuthenticated(): boolean {
    return this.currentUserValue !== null;
  }

  // ============ ALMACENAMIENTO LOCAL ============

  private storeUser(user: User): void {
    // Guardar el usuario sin la contraseña
    const { password, ...userToStore } = user;
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem('currentUser');

    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }

    return null;
  }

  private removeStoredUser(): void {
    localStorage.removeItem('currentUser');
  }
}
