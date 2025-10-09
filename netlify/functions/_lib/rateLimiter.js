// Simple per-UID, per-function, sliding window limiter using Firestore
const { db } = require('./firebaseAdmin');

async function rateLimit({ uid, key, limit = 30, windowSeconds = 60 }) {
  const now = Date.now();
  const start = now - windowSeconds * 1000;
  const ref = db.collection('rate_limits').doc(`${uid}_${key}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let hits = snap.exists ? (snap.data().hits || []).filter(ts => ts >= start) : [];
    if (hits.length >= limit) {
      const retryAfter = Math.ceil((hits[0] + windowSeconds * 1000 - now) / 1000);
      const err = new Error(`Rate limit exceeded. Try again in ~${retryAfter}s.`);
      err.statusCode = 429; throw err;
    }
    hits.push(now);
    tx.set(ref, { hits }, { merge: true });
  });
}

module.exports = { rateLimit };
