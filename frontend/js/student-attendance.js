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
    const res  = await fetch(`${API}/attendance/my`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    render(Array.isArray(data) ? data : []);
  } catch (err) {
    document.getElementById('attCards').innerHTML = '<div class="empty-state">Failed to load attendance</div>';
  }
}

function render(data) {
  const el = document.getElementById('attCards');
  if (!data.length) { el.innerHTML = '<div class="empty-state" style="margin-top:2rem">No attendance records yet. Attend a class and get scanned.</div>'; return; }

  el.innerHTML = data.map(s => {
    const pct = s.percentage || 0;
    const cls = pct >= 75 ? 'ok' : pct >= 60 ? 'mid' : 'low';
    const missed = (s.total || 0) - (s.present || 0);

    return `
      <div class="att-subject-card ${cls}">
        <div class="att-sub-header">
          <div>
            <div class="att-sub-name">${s.subject}</div>
            <div class="att-sub-code">${s.code || ''}</div>
          </div>
          <div class="att-pct-big ${cls}">${pct}%</div>
        </div>
        <div class="att-stats-row">
          <div class="att-stat-mini">
            <div class="att-mini-val">${s.total || 0}</div>
            <div class="att-mini-label">Conducted</div>
          </div>
          <div class="att-stat-mini">
            <div class="att-mini-val" style="color:#16A34A">${s.present || 0}</div>
            <div class="att-mini-label">Present</div>
          </div>
          <div class="att-stat-mini">
            <div class="att-mini-val" style="color:#DC2626">${missed}</div>
            <div class="att-mini-label">Absent</div>
          </div>
          <div class="att-stat-mini">
            <div class="att-mini-val">${42 - (s.total || 0)}</div>
            <div class="att-mini-label">Remaining</div>
          </div>
        </div>
        <div class="att-bar-wrap">
          <div class="att-bar-bg">
            <div class="att-bar-fill ${cls}" style="width:${pct}%"></div>
          </div>
        </div>
        ${pct < 75 ? `<div class="att-warning">⚠ Below 75% — You need to attend more classes</div>` : ''}
        ${s.records && s.records.length ? `
          <details style="margin-top:0.75rem">
            <summary style="font-size:12px;color:var(--muted);cursor:pointer;font-weight:500">View class history (${s.records.length})</summary>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:0.5rem">
              ${s.records.map(r => `
                <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${r.status==='present'?'#DCFCE7':'#FEE2E2'};color:${r.status==='present'?'#16A34A':'#DC2626'};font-weight:500">
                  ${r.date}
                </span>
              `).join('')}
            </div>
          </details>
        ` : ''}
      </div>
    `;
  }).join('');
}

const hamburger = document.getElementById('hamburger');
const sidebar   = document.querySelector('.sidebar');
const overlay   = document.getElementById('sidebarOverlay');
if (hamburger) { hamburger.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); }); }
if (overlay)   { overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); }); }
document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('studentToken'); localStorage.removeItem('studentInfo'); window.location.href = '/pages/student-login.html'; });

load();