import { Hono } from "hono";
import { cors } from "hono/cors";
import { validator } from "hono/validator";
import { jwt } from "hono/jwt";

type Bindings = {
  DB: D1Database;
  USER_TOKEN_SECRET: string;
};

interface Note {
  id: number;
  screen_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

const app = new Hono<{ Bindings: Bindings }>()
  .use("*", cors(), (c, next) =>
    jwt({
      secret: c.env.USER_TOKEN_SECRET,
    })(c, next)
  )
  .get("/:screenId", async (c) => {
    const screenId = c.req.param("screenId");
    try {
      const res = await c.env.DB.prepare(
        "SELECT * FROM notes WHERE screen_id = ? ORDER BY id ASC"
      )
        .bind(screenId)
        .all();
      return c.json(res.results as unknown as Note[]);
    } catch (e) {
      return c.json({ err: (e as Error).message }, 500);
    }
  })
  .post(
    "/:screenId",
    validator("json", (value, c) => {
      return value as { content: string };
    }),
    async (c) => {
      const screenId = c.req.param("screenId");
      const note = (await c.req.json()) as {
        content: string;
      };
      try {
        const payload = c.get("jwtPayload");
        const userId = payload.nickname as string;

        if (!userId) {
          return c.json({ err: "Invalid JWT: nickname not found" }, 401);
        }

        const res = await c.env.DB.prepare(
          "INSERT INTO notes (screen_id, user_id, content) VALUES (?, ?, ?)"
        )
          .bind(screenId, userId, note.content)
          .run();
        if (!res.success) {
          return c.json({ err: "Failed to insert note" }, 500);
        }
        return c.json(res.meta);
      } catch (e) {
        return c.json({ err: (e as Error).message }, 500);
      }
    }
  )
  .delete("/:screenId/:noteId", async (c) => {
    const noteId = c.req.param("noteId");
    try {
      const res = await c.env.DB.prepare("DELETE FROM notes WHERE id = ?")
        .bind(noteId)
        .run();
      return c.json(res.meta);
    } catch (e) {
      return c.json({ err: (e as Error).message }, 500);
    }
  });

export type AppType = typeof app;
export default app;
