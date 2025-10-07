// netlify/functions/synapseGemini.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let appInited = false;
function initAdmin() {
  if (appInited) return;
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!raw) throw new Error('Missing FIREBASE_ADMIN_CREDENTIALS');
  const creds = JSON.parse(raw);
  initializeApp({ credential: cert(creds) });
  appInited = true;
}

const MODEL_WHITELIST = new Set([
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest'
]);

function enforceCaps({systemPrompt = '', userPrompt = ''}) {
  const MAX = 20000;
  if (systemPrompt.length > MAX || userPrompt.length > MAX) {
    throw new Error('Prompt too large');
  }
}

function checkEmailDomain(token) {
  const allow = (process.env.ALLOW_EMAIL_DOMAIN || '').trim(); // e.g. "yourdistrict.edu"
  if (!allow) return;
  const email = token.email || '';
  const domain = email.split('@')[1] || '';
  if (domain.toLowerCase() !== allow.toLowerCase()) {
    throw new Error('Unauthorized email domain');
  }
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    initAdmin();

    const authz = event.headers.authorization || '';
    const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : null;
    if (!idToken) return { statusCode: 401, body: 'Missing bearer token' };

    const decoded = await getAuth().verifyIdToken(idToken);
    checkEmailDomain(decoded);

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch {}
    const { model, systemPrompt = '', userPrompt = '', responseSchema } = body;

    if (!model || !userPrompt) return { statusCode: 400, body: 'model and userPrompt are required' };
    if (!MODEL_WHITELIST.has(model)) return { statusCode: 400, body: 'Model not allowed' };

    enforceCaps({ systemPrompt, userPrompt });

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: 'Server missing GOOGLE_API_KEY' };

    const genAI = new GoogleGenerativeAI(apiKey);
    const gModel = genAI.getGenerativeModel({ model });

    const generationConfig = responseSchema ? {
      responseMimeType: 'application/json',
      responseSchema
    } : {};

    const prompt = [systemPrompt.trim(), userPrompt.trim()].filter(Boolean).join('\n\n');

    const result = await gModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      generationConfig
    });

    const text = result.response?.text() || '{}';

    let parsed;
    try { parsed = JSON.parse(text); }
    catch {
      const m = text.match(/\{[\s\S]*\}$/);
      parsed = m ? JSON.parse(m[0]) : { error: 'Non-JSON response', raw: text.slice(0, 2000) };
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) };
  } catch (err) {
    console.error('synapseGemini error:', err);
    return { statusCode: 500, body: String(err.message || err) };
  }
};
