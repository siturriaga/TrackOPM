exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    const { verify } = require("./auth");
    const { admin } = require("./firebaseAdmin");
    const user = await verify(event);
    const db = admin.firestore();

    const payload = JSON.parse(event.body||"{}");
    // expected: {assignmentId, rosterId, studentId, dueAt, method, tier, standardCode, subject, grade}
    const doc = {
      ...payload,
      uid: user.uid,
      givenAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("users").doc(user.uid).collection("assignment_logs").add(doc);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ ok:false, error: e.message }) };
  }
};
