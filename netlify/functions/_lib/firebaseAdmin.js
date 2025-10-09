// Firebase Admin singleton (uses FIREBASE_ADMIN_CREDENTIALS env var)
const admin = require('firebase-admin');

if (!admin.apps.length) {
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!raw) throw new Error('FIREBASE_ADMIN_CREDENTIALS env var missing');
  const creds = JSON.parse(raw);
  admin.initializeApp({
    credential: admin.credential.cert(creds),
  });
}

const db = admin.firestore();
const storage = admin.storage();

module.exports = { admin, db, storage };
