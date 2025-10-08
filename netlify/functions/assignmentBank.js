// GET  -> list user's items (optional ?q=)
// POST -> { title, text, standard, difficulty }
// DELETE -> ?id=...
const { requireUser, json, badRequest } = require("./_lib/auth");
const { db } = require("./_lib/firebaseAdmin");
const { rateLimit } = require("./_lib/rateLimiter");

exports.handler = async (event) => {
  const u = await requireUser(event);
  if (u.error) return u.error;

  const fn = "assignmentBank";
  const rl = await rateLimit({ uid: u.uid, fn, maxPerMinute: 60 });
  if (!rl.allowed) return json({ error: "Rate limit exceeded" }, 429);

  const col = db.collection("users").doc(u.uid).collection("assignments");

  if (event.httpMethod === "GET") {
    const q = (event.queryStringParameters?.q || "").toLowerCase();
    let qSnap = await col.orderBy("createdAt", "desc").limit(100).get();
    let items = [];
    qSnap.forEach(d => {
      const a = d.data();
      if (!q || (a.title || "").toLowerCase().includes(q) || (a.standard || "").toLowerCase().includes(q)) {
        items.push({ id: d.id, ...a });
      }
    });
    return json({ items });
  }

  if (event.httpMethod === "POST") {
    const { title="", text="", standard="", difficulty="" } = safeParse(event.body);
    if (!title || !text) return badRequest("Missing title or text");
    const doc = await col.add({
      title: String(title).slice(0, 200),
      text: String(text).slice(0, 20000),
      standard: String(standard || "").slice(0, 100),
      difficulty: String(difficulty || "").slice(0, 50),
      createdAt: Date.now(),
    });
    return json({ id: doc.id });
  }

  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    if (!id) return badRequest("Missing id");
    await col.doc(id).delete();
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

function safeParse(b){ try{ return JSON.parse(b||"{}"); }catch{ return {}; } }
