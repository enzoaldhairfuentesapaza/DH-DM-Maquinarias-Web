import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  const origin = (env.VITE_API_URL ?? '').replace(/\/+$/, '');
  if (origin && !/^https?:\/\/[^/]+$/.test(origin)) throw new Error('VITE_API_URL debe ser un origen sin /api ni rutas.');
  return {
    plugins: [react(), {
      name: 'calculator-api-origin',
      configureServer(server) {
        server.middlewares.use('/cotizador-app/runtime-config.js', (_req, res) => {
          res.setHeader('Content-Type', 'application/javascript');
          res.end(`window.HDM_API_ORIGIN = ${JSON.stringify(origin || 'http://localhost:8000')};`);
        });
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'cotizador-app/runtime-config.js', source: `window.HDM_API_ORIGIN = ${JSON.stringify(origin)};\n` });
      },
    }],
  };
});
