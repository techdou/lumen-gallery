import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
// base 必须与 GitHub Pages 子路径一致（仓库名 lumen-gallery），
// 否则打包后的资源引用路径会错，页面白屏。
export default defineConfig({
  base: '/lumen-gallery/',
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
