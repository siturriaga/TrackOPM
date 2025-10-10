// Verifies Firebase ID token on incoming requests (Authorization: Bearer <idToken>)
const { admin } = require("./firebaseAdmin");

async function verify(req) {
  const auth = (req.headers["authorization"] || "").toString();
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new Error("Missing bearer token");
  const decoded = await admin.auth().verifyIdToken(m[1], true);
  return decoded; // { uid, email, ... }
}

module.exports = { verify };
