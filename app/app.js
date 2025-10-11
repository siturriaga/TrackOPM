import { initializeFirebase, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, db, doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from './utils/firebase.js';

// --- State Management ---
const state = {
    user: null,
    students: [],
    activeTab: 'dashboard',
    standardsManifest: null,
    standards: [],
    selectedStandard: null,
};

// --- DOM Elements ---
const dom = {
    authGate: document.getElementById('auth-gate'),
    appContainer: document.getElementById('app-container'),
    mainContent: document.getElementById('app-main'),
    views: document.querySelectorAll('.view'),
    navItems: document.querySelectorAll('.nav-item'),
    viewTitle: document.getElementById('view-title'),
    welcomeMessage: document.getElementById('welcome-message'),
    userAvatar: document.getElementById('user-avatar'),
    userDisplayName: document.getElementById('user-display-name'),
    toaster: document.getElementById('toaster'),
};

// --- Utility Functions ---
const showToast = (message, duration = 3000) => {
    dom.toaster.textContent = message;
    dom.toaster.classList.add('show');
    setTimeout(() => dom.toaster.classList.remove('show'), duration);
};

const renderMarkdown = (markdown) => {
    let html = markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/^\s*\n\*/gm, '<ul>\n*')
        .replace(/^(\*.+)\s*\n([^\*])/gm, '$1\n</ul>\n\n$2')
        .replace(/^\* (.*$)/gim, '<li>$1</li>');
    return html.trim();
};

// --- Rendering Functions ---
const renderView = (tabId) => {
    state.activeTab = tabId;
    dom.views.forEach(v => v.hidden = v.id !== `view-${tabId}`);
    dom.navItems.forEach(n => n.classList.toggle('active', n.dataset.tab === tabId));
    const title = tabId.charAt(0).toUpperCase() + tabId.slice(1);
    dom.viewTitle.textContent = title;

    // Trigger view-specific render logic
    switch (tabId) {
        case 'dashboard': renderDashboard(); break;
        case 'roster': renderRoster(); break;
        case 'groups': renderGroupsView(); break;
        case 'assignments': renderAssignments(); break;
    }
};

const renderDashboard = async () => {
    const dashboardView = document.getElementById('view-dashboard');
    if (!state.user) return;
    
    await fetchStudents();
    const periods = new Set(state.students.map(s => s.period)).size;
    const avgMastery = "N/A"; // Placeholder for future calculation

    dashboardView.innerHTML = `
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
    const container = document.getElementById('roster-table-container');
    if (state.students.length === 0) {
        container.innerHTML = `<p class="status-text">No students found. Import a roster to get started.</p>`;
        return;
    }
    const table = `
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
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    container.innerHTML = table;
};

const renderGroupsView = async () => {
    await fetchStudents();
    const periodSelect = document.getElementById('groups-period');
    const periods = [...new Set(state.students.map(s => s.period))];
    periodSelect.innerHTML = periods.map(p => `<option>${p}</option>`).join('');
};


const renderAssignments = async () => {
    if (!state.standardsManifest) {
        const response = await fetch('/standards/manifest.json');
        state.standardsManifest = await response.json();
    }
    const subjectSelect = document.getElementById('standards-subject');
    subjectSelect.innerHTML = `<option selected disabled>Select Subject...</option>` + 
        Object.keys(state.standardsManifest).map(s => `<option>${s}</option>`).join('');
};

// --- Firebase & Data Logic ---
const fetchStudents = async () => {
    if (!state.user) return;
    const studentsCol = collection(db, 'users', state.user.uid, 'students');
    const snapshot = await getDocs(studentsCol);
    state.students = snapshot.docs.map(doc => doc.data());
};

const handleRosterUpload = async (file, quarter, period) => {
    const text = await file.text();
    const rows = text.split('\n').filter(row => row.trim() !== '');
    const headers = rows.shift().toLowerCase().split(/[,	]/).map(h => h.trim().replace(/"/g, ''));

    const nameIndex = headers.findIndex(h => h.includes('name'));
    const idIndex = headers.findIndex(h => h.includes('id'));
    const testIndex = headers.findIndex(h => h.includes('test'));
    const scoreIndex = headers.findIndex(h => h.includes('score'));

    const studentsToUpload = rows.map(row => {
        const values = row.split(/[,	]/).map(v => v.trim().replace(/"/g, ''));
        const student = {
            name: values[nameIndex !== -1 ? nameIndex : 0] || 'N/A',
            id: values[idIndex !== -1 ? idIndex : 1] || 'N/A',
            test: values[testIndex] || 'N/A',
            score: values[scoreIndex] || 'N/A',
            quarter,
            period,
        };
        return student;
    });

    const uploadStatus = document.getElementById('roster-upload-status');
    uploadStatus.textContent = `Found ${studentsToUpload.length} students. Importing...`;

    for (const student of studentsToUpload) {
        const docId = `${student.id}__${student.period}__${student.quarter}`;
        const studentRef = doc(db, 'users', state.user.uid, 'students', docId);
        await setDoc(studentRef, { ...student, ts: serverTimestamp() });
    }
    
    uploadStatus.textContent = `Successfully imported ${studentsToUpload.length} students.`;
    await fetchStudents();
    renderRoster();
};


// --- Event Handlers ---
const handleAuth = (user) => {
    if (user) {
        state.user = user;
        dom.authGate.hidden = true;
        dom.appContainer.hidden = false;
        dom.welcomeMessage.textContent = `Good Day, ${user.displayName.split(' ')[0]}!`;
        dom.userAvatar.src = user.photoURL;
        dom.userDisplayName.textContent = user.displayName;
        renderView('dashboard');
    } else {
        state.user = null;
        dom.authGate.hidden = false;
        dom.appContainer.hidden = true;
    }
};

const handleNavClick = (e) => {
    const target = e.target.closest('[data-tab]');
    if (!target) return;
    e.preventDefault();
    renderView(target.dataset.tab);
};

const handleActionClick = async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    switch (target.dataset.action) {
        case 'google-signin':
            const provider = new GoogleAuthProvider();
            signInWithPopup(getAuth(), provider).catch(err => showToast(`Sign in failed: ${err.message}`));
            break;
        case 'sign-out':
            signOut(getAuth());
            break;
        case 'nav-roster':
            renderView('roster');
            break;
        case 'nav-assignments':
            renderView('assignments');
            break;
        case 'upload-roster-proxy':
            document.getElementById('roster-file-input').click();
            break;
        case 'save-roster':
            const fileInput = document.getElementById('roster-file-input');
            const quarter = document.getElementById('roster-quarter').value;
            const period = document.getElementById('roster-period').value;
            if (fileInput.files.length > 0) {
                handleRosterUpload(fileInput.files[0], quarter, period);
            } else {
                showToast('Please select a file first.');
            }
            break;
        case 'generate-groups':
            generateAndRenderGroups();
            break;
        case 'generate-assignment':
            generateAssignment();
            break;
    }
};

const handleStandardsChange = async (e) => {
    const subjectSelect = document.getElementById('standards-subject');
    const gradeSelect = document.getElementById('standards-grade');
    const searchInput = document.getElementById('standards-search');
    
    if (e.target.id === 'standards-subject') {
        const grades = Object.keys(state.standardsManifest[subjectSelect.value]);
        gradeSelect.innerHTML = `<option selected disabled>Select Grade...</option>` + grades.map(g => `<option>${g}</option>`).join('');
        gradeSelect.disabled = false;
    }
    
    if (e.target.id === 'standards-grade') {
        const file = state.standardsManifest[subjectSelect.value][gradeSelect.value];
        const response = await fetch(`/standards/${file}`);
        state.standards = await response.json();
        renderStandardsList(state.standards);
        searchInput.disabled = false;
    }
};

const renderStandardsList = (standards) => {
    const listEl = document.getElementById('standards-list');
    listEl.innerHTML = standards.map(s => `
        <div class="standard-item" data-code="${s.code}">
            <strong>${s.code}</strong>
            <span>${s.title}</span>
        </div>
    `).join('');
};

const generateAndRenderGroups = () => {
    const period = document.getElementById('groups-period').value;
    const strategy = document.getElementById('groups-strategy').value;
    const size = parseInt(document.getElementById('groups-size').value);
    const container = document.getElementById('groups-container');

    let studentsInPeriod = state.students.filter(s => s.period === period);
    if(studentsInPeriod.length === 0) {
        showToast(`No students found for ${period}.`);
        return;
    }
    
    // Sort students by score (numeric, high to low). Treat N/A as 0.
    studentsInPeriod.sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0));

    let groups = [];
    const numGroups = Math.ceil(studentsInPeriod.length / size);
    for (let i = 0; i < numGroups; i++) groups.push([]);
    
    if (strategy === 'heterodox') { // Round-robin
        studentsInPeriod.forEach((student, i) => {
            groups[i % numGroups].push(student.name);
        });
    } else { // Homogeneous
        let currentGroup = 0;
        studentsInPeriod.forEach((student, i) => {
            if (groups[currentGroup].length >= size) currentGroup++;
            if(groups[currentGroup]) groups[currentGroup].push(student.name);
        });
    }
    
    container.innerHTML = groups.map((group, i) => `
        <div class="card group-card">
            <h3>Group ${i + 1}</h3>
            <ul class="group-members">
                ${group.map(name => `<li>${name}</li>`).join('')}
            </ul>
        </div>
    `).join('');
};

const generateAssignment = async () => {
    if (!state.selectedStandard) {
        showToast('Please select a standard first.');
        return;
    }
    const btn = document.getElementById('generate-assignment-btn');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    const payload = {
        task: "lesson",
        subject: document.getElementById('standards-subject').value,
        grade: document.getElementById('standards-grade').value,
        standard: state.selectedStandard,
        hints: {
            level: document.getElementById('assignment-level').value,
            duration: document.getElementById('assignment-duration').value,
        }
    };

    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

        const result = await response.json();
        const outputContainer = document.getElementById('assignment-output');
        outputContainer.innerHTML = `<h2>${result.title}</h2>` + renderMarkdown(result.text);
        outputContainer.hidden = false;

    } catch (err) {
        showToast('Failed to generate assignment. Please try again.');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generate';
    }
};

// --- Initialization ---
const init = async () => {
    try {
        const { auth } = await initializeFirebase();
        onAuthStateChanged(auth, handleAuth);

        document.addEventListener('click', handleActionClick);
        document.querySelector('.nav-menu').addEventListener('click', handleNavClick);
        
        const assignmentView = document.getElementById('view-assignments');
        assignmentView.addEventListener('change', handleStandardsChange);
        assignmentView.addEventListener('input', e => {
            if (e.target.id === 'standards-search') {
                const query = e.target.value.toLowerCase();
                const filtered = state.standards.filter(s => s.code.toLowerCase().includes(query) || s.title.toLowerCase().includes(query));
                renderStandardsList(filtered);
            }
        });
        assignmentView.addEventListener('click', e => {
            const item = e.target.closest('.standard-item');
            if (item) {
                document.querySelectorAll('.standard-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                state.selectedStandard = state.standards.find(s => s.code === item.dataset.code);
                document.getElementById('generate-assignment-btn').disabled = false;
            }
        });

    } catch (error) {
        console.error("Initialization failed:", error);
        document.getElementById('auth-status').textContent = 'Error: Could not connect to services.';
    }
};

// --- Global Error Handling ---
window.addEventListener('error', (event) => {
    document.getElementById('crash-overlay').hidden = false;
    document.getElementById('error-details').textContent = event.message;
});
window.addEventListener('unhandledrejection', (event) => {
    document.getElementById('crash-overlay').hidden = false;
    document.getElementById('error-details').textContent = event.reason.stack || event.reason;
});

init();
