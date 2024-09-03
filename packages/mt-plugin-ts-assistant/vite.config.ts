import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5173;

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
        server: {
          port: PORT,
        },
      }
    : {}),
  plugins: [
    svelte({
      emitCss: false,
    }),
  ],
  define: {
    OPEN_AI_API_KEY: JSON.stringify(process.env.OPEN_AI_API_KEY || ""),
    OPEN_AI_ASSISTANT_ID: JSON.stringify(process.env.OPEN_AI_ASSISTANT_ID || ""),
  },
}));
