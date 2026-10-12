const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('teacherToken');
const teacher = JSON.parse(localStorage.getItem('teacherInfo') || '{}');
if (!token) window.location.href = '/pages/teacher-login.html';

const days  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const now   = new Date();
const today = now.toISOString().split('T')[0];

document.getElementById('teacherName').textContent = teacher.name       || '—';
document.getElementById('teacherEmp').textContent  = teacher.employeeId || '—';
document.getElementById('todayDate').textContent   = now.toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
document.getElementById('todayDay').textContent    = days[now.getDay()];

const assignments = teacher.assignments || [];
document.getElementById('statSubjects').textContent = assignments.length;
document.getElementById('statSections').textContent = [...new Set(assignments.flatMap(a => a.sections))].length;

// ── Load everything ──
async function loadDashboard() {
  try {
    const res  = await fetch(`${API}/students`, { headers: { Authorization: `Bearer ${token}` } });
    const all  = await res.json();

    // Only students from this teacher's sections
    const mySections = [...new Set(assignments.flatMap(a => a.sections))];
    const myStudents = all.filter(s => mySections.includes(s.section));
    document.getElementById('statStudents').textContent = myStudents.length;

    // Load attendance for all subjects
    await Promise.all([
      loadSubjectAttendance(myStudents),
      loadTodayScans(),
      loadAtRiskStudents(myStudents),
    ]);
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

// ── Today scans ──
async function loadTodayScans() {
  try {
    const counts = await Promise.all(
      assignments.flatMap(a =>
        a.sections.map(sec =>
          fetch(`${API}/attendance/session?section=${sec}&subjectId=${a.subjectId}&date=${today}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()).then(d => Array.isArray(d) ? d.length : 0).catch(() => 0)
        )
      )
    );
    document.getElementById('statScans').textContent = counts.reduce((a, b) => a + b, 0);
  } catch { document.getElementById('statScans').textContent = 0; }
}

// ── Subject attendance percentages ──
async function loadSubjectAttendance(allStudents) {
  const tbody = document.getElementById('subjectsBody');
  tbody.innerHTML = '<tr><td colspan="4" class="empty">Loading…</td></tr>';

  try {
    const rows = await Promise.all(assignments.map(async a => {
      // Get conducted count per section
      const conductedPerSection = await Promise.all(
        a.sections.map(sec =>
          fetch(`${API}/attendance/conducted?section=${sec}&subjectId=${a.subjectId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()).then(d => d.conducted || 0).catch(() => 0)
        )
      );
      const conducted = Math.max(...conductedPerSection, 0);

      // Get attendance records for this subject
      const attRecords = await Promise.all(
        a.sections.map(sec =>
          fetch(`${API}/attendance/session?section=${sec}&subjectId=${a.subjectId}&date=${today}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()).catch(() => [])
        )
      );

      // Calculate avg attendance % across all sessions
      const sectionStudents = allStudents.filter(s => a.sections.includes(s.section) && s.batch === a.batch);
      const totalStudents   = sectionStudents.length;
      const pct             = conducted > 0 && totalStudents > 0
        ? Math.round((attRecords.flat().length / (conducted * totalStudents)) * 100)
        : 0;
      const pctClass = pct >= 75 ? 'good' : pct >= 60 ? 'warn' : conducted === 0 ? '' : 'danger';

      return { a, conducted, pct, pctClass };
    }));

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty">No subjects assigned</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(({ a, conducted, pct, pctClass }) => `
      <tr>
        <td>
          <div class="sub-name">${a.subjectName}</div>
        </td>
        <td><span class="sub-batch">${a.batch || '—'}</span></td>
        <td>
          ${a.sections.map(s => `<span class="badge">${s}</span>`).join('')}
        </td>
        <td>
          <div class="conducted-wrap">
            <span class="conducted-num">${conducted} <span style="color:var(--muted);font-weight:400">/ 42</span></span>
          </div>
        </td>
        <td>
          <div class="pct-wrap">
            <span class="pct-label ${pctClass}">${conducted > 0 ? pct + '%' : '—'}</span>
            <div class="pct-bar-bg">
              <div class="pct-bar-fill ${pctClass}" style="width:${pct}%"></div>
            </div>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Failed to load</td></tr>';
  }
}

// ── At-risk students (below 75%) ──
async function loadAtRiskStudents(allStudents) {
  const container = document.getElementById('atRiskList');
  container.innerHTML = '<div class="empty">Checking attendance…</div>';

  try {
    const atRisk = [];

    await Promise.all(assignments.map(async a => {
      const sectionStudents = allStudents.filter(s =>
        a.sections.includes(s.section) && s.batch === a.batch
      );

      // Get conducted count
      const conductedRes = await fetch(`${API}/attendance/conducted?section=${a.sections[0]}&subjectId=${a.subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).catch(() => ({ conducted: 0 }));
      const conducted = conductedRes.conducted || 0;
      if (conducted === 0) return;

      await Promise.all(sectionStudents.map(async s => {
        const stats = await fetch(`${API}/attendance/stats?rollNumber=${s.rollNumber}&subjectId=${a.subjectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ attended: 0, conducted: 0 }));

        const attended = stats.attended || 0;
        const pct      = conducted > 0 ? Math.round((attended / conducted) * 100) : 0;

        if (pct < 75) {
          atRisk.push({
            name:        s.name,
            rollNumber:  s.rollNumber,
            section:     s.section,
            batch:       s.batch,
            subject:     a.subjectName,
            attended,
            conducted,
            pct
          });
        }
      }));
    }));

    document.getElementById('atRiskCount').textContent = atRisk.length;

    if (!atRisk.length) {
      container.innerHTML = '<div class="empty" style="color:#16A34A">✓ All students above 75% attendance</div>';
      return;
    }

    // Sort by pct ascending (worst first)
    atRisk.sort((a, b) => a.pct - b.pct);

    container.innerHTML = atRisk.map(s => {
      const pctClass = s.pct < 50 ? 'danger' : 'warn';
      return `
        <div class="risk-row">
          <div class="risk-avatar">${s.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
          <div class="risk-info">
            <div class="risk-name">${s.name}</div>
            <div class="risk-meta">${s.rollNumber} · ${s.section} · ${s.subject}</div>
          </div>
          <div class="risk-stats">
            <div class="risk-pct ${pctClass}">${s.pct}%</div>
            <div class="risk-detail">${s.attended}/${s.conducted} classes</div>
          </div>
          <div class="risk-bar-wrap">
            <div class="risk-bar-bg">
              <div class="risk-bar-fill ${pctClass}" style="width:${s.pct}%"></div>
            </div>
            <span class="risk-threshold">75%</span>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = '<div class="empty">Failed to load at-risk data</div>';
  }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/pages/teacher-login.html';
});

// Mobile sidebar toggle
const hamburger       = document.getElementById('hamburger');
const sidebar         = document.querySelector('.sidebar');
const sidebarOverlay  = document.getElementById('sidebarOverlay');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show');
  });
}
if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
  });
}

loadDashboard();