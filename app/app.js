import {
  initializeFirebase, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut,
  db, doc, getDoc, setDoc, collection, getDocs, serverTimestamp, getAuth
} from './firebase.js';

// ---- State ----
const state = {
  user: null,
  students: [],
  activeTab: 'dashboard',
  standardsManifest: null,
  standards: [],
  selectedStandard: null,
};

// ---- DOM ----
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const dom = {
  authGate: $('#auth-gate'),
  appContainer: $('#app-container'),
  views: $$('.view'),
  navItems: $$('.nav-item'),
  viewTitle: $('#view-title'),
  welcomeMessage: $('#welcome-message'),
  userAvatar: $('#user-avatar'),
  userDisplayName: $('#user-display-name'),
  toaster: $('#toaster'),
};

// ---- Utils ----
const showToast = (msg, ms = 3000) => {
  dom.toaster.textContent = msg;
  dom.toaster.classList.add('show');
  setTimeout(() => dom.toaster.classList.remove('show'), ms);
};

const renderMarkdown = (md) => {
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\s*\n\*/gm, '<ul>\n*')
    .replace(/^(\*.+)\s*\n([^\*])/gm, '$1\n</ul>\n\n$2')
    .replace(/^\* (.*$)/gim, '<li>$1</li>');
  return html.trim();
};

// ---- Views ----
const renderView = (tabId) => {
  state.activeTab = tabId;
  dom.views.forEach(v => v.hidden = v.id !== `view-${tabId}`);
  dom.navItems.forEach(n => n.classList.toggle('active', n.dataset.tab === tabId));
  dom.viewTitle.textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1);

  switch (tabId) {
    case 'dashboard': renderDashboard(); break;
    case 'roster': renderRoster(); break;
    case 'groups': renderGroupsView(); break;
    case 'assignments': renderAssignments(); break;
  }
};

const renderDashboard = async () => {
  const el = $('#view-dashboard');
  if (!state.user) return;
  await fetchStudents();
  const periods = new Set(state.students.map(s => s.period)).size;
  const avgMastery = "N/A";

  el.innerHTML = `
    <div class="card kpi-card">
      <div class="kpi-value">${state.students.length}</div>
      <div class="kpi-label">Students</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-value">${periods}</div>
      <div class="kpi-label">Periods</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-value">${avgMastery}</div>
      <div class="kpi-label">Avg. Mastery</div>
    </div>
    <div class="card actions-card">
      <button class="btn" data-action="nav-roster">Upload Roster</button>
      <button class="btn" data-action="nav-assignments">Create Assignment</button>
    </div>
  `;
};

const renderRoster = () => {
  const container = $('#roster-table-container');
  if (state.students.length === 0) {
    container.innerHTML = `<p class="status-text">No students found. Import a roster to get started.</p>`;
    return;
  }
  container.innerHTML = `
    <table>
      <thead>
        <tr><th>Name</th><th>ID</th><th>Quarter</th><th>Period</th><th>Test</th><th>Score</th></tr>
      </thead>
      <tbody>
        ${state.students.map(s => `
          <tr>
            <td>${s.name}</td>
            <td>${s.id}</td>
            <td>${s.quarter}</td>
            <td>${s.period}</td>
            <td>${s.test || 'N/A'}</td>
            <td>${s.score || 'N/A'}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
};

const renderGroupsView = async () => {
  await fetchStudents();
  const periodSelect = $('#groups-period');
  const periods = [...new Set(state.students.map(s => s.period))];
  periodSelect.innerHTML = periods.map(p => `<option>${p}</option>`).join('') || `<option disabled>No periods</option>`;
};

const renderAssignments = async () => {
  if (!state.standardsManifest) {
    const res = await fetch('/standards/manifest.json');
    state.standardsManifest = await res.json();
  }
  const subjectSelect = $('#standards-subject');
  subjectSelect.innerHTML =
    `<option selected disabled>Select Subject...</option>` +
    Object.keys(state.standardsManifest).map(s => `<option>${s}</option>`).join('');
};

// ---- Data (Firestore) ----
const fetchStudents = async () => {
  if (!state.user) return;
  const colRef = collection(db, 'users', state.user.uid, 'students');
  const snap = await getDocs(colRef);
  state.students = snap.docs.map(d => d.data());
};

const handleRosterUpload = async (file, quarter, period) => {
  const text = await file.text();
  const rows = text.split('\n').filter(r => r.trim() !== '');
  const headers = rows.shift().toLowerCase().split(/[,	]/).map(h => h.trim().replace(/"/g, ''));

  const nameIndex  = headers.findIndex(h => h.includes('name'));
  const idIndex    = headers.findIndex(h => h.includes('id'));
  const testIndex  = headers.findIndex(h => h.includes('test'));
  const scoreIndex = headers.findIndex(h => h.includes('score'));

  const studentsToUpload = rows.map(row => {
    const values = row.split(/[,	]/).map(v => v.trim().replace(/"/g, ''));
    return {
      name:  values[nameIndex !== -1 ? nameIndex : 0] || 'N/A',
      id:    values[idIndex   !== -1 ? idIndex   : 1] || 'N/A',
      test:  values[testIndex]  || 'N/A',
      score: values[scoreIndex] || 'N/A',
      quarter, period,
    };
  });

  const status = $('#roster-upload-status');
  status.textContent = `Found ${studentsToUpload.length} students. Importing...`;

  for (const student of studentsToUpload) {
    const docId = `${student.id}__${student.period}__${student.quarter}`;
    await setDoc(doc(db, 'users', state.user.uid, 'students', docId), { ...student, ts: serverTimestamp() });
  }
  status.textContent = `Successfully imported ${studentsToUpload.length} students.`;
  await fetchStudents();
  renderRoster();
};

// ---- Events ----
const handleAuth = (user) => {
  if (user) {
    state.user = user;
    dom.authGate.hidden = true;
    $('#app-container').hidden = false;
    dom.welcomeMessage.textContent = `Good Day, ${user.displayName?.split(' ')[0] ?? 'Teacher'}!`;
    dom.userAvatar.src = user.photoURL || '';
    dom.userDisplayName.textContent = user.displayName || '';
    renderView('dashboard');
  } else {
    state.user = null;
    dom.authGate.hidden = false;
    $('#app-container').hidden = true;
  }
};

const handleNavClick = (e) => {
  const target = e.target.closest('[data-tab]');
  if (!target) return;
  e.preventDefault();
  renderView(target.dataset.tab);
};

const handleActionClick = async (e) => {
  const t = e.target.closest('[data-action]');
  if (!t) return;

  switch (t.dataset.action) {
    case 'google-signin': {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(getAuth(), provider);
      } catch (err) { showToast(`Sign in failed: ${err.message}`); }
      break;
    }
    case 'sign-out':
      signOut(getAuth()); break;
    case 'nav-roster':
      renderView('roster'); break;
    case 'nav-assignments':
      renderView('assignments'); break;
    case 'save-roster': {
      const f = $('#roster-file-input');
      const q = $('#roster-quarter').value;
      const p = $('#roster-period').value;
      if (f.files.length) handleRosterUpload(f.files[0], q, p);
      else showToast('Please select a file first.');
      break;
    }
    case 'generate-groups':
      generateAndRenderGroups(); break;
    case 'generate-assignment':
      generateAssignment(); break;
  }
};

const handleStandardsChange = async (e) => {
  const subjectSelect = $('#standards-subject');
  const gradeSelect = $('#standards-grade');
  const searchInput = $('#standards-search');

  if (e.target.id === 'standards-subject') {
    const grades = Object.keys(state.standardsManifest[subjectSelect.value]);
    gradeSelect.innerHTML = `<option selected disabled>Select Grade...</option>` + grades.map(g => `<option>${g}</option>`).join('');
    gradeSelect.disabled = false;
  }

  if (e.target.id === 'standards-grade') {
    const file = state.standardsManifest[subjectSelect.value][gradeSelect.value];
    const res = await fetch(`/standards/${file}`);
    state.standards = (await res.json()).standards || [];
    renderStandardsList(state.standards);
    searchInput.disabled = false;
  }
};

const renderStandardsList = (standards) => {
  const listEl = $('#standards-list');
  listEl.innerHTML = standards.map(s => `
    <div class="standard-item" data-code="${s.code}">
      <strong>${s.code}</strong>
      <span>${s.title || s.name}</span>
    </div>`).join('');
};

const generateAndRenderGroups = () => {
  const period = $('#groups-period').value;
  const strategy = $('#groups-strategy').value;
  const size = parseInt($('#groups-size').value);
  const container = $('#groups-container');

  let students = state.students.filter(s => s.period === period);
  if (!students.length) { showToast(`No students found for ${period}.`); return; }

  students.sort((a,b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0));

  const numGroups = Math.ceil(students.length / size);
  const groups = Array.from({length: numGroups}, () => []);

  if (strategy === 'heterodox') {
    students.forEach((st, i) => groups[i % numGroups].push(st.name));
  } else {
    let g = 0;
    students.forEach(st => {
      if (groups[g].length >= size) g++;
      groups[g]?.push(st.name);
    });
  }

  container.innerHTML = groups.map((g, i) => `
    <div class="card group-card">
      <h3>Group ${i + 1}</h3>
      <ul class="group-members">${g.map(n => `<li>${n}</li>`).join('')}</ul>
    </div>`).join('');
};

const generateAssignment = async () => {
  if (!state.selectedStandard) { showToast('Please select a standard first.'); return; }
  const btn = $('#generate-assignment-btn');
  btn.disabled = true; btn.textContent = 'Generating...';

  const payload = {
    task: "lesson",
    subject: $('#standards-subject').value,
    grade: $('#standards-grade').value,
    standard: {
      code: state.selectedStandard.code,
      title: state.selectedStandard.title || state.selectedStandard.name,
      clarification: state.selectedStandard.internal?.clarifications?.[0] || "",
      objectives: state.selectedStandard.internal?.objectives || []
    },
    hints: {
      level: $('#assignment-level').value,
      duration: $('#assignment-duration').value,
    }
  };

  try {
    const res = await fetch('/.netlify/functions/gemini', { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`Server error: ${res.statusText}`);
    const result = await res.json();
    const out = $('#assignment-output');
    out.innerHTML = `<h2>${result.title}</h2>` + renderMarkdown(result.text);
    out.hidden = false;
  } catch (err) {
    console.error(err);
    showToast('Failed to generate assignment. Please try again.');
  } finally {
    btn.disabled = false; btn.textContent = 'Generate';
  }
};

// ---- Init ----
const init = async () => {
  try {
    const { auth } = await initializeFirebase();
    onAuthStateChanged(auth, handleAuth);

    document.addEventListener('click', handleActionClick);
    const navMenu = $('.nav-menu');
    if (navMenu) navMenu.addEventListener('click', handleNavClick);

    const assignmentView = $('#view-assignments');
    assignmentView.addEventListener('change', handleStandardsChange);
    assignmentView.addEventListener('input', e => {
      if (e.target.id === 'standards-search') {
        const q = e.target.value.toLowerCase();
        const filtered = state.standards.filter(s =>
          s.code.toLowerCase().includes(q) ||
          (s.title || s.name || '').toLowerCase().includes(q)
        );
        renderStandardsList(filtered);
      }
    });
    assignmentView.addEventListener('click', e => {
      const item = e.target.closest('.standard-item');
      if (item) {
        $$('.standard-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        state.selectedStandard = state.standards.find(s => s.code === item.dataset.code);
        $('#generate-assignment-btn').disabled = false;
      }
    });

  } catch (error) {
    console.error("Initialization failed:", error);
    const s = $('#auth-status');
    if (s) s.textContent = 'Error: Could not connect to services.';
  }
};

// ---- Global error overlays ----
window.addEventListener('error', (event) => {
  $('#crash-overlay').hidden = false;
  $('#error-details').textContent = event.message;
});
window.addEventListener('unhandledrejection', (event) => {
  $('#crash-overlay').hidden = false;
  $('#error-details').textContent = event.reason?.stack || event.reason;
});

init();
