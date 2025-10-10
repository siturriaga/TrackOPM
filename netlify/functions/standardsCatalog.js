// standardsCatalog.js
// GET  /.netlify/functions/standardsCatalog?subject=Civics&grade=7&view=teacher|internal
//      view=teacher  => only [{code,name}] (for UI lists)
//      view=internal => full objects with .internal
// Also de-dupes by (code) and prefers the richest internal payload.

import fs from "fs";
import path from "path";

const root = path.resolve(process.cwd());

function safeReadJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function dedupeKeepRich(records) {
  const byCode = new Map();
  for (const r of records) {
    const key = r.code?.trim();
    if (!key) continue;
    if (!byCode.has(key)) {
      byCode.set(key, r);
      continue;
    }
    // prefer record with longer internal metadata
    const a = byCode.get(key);
    const aLen = JSON.stringify(a.internal || {}).length;
    const bLen = JSON.stringify(r.internal || {}).length;
    byCode.set(key, bLen > aLen ? r : a);
  }
  return Array.from(byCode.values());
}

export async function handler(event) {
  try {
    const url = new URL(event.rawUrl);
    const subject = url.searchParams.get("subject");
    const grade = url.searchParams.get("grade");
    const view = (url.searchParams.get("view") || "teacher").toLowerCase();

    if (!subject || !grade) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "subject and grade are required" })
      };
    }

    // Load manifest
    const manifestPath = path.join(root, "standards", "index.json");
    const manifest = safeReadJSON(manifestPath);
    if (!manifest) {
      return { statusCode: 500, body: JSON.stringify({ error: "manifest not found" }) };
    }

    // Resolve path pattern for the subject
    const entry = manifest.subjects.find(
      s => s.subject.toLowerCase() === subject.toLowerCase()
    );
    if (!entry) {
      return { statusCode: 404, body: JSON.stringify({ error: "subject not in manifest" }) };
    }

    const chunkRel = entry.pathPattern.replace("{grade}", grade);
    const chunkAbs = path.join(root, chunkRel);
    const chunk = safeReadJSON(chunkAbs);

    if (!chunk || !Array.isArray(chunk.standards)) {
      return { statusCode: 200, body: JSON.stringify({ subject, grade, standards: [] }) };
    }

    // De-dupe and sanitize
    const deduped = dedupeKeepRich(chunk.standards);

    let payload;
    if (view === "teacher") {
      payload = deduped.map(({ code, name }) => ({ code, name }));
    } else {
      payload = deduped; // includes .internal
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
      body: JSON.stringify({
        subject: chunk.subject,
        grade: chunk.grade,
        version: chunk.version,
        count: payload.length,
        standards: payload
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
