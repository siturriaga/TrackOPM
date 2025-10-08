// POST with { q, subject? } -> returns normalized "results" (safe stub).
// Verifies Firebase auth; rate limits; whitelists domains conceptually.
const { requireUser, json, badRequest } = require("./_lib/auth");
const { rateLimit } = require("./_lib/rateLimiter");

const ALLOWED_DOMAINS = ["cpalms.org", "fldoe.org"];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);
  const u = await requireUser(event);
  if (u.error) return u.error;

  const { q = "", subject = "" } = safeParse(event.body);
  if (!q) return badRequest("Missing q");

  const rl = await rateLimit({ uid: u.uid, fn: "searchStandard", maxPerMinute: 60 });
  if (!rl.allowed) return json({ error: "Rate limit exceeded" }, 429);

  // NOTE: Without a paid search API configured, we return a safe stub.
  // You can wire a Custom Search Engine here later and filter to ALLOWED_DOMAINS.
  const results = [
    // Example placeholder; keeps UI stable.
    // { title: "CPALMS — Florida Standards", url: "https://www.cpalms.org/", snippet: "Official standards repository for Florida educators." }
  ];

  return json({ query: q, subject, results });
};

function safeParse(body) {
  try { return JSON.parse(body || "{}"); } catch { return {}; }
}
