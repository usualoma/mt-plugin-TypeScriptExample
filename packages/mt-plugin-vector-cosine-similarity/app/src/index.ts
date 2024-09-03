import { Hono } from "hono";
import OpenAI from "openai";

type Bindings = {
  VECTORIZE: Vectorize;
  OPEN_AI_API_KEY: string;
};

interface Entry {
  id: number;
  text: string;
  status:
    | 1 // hold
    | 2 // release
    | 3 // review
    | 4 // future
    | 5 // junk
    | 6; // unpublish
}

interface ContentData {
  id: number;
  status: Entry["status"];
}

interface SimilarEntryPostBody {
  package: string;
  object: Entry | ContentData;
}

const app = new Hono<{ Bindings: Bindings }>();

app.post("/entry-post-save", async (c) => {
  const { package: pkg, object } = (await c.req.json()) as SimilarEntryPostBody;
  const { id, status } = object;

  if ((typeof status === "string" ? parseInt(status) : status) !== 2) {
    try {
      await c.env.VECTORIZE.deleteByIds([id.toString()]);
      return c.json({ success: true });
    } catch (error) {
      console.error("Error:", error);
      return c.json({ error: "Failed to delete the entry" }, 500);
    }
  }

  const openai = new OpenAI({
    apiKey: c.env.OPEN_AI_API_KEY,
  });

  try {
    const embedding = await openai.embeddings.create({
      input: "text" in object ? object.text : "",
      model: "text-embedding-3-small",
    });

    await c.env.VECTORIZE.upsert([
      {
        id: id.toString(),
        values: embedding.data[0].embedding,
        namespace: pkg.replace(/.*::/, "").toLowerCase(),
      },
    ]);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return c.json({ error: "Failed to process the entry" }, 500);
  }
});

app.post("/vector-cosine-similarity", async (c) => {
  const {
    attributes: { namespace, id },
  } = (await c.req.json()) as {
    attributes: {
      namespace: string;
      id: string;
    };
  };
  const { limit: queryLimit } = c.req.query();
  const limit = queryLimit ? parseInt(queryLimit) : 3;

  const [res] = await c.env.VECTORIZE.getByIds([id]);

  if (!res) {
    return c.json({ error: "Entry not found" }, 404);
  }

  const similarItems = await c.env.VECTORIZE.query(res.values, {
    topK: limit + 1,
    returnValues: true,
    returnMetadata: "all",
    namespace,
  });

  const results = similarItems.matches
    .filter((match) => match.id !== id)
    .slice(0, limit)
    .map((match) => ({
      id: match.id,
      score: match.score,
    }));

  return c.json({
    vars: {
      [`similar_${namespace}_items`]: results,
    },
  });
});

export default app;
