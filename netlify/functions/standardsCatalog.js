// /netlify/functions/standardsCatalog.js
// Curated Florida standards (codes + titles + clarifications + objectives + source).
// Expand as needed; structured to be easy to maintain.

const SOURCES = {
  CPALMS: "https://www.cpalms.org/",
  FLDOE: "https://www.fldoe.org/"
};

const db = {
  // --- Civics (7th) example entries ---
  "Civics|7": [
    {
      code: "SS.7.CG.1.6",
      title: "Evaluate the rights and liberties protected by the U.S. Constitution and Bill of Rights.",
      clarifications: [
        "Students will identify specific rights from Amendments 1–10.",
        "Students will analyze limitations and responsibilities tied to each right."
      ],
      objectives: [
        "Describe the purpose of the Bill of Rights.",
        "Explain how rights apply in real-world scenarios using case studies."
      ],
      source: SOURCES.CPALMS
    },
    {
      code: "SS.7.CG.2.3",
      title: "Explain the principles of rule of law, due process, and equal protection.",
      clarifications: [
        "Differentiate rule of law vs. arbitrary rule.",
        "Connect due process to protections for the accused."
      ],
      objectives: [
        "Define rule of law and due process with examples.",
        "Interpret how equal protection applies in landmark cases."
      ],
      source: SOURCES.CPALMS
    }
    // Add more Civics 7 codes here…
  ],

  // --- ELA B.E.S.T. (example for 6,7,8) ---
  "ELA|6": [
    { code: "ELA.6.R.1.1", title: "Analyze how setting, events, conflict shape plot.", clarifications: [], objectives: [], source: SOURCES.CPALMS },
    { code: "ELA.6.R.2.1", title: "Explain how text features and structures contribute to meaning.", clarifications: [], objectives: [], source: SOURCES.CPALMS }
  ],
  "ELA|7": [
    { code: "ELA.7.R.1.1", title: "Analyze impact of setting, events, conflict on plot.", clarifications: [], objectives: [], source: SOURCES.CPALMS },
    { code: "ELA.7.R.2.1", title: "Explain how ideas interact and develop in a text.", clarifications: [], objectives: [], source: SOURCES.CPALMS }
  ],
  "ELA|8": [
    { code: "ELA.8.R.1.1", title: "Analyze how setting, events, conflict contribute to a theme and central idea.", clarifications: [], objectives: [], source: SOURCES.CPALMS }
  ],

  // --- Math B.E.S.T. (examples) ---
  "Math|6": [
    { code: "MA.6.NSO.1.1", title: "Read and write decimals to thousandths.", clarifications: [], objectives: [], source: SOURCES.CPALMS }
  ],
  "Math|7": [
    { code: "MA.7.AR.1.1", title: "Write and solve one-step equations.", clarifications: [], objectives: [], source: SOURCES.CPALMS }
  ],
  "Math|8": [
    { code: "MA.8.AR.1.1", title: "Solve linear equations in one variable.", clarifications: [], objectives: [], source: SOURCES.CPALMS }
  ],

  // --- Science / Biology (examples) ---
  "Science|6": [
    { code: "SC.6.N.1.1", title: "Define problems & use scientific methods.", clarifications: [], objectives: [], source: SOURCES.FLDOE }
  ],
  "Science|7": [
    { code: "SC.7.L.16.1", title: "Understand heredity and genetics.", clarifications: [], objectives: [], source: SOURCES.FLDOE }
  ],
  "Science|8": [
    { code: "SC.8.P.8.4", title: "Classify and compare matter; physical/chemical changes.", clarifications: [], objectives: [], source: SOURCES.FLDOE }
  ],
  "Biology|8": [
    { code: "SC.912.L.16.14", title: "Mendelian genetics and inheritance patterns.", clarifications: [], objectives: [], source: SOURCES.FLDOE }
  ]
};

function lookup(subject, grade){
  // Civics only meaningful in 7th; other combos may return []
  if(subject==='Civics' && grade!=='7') return [];
  return (db[`${subject}|${grade}`] || []).map(s=>({
    code: s.code, title: s.title,
    clarifications: s.clarifications || [],
    objectives: s.objectives || [],
    source: s.source
  }));
}

module.exports = { lookup };
