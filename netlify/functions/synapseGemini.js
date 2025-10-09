const { requireUser, json, badRequest } = require('./auth');
const { moderateInput } = require('./moderation');

let GoogleGenerativeAI;
try { GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI; } catch { /* optional at build */ }

exports.handler = async (event) => {
  try {
    await requireUser(event);
    const body = JSON.parse(event.body || "{}");
    const { task = "lesson", subject, grade, standard, hints = {} } = body;

    if (!standard || !standard.code) return badRequest("Field 'standard.code' is required");

    const prompt = `Create a ${task} aligned to ${standard.code} – ${standard.title || ""}.
Subject: ${subject || "unknown"}, Grade: ${grade || "unknown"}.
Tone: ${hints.tone || "supportive, teacher-friendly"}.
Output as concise Markdown.`;

    const mod = moderateInput(prompt);
    if (!mod.ok) return json(400, { error: mod.reason });

    const key = process.env.GEMINI_API_KEY;
    if (!key || !GoogleGenerativeAI) {
      return json(200, { title: "Preview (no model key)", text: `Prompt:\n\n${prompt}` });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const resp = await model.generateContent(prompt);
    const out = resp?.response?.text?.() || "No content";

    return json(200, { title: `Aligned ${task.toUpperCase()}`, text: out.trim() });
  } catch (e) {
    return json(e.statusCode || 500, { error: e.message || String(e) });
  }
};
