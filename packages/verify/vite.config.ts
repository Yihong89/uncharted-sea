import { defineConfig } from "vite";

// base 留空即可本地；部署 GitHub Pages 时可通过环境变量覆盖
export default defineConfig({
  base: "./",
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    target: "es2020",
  },
});
