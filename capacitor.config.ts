import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'app-gastos',
  webDir: 'www',
  ios: {
    contentInset: 'automatic', // Respeta safe areas automáticamente
  },
  plugins: {
    StatusBar: {
      style: 'light', // Estilo iOS nativo
      overlaysWebView: true, // Permite overlay con safe-area-inset
    },
    Keyboard: {
      resize: 'ionic', // Manejo de teclado estilo Ionic
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'appgastos',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite'
      },
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite',
        biometricSubTitle: 'Log in using your biometric'
      }
    }
  }
};

export default config;
