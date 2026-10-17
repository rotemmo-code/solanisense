import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeManifestIcons: false, // 590 KB the app never shows; the browser fetches the icons when installing
      manifest: {
        name: 'SolaniSense',
        short_name: 'SolaniSense',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        theme_color: '#1e3a5f',
        background_color: '#0f1f33',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
