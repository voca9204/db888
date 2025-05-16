import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@services': path.resolve(__dirname, './src/services'),
        '@assets': path.resolve(__dirname, './src/assets'),
        // Firebase alias 제거
        // '@firebase': path.resolve(__dirname, './src/firebase'),
        '@context': path.resolve(__dirname, './src/context'),
        '@store': path.resolve(__dirname, './src/store'),
      }
    },
    define: {
      '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
      '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
      'process.env': {},
      'globalThis.process.env': {},
      'global': 'window'
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
      target: 'es2015',
      sourcemap: mode !== 'production'
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
        supported: { 'top-level-await': true },
      },
      // Firebase 모듈을 수동으로 포함하지 않음
      exclude: ['firebase']
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true
    }
  }
})
