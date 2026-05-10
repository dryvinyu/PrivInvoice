import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), tsconfigPaths(), react()],
  resolve: {
    alias: {
      "@": "/src",
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  build: {
    outDir: "dist-vercel",
    emptyOutDir: true,
  },
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    exclude: ["@zama-fhe/relayer-sdk", "@zama-fhe/relayer-sdk/web", "tfhe", "tkms"],
  },
});
