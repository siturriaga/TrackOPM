// POST with { systemPrompt, userPrompt, responseSchema? }
// Server-enforces single model; verifies Firebase auth; rate limits; moderates.
const { requireUser, json, badRequest } = require("./_lib/auth");
const { rateLimit } = require("./_lib/rateLimiter");
const { moderatePrompt } = require("./_lib/moderation");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL = "gemini-2.5-flash-preview-05-20"; // locked server-side

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);
  const u = await requireUser(event);
  if (u.error) return u.error;

  const { systemPrompt = "", userPrompt = "", responseSchema } = safeParse(event.body);
  if (!userPrompt || typeof userPrompt !== "string") return badRequest("Missing userPrompt");

  const mod = moderatePrompt(`${systemPrompt}\n${userPrompt}`.slice(0, 8000));
  if (!mod.allowed) return json({ error: "Prompt blocked by moderator" }, 400);

  const rl = await rateLimit({ uid: u.uid, fn: "synapseGemini", maxPerMinute: 60 });
  if (!rl.allowed) return json({ error: "Rate limit exceeded" }, 429);

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: "Missing GEMINI_API_KEY" }, 500);

  const client = new GoogleGenerativeAI(key);
  const model = client.getGenerativeModel({ model: MODEL });

  try {
    // Use “JSON” style response via system steer
    const steer = `
You are a precise generator for K–12 teacher content.
Return ONLY valid JSON matching the user's expected schema.
If unsure, return {"title":"Unavailable","text":"Please try again."}.
`.trim();

    const input = [steer, systemPrompt || "", `USER:\n${userPrompt}`].join("\n\n").slice(0, 24000);

    const result = await withTimeout(model.generateContent({ contents: [{ role: "user", parts: [{ text: input }] }] }), 25000);
    const text = result?.response?.text?.() || "";

    const parsed = tryJson(text);
    if (!parsed || typeof parsed !== "object") {
      // Fallback minimal
      return json({ title: "Result", text: text.slice(0, 4000) || "No content returned." });
    }

    // Optional schema “shape guard”
    if (responseSchema && typeof responseSchema === "object") {
      // very light shape check: ensure keys exist if provided
      if (Array.isArray(responseSchema.required)) {
        for (const k of responseSchema.required) {
          if (!(k in parsed)) return json({ title: "Result", text: text.slice(0, 4000) }, 200);
        }
      }
    }

    return json(parsed);
  } catch (e) {
    return json({ error: "Gemini error", detail: String(e.message || e) }, 500);
  }
};

function safeParse(body) {
  try { return JSON.parse(body || "{}"); } catch { return {}; }
}
function tryJson(s) {
  try { return JSON.parse(s); } catch { return null; }
}
function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error("Timed out")), ms))]);
}
