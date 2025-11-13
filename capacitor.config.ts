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
    }
  }
};

export default config;
