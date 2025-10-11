import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { task, subject, grade, standard, hints } = JSON.parse(event.body);
    if (!standard || !standard.code) {
      return { statusCode: 400, body: 'Invalid standard provided.' };
    }

    const prompt = `
You are an expert instructional coach AI assisting a teacher.
Generate a concise, teacher-facing resource.
Use clear headings, bullet points, and lists. Output must be Markdown.

Task: Create a ${task}.
Subject: ${subject}
Grade: ${grade}
Standard: ${standard.code} - ${standard.title || standard.name}
Clarification: ${standard.clarification || (standard.internal?.clarifications?.[0] ?? "")}
Objectives: ${(standard.objectives || standard.internal?.objectives || []).join(', ')}

Requirements:
- Level: ${hints.level}
- Duration: ${hints.duration}
- Tone: Supportive, teacher-friendly, practical.
- Include DI, Gradual Release (I/We/You do), and 1–2 collaborative structures (stations or think-pair-share).
Begin with a title line.
    `.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const lines = text.split('\n');
    const title = lines[0].replace(/#/g, '').trim() || "Generated Resource";
    const content = lines.slice(1).join('\n');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ title, text: content }),
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate content from AI." }) };
  }
};
