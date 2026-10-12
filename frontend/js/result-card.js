const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('teacherToken');
const teacher = JSON.parse(localStorage.getItem('teacherInfo') || '{}');
if (!token) window.location.href = '/pages/teacher-login.html';

document.getElementById('teacherName').textContent = teacher.name       || '—';
document.getElementById('teacherEmp').textContent  = teacher.employeeId || '—';
document.getElementById('rcDate') && (document.getElementById('rcDate').textContent = new Date().toLocaleDateString('en-PK', { year:'numeric', month:'long', day:'numeric' }));

let allStudents = [];

// Load all students from teacher's assigned sections
async function loadAllStudents() {
  try {
    const assignments = teacher.assignments || [];
    const fetches     = [];

    for (const a of assignments) {
      for (const section of a.sections) {
        fetches.push(
          fetch(`${API}/students?section=${section}&batch=${a.batch}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()).catch(() => [])
        );
      }
    }

    const results = await Promise.all(fetches);
    const merged  = [];
    results.flat().forEach(s => {
      if (s && s.id && !merged.find(m => m.id === s.id)) merged.push(s);
    });

    allStudents = merged;
    console.log(`Result card: loaded ${allStudents.length} students`);
  } catch (err) {
    console.error('Failed to load students:', err);
  }
}

loadAllStudents();

// Search
const searchInput   = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();

  if (!q) {
    searchResults.style.display = 'none';
    searchResults.innerHTML = '';
    return;
  }

  const matches = allStudents.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.rollNumber || '').toLowerCase().includes(q)
  ).slice(0, 8);

  if (!matches.length) {
    searchResults.style.display = 'block';
    searchResults.innerHTML = '<div class="search-empty">No students found</div>';
  } else {
    searchResults.style.display = 'block';
    searchResults.innerHTML = matches.map(s => {
      const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      return `
        <div class="search-item" onclick="loadResult('${s.rollNumber}')">
          <div class="search-avatar">${initials}</div>
          <div>
            <div class="search-name">${s.name}</div>
            <div class="search-meta">${s.rollNumber} · ${s.batch} · ${s.section}</div>
          </div>
        </div>
      `;
    }).join('');
  }
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-card')) {
    searchResults.style.display = 'none';
  }
});

// Load result for a student
window.loadResult = async function(rollNumber) {
  searchResults.style.display = 'none';
  searchInput.value = '';

  try {
    const res  = await fetch(`${API}/marks/student/${rollNumber}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = '/pages/teacher-login.html';
      return;
    }

    if (res.status === 403) {
      alert('This student is not in your assigned sections.');
      return;
    }

    const data = await res.json();
    if (!res.ok) { alert(data.message || 'Failed to load'); return; }

    renderResultCard(data);
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('Failed to load result. Check console.');
    console.error(err);
  }
};

function renderResultCard(data) {
  const { student, marks, cgpa } = data;

  // Fill student info
  document.getElementById('rcName').textContent    = student.name    || '—';
  document.getElementById('rcRoll').textContent    = student.rollNumber || '—';
  document.getElementById('rcBatch').textContent   = student.batch   || '—';
  document.getElementById('rcSection').textContent = student.section || '—';
  if (document.getElementById('rcDate')) {
    document.getElementById('rcDate').textContent = new Date().toLocaleDateString('en-PK', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  const tbody = document.getElementById('rcTableBody');
  const tfoot = document.getElementById('rcTableFoot');

  if (!marks || !marks.length) {
    tbody.innerHTML = '<tr><td colspan="14" style="padding:2rem;text-align:center;color:var(--muted)">No marks entered yet for this student</td></tr>';
    tfoot.innerHTML = '';
    document.getElementById('rcCGPA').textContent         = '—';
    document.getElementById('rcResult').textContent       = '—';
    document.getElementById('rcOverallGrade').textContent = '—';
    return;
  }

  tbody.innerHTML = marks.map(m => `
    <tr>
      <td>${m.subjectName}</td>
      <td style="text-align:center;color:var(--muted);font-size:12px">${m.subjectCode}</td>
      <td style="text-align:center">${m.creditHours || 3}</td>
      <td>${m.quiz1    || 0}</td>
      <td>${m.quiz2    || 0}</td>
      <td>${m.quiz3    || 0}</td>
      <td>${m.assign1  || 0}</td>
      <td>${m.assign2  || 0}</td>
      <td>${m.assign3  || 0}</td>
      <td>${m.midterm  || 0}</td>
      <td>${m.final    || 0}</td>
      <td style="font-weight:700;color:var(--navy)">${m.total || 0}</td>
      <td><span class="rc-grade ${m.grade || 'F'}">${m.grade || 'F'}</span></td>
      <td style="font-weight:600">${m.gpa !== undefined ? m.gpa.toFixed(2) : '—'}</td>
    </tr>
  `).join('');

  const totalCredits = marks.reduce((s, m) => s + (m.creditHours || 3), 0);
  const avgTotal     = marks.length ? Math.round(marks.reduce((s, m) => s + (m.total || 0), 0) / marks.length) : 0;

  tfoot.innerHTML = `
    <tr>
      <td>Total / Average</td>
      <td>—</td>
      <td>${totalCredits} Cr</td>
      <td colspan="8" style="text-align:center">—</td>
      <td>${avgTotal}</td>
      <td>—</td>
      <td>${cgpa ? cgpa.toFixed(2) : '—'}</td>
    </tr>
  `;

  const hasFail      = marks.some(m => m.grade === 'F');
  const passed       = !hasFail && cgpa >= 1.0;
  const overallGrade = cgpaToGrade(cgpa || 0);

  document.getElementById('rcCGPA').textContent           = cgpa ? cgpa.toFixed(2) : '0.00';
  document.getElementById('rcResult').textContent         = passed ? 'PASS' : 'FAIL';
  document.getElementById('rcResult').className           = `rc-result-val ${passed ? 'pass' : 'fail'}`;
  document.getElementById('rcOverallGrade').textContent   = overallGrade;
  document.getElementById('rcOverallGrade').style.color   = passed ? '#16A34A' : '#DC2626';
}

function cgpaToGrade(cgpa) {
  if (cgpa >= 4.00) return 'A+';
  if (cgpa >= 3.66) return 'A';
  if (cgpa >= 3.33) return 'B+';
  if (cgpa >= 3.00) return 'B';
  if (cgpa >= 2.66) return 'C+';
  if (cgpa >= 2.33) return 'C';
  if (cgpa >= 2.00) return 'D+';
  if (cgpa >= 1.66) return 'D';
  if (cgpa >= 1.33) return 'E+';
  if (cgpa >= 1.00) return 'E';
  return 'F';
}

window.clearResult = function() {
  document.getElementById('resultSection').style.display = 'none';
};

// Mobile sidebar
const hamburger      = document.getElementById('hamburger');
const sidebar        = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
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

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/pages/teacher-login.html';
});