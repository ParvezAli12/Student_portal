const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('studentToken');
const student = JSON.parse(localStorage.getItem('studentInfo') || '{}');
if (!token) window.location.href = '/pages/student-login.html';

const initials = (student.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
document.getElementById('sAvatar').textContent = initials;
document.getElementById('sName').textContent   = student.name       || '—';
document.getElementById('sRoll').textContent   = student.rollNumber || '—';

const gradeColors = { A:'#16A34A', B:'#2563EB', C:'#CA8A04', D:'#EA580C', F:'#DC2626' };

async function load() {
  try {
    const res  = await fetch(`${API}/marks/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    render(data.marks || [], data.cgpa || 0);
  } catch {
    document.getElementById('marksCards').innerHTML = '<div class="empty-state">Failed to load marks</div>';
  }
}

function render(marks, cgpa) {
  const el = document.getElementById('marksCards');
  if (!marks.length) {
    el.innerHTML = '<div class="empty-state" style="margin-top:2rem">No marks entered yet. Check back after your teacher enters them.</div>';
    return;
  }

  el.innerHTML = `
    <div class="card s-card" style="margin-bottom:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-weight:600;margin-bottom:4px">Overall CGPA</div>
          <div style="font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:700;color:var(--navy)">${cgpa.toFixed(2)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;color:var(--muted);margin-bottom:4px">${marks.length} subjects</div>
          <a href="/pages/student-result.html" style="display:inline-flex;align-items:center;gap:6px;background:var(--navy);color:white;border-radius:8px;padding:0.6rem 1rem;font-size:13px;font-weight:600;text-decoration:none">View Full Result Card</a>
        </div>
      </div>
    </div>
    ${marks.map(m => {
      const color = gradeColors[m.grade] || '#DC2626';
      return `
        <div class="marks-subject-card">
          <div class="marks-sub-header">
            <div>
              <div class="marks-sub-name">${m.subjectName}</div>
              <div class="marks-sub-code">${m.subjectCode} · ${m.creditHours} Credit Hours</div>
            </div>
            <div style="text-align:right">
              <div class="marks-grade-big" style="color:${color}">${m.grade}</div>
              <div style="font-size:12px;color:var(--muted)">GPA ${m.gpa?.toFixed(1) || '0.0'}</div>
            </div>
          </div>
          <div class="marks-breakdown">
            <div class="mb-item">
              <div class="mb-label">Quizzes</div>
              <div class="mb-val">${(m.quiz1||0)+(m.quiz2||0)+(m.quiz3||0)}</div>
              <div class="mb-max">/ 10</div>
            </div>
            <div class="mb-item">
              <div class="mb-label">Assignments</div>
              <div class="mb-val">${(m.assign1||0)+(m.assign2||0)+(m.assign3||0)}</div>
              <div class="mb-max">/ 10</div>
            </div>
            <div class="mb-item">
              <div class="mb-label">Midterm</div>
              <div class="mb-val">${m.midterm||0}</div>
              <div class="mb-max">/ 30</div>
            </div>
            <div class="mb-item">
              <div class="mb-label">Final</div>
              <div class="mb-val">${m.final||0}</div>
              <div class="mb-max">/ 50</div>
            </div>
          </div>
          <div class="marks-quizzes">
            <div class="mq-item"><div class="mq-label">Quiz 1</div><div class="mq-val">${m.quiz1||0}<span style="font-size:10px;color:var(--muted)">/3</span></div></div>
            <div class="mq-item"><div class="mq-label">Quiz 2</div><div class="mq-val">${m.quiz2||0}<span style="font-size:10px;color:var(--muted)">/3</span></div></div>
            <div class="mq-item"><div class="mq-label">Quiz 3</div><div class="mq-val">${m.quiz3||0}<span style="font-size:10px;color:var(--muted)">/4</span></div></div>
          </div>
          <div class="marks-assignments">
            <div class="mq-item"><div class="mq-label">Assign 1</div><div class="mq-val">${m.assign1||0}<span style="font-size:10px;color:var(--muted)">/3</span></div></div>
            <div class="mq-item"><div class="mq-label">Assign 2</div><div class="mq-val">${m.assign2||0}<span style="font-size:10px;color:var(--muted)">/3</span></div></div>
            <div class="mq-item"><div class="mq-label">Assign 3</div><div class="mq-val">${m.assign3||0}<span style="font-size:10px;color:var(--muted)">/4</span></div></div>
          </div>
          <div style="padding:0.75rem 1.25rem;background:var(--bg);border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;color:var(--muted)">Total Marks</span>
            <span style="font-size:18px;font-weight:700;color:${color}">${m.total||0} / 100</span>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

const hamburger = document.getElementById('hamburger');
const sidebar   = document.querySelector('.sidebar');
const overlay   = document.getElementById('sidebarOverlay');
if (hamburger) { hamburger.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); }); }
if (overlay)   { overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); }); }
document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('studentToken'); localStorage.removeItem('studentInfo'); window.location.href = '/pages/student-login.html'; });

load();