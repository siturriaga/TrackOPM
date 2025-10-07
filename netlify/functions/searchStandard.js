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

function enforceQuery(q) {
  if (!q || typeof q !== 'string' || q.length > 500) throw new Error('Invalid q');
}

async function cseSearch(q) {
  const cx = process.env.CSE_ID;
  const key = process.env.CSE_API_KEY;
  if (!cx || !key) return null;
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(q)}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const json = await r.json();
  const results = (json.items || []).map(it => ({
    title: it.title, url: it.link, snippet: it.snippet
  }));
  return { results };
}

async function naiveFetch(q) {
  const targets = [
    'https://www.cpalms.org',
    'https://www.fldoe.org'
  ];
  const results = [];
  for (const base of targets) {
    try {
      const r = await fetch(`${base}/?q=${encodeURIComponent(q)}`, { redirect: 'follow' });
      const txt = await r.text();
      const title = (txt.match(/<title>([^<]+)<\/title>/i) || [,''])[1];
      const snippet = (txt.replace(/\s+/g,' ').match(/<meta name="description" content="([^"]+)"/i) || [,''])[1] || '';
      results.push({ title: title || base, url: r.url || base, snippet });
    } catch {}
  }
  return { results };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    initAdmin();

    const authz = event.headers.authorization || '';
    const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : null;
    if (!idToken) return { statusCode: 401, body: 'Missing bearer token' };

    await getAuth().verifyIdToken(idToken);

    const { q } = JSON.parse(event.body || '{}');
    enforceQuery(q);

    const cse = await cseSearch(q);
    const payload = cse || await naiveFetch(q);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
  } catch (err) {
    console.error('searchStandard error:', err);
    return { statusCode: 500, body: String(err.message || err) };
  }
};
