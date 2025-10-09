// Flexible standards search: tolerant to case/spacing/typos
const { requireUser, json, badRequest } = require('./auth');
const catalog = require('./standardsCatalog');

// normalize (lowercase, collapse spaces, strip symbols)
const norm = (s) => String(s || "")
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
  .replace(/\s+/g, " ")
  .trim();

const SUBJECT_ALIASES = new Map([
  ["ela", "english language arts"],
  ["e l a", "english language arts"],
  ["english", "english language arts"],
  ["language arts", "english language arts"],
  ["reading", "english language arts"],

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

const GRADE_WORDS = new Map([
  ["k", "K"], ["kindergarten", "K"],
  ["one","1"],["first","1"],["two","2"],["second","2"],
  ["three","3"],["third","3"],["four","4"],["fourth","4"],
  ["five","5"],["fifth","5"],["six","6"],["sixth","6"],
  ["seven","7"],["seventh","7"],["eight","8"],["eighth","8"],
  ["nine","9"],["ninth","9"],["ten","10"],["tenth","10"],
  ["eleven","11"],["eleventh","11"],["twelve","12"],["twelfth","12"],
]);

function normalizeGrade(g) {
  const s = norm(g);
  if (!s) return null;
  if (GRADE_WORDS.has(s)) return GRADE_WORDS.get(s);
  const m = s.match(/\d{1,2}/);
  return m ? String(parseInt(m[0],10)) : null;
}

// Levenshtein
function levenshtein(a,b){a=norm(a);b=norm(b);const al=a.length,bl=b.length;if(!al)return bl;if(!bl)return al;const d=new Array(bl+1);for(let j=0;j<=bl;j++)d[j]=j;for(let i=1;i<=al;i++){let prev=i-1;d[0]=i;for(let j=1;j<=bl;j++){const tmp=d[j];const cost=a[i-1]===b[j-1]?0:1;d[j]=Math.min(d[j]+1,d[j-1]+1,prev+cost);prev=tmp}}return d[bl]}
const sim = (a,b)=>{const d=levenshtein(a,b);const L=Math.max(norm(a).length,norm(b).length)||1;return 1-d/L};

function subjectsFromCatalog(){const s=new Set();for(const k of Object.keys(catalog)) s.add(k.split('|')[0]);return [...s];}
function gradesFor(sub){const g=new Set();for(const k of Object.keys(catalog)){const [s,gr]=k.split('|');if(s===sub) g.add(gr)}return [...g].sort((a,b)=>(a==='K')?-1:(b==='K')?1:(+a-+b))}

exports.handler = async (event) => {
  try{
    await requireUser(event);

    const body = JSON.parse(event.body||"{}");
    let { subject, grade } = body;
    if (!subject) return badRequest("Field 'subject' is required");

    const gradeNorm = normalizeGrade(grade);
    const subjIn = norm(subject);
    const availableSubs = subjectsFromCatalog();

    // alias → exact → fuzzy
    let subjCanon = SUBJECT_ALIASES.get(subjIn) || subjIn;
    let best = availableSubs.find(s=>s===subjCanon);
    let strategy = "exact";
    if(!best){
      let top = { s:null, score:-1 };
      for (const s of availableSubs){
        const sc = sim(subjCanon, s);
        if (sc > top.score) top = { s, score: sc };
      }
      if (top.score >= 0.6) { best = top.s; strategy = "fuzzy"; }
      // try alias fuzzy
      if(!best){
        for (const [alias, canon] of SUBJECT_ALIASES.entries()){
          if (sim(subjCanon, alias) >= 0.7 && availableSubs.includes(canon)){
            best = canon; strategy = "alias-fuzzy"; break;
          }
        }
      }
    }
    if(!best){
      return json(200,{ standards:[], resolvedSubject:null, resolvedGrade:gradeNorm, strategy:"no-subject-match", suggestions:{subjects:availableSubs} });
    }

    const subjectGrades = gradesFor(best);
    const keyOf = (g)=>`${best}|${g}`;
    let chosenGrade = null;
    let result = [];

    if (gradeNorm && subjectGrades.includes(gradeNorm)) {
      chosenGrade = gradeNorm; result = catalog[keyOf(chosenGrade)];
      strategy += "+exact-grade";
    } else if (gradeNorm) {
      const n = parseInt(gradeNorm,10);
      if(!Number.isNaN(n)){
        for(const g of [String(n), String(n-1), String(n+1)]){
          if(subjectGrades.includes(g)){ chosenGrade=g; result=catalog[keyOf(g)]; strategy+="+adjacent"; break; }
        }
      }
      if(!result || !result.length){
        if(subjectGrades.length){ chosenGrade=subjectGrades[0]; result=catalog[keyOf(chosenGrade)]; strategy+="+fallback-first-grade"; }
      }
    } else {
      strategy += "+no-grade-combined";
      const combined = []; for(const g of subjectGrades) combined.push(...(catalog[keyOf(g)]||[]));
      result = combined.slice(0, 100);
    }

    return json(200, {
      standards: result || [],
      resolvedSubject: best,
      resolvedGrade: chosenGrade || gradeNorm || null,
      strategy,
      suggestions: { subjects: availableSubs, grades: subjectGrades }
    });
  }catch(e){
    const status = e.statusCode || 500;
    return json(status, { error: e.message || String(e) });
  }
};
