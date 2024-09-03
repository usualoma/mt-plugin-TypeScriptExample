import { defineConfig } from "@usualoma/mt-plugin-builder";

const baseURL = process.env.WEBHOOK_BASE_URL?.replace(/\/+$/, "");

export default defineConfig({
  tags: {
    function: {
      BlogCard: `${baseURL}/blog-card`,
    },
    block: {
      Minify: `${baseURL}/minify`,
    },
    modifier: {
      gfm: `${baseURL}/github-flavored-markdown`,
    },
  },
});
