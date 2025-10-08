// /netlify/functions/searchStandard.js
// Fetch & normalize Florida standards (CPALMS/FLDOE) based on Subject + Grade.
// Uses curated catalog as fallback. Caches results in-memory per cold start.

const { getUser } = require("./_lib/auth");
const { moderateInput } = require("./_lib/moderation");
const { rateLimit } = require("./_lib/rateLimiter");
const catalog = require("./standardsCatalog");

const cache = new Map(); // key "Subject|Grade" -> { standards: [...] }

exports.handler = async (event, context) => {
  try {
    const uid = await getUser(event);
    await rateLimit(uid, "searchStandard", 60, 60); // 60 req / 60s bucket
    const body = JSON.parse(event.body || "{}");
    const subject = String(body.subject || "").trim();
    const grade = String(body.grade || "").trim();

    if (!subject || !grade) {
      return resp(400, { error: "subject and grade are required" });
    }
    await moderateInput(`${subject} ${grade}`);

    const key = `${subject}|${grade}`;
    if (cache.has(key)) return resp(200, cache.get(key));

    // 1) Try curated catalog first (fast & reliable)
    let standards = catalog.lookup(subject, grade);

    // 2) TODO (optional): live fetch from official sources (CPALMS/FLDOE).
    // You can extend here with scraping/API calls and then merge/normalize.
    // Keep the same return shape.
    // For now, curated set covers major FL middle school subjects.

    const payload = { standards };
    cache.set(key, payload);
    return resp(200, payload);
  } catch (err) {
    return resp(500, { error: err.message || String(err) });
  }
};

function resp(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
