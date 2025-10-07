// netlify/functions/searchStandard.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fetch = require('node-fetch');

let appInited = false;
function initAdmin() {
  if (appInited) return;
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!raw) throw new Error('Missing FIREBASE_ADMIN_CREDENTIALS');
  const creds = JSON.parse(raw);
  initializeApp({ credential: cert(creds) });
  appInited = true;
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

function sanitizeQuery(q) {
  if (typeof q !== 'string') throw new Error('Invalid query');
  const trimmed = q.trim().slice(0, 300); // cap length
  if (!trimmed) throw new Error('Empty query');
  return trimmed.replace(/[\r\n]+/g, ' ');
}

function normalize(items = []) {
  return items
    .filter(Boolean)
    .map(it => ({
      title: (it.title || '').toString().slice(0, 200),
      url: (it.url || it.link || '').toString().slice(0, 500),
      snippet: (it.snippet || '').toString().slice(0, 400)
    }))
    .filter(x => x.title && x.url);
}

async function cseSearch(q) {
  const cx = process.env.CSE_ID;
  const key = process.env.CSE_API_KEY;
  if (!cx || !key) return null;

  const url = `https://www.googleapis.com/customsearch/v1` +
              `?key=${encodeURIComponent(key)}` +
              `&cx=${encodeURIComponent(cx)}` +
              `&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { timeout: 8000 });
  if (!r.ok) return null;
  const json = await r.json();
  return { results: normalize((json.items || []).map(i => ({
    title: i.title, url: i.link, snippet: i.snippet
  }))) };
}

async function whitelistFetch(q) {
  // Minimal, whitelisted, best-effort “fallback” without any secret keys
  const ALLOWED = ['https://www.cpalms.org', 'https://www.fldoe.org'];
  const results = [];
  for (const base of ALLOWED) {
    try {
      const r = await fetch(`${base}/?q=${encodeURIComponent(q)}`, { redirect: 'follow', timeout: 6000 });
      if (!r.ok) continue;
      const txt = await r.text();
      const title = (txt.match(/<title>([^<]+)<\/title>/i) || [,''])[1] || base;
      const desc = (txt.replace(/\s+/g,' ').match(/<meta name="description" content="([^"]+)"/i) || [,''])[1] || '';
      results.push({ title, url: r.url || base, snippet: desc });
    } catch (_) { /* ignore */ }
  }
  return { results: normalize(results) };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    initAdmin();

    // Require Firebase ID token
    const authz = event.headers.authorization || '';
    const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : null;
    if (!idToken) return { statusCode: 401, body: 'Missing bearer token' };

    const decoded = await getAuth().verifyIdToken(idToken);
    checkEmailDomain(decoded); // optional allowlist

    // Parse and sanitize body
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
    const q = sanitizeQuery(body.q);

    // Prefer CSE; fallback to whitelist fetch
    const cse = await cseSearch(q);
    const payload = cse || await whitelistFetch(q);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(payload)
    };
  } catch (err) {
    console.error('searchStandard error:', err);
    // Fail closed with minimal info
    return { statusCode: 500, body: 'Search unavailable' };
  }
};
