const { requireUser, json } = require('./auth');
// Minimal placeholder — wire to Firestore later if desired
exports.handler = async (event) => {
  try {
    await requireUser(event);
    return json(200, { items: [] });
  } catch (e) {
    return json(e.statusCode || 500, { error: e.message || String(e) });
  }
};
