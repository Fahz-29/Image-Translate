
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Use clean string values for environment variables.
      // We strip any accidental double-quotes that might come from .env file syntax
      'process.env.API_KEY': JSON.stringify((env.API_KEY || process.env.API_KEY || "").replace(/^["'](.+)["']$/, '$1').trim()),
      'process.env.SUPABASE_URL': JSON.stringify((env.SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/^["'](.+)["']$/, '$1').trim()),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify((env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").replace(/^["'](.+)["']$/, '$1').trim()),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  }
})
