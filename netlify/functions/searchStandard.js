// searchStandard.js
// GET /.netlify/functions/searchStandard?q=rule%20of%20law&subject=Civics&grade=7&view=teacher|internal

import { handler as catalogHandler } from "./standardsCatalog.js";

export async function handler(event) {
  const url = new URL(event.rawUrl);
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();
  if (!q) {
    return { statusCode: 400, body: JSON.stringify({ error: "q required" }) };
  }
  // Reuse catalog with internal view, then filter here; switch to teacher view at the end.
  const subject = url.searchParams.get("subject");
  const grade = url.searchParams.get("grade");
  const view = (url.searchParams.get("view") || "teacher").toLowerCase();

  const catResp = await catalogHandler({
    rawUrl: `${url.origin}/.netlify/functions/standardsCatalog?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}&view=internal`
  });

  if (catResp.statusCode !== 200) return catResp;

  const data = JSON.parse(catResp.body);
  const results = (data.standards || []).filter(s => {
    const hay = `${s.code} ${s.name} ${JSON.stringify(s.internal||{})}`.toLowerCase();
    return hay.includes(q);
  });

  const final = view === "teacher" ? results.map(({ code, name }) => ({ code, name })) : results;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, grade, count: final.length, standards: final })
  };
}
