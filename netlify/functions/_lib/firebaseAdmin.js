// Singleton Firebase Admin init (uses FIREBASE_ADMIN_CREDENTIALS env var)
const admin = require("firebase-admin");

let app;
try {
  app = admin.app();
} catch {
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!raw) {
    throw new Error("Missing FIREBASE_ADMIN_CREDENTIALS env var");
  }
  const creds = JSON.parse(raw);
  app = admin.initializeApp({
    credential: admin.credential.cert(creds),
  });
}

const db = admin.firestore();
const storage = admin.storage?.();

module.exports = { admin, db, storage };
