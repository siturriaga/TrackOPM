// netlify/functions/searchStandard.js
const admin = require('firebase-admin');

let init = false;
function initAdmin(){
  if (init) return;
  const creds = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!creds) throw new Error('FIREBASE_ADMIN_CREDENTIALS missing');
  const sa = JSON.parse(creds);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  init = true;
}

function extractCodesFromText(text=''){
  // Naive detection e.g. "SS.7.CG.1.6", "MA.6.AR.1.1", etc.
  const rx = /([A-Z]{1,3}\.\d{1,2}\.[A-Z]\w?\.\d(?:\.\d+)?)/g;
  const set = new Set();
  let m; while((m = rx.exec(text))){ set.add(m[1]); }
  return [...set];
}

exports.handler = async (event) => {
  try{
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    initAdmin();

    const auth = event.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return { statusCode: 401, body: 'Missing ID token' };

    try{ await admin.auth().verifyIdToken(token); }
    catch{ return { statusCode: 401, body: 'Invalid ID token' }; }

    const body = JSON.parse(event.body || '{}');
    const q = String(body.q||'');
    const subject = String(body.subject||'');

    // 1) Try Firestore catalog first (optional). Key can be normalized subject+grade
    const db = admin.firestore();
    const key = subject.trim().toLowerCase().replace(/\s+/g,'_'); // e.g., "7th_grade_florida_civics"
    let standards = [];

    try{
      const snap = await db.collection('catalog').doc(key).get();
      if (snap.exists && Array.isArray(snap.data()?.standards)) {
        standards = snap.data().standards;
      }
    }catch(e){
      console.warn('catalog read failed', e.message);
    }

    // 2) Fallback: regex extract from query+subject (best-effort)
    if (!standards.length) {
      standards = extractCodesFromText(q + ' ' + subject);
    }

    // 3) Return minimal structure
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ standards })
    };
  }catch(err){
    console.error('searchStandard error', err);
    return { statusCode: 500, body: err.message || 'Server error' };
  }
};
