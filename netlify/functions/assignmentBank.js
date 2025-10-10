exports.handler = async (event) => {
  try {
    const { verify } = require("./auth");
    const { admin } = require("./firebaseAdmin");
    const db = admin.firestore();
    const user = await verify(event);

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body||"{}"); // {title, standardCode, subject, grade, tier, content}
      body.uid = user.uid; body.createdAt = admin.firestore.FieldValue.serverTimestamp();
      const ref = await db.collection("users").doc(user.uid).collection("assignments").add(body);
      return { statusCode: 200, body: JSON.stringify({ ok:true, id: ref.id }) };
    }

    if (event.httpMethod === "GET") {
      const qs = new URLSearchParams(event.queryStringParameters||{});
      const snap = await db.collection("users").doc(user.uid).collection("assignments").orderBy("createdAt","desc").limit(50).get();
      const items = snap.docs.map(d=>({id:d.id, ...d.data()}));
      return { statusCode: 200, body: JSON.stringify({ ok:true, items }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ ok:false, error:e.message }) };
  }
};
