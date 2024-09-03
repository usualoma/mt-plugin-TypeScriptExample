import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig(({ command, mode }) => ({
  build: {
    lib: {
      entry: "src/main.ts",
      fileName: "main",
      formats: ["es"],
    },
    outDir: "dist",
  },
  ...(command === "serve" && mode === "development"
    ? {
        root: "dev",
        publicDir: "dev/public",
      }
    : {}),
  plugins: [
    svelte({
      emitCss: false,
    }),
  ],
  define: {
    API_URL: JSON.stringify(process.env.API_URL || ""),
  },
}));
