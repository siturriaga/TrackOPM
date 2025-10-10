// Initialize firebase-admin using an env var FIREBASE_ADMIN_CREDENTIALS (one-line JSON)
const admin = require("firebase-admin");

let app;
if (!admin.apps.length) {
  const creds = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!creds) throw new Error("FIREBASE_ADMIN_CREDENTIALS missing.");
  const parsed = JSON.parse(creds);
  app = admin.initializeApp({ credential: admin.credential.cert(parsed) });
} else {
  app = admin.app();
}

module.exports = { admin, app };
