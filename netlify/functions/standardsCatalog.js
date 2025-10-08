// GET ?subject=...&grade=...  or POST {subject,grade}
// Returns cached standards from Firestore if present.
const { requireUser, json } = require("./_lib/auth");
const { db } = require("./_lib/firebaseAdmin");
const { rateLimit } = require("./_lib/rateLimiter");

exports.handler = async (event) => {
  const u = await requireUser(event);
  if (u.error) return u.error;

  const isPost = event.httpMethod === "POST";
  const params = isPost ? safeParse(event.body) : event.queryStringParameters || {};
  const subject = (params.subject || "").trim();
  const grade = (params.grade || "").trim();
  if (!subject || !grade) return json({ error: "Missing subject or grade" }, 400);

  const rl = await rateLimit({ uid: u.uid, fn: "standardsCatalog", maxPerMinute: 60 });
  if (!rl.allowed) return json({ error: "Rate limit exceeded" }, 429);

  const key = `${subject}::${grade}`.toLowerCase();
  const ref = db.collection("standardsCatalog").doc(key);
  const snap = await ref.get();

  if (!snap.exists) {
    // Not pre-seeded. Return empty to let client fall back to search.
    return json({ subject, grade, standards: [] }, 200);
  }

  const data = snap.data();
  return json({ subject, grade, standards: data.standards || [] });
};

function safeParse(b) { try { return JSON.parse(b || "{}"); } catch { return {}; } }
