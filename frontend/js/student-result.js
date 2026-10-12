const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('studentToken');
const student = JSON.parse(localStorage.getItem('studentInfo') || '{}');
if (!token) window.location.href = '/pages/student-login.html';

const initials = (student.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
document.getElementById('sAvatar').textContent = initials;
document.getElementById('sName').textContent   = student.name       || '—';
document.getElementById('sRoll').textContent   = student.rollNumber || '—';

async function load() {
  try {
    const res  = await fetch(`${API}/marks/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    render(data);
  } catch {
    document.getElementById('resultContent').innerHTML = '<div class="empty-state">Failed to load result</div>';
  }
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

function render(data) {
  const { marks, cgpa } = data;
  const el = document.getElementById('resultContent');

  if (!marks || !marks.length) {
    el.innerHTML = '<div class="empty-state" style="margin-top:2rem">No marks available yet. Check back after your teacher enters them.</div>';
    return;
  }

  const hasFail      = marks.some(m => m.grade === 'F');
  const passed       = !hasFail && cgpa >= 1.0;
  const overallGrade = cgpaToGrade(cgpa);
  const totalCredits = marks.reduce((s, m) => s + (m.creditHours || 3), 0);
  const avgTotal     = marks.length ? Math.round(marks.reduce((s,m) => s + (m.total||0), 0) / marks.length) : 0;

  el.innerHTML = `
    <div class="result-card">
      <div class="rc-header">
        <div class="rc-logo">
          <div class="rc-logo-box">SE</div>
          <div>
            <div class="rc-uni">Sir Syed University of Engineering & Technology</div>
            <div class="rc-dept">Department of Software Engineering · Karachi</div>
          </div>
        </div>
        <div class="rc-title-block">
          <div class="rc-title">SEMESTER RESULT CARD</div>
          <div class="rc-semester">Academic Year 2025-2026</div>
        </div>
      </div>

      <div class="rc-info-grid">
        <div class="rc-info-item"><div class="rc-info-label">Student Name</div><div class="rc-info-value">${student.name}</div></div>
        <div class="rc-info-item"><div class="rc-info-label">Roll Number</div><div class="rc-info-value">${student.rollNumber}</div></div>
        <div class="rc-info-item"><div class="rc-info-label">Batch</div><div class="rc-info-value">${student.batch}</div></div>
        <div class="rc-info-item"><div class="rc-info-label">Section</div><div class="rc-info-value">${student.section}</div></div>
        <div class="rc-info-item"><div class="rc-info-label">Program</div><div class="rc-info-value">BS Software Engineering</div></div>
        <div class="rc-info-item"><div class="rc-info-label">Date Issued</div><div class="rc-info-value">${new Date().toLocaleDateString('en-PK',{year:'numeric',month:'long',day:'numeric'})}</div></div>
      </div>

      <table class="rc-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Code</th>
            <th>Cr.Hrs</th>
            <th>Q1<br><small>/3</small></th>
            <th>Q2<br><small>/3</small></th>
            <th>Q3<br><small>/4</small></th>
            <th>A1<br><small>/3</small></th>
            <th>A2<br><small>/3</small></th>
            <th>A3<br><small>/4</small></th>
            <th>Mid<br><small>/30</small></th>
            <th>Final<br><small>/50</small></th>
            <th>Total<br><small>/100</small></th>
            <th>Grade</th>
            <th>GPA</th>
          </tr>
        </thead>
        <tbody>
          ${marks.map(m => `
            <tr>
              <td>${m.subjectName}</td>
              <td style="text-align:center;color:var(--muted);font-size:12px">${m.subjectCode}</td>
              <td style="text-align:center">${m.creditHours}</td>
              <td>${m.quiz1||0}</td>
              <td>${m.quiz2||0}</td>
              <td>${m.quiz3||0}</td>
              <td>${m.assign1||0}</td>
              <td>${m.assign2||0}</td>
              <td>${m.assign3||0}</td>
              <td>${m.midterm||0}</td>
              <td>${m.final||0}</td>
              <td style="font-weight:700;color:var(--navy)">${m.total||0}</td>
              <td><span class="rc-grade ${m.grade}">${m.grade}</span></td>
              <td style="font-weight:600">${m.gpa?.toFixed(1)||'—'}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td>Total / Average</td>
            <td>—</td>
            <td>${totalCredits} Cr</td>
            <td colspan="8">—</td>
            <td>${avgTotal}</td>
            <td>—</td>
            <td>${cgpa.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="rc-bottom">
        <div class="rc-cgpa-block">
          <div class="rc-cgpa-label">CGPA</div>
          <div class="rc-cgpa-val">${cgpa.toFixed(2)}</div>
        </div>
        <div class="rc-result-block">
          <div class="rc-result-label">Result</div>
          <div class="rc-result-val ${passed?'pass':'fail'}">${passed?'PASS':'FAIL'}</div>
        </div>
        <div class="rc-grade-block">
          <div class="rc-grade-label">Overall Grade</div>
          <div class="rc-grade-val" style="color:${passed?'#16A34A':'#DC2626'}">${overallGrade}</div>
        </div>
      </div>

      <div class="rc-signatures">
        <div class="rc-sig"><div class="rc-sig-line"></div><div class="rc-sig-label">Class Advisor</div></div>
        <div class="rc-sig"><div class="rc-sig-line"></div><div class="rc-sig-label">Controller of Examinations</div></div>
        <div class="rc-sig"><div class="rc-sig-line"></div><div class="rc-sig-label">Dean / HOD</div></div>
      </div>

      <div class="rc-footer">
        This is a computer-generated result card. · SSUET · Karachi · www.ssuet.edu.pk
      </div>
    </div>
  `;
}

const hamburger = document.getElementById('hamburger');
const sidebar   = document.querySelector('.sidebar');
const overlay   = document.getElementById('sidebarOverlay');
if (hamburger) { hamburger.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); }); }
if (overlay)   { overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); }); }
document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('studentToken'); localStorage.removeItem('studentInfo'); window.location.href = '/pages/student-login.html'; });

load();