// POST { type, payload } -> returns CSV text
// type: "groups" | "roster" | "tracker"
const { requireUser } = require("./_lib/auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return resp("Method not allowed", 405, "text/plain");

  const u = await requireUser(event);
  if (u.error) return u.error;

  const { type = "", payload = {} } = safeParse(event.body);
  let csv = "data\n";

  if (type === "groups") {
    // payload: { class_summary, groups:[{name,criteria,members, strategy}] }
    const rows = [["Group", "Criteria", "Members", "Strategy"]];
    for (const g of payload.groups || []) {
      rows.push([
        safe(g.name),
        safe(g.criteria),
        safe((g.members || []).join("; ")),
        safe(g.strategy),
      ]);
    }
    csv = toCsv(rows);
  } else if (type === "roster") {
    // payload: [{name,id,period,scores:{...}}]
    const students = payload || [];
    const standards = Object.keys((students[0]?.scores) || {});
    const head = ["Name","ID","Period", ...standards];
    const rows = [head];
    for (const s of students) {
      rows.push([ safe(s.name), safe(s.id), safe(s.period || ""), ...standards.map(k => String(s.scores?.[k] ?? 0)) ]);
    }
    csv = toCsv(rows);
  } else if (type === "tracker") {
    // payload: { name,id,period,scores:{std:score,...} }
    const s = payload || {};
    const rows = [["Standard","Score"]];
    for (const [k,v] of Object.entries(s.scores || {})) {
      rows.push([safe(k), String(v ?? 0)]);
    }
    csv = toCsv(rows);
  } else {
    return resp("Unknown type", 400, "text/plain");
  }

  return {
    statusCode: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${type}.csv"`,
      "cache-control": "no-store",
    },
    body: csv,
  };
};

function safeParse(b){ try{ return JSON.parse(b||"{}"); }catch{ return {}; } }
function safe(s){ return (s==null?"":String(s)).replaceAll(/[\r\n]+/g, " ").slice(0, 10000); }
function toCsv(rows){
  return rows.map(r => r.map(cell => {
    const c = String(cell ?? "");
    return /[,"\n]/.test(c) ? `"${c.replaceAll('"','""')}"` : c;
  }).join(",")).join("\n");
}
function resp(body, code=200, type="text/plain"){ return { statusCode: code, headers: { "content-type": type }, body }; }
