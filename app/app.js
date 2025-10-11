// Synapse — Teacher-safe standards viewer (Code + Title only)
// Works with the exact chunks you have in /standards/
//   civics.7.json, ela.6.json, ela.7.json, ela.8.json, math.7.json, math.8.json, us_history.6.json

const els = {
  subject: document.getElementById('subject'),
  grade: document.getElementById('grade'),
  loadBtn: document.getElementById('loadBtn'),
  clearBtn: document.getElementById('clearBtn'),
  printBtn: document.getElementById('printBtn'),
  closeBtn: document.getElementById('closeBtn'),
  search: document.getElementById('search'),
  list: document.getElementById('standardsList'),
  loading: document.getElementById('loading'),
  empty: document.getElementById('empty'),
  error: document.getElementById('error'),
  count: document.getElementById('count'),
  status: document.getElementById('status'),
};

let manifest = null;
let current = { subject:null, grade:null, items:[] };

const fetchJSON = async (url) => {
  const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
};

const titleCase = s => (s || '').replace(/\s+/g,' ').trim();

function setBusy(b){
  els.list.setAttribute('aria-busy', b ? 'true' : 'false');
  els.loading.classList.toggle('hidden', !b);
}
function showEmpty(msg){
  els.empty.querySelector('.empty__text').innerHTML = msg || 'Choose a subject and grade, then press <strong>Load Standards</strong>.';
  els.empty.classList.remove('hidden'); els.error.classList.add('hidden');
  els.list.innerHTML = ''; els.count.textContent = '0';
}
function showError(msg){
  els.error.querySelector('.empty__text').textContent = msg || 'Unable to load.';
  els.error.classList.remove('hidden'); els.empty.classList.add('hidden');
  els.list.innerHTML = ''; els.count.textContent = '0';
}
function hidePlacards(){ els.empty.classList.add('hidden'); els.error.classList.add('hidden'); }

function highlight(text, q){
  if(!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if(i === -1) return text;
  return text.slice(0,i) + '<span class="mark">' + text.slice(i,i+q.length) + '</span>' + text.slice(i+q.length);
}
function render(items, q=''){
  els.list.innerHTML = items.map(it => `
    <li class="row">
      <span class="code">${highlight(it.code, q)}</span>
      <span class="title">${highlight(it.name, q)}</span>
    </li>
  `).join('');
  els.count.textContent = String(items.length);
}

function populateSubjects(){
  els.subject.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = ''; blank.textContent = 'Select subject…';
  els.subject.appendChild(blank);

  manifest.subjects.forEach(s => {
    const o = document.createElement('option');
    o.value = s.subject; o.textContent = s.subject;
    els.subject.appendChild(o);
  });
}
function populateGrades(subjectName){
  els.grade.innerHTML = '';
  const entry = manifest.subjects.find(s => s.subject === subjectName);
  if(!entry){ els.grade.disabled = true; return; }
  entry.grades.forEach(g => {
    const o = document.createElement('option');
    o.value = String(g); o.textContent = String(g);
    els.grade.appendChild(o);
  });
  els.grade.disabled = false;
}
function findPattern(subject){ const e = manifest.subjects.find(s => s.subject === subject); return e ? e.pathPattern : null; }

async function loadStandards(){
  const subject = els.subject.value || null;
  const grade = els.grade.value || null;
  if(!subject || !grade){ showEmpty('Pick a subject and grade, then click <strong>Load Standards</strong>.'); return; }

  const pattern = findPattern(subject);
  if(!pattern){ showError('Subject not in manifest.'); return; }
  const path = pattern.replace('{grade}', grade);

  hidePlacards(); setBusy(true); els.search.disabled = true; els.status.textContent = 'Loading…';
  try{
    const data = await fetchJSON('/' + path.replace(/^\//,''));
    const list = Array.isArray(data.standards) ? data.standards : [];
    list.sort((a,b) => a.code.localeCompare(b.code, 'en', {numeric:true}));
    current = { subject, grade, items: list.map(({code,name}) => ({code, name})) };

    if(current.items.length === 0){ showEmpty('This chunk is empty. Confirm the JSON has standards.'); }
    else { hidePlacards(); render(current.items); els.search.disabled = false; els.status.textContent = `${subject} · Grade ${grade}`; }
  }catch(err){
    console.error(err);
    showError(`Could not fetch: ${path}`);
    els.status.textContent = 'Error';
  }finally{ setBusy(false); }
}

function debounce(fn, ms=160){ let t; return (...a)=>{clearTimeout(t); t=setTimeout(()=>fn(...a),ms)}; }
function filterList(q){
  const s = titleCase(q||'');
  if(!s){ render(current.items); return; }
  const out = current.items.filter(it =>
    it.code.toLowerCase().includes(s.toLowerCase()) ||
    it.name.toLowerCase().includes(s.toLowerCase())
  );
  render(out, s);
}

function clearAll(){
  els.subject.value = '';
  els.grade.innerHTML = ''; els.grade.disabled = true;
  els.search.value = ''; els.search.disabled = true;
  els.list.innerHTML = ''; els.count.textContent = '0'; els.status.textContent = '';
  showEmpty();
}

function init(){
  showEmpty();
  fetchJSON('/standards/index.json')
    .then(data => { manifest = data; populateSubjects(); })
    .catch(err => { console.error(err); showError('Could not load /standards/index.json'); });

  els.subject.addEventListener('change', () => {
    if(!els.subject.value){ clearAll(); return; }
    populateGrades(els.subject.value);
  });
  els.loadBtn.addEventListener('click', loadStandards);
  els.search.addEventListener('input', debounce(e => filterList(e.target.value), 160));
  els.printBtn.addEventListener('click', () => window.print());
  els.clearBtn.addEventListener('click', clearAll);
  els.closeBtn.addEventListener('click', () => { window.location.href = '/'; });
}

document.addEventListener('DOMContentLoaded', init);
