// netlify/functions/searchStandard.js
// Flexible standards search: tolerant to case, spacing, and mild misspellings.
// Requires a valid Firebase ID token (Google Sign-In) via Authorization: Bearer <token>

const { requireUser, json, badRequest } = require("./auth");
const catalog = require("./standardsCatalog");

/* ---------------------------- utilities ---------------------------- */

// simple normalize: lowercase letters/digits, collapse spaces
const norm = (s) => String(s || "")
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
  .replace(/\s+/g, " ")
  .trim();

// map common aliases to canonical subjects used in the catalog keys
const SUBJECT_ALIASES = new Map([
  ["ela", "english language arts"],
  ["e l a", "english language arts"],
  ["english", "english language arts"],
  ["language arts", "english language arts"],
  ["reading", "english language arts"],
  ["lit", "english language arts"],

  ["math", "mathematics"],
  ["algebra", "mathematics"],
  ["geometry", "mathematics"],

  ["sci", "science"],
  ["sciences", "science"],

  ["civics", "civics"],
  ["civic", "civics"],
  ["social studies", "civics"],
  ["government", "civics"],
]);

// words → numbers for grades
const GRADE_WORDS = new Map([
  ["k", "K"], ["kindergarten", "K"],
  ["one", "1"], ["first", "1"],
  ["two", "2"], ["second", "2"],
  ["three", "3"], ["third", "3"],
  ["four", "4"], ["fourth", "4"],
  ["five", "5"], ["fifth", "5"],
  ["six", "6"], ["sixth", "6"],
  ["seven", "7"], ["seventh", "7"],
  ["eight", "8"], ["eighth", "8"],
  ["nine", "9"], ["ninth", "9"],
  ["ten", "10"], ["tenth", "10"],
  ["eleven", "11"], ["eleventh", "11"],
  ["twelve", "12"], ["twelfth", "12"],
]);

function normalizeGrade(input) {
  const s = norm(input);
  if (!s) return null;
  // direct word map
  if (GRADE_WORDS.has(s)) return GRADE_WORDS.get(s);
  // extract first number in the string (e.g., "grade 7", "7th")
  const m = s.match(/\d{1,2}/);
  if (m) return String(parseInt(m[0], 10));
  return null; // unsupported/unknown
}

function canonicalSubject(input) {
  const s = norm(input);
  if (!s) return null;
  if (SUBJECT_ALIASES.has(s)) return SUBJECT_ALIASES.get(s);
  return s; // try as-is; fuzzy will clean it up
}

// Levenshtein distance (small & fast enough for our subject names)
function levenshtein(a, b) {
  a = norm(a); b = norm(b);
  const al = a.length, bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  const dp = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) dp[j] = j;
  for (let i = 1; i <= al; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= bl; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1,        // deletion
        dp[j - 1] + 1,    // insertion
        prev + cost       // substitution
      );
      prev = tmp;
    }
  }
  return dp[bl];
}
const sim = (a, b) => {
  const d = levenshtein(a, b);
  const L = Math.max(norm(a).length, norm(b).length) || 1;
  return 1 - d / L; // 0..1
};

function uniqueSubjectsFromCatalog() {
  const subs = new Set();
  for (const key of Object.keys(catalog)) {
    const [subject] = key.split("|");
    subs.add(subject);
  }
  return [...subs];
}

function gradesForSubject(subject) {
  const out = new Set();
  for (const key of Object.keys(catalog)) {
    const [sub, grade] = key.split("|");
    if (sub === subject) out.add(grade);
  }
  return [...out].sort((a,b)=> (a==="K") ? -1 : (b==="K") ? 1 : (+a - +b));
}

/* ------------------------------ handler ------------------------------ */

exports.handler = async (event) => {
  try {
    await requireUser(event); // verifies Firebase ID token (Google sign-in)

    const body = JSON.parse(event.body || "{}");
    let { subject, grade } = body;

    if (!subject) return badRequest("Field 'subject' is required");
    // grade can be optional; we’ll try to infer/fallback

    // 1) Normalize inputs
    const gradeNorm = normalizeGrade(grade);
    const subjectCanon = canonicalSubject(subject);

    // 2) Find best subject match across the catalog (aliases + fuzzy)
    const availableSubjects = uniqueSubjectsFromCatalog();            // from catalog keys
    // first, if alias/canon matches exactly one of the available subjects
    let bestSubject = availableSubjects.find(s => s === subjectCanon);

    let strategy = "exact";
    if (!bestSubject) {
      // fuzzy: pick the catalog subject with the highest similarity
      let best = { s: null, score: -1 };
      for (const s of availableSubjects) {
        const score = sim(subjectCanon, s);
        if (score > best.score) best = { s, score };
      }
      // accept if reasonably close (0.6+ works well for short words)
      if (best.score >= 0.6) {
        bestSubject = best.s;
        strategy = "fuzzy";
      } else {
        // final alias attempt: if user typed something that maps to a known alias not in catalog keys
        for (const [alias, canon] of SUBJECT_ALIASES.entries()) {
          if (sim(subjectCanon, alias) >= 0.7 && availableSubjects.includes(canon)) {
            bestSubject = canon;
            strategy = "alias-fuzzy";
            break;
          }
        }
      }
    }

    if (!bestSubject) {
      return json(200, {
        standards: [],
        resolvedSubject: null,
        resolvedGrade: gradeNorm,
        strategy: "no-subject-match",
        suggestions: { subjects: availableSubjects }
      });
    }

    // 3) With subject chosen, resolve grade fallback
    // try exact grade, then ±1, then “any grade for subject”
    const subjectGrades = gradesForSubject(bestSubject);
    let chosenGrade = null;
    let result = [];

    const tryKey = (g) => catalog[`${bestSubject}|${g}`] || [];

    if (gradeNorm && subjectGrades.includes(gradeNorm)) {
      chosenGrade = gradeNorm;
      result = tryKey(gradeNorm);
      strategy += "+exact-grade";
    } else if (gradeNorm) {
      // adjacent numeric ±1 (if numeric)
      const n = parseInt(gradeNorm, 10);
      if (!Number.isNaN(n)) {
        for (const g of [String(n), String(n - 1), String(n + 1)]) {
          if (subjectGrades.includes(g)) {
            chosenGrade = g;
            result = tryKey(g);
            strategy += "+adjacent-grade";
            break;
          }
        }
      }
      if (!result.length) {
        // if still nothing, take the first available grade for that subject
        if (subjectGrades.length) {
          chosenGrade = subjectGrades[0];
          result = tryKey(chosenGrade);
          strategy += "+fallback-first-grade";
        }
      }
    } else {
      // no grade provided: return combined list across grades (capped)
      strategy += "+no-grade-combined";
      const combined = [];
      for (const g of subjectGrades) combined.push(...tryKey(g));
      result = combined.slice(0, 100); // cap to keep payload reasonable
    }

    return json(200, {
      standards: result,
      resolvedSubject: bestSubject,
      resolvedGrade: chosenGrade || gradeNorm || null,
      strategy,
      suggestions: {
        subjects: availableSubjects,
        grades: subjectGrades
      }
    });
  } catch (err) {
    return json(500, { error: err?.message || String(err) });
  }
};
