// Simple per-UID per-function rate-limit stored in Firestore.
// Defaults: max 60/minute (burst ~10).
const { db } = require("./firebaseAdmin");

async function rateLimit({ uid, fn, maxPerMinute = 60 }) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const start = now - windowMs;
  const ref = db.collection("_rl").doc(uid).collection("fn").doc(fn);

  const snap = await ref.get();
  const arr = (snap.exists ? snap.data()?.hits : []) || [];
  const filtered = arr.filter((t) => t > start);
  if (filtered.length >= maxPerMinute) {
    return { allowed: false };
  }
  filtered.push(now);
  await ref.set({ hits: filtered }, { merge: true });
  return { allowed: true };
}

module.exports = { rateLimit };
