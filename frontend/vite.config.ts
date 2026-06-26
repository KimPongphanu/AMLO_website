import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // 🌟 ให้ Vite รับ Request จากทุก Network Interface
    port: 5173, // พอร์ตที่ต้องการ
  },

  // 🌟 เพิ่ม optimizeDeps เพื่อแก้ปัญหา Error: Calling 'require' for "react-is"
  optimizeDeps: {
    include: ['react-is'],
  },
})
