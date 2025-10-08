// POST { roster:[{name,id,score}], standard, goal? } -> DI groups
// goal: "heterogeneous" | "homogeneous" (default: homogeneous thirds)
const { requireUser, json, badRequest } = require("./_lib/auth");
const { rateLimit } = require("./_lib/rateLimiter");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);
  const u = await requireUser(event);
  if (u.error) return u.error;

  const { roster = [], standard = "", goal = "homogeneous" } = safeParse(event.body);
  if (!Array.isArray(roster) || roster.length === 0) return badRequest("Missing or empty roster");

  const rl = await rateLimit({ uid: u.uid, fn: "groupIntelligence", maxPerMinute: 60 });
  if (!rl.allowed) return json({ error: "Rate limit exceeded" }, 429);

  // Normalize and sort by score
  const data = roster.map(r => ({ name: r.name || "N/A", id: r.id || "", score: Number(r.score) || 0 }));
  data.sort((a,b) => a.score - b.score);

  let groups = [];
  if (goal === "heterogeneous") {
    // Pair top with bottom (zip)
    const left = data.slice(0, Math.ceil(data.length/2));
    const right = data.slice(Math.ceil(data.length/2)).reverse();
    const pairs = [];
    for (let i=0; i<left.length; i++) {
      const a = left[i], b = right[i];
      if (a && b) pairs.push([a,b]); else pairs.push([a].filter(Boolean));
    }
    groups = pairs.map((arr, i) => ({
      name: `Mixed Group ${i+1}`,
      criteria: "Heterogeneous pairing",
      members: arr.map(x => x?.name).filter(Boolean),
      strategy: "Think-pair-share; peer explanation; role cards",
    }));
  } else {
    // Homogeneous thirds
    const n = data.length;
    const t = Math.ceil(n/3);
    groups = [
      { name:'Remediation', criteria:'Lower third', members:data.slice(0,t).map(x=>x.name), strategy:'Re-teach, 2 guided items' },
      { name:'Practice', criteria:'Middle third', members:data.slice(t,2*t).map(x=>x.name), strategy:'Mixed practice, pair-share' },
      { name:'Enrichment', criteria:'Upper third', members:data.slice(2*t).map(x=>x.name), strategy:'Extension, explain reasoning' }
    ];
  }

  const median = data[Math.floor(data.length/2)]?.score ?? 0;
  const class_summary = `Auto groups for ${standard || "standard"}. n=${data.length}. Median≈${median}`;

  return json({ class_summary, groups });
};

function safeParse(b){ try{ return JSON.parse(b||"{}"); }catch{ return {}; } }
