// Self-contained Gemini proxy for Netlify Functions
// - No external local requires (no ./auth, no ./moderation)
// - CORS-friendly, safe to call from the app
// - Uses GEMINI_API_KEY set in Netlify env

let GoogleGenerativeAI;
try {
  // Optional at build time; if not present we'll fallback to fetch
  GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;
} catch { /* ok */ }

// Small helpers (local — no imports)
function json(status, body, extraHeaders = {}) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}
const badRequest = (msg) => json(400, { error: msg });

// Optional, lightweight input guard (no external “moderation” dep)
function basicModeration(text = "") {
  const tooLong = text.length > 8000; // keep requests sane
  const blocked = /(?:api[_-]?key|password|token)[^a-z]/i.test(text); // naive secret leakage
  if (tooLong) return { ok: false, reason: "Input too long" };
  if (blocked) return { ok: false, reason: "Blocked content" };
  return { ok: true };
}

exports.handler = async (event) => {
  try {
    // Preflight
    if (event.httpMethod === "OPTIONS") {
      return json(200, {});
    }
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method Not Allowed" });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) return json(500, { error: "Missing GEMINI_API_KEY" });

    const body = JSON.parse(event.body || "{}");
    const {
      task = "lesson",                // "lesson", "practice", "plan", etc.
      subject = "unknown",
      grade = "unknown",
      standard = {},                 // { code, title }
      hints = {},                    // { tone, duration, level }
      model = "gemini-1.5-pro",      // better quality than flash; change if you want
      temperature = 0.7
    } = body;

    if (!standard.code) return badRequest("Field 'standard.code' is required");

    const prompt =
`Create a ${task} aligned to ${standard.code}${standard.title ? ` – ${standard.title}` : ""}.
Subject: ${subject}, Grade: ${grade}.
Level: ${hints.level || "On grade"}; Duration: ${hints.duration || "60"} minutes.
Tone: ${hints.tone || "supportive, teacher-friendly"}.
Format:
1) "Teacher-friendly explanation" (3–5 sentences)
2) "Lesson plan" using Gradual Release (I Do → We Do → You Do), DI/stations, and an exit ticket
3) Bullet list of materials and accommodations
Output as concise Markdown.`;

    const mod = basicModeration(prompt);
    if (!mod.ok) return badRequest(mod.reason);

    // Prefer SDK if present; otherwise fall back to raw fetch
    if (GoogleGenerativeAI) {
      const genAI = new GoogleGenerativeAI(key);
      const mdl = genAI.getGenerativeModel({ model });
      const resp = await mdl.generateContent(prompt);
      const text = resp?.response?.text?.() || "No content.";
      return json(200, { title: `Aligned ${task.toUpperCase()}`, text: text.trim() });
    } else {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature }
          })
        }
      );
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "No content.";
      return json(200, { title: `Aligned ${task.toUpperCase()}`, text: text.trim() });
    }
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
