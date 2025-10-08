const { admin } = require("./firebaseAdmin");

async function requireUser(event) {
  const auth = event.headers.authorization || event.headers.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: { statusCode: 401, body: "Missing bearer token" } };

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email || null };
  } catch (e) {
    return { error: { statusCode: 401, body: "Invalid Firebase ID token" } };
  }
}

function json(data, code = 200, extra = {}) {
  return {
    statusCode: code,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extra },
    body: JSON.stringify(data),
  };
}

function badRequest(msg) {
  return json({ error: msg }, 400);
}

module.exports = { requireUser, json, badRequest };
