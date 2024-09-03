import { Hono } from "hono";
import { marked } from "marked";
import { minify } from "html-minifier-terser";
import * as cheerio from "cheerio";

const app = new Hono();

app.post("/blog-card", async (c) => {
  const {
    attributes: { url },
  } = await c.req.json();

  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    // OGPデータの取得
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      url;
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";
    const image = $('meta[property="og:image"]').attr("content") || "";
    const siteName = $('meta[property="og:site_name"]').attr("content") || "";

    // ブログカードのHTML生成
    const blogCard = `
      <div class="blog-card" style="border: 1px solid #ddd; padding: 16px; border-radius: 8px; max-width: 600px;">
        <a href="${url}" style="text-decoration: none; color: inherit;" target="_blank" rel="noopener noreferrer">
          <div style="display: flex; gap: 16px;">
            ${
              image
                ? `
              <div style="flex-shrink: 0;">
                <img src="${image}" alt="${title}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 4px;">
              </div>
            `
                : ""
            }
            <div style="flex-grow: 1;">
              <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${title}</div>
              <div style="font-size: 14px; color: #666; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${description}</div>
              ${
                siteName
                  ? `<div style="font-size: 12px; color: #888; margin-top: 8px;">${siteName}</div>`
                  : ""
              }
            </div>
          </div>
        </a>
      </div>
    `;

    return c.text(blogCard, 200);
  } catch (error) {
    console.error(error);
    return c.text("ブログカードの生成中にエラーが発生しました", 500);
  }
});

app.post("/minify", async (c) => {
  const { contents } = await c.req.json();

  try {
    const minified = await minify(contents, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
      removeEmptyAttributes: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
    });

    return c.text(minified, 200);
  } catch (error) {
    console.error(error);
    return c.text("HTMLの最小化中にエラーが発生しました", 500);
  }
});

app.post("/github-flavored-markdown", async (c) => {
  const { contents, modifier, attributes } = await c.req.json();
  if (!attributes[modifier]) {
    return c.text(contents, 200);
  }

  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  try {
    const htmlContent = await marked(contents);
    return c.text(htmlContent, 200);
  } catch (error) {
    return c.text("Markdown の変換中にエラーが発生しました", 500);
  }
});

export default app;
