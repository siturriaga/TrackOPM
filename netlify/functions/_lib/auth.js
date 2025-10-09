// Verifies Firebase ID token from Authorization: Bearer <token>
const { admin } = require('./firebaseAdmin');

const json = (status, obj) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj),
});

const badRequest = (msg) => json(400, { error: msg });

async function requireUser(event) {
  const authz = event.headers.authorization || event.headers.Authorization;
  if (!authz || !authz.startsWith('Bearer ')) {
    throw new Error('Missing Authorization bearer token');
  }
  const token = authz.slice(7);
  const decoded = await admin.auth().verifyIdToken(token);
  if (!decoded || !decoded.uid) throw new Error('Invalid token');
  return { uid: decoded.uid, email: decoded.email || null };
}

module.exports = { requireUser, json, badRequest };
