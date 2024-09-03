import { defineConfig } from "@usualoma/mt-plugin-builder";

export default defineConfig({
  author_link: "https://blog.taaas.jp/",
  author_name: "Taku Amano",
  script: "main.js",
  mt_static: "dist",
  user_token_secret: process.env.USER_TOKEN_SECRET,
});
