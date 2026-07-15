import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safecallr.app',
  appName: 'SafeCallr',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
