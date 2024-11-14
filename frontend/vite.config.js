import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    // host: 'localhost'
		host: '172.31.48.151'
	},
  plugins: [react()],
})
