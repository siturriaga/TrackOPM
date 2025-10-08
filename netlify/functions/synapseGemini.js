// /netlify/functions/synapseGemini.js
// Single fixed model; guards with moderation + rate limiting.
// Supports tasks: 'assignment' | 'lesson' | 'explain' | 'groups' (if needed).
const { getUser } = require("./_lib/auth");
const { moderateInput, moderateOutput } = require("./_lib/moderation");
const { rateLimit } = require("./_lib/rateLimiter");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const MODEL = "gemini-2.5-flash-preview-05-20";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
  try {
    const uid = await getUser(event);
    await rateLimit(uid, "synapseGemini", 60, 60);

    const body = JSON.parse(event.body || "{}");
    const { task, subject, grade, standard, studentContext, assignmentType, difficulty } = body;

    if (!task || !subject || !grade || !standard?.code) {
      return json(400, { error: "task, subject, grade, and standard.code are required" });
    }

    // Safety
    await moderateInput(`${task} ${subject} ${grade} ${standard.code} ${assignmentType||''} ${difficulty||''}`);

    const sys = systemPrompt(task);
    const user = userPrompt({ task, subject, grade, standard, studentContext, assignmentType, difficulty });

    const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: sys });
    const result = await model.generateContent(user);
    const text = result?.response?.text() || "";

    await moderateOutput(text);

    // Normalize
    return json(200, { title: extractTitle(text) || "Result", text });
  } catch (err) {
    return json(500, { error: err.message || String(err) });
  }
};

function systemPrompt(task){
  if (task === 'assignment') {
    return `You are a curriculum designer.
Use ONLY the supplied official Florida standard, clarifications, and objectives.
Embed Differentiated Instruction best practices (stations, learning circles, gradual release).
Return teacher-ready content. Avoid unsafe or off-task material.`;
  }
  if (task === 'lesson') {
    return `You design concise mini-lessons using gradual release (I/We/You), checks for understanding, and DI scaffolds.
Use ONLY the supplied Florida standard details.`;
  }
  if (task === 'explain') {
    return `You explain standards plainly for teachers and students, including key ideas, misconceptions, and quick checks.`;
  }
  return `You are a helpful teaching assistant.`;
}

function userPrompt({ task, subject, grade, standard, studentContext, assignmentType, difficulty }){
  const header = [
    `Subject: ${subject}`,
    `Grade: ${grade}`,
    `Standard: ${standard.code} — ${standard.title}`,
    standard.clarifications?.length ? `Clarifications:\n- ${standard.clarifications.join("\n- ")}` : "",
    standard.objectives?.length ? `Objectives:\n- ${standard.objectives.join("\n- ")}` : "",
    studentContext ? `Student context (optional): ${JSON.stringify(studentContext)}` : ""
  ].filter(Boolean).join("\n");

  if (task === 'assignment') {
    return `${header}

Task: Create a ${assignmentType || 'Worksheet'} at ${difficulty || 'On-Level'}.
Return sections:
- Title
- Directions
- Items (numbered)
- Differentiation Notes (for EL/IEP, extensions)`;
  }

  if (task === 'lesson') {
    return `${header}

Task: 15-minute mini-lesson.
Return sections:
- Objective
- Materials
- Sequence (I Do / We Do / You Do)
- Checks for Understanding
- Extension
- EL & IEP Supports`;
  }

  if (task === 'explain') {
    return `${header}

Task: Explain in plain language. Then add:
- Key ideas (bulleted)
- Common misconceptions
- Quick check questions`;
  }

  return header;
}

function extractTitle(text){
  const m = text.match(/^#+\s*(.+)$/m) || text.match(/^Title:\s*(.+)$/m);
  return m?.[1]?.trim();
}

function json(statusCode, body){
  return { statusCode, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) };
}
