import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.darma.shop',
  appName: 'Darma Shop',
  webDir: 'out',
  server: {
    url: 'https://venkata-derma.vercel.app',
    cleartext: true
  }
};

export default config;
