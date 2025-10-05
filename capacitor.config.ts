import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.baddil.com',
  appName: 'baddil',
  webDir: 'build',
  server: {
    allowNavigation: ['badilny.vercel.app']
  }
};

export default config;
