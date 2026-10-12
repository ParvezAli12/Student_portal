const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('teacherToken');
const teacher = JSON.parse(localStorage.getItem('teacherInfo') || '{}');
if (!token) window.location.href = '/pages/teacher-login.html';

document.getElementById('teacherName').textContent = teacher.name       || '—';
document.getElementById('teacherEmp').textContent  = teacher.employeeId || '—';

const assignments   = teacher.assignments || [];
const subjectSelect = document.getElementById('subjectSelect');
const sectionSelect = document.getElementById('sectionSelect');
const loadBtn       = document.getElementById('loadBtn');

// Populate subjects from teacher's assignments only
assignments.forEach(a => {
  const o = document.createElement('option');
  o.value           = a.subjectId;
  o.textContent     = `${a.subjectName} (${a.batch})`;
  o.dataset.batch   = a.batch;
  o.dataset.sections = JSON.stringify(a.sections);
  subjectSelect.appendChild(o);
});

subjectSelect.addEventListener('change', () => {
  sectionSelect.innerHTML = '<option value="">— Select Section —</option>';
  sectionSelect.disabled  = true;
  loadBtn.disabled        = true;

  const opt = subjectSelect.options[subjectSelect.selectedIndex];
  if (!opt.value) return;

  const sections = JSON.parse(opt.dataset.sections || '[]');
  sections.forEach(s => {
    const o = document.createElement('option');
    o.value = s; o.textContent = s;
    sectionSelect.appendChild(o);
  });
  sectionSelect.disabled = false;
});

sectionSelect.addEventListener('change', () => {
  loadBtn.disabled = !sectionSelect.value;
});

// Load students + existing marks
loadBtn.addEventListener('click', async () => {
  const subjectId   = subjectSelect.value;
  const section     = sectionSelect.value;
  const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;

  // Get batch for this subject from teacher's assignments
  const assignment = assignments.find(a => a.subjectId === subjectId);
  const batch      = assignment?.batch || '';

  loadBtn.textContent = 'Loading…';
  loadBtn.disabled    = true;

  try {
    const [stuRes, marksRes] = await Promise.all([
      fetch(`${API}/students?section=${section}&batch=${batch}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API}/marks?subjectId=${subjectId}&section=${section}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const students = await stuRes.json();
    const existing = await marksRes.json();

if (!Array.isArray(students)) {
  alert('Failed to load students');
  return;
}

    document.getElementById('marksTitle').textContent  = `${subjectName} · ${section} · ${batch}`;
    document.getElementById('marksCard').style.display = 'block';

    renderMarksTable(students, existing, subjectId);

  } catch (err) {
    alert('Failed to load. Check console.');
    console.error(err);
  } finally {
    loadBtn.textContent = 'Load Students';
    loadBtn.disabled    = false;
  }
});

function renderMarksTable(students, existing, subjectId) {
  const tbody = document.getElementById('marksBody');

  if (!students.length) {
    tbody.innerHTML = '<tr><td colspan="14" style="padding:2rem;text-align:center;color:var(--muted)">No students found in this section/batch</td></tr>';
    return;
  }

  tbody.innerHTML = students.map((s, i) => {
    const m = existing.find(e => e.rollNumber === s.rollNumber) || {};
    return `
      <tr id="row-${s.rollNumber}">
        <td><span class="row-num">${String(i + 1).padStart(2, '0')}</span></td>
        <td>
          <div class="stu-name">${s.name}</div>
          <div class="stu-roll">${s.rollNumber}</div>
        </td>
        <td><input class="mark-input" type="number" min="0" max="3"  value="${m.quiz1    !== undefined ? m.quiz1    : ''}" placeholder="0" data-field="quiz1"   data-roll="${s.rollNumber}" onchange="recalcRow('${s.rollNumber}')"/></td>
        <td><input class="mark-input" type="number" min="0" max="3"  value="${m.quiz2    !== undefined ? m.quiz2    : ''}" placeholder="0" data-field="quiz2"   data-roll="${s.rollNumber}" onchange="recalcRow('${s.rollNumber}')"/></td>
        <td><input class="mark-input" type="number" min="0" max="4"  value="${m.quiz3    !== undefined ? m.quiz3    : ''}" placeholder="0" data-field="quiz3"   data-roll="${s.rollNumber}" onchange="recalcRow('${s.rollNumber}')"/></td>
        <td><input class="mark-input" type="number" min="0" max="3"  value="${m.assign1  !== undefined ? m.assign1  : ''}" placeholder="0" data-field="assign1" data-roll="${s.rollNumber}" onchange="recalcRow('${s.rollNumber}')"/></td>
        <td><input class="mark-input" type="number" min="0" max="3"  value="${m.assign2  !== undefined ? m.assign2  : ''}" placeholder="0" data-field="assign2" data-roll="${s.rollNumber}" onchange="recalcRow('${s.rollNumber}')"/></td>
        <td><input class="mark-input" type="number" min="0" max="4"  value="${m.assign3  !== undefined ? m.assign3  : ''}" placeholder="0" data-field="assign3" data-roll="${s.rollNumber}" onchange="recalcRow('${s.rollNumber}')"/></td>
        <td><input class="mark-input" type="number" min="0" max="30" value="${m.midterm  !== undefined ? m.midterm  : ''}" placeholder="0" data-field="midterm" data-roll="${s.rollNumber}" onchange="recalcRow('${s.rollNumber}')"/></td>
        <td><input class="mark-input" type="number" min="0" max="50" value="${m.final    !== undefined ? m.final    : ''}" placeholder="0" data-field="final"   data-roll="${s.rollNumber}" onchange="recalcRow('${s.rollNumber}')"/></td>
        <td><span class="total-cell" id="total-${s.rollNumber}">${m.total !== undefined ? m.total : '—'}</span></td>
        <td><span class="grade-badge grade-${m.grade || ''}" id="grade-${s.rollNumber}">${m.grade || '—'}</span></td>
        <td><span class="gpa-cell" id="gpa-${s.rollNumber}">${m.gpa !== undefined ? m.gpa.toFixed(1) : '—'}</span></td>
        <td>
          <button class="save-row-btn ${m.total !== undefined ? 'saved' : ''}" id="savebtn-${s.rollNumber}" onclick="saveRow('${s.rollNumber}', '${subjectId}')">
            ${m.total !== undefined ? 'Saved ✓' : 'Save'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Recalculate live as user types
window.recalcRow = function(rollNumber) {
  const marks  = getRowMarks(rollNumber);
  const total  = calcTotal(marks);
  const grade  = calcGrade(total);

  document.getElementById(`total-${rollNumber}`).textContent = total;

  const gradeEl = document.getElementById(`grade-${rollNumber}`);
  gradeEl.textContent = grade.grade;
  gradeEl.className   = `grade-badge grade-${grade.grade}`;

  document.getElementById(`gpa-${rollNumber}`).textContent = grade.gpa.toFixed(1);

  const saveBtn = document.getElementById(`savebtn-${rollNumber}`);
  if (saveBtn) { saveBtn.textContent = 'Save'; saveBtn.className = 'save-row-btn'; }
};

function getRowMarks(rollNumber) {
  const row    = document.getElementById(`row-${rollNumber}`);
  const inputs = row.querySelectorAll('.mark-input');
  const result = {};
  inputs.forEach(inp => { result[inp.dataset.field] = parseFloat(inp.value) || 0; });
  return result;
}

function calcTotal(marks) {
  return Math.min(marks.quiz1    || 0, 3)
       + Math.min(marks.quiz2    || 0, 3)
       + Math.min(marks.quiz3    || 0, 4)
       + Math.min(marks.assign1  || 0, 3)
       + Math.min(marks.assign2  || 0, 3)
       + Math.min(marks.assign3  || 0, 4)
       + Math.min(marks.midterm  || 0, 30)
       + Math.min(marks.final    || 0, 50);
}

const GRADE_SCALE = [
  { min: 85, grade: 'A+', gpa: 4.00 },
  { min: 80, grade: 'A',  gpa: 3.66 },
  { min: 75, grade: 'B+', gpa: 3.33 },
  { min: 70, grade: 'B',  gpa: 3.00 },
  { min: 65, grade: 'C+', gpa: 2.66 },
  { min: 60, grade: 'C',  gpa: 2.33 },
  { min: 55, grade: 'D+', gpa: 2.00 },
  { min: 50, grade: 'D',  gpa: 1.66 },
  { min: 45, grade: 'E+', gpa: 1.33 },
  { min: 40, grade: 'E',  gpa: 1.00 },
  { min: 0,  grade: 'F',  gpa: 0.00 },
];

function calcGrade(total) {
  return GRADE_SCALE.find(g => total >= g.min) || { grade: 'F', gpa: 0.0 };
}

// Save single row
window.saveRow = async function(rollNumber, subjectId) {
  const btn   = document.getElementById(`savebtn-${rollNumber}`);
  const marks = getRowMarks(rollNumber);

  btn.textContent = 'Saving…';
  btn.className   = 'save-row-btn saving';

  try {
    const res = await fetch(`${API}/marks`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ rollNumber, subjectId, ...marks })
    });

    if (!res.ok) {
      const data = await res.json();
      btn.textContent = 'Error';
      btn.className   = 'save-row-btn';
      alert(data.message || 'Failed to save');
      return;
    }

    btn.textContent = 'Saved ✓';
    btn.className   = 'save-row-btn saved';
  } catch {
    btn.textContent = 'Error';
    btn.className   = 'save-row-btn';
  }
};

// Save all rows
document.getElementById('saveAllBtn').addEventListener('click', async () => {
  const subjectId  = subjectSelect.value;
  const status     = document.getElementById('saveStatus');
  const rows       = document.querySelectorAll('[id^="row-"]');
  const saveAllBtn = document.getElementById('saveAllBtn');

  if (!subjectId) { alert('Please select a subject first.'); return; }

  saveAllBtn.textContent = 'Saving all…';
  saveAllBtn.disabled    = true;
  status.textContent     = '';
  status.className       = 'save-status';

  let saved  = 0;
  let failed = 0;

  for (const row of rows) {
    const rollNumber = row.id.replace('row-', '');
    const marks      = getRowMarks(rollNumber);
    const btn        = document.getElementById(`savebtn-${rollNumber}`);

    try {
      const res = await fetch(`${API}/marks`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ rollNumber, subjectId, ...marks })
      });
      if (!res.ok) throw new Error();
      btn.textContent = 'Saved ✓';
      btn.className   = 'save-row-btn saved';
      saved++;
    } catch {
      btn.textContent = 'Error';
      btn.className   = 'save-row-btn';
      failed++;
    }
  }

  status.textContent = failed > 0
    ? `⚠ ${saved} saved, ${failed} failed`
    : `✓ All ${saved} students saved successfully`;
  status.className = `save-status ${failed > 0 ? 'error' : 'success'}`;

  saveAllBtn.textContent = 'Save All Marks';
  saveAllBtn.disabled    = false;
});

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