/* Synapse App — Auth-gated, user-scoped Firestore, standards picker, and Gemini assignments. */

import {
  initFirebase, auth, db, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut,
  collection, doc, setDoc, getDoc, getDocs, addDoc, query, where, orderBy, serverTimestamp
} from "./utils/firebase.js";

const views = document.getElementById('views');
const authGate = document.getElementById('authGate');
const welcomeMsg = document.getElementById('welcomeMsg');

// ------------------ STATE ------------------
const state = {
  user: null,
  roster: [],
  periods: new Set(),
  standards: [],
  selectedStandard: null
};

// helpers
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
const byId = id => document.getElementById(id);
const toast = (m)=>console.log('[Synapse]', m);

function greet() {
  if (!state.user) return '';
  const h = new Date().getHours();
  const part = h < 4 ? 'Evening' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  const name = state.user.displayName || 'Teacher';
  welcomeMsg.textContent = `Good ${part}, ${name}`;
}

// ------------------ AUTH -------------------
async function requireAuth() {
  await initFirebase();
  onAuthStateChanged(auth, async (user) => {
    state.user = user || null;
    if (!state.user) {
      authGate.style.display = 'grid';
      document.body.classList.add('locked');
    } else {
      document.body.classList.remove('locked');
      authGate.style.display = 'none';
      greet();
      await loadUserData();
    }
  });
}

async function handleGoogleSignin() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) { toast(e.message || 'Sign-in failed'); }
}
async function handleSignOut(){
  try { await signOut(auth); } catch (e) { toast(e.message || 'Sign-out failed'); }
}

// ------------------ DATA LAYOUT ------------------
// users/{uid}/students/{key}, tracker/{key}, groups/{period}, assignments/{id}
function stuKey(s){ return `${s.id||'NA'}__${s.period||'NA'}__${s.quarter||'NA'}`; }

// ------------------ EVENT DELEGATION ------------
document.addEventListener('click', async (e) => {
  const t = e.target;

  const tabBtn = t.closest('[data-tab]');
  if (tabBtn) {
    e.preventDefault();
    const tab = tabBtn.dataset.tab;
    $$('.tab').forEach(b => b.classList.toggle('is-active', b===tabBtn));
    $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view===tab));
    return;
  }

  const actBtn = t.closest('[data-action]');
  if (actBtn) {
    e.preventDefault();
    const action = actBtn.dataset.action;
    switch(action){
      case 'google-signin': return handleGoogleSignin();
      case 'sign-out': return handleSignOut();
      case 'open-profile': return activate('settings');
      case 'goto-roster': return activate('roster');
      case 'goto-assignments': return activate('assignments');
      case 'upload-roster': return handleUploadRoster();
      case 'save-tracker': return handleSaveTracker();
      case 'clear-tracker': return handleClearTracker();
      case 'print-view': return window.print();
      case 'regen-groups': return handleRegenerateGroups();
      case 'load-standards': return loadStandards();
      case 'generate-assignment': return handleGenerateAssignment();
      case 'export-csv': return exportCSV();
      case 'clear-data': return clearUserData();
      case 'save-profile': return saveProfile();
      default: return;
    }
  }
});

// choose-standard
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-action="choose-standard"]');
  if (!btn) return;
  e.preventDefault();
  const code = decodeURIComponent(btn.dataset.code);
  const item = state.standards.find(s => s.code===code);
  state.selectedStandard = item || null;
  toast(`Selected ${code}`);
});

function activate(view){
  $$('.tab').forEach(btn => btn.classList.toggle('is-active', btn.dataset.tab===view));
  $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view===view));
}

// ------------------ ROSTER ----------------------
async function handleUploadRoster(){
  if (!state.user) { toast('Sign in first'); return; }
  const file = byId('rosterFile').files[0];
  const quarter = byId('rosterQuarter').value;
  const period = byId('rosterPeriod').value;
  if (!file) { toast('Choose a file first'); return; }

  const text = await file.text().catch(()=>null);
  if (!text) { toast('Unable to read file'); return; }

  const rows = text.split(/\r?\n/).filter(Boolean).map(r => r.split(/,|\t|;/));
  const header = rows[0].map(c => c.trim().toLowerCase());
  const nameIdx = header.findIndex(h => /name/i.test(h)) >= 0 ? header.findIndex(h => /name/i.test(h)) : 0;
  const idIdx   = header.findIndex(h => /(student.*id|id)/i.test(h)) >= 0 ? header.findIndex(h => /(student.*id|id)/i.test(h)) : 1;
  const testIdx = header.findIndex(h => /test/i.test(h));
  const scoreIdx= header.findIndex(h => /score|points/i.test(h));

  const out = [];
  for (let i=1;i<rows.length;i++){
    const r = rows[i]; if (!r || !r.length) continue;
    out.push({
      name: (r[nameIdx]||'').trim() || 'N/A',
      id: (r[idIdx]||'').trim() || 'N/A',
      quarter, period,
      test: testIdx>=0 ? (r[testIdx]||'N/A').trim() : 'N/A',
      score: scoreIdx>=0 ? (r[scoreIdx]||'').trim() : 'N/A',
      prof: 'N/A'
    });
  }
  state.roster = out;
  state.periods.add(period);
  renderRoster();
  hydratePeriodSelectors();
  byId('rosterSummary').innerHTML = `${out.length} students imported into <b>${quarter}</b>, <b>${period}</b>.`;
  byId('kpi-students').textContent = out.length;
  byId('kpi-periods').textContent = state.periods.size;

  const uid = state.user.uid;
  for (const s of out) {
    const key = stuKey(s);
    await setDoc(doc(db, `users/${uid}/students/${key}`), { ...s, ts: serverTimestamp() }, { merge: true });
  }
  toast('Roster saved to your account');
}

function renderRoster(){
  const tb = byId('rosterTable').querySelector('tbody');
  tb.innerHTML = state.roster.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${s.id}</td>
      <td>${s.quarter}</td>
      <td>${s.period}</td>
      <td class="hide-on-mobile">${s.test}</td>
      <td class="hide-on-mobile">${s.score}</td>
      <td><span class="pill na">${s.prof||'N/A'}</span></td>
    </tr>
  `).join('');
}
function hydratePeriodSelectors(){
  const opts = Array.from(state.periods).sort().map(p => `<option>${p}</option>`).join('');
  ['trkPeriod','grpPeriod'].forEach(id => { const el = byId(id); if (el) el.innerHTML = opts; });
}

// ------------------ LOAD user data -------------------------------
async function loadUserData(){
  const uid = state.user.uid;
  const snap = await getDocs(collection(db, `users/${uid}/students`));
  state.roster = []; state.periods = new Set();
  snap.forEach(d => {
    const s = d.data();
    state.roster.push(s);
    if (s.period) state.periods.add(s.period);
  });
  renderRoster();
  hydratePeriodSelectors();
  byId('kpi-students').textContent = state.roster.length;
  byId('kpi-periods').textContent = state.periods.size;
}

// ------------------ TRACKER --------------------------------------
async function handleSaveTracker(){
  if (!state.user) return;
  const uid = state.user.uid;
  for (const s of state.roster) {
    const key = stuKey(s);
    await setDoc(doc(db, `users/${uid}/tracker/${key}`), { status: 'IP', notes: '', ts: serverTimestamp() }, { merge: true });
  }
  toast('Tracker saved');
}
function handleClearTracker(){
  byId('trackerTable').querySelector('tbody').innerHTML = '';
  toast('Tracker cleared (view only).');
}

// ------------------ GROUPS ---------------------------------------
async function handleRegenerateGroups(){
  if (!state.user) { toast('Sign in first'); return; }
  const size = parseInt(byId('grpSize').value, 10) || 4;
  const period = byId('grpPeriod').value;
  const students = state.roster.filter(s => s.period===period).map(s => s.name);
  const cols = Math.ceil(students.length / size);
  const grid = byId('groupsGrid');
  grid.innerHTML = '';
  const groups = [];
  for (let c=0;c<cols;c++){
    const chunk = students.slice(c*size, c*size + size);
    groups.push(chunk);
    grid.insertAdjacentHTML('beforeend', `
      <div class="card pad reveal">
        <h3>Group ${c+1}</h3>
        <ul class="stack-xs">${chunk.map(n => `<li>${n}</li>`).join('')}</ul>
      </div>
    `);
  }
  const uid = state.user.uid;
  await setDoc(doc(db, `users/${uid}/groups/${period}`), { period, groups, ts: serverTimestamp() }, { merge: true });
  toast('Groups regenerated & saved');
}

// ------------------ STANDARDS picker ------------------------------
const SUBJECT_MAP = {
  "Math": ["6","7","8"],
  "ELA": ["6","7","8"],
  "Civics": ["7"],
  "U.S. History": ["6"]
};
function guessStandardsPath(subject, grade){
  const s = subject.toLowerCase();
  if (s.includes('civics') && grade==='7') return `/standards/civics.7.json`;
  if (s.includes('u.s.') && grade==='6') return `/standards/us_history.6.json`;
  if (s.includes('math') && grade==='7') return `/standards/math.7.json`;
  if (s.includes('math') && grade==='8') return `/standards/math.8.json`;
  if (s.includes('ela') && grade==='6') return `/standards/ela.6.json`;
  if (s.includes('ela') && grade==='7') return `/standards/ela.7.json`;
  if (s.includes('ela') && grade==='8') return `/standards/ela.8.json`;
  return null;
}
async function initStandardsUI(){
  const subSel = byId('stdSubject');
  const grdSel = byId('stdGrade');
  subSel.innerHTML = Object.keys(SUBJECT_MAP).map(s => `<option>${s}</option>`).join('');
  grdSel.innerHTML = SUBJECT_MAP[subSel.value].map(g => `<option>${g}</option>`).join('');
  subSel.addEventListener('change', ()=> {
    grdSel.innerHTML = SUBJECT_MAP[subSel.value].map(g => `<option>${g}</option>`).join('');
  });
  byId('stdSearch').addEventListener('input', renderStandards);
}
async function loadStandards(){
  const subject = byId('stdSubject').value;
  const grade = byId('stdGrade').value;
  const path = guessStandardsPath(subject, grade);
  if (!path) { byId('stdList').innerHTML = `<li>Not available.</li>`; return; }
  try{
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : (Array.isArray(data.standards) ? data.standards : []);
    state.standards = items.map(s => ({ code: s.code || s.id || 'N/A', title: s.title || s.name || 'N/A' }));
    renderStandards();
  }catch(e){
    byId('stdList').innerHTML = `<li>Failed to load: ${path}</li>`;
  }
}
function renderStandards(){
  const q = byId('stdSearch').value.trim().toLowerCase();
  const list = q ? state.standards.filter(s =>
    s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
  ) : state.standards;
  byId('stdList').innerHTML = list.map(s => `
    <li>
      <span class="code">${s.code}</span>
      <span class="title"> — ${s.title}</span>
      <button class="btn" data-action="choose-standard" data-code="${encodeURIComponent(s.code)}">Select</button>
    </li>
  `).join('');
}

// ------------------ Assignments (Gemini) --------------------------
async function handleGenerateAssignment(){
  if (!state.user){ toast('Sign in first'); return; }
  const standard = state.selectedStandard;
  if (!standard){ toast('Pick a standard first'); return; }
  const subject = byId('stdSubject').value;
  const grade = byId('stdGrade').value;
  const level = byId('asnLevel').value;
  const duration = byId('asnDuration').value;

  const res = await fetch('/.netlify/functions/gemini', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      task: 'lesson', subject, grade,
      standard, hints: { level, duration, tone: 'supportive, teacher-friendly' }
    })
  });
  const data = await res.json().catch(()=>({ error:'Bad response' }));
  if (data.error){ toast(data.error); return; }

  const html = mdToHtml(data.text || '');
  byId('asnOut').innerHTML = html;

  // save assignment
  const uid = state.user.uid;
  await addDoc(collection(db, `users/${uid}/assignments`), {
    subject, grade, standard, level, duration, text: data.text || '', ts: serverTimestamp()
  });
  toast('Assignment saved');
}

// tiny Markdown → HTML
function mdToHtml(md){
  return md
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^\s*[-*] (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)(\s*(<li>.*<\/li>))+?/gms, m => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>');
}

// ------------------ Utilities ------------------------------------
function exportCSV(){
  const rows = [['Name','ID','Quarter','Period','Test','Score','Proficiency']]
    .concat(state.roster.map(s => [s.name,s.id,s.quarter,s.period,s.test,s.score,s.prof]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'roster.csv';
  a.click();
}
function clearUserData(){
  state.roster = []; state.periods = new Set();
  renderRoster(); hydratePeriodSelectors();
  byId('kpi-students').textContent = '0';
  byId('kpi-periods').textContent = '0';
  toast('Local view cleared. (Remote deletion can be added with confirmation.)');
}
function saveProfile(){ toast('Profile saved (wire to Firestore doc if desired).'); }

// ------------------ Init -----------------------------------------
function initUIReveal(){
  const io = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting && e.target.classList.add('reveal'));
  }, { threshold: 0.12 });
  $$('.card, .kpi, .table-wrap').forEach(el => io.observe(el));
}
function initStandards(){ initStandardsUI(); }

async function init(){
  initUIReveal();
  initStandards();
  await requireAuth();
}
init();
