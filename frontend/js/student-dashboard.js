const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('studentToken');
const student = JSON.parse(localStorage.getItem('studentInfo') || '{}');
if (!token) window.location.href = '/pages/student-login.html';

// Fill sidebar
const initials = (student.name || '?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
document.getElementById('sAvatar').textContent = initials;
document.getElementById('sName').textContent   = student.name       || '—';
document.getElementById('sRoll').textContent   = student.rollNumber || '—';

// Fill header
document.getElementById('welcomeTitle').textContent = `Welcome, ${student.name?.split(' ')[0] || 'Student'}`;
document.getElementById('todayDate').textContent    = new Date().toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
document.getElementById('sectionVal').textContent   = `${student.section} · ${student.batch}`;
document.getElementById('totalSubjects').textContent = (student.enrolledSubjects || []).length;

async function loadDashboard() {
  try {
    // Load attendance
    const attRes  = await fetch(`${API}/attendance/my`, { headers: { Authorization: `Bearer ${token}` } });
    const attData = await attRes.json();

    // Load marks
const marksRes  = await fetch(`${API}/marks/my`, {
  headers: { Authorization: `Bearer ${token}` }
});
const marksData = await marksRes.json();

    renderAttendance(Array.isArray(attData) ? attData : []);
    renderMarks(marksData.marks || []);
    renderStats(attData, marksData);
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

function renderStats(attData, marksData) {
  // Avg attendance
  const atts = Array.isArray(attData) ? attData : [];
  const avg  = atts.length
    ? Math.round(atts.reduce((s, a) => s + (a.percentage || 0), 0) / atts.length)
    : 0;
  document.getElementById('avgAttendance').textContent = avg + '%';

  // CGPA
  document.getElementById('cgpaVal').textContent = marksData.cgpa ? marksData.cgpa.toFixed(2) : '—';

  // Warning
  const lowSubjects = atts.filter(a => a.percentage < 75);
  if (lowSubjects.length) {
    const banner = document.getElementById('warningBanner');
    banner.style.display = 'flex';
    document.getElementById('warningText').textContent =
      `⚠ You have ${lowSubjects.length} subject${lowSubjects.length > 1 ? 's' : ''} with attendance below 75% — ${lowSubjects.map(s => s.subject).join(', ')}`;
  }
}

function renderAttendance(data) {
  const el = document.getElementById('attOverview');
  if (!data.length) { el.innerHTML = '<div class="empty-state">No attendance records yet</div>'; return; }

  el.innerHTML = data.map(s => {
    const pct      = s.percentage || 0;
    const cls      = pct >= 75 ? 'ok' : pct >= 60 ? 'mid' : 'low';
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--navy)">${s.subject}</div>
          <div style="font-size:11px;color:var(--muted)">${s.present} / ${s.total} classes</div>
        </div>
        <div style="display:flex;align-items:center;gap:1rem">
          <div style="width:100px">
            <div class="att-bar-bg"><div class="att-bar-fill ${cls}" style="width:${pct}%"></div></div>
          </div>
          <div style="font-size:14px;font-weight:700;color:${pct>=75?'#16A34A':pct>=60?'#D97706':'#DC2626'};min-width:40px;text-align:right">${pct}%</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderMarks(marks) {
  const el = document.getElementById('marksSummary');
  if (!marks.length) { el.innerHTML = '<div class="empty-state">No marks entered yet</div>'; return; }

  el.innerHTML = marks.map(m => `
    <div class="marks-summary-row">
      <div>
        <div class="msub-name">${m.subjectName}</div>
        <div class="msub-code">${m.subjectCode}</div>
      </div>
      <div class="msub-right">
        <div class="msub-total">${m.total || 0}<span style="font-size:12px;color:var(--muted);font-weight:400">/100</span></div>
        <div class="msub-grade grade-${m.grade || 'F'}">${m.grade || 'F'}</div>
      </div>
    </div>
  `).join('');
}

// Mobile sidebar
const hamburger      = document.getElementById('hamburger');
const sidebar        = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
if (hamburger) { hamburger.addEventListener('click', () => { sidebar.classList.toggle('open'); sidebarOverlay.classList.toggle('show'); }); }
if (sidebarOverlay) { sidebarOverlay.addEventListener('click', () => { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); }); }

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('studentToken');
  localStorage.removeItem('studentInfo');
  window.location.href = '/pages/student-login.html';
});

loadDashboard();