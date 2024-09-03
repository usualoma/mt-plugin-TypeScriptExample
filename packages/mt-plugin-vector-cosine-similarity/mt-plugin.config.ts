import { defineConfig } from "@usualoma/mt-plugin-builder";

const baseURL = process.env.WEBHOOK_BASE_URL?.replace(/\/+$/, "");

export default defineConfig({
  tags: {
    function: {
      VectorCosineSimilarity: `${baseURL}/vector-cosine-similarity`,
    },
  },
  callbacks: {
    "MT::Entry::post_save": `${baseURL}/entry-post-save`,
  },
});
