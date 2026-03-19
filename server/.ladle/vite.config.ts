import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    postcss: {
      plugins: [(await import('@tailwindcss/postcss')).default],
    },
  },
  resolve: {
    alias: {
      '@': '/Users/alexandretang/do-my-job/server/src',
    },
  },
})
