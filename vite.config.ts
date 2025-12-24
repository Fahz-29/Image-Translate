
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from the current directory (process.cwd())
  // The empty string as third argument tells Vite to load all variables (not just VITE_ prefixed)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This maps the server-side environment variables to the client-side code
      'process.env.API_KEY': "AIzaSyAYO3-je4BjKenu0swJUH000dmUMNQmQK0",
      'process.env.SUPABASE_URL': "https://kaghnkhyylftabxuxdxn.supabase.co",
      'process.env.SUPABASE_ANON_KEY': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZ2hua2h5eWxmdGFieHV4ZHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MzUyOTMsImV4cCI6MjA4MjExMTI5M30.388Buh9KT5OOxiiYdFqz6SnQgnNExzfDr3hOpEa3ea0",
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  }
})
