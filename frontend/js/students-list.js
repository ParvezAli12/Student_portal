const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('teacherToken');
const teacher = JSON.parse(localStorage.getItem('teacherInfo') || '{}');
if (!token) window.location.href = '/pages/teacher-login.html';

document.getElementById('teacherName').textContent = teacher.name       || '—';
document.getElementById('teacherEmp').textContent  = teacher.employeeId || '—';

let allStudents = [];

async function loadStudents() {
  try {
    const res  = await fetch(`${API}/students`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    allStudents = Array.isArray(data) ? data : [];
    renderTable(allStudents);
    document.getElementById('studentCount').textContent = `${allStudents.length} students registered`;
  } catch (err) {
    document.getElementById('studentsTable').innerHTML =
      '<tr><td colspan="7" class="empty-state">Failed to load students</td></tr>';
  }
}

function renderTable(students) {
  const tbody = document.getElementById('studentsTable');
  if (!students.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No students found</td></tr>';
    return;
  }
  tbody.innerHTML = students.map((s, i) => `
    <tr>
      <td class="row-num">${i + 1}</td>
      <td>
        <div class="stu-name">${s.name}</div>
        <div class="stu-email">${s.email || '—'}</div>
      </td>
      <td><span class="roll-num">${s.rollNumber || s.studentId}</span></td>
      <td><span class="badge badge-terra">${s.batch || '—'}</span></td>
      <td><span class="badge">${s.section || '—'}</span></td>
      <td>${(s.enrolledSubjects || []).length} subjects</td>
      <td>
        <button class="qr-thumb-btn" onclick="showQR('${s.id}')">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3v3M21 21h-3M16 16h.01"/></svg>
          View QR
        </button>
      </td>
    </tr>
  `).join('');
}

// Filters
const searchInput    = document.getElementById('searchInput');
const filterBatch    = document.getElementById('filterBatch');
const filterSection  = document.getElementById('filterSection');

function applyFilters() {
  const q   = searchInput.value.toLowerCase();
  const bat = filterBatch.value;
  const sec = filterSection.value;
  const filtered = allStudents.filter(s => {
    const matchQ   = !q   || s.name.toLowerCase().includes(q) || (s.rollNumber || '').toLowerCase().includes(q);
    const matchBat = !bat || s.batch   === bat;
    const matchSec = !sec || s.section === sec;
    return matchQ && matchBat && matchSec;
  });
  renderTable(filtered);
}

searchInput.addEventListener('input',   applyFilters);
filterBatch.addEventListener('change',  applyFilters);
filterSection.addEventListener('change', applyFilters);

document.getElementById('clearFilters').addEventListener('click', () => {
  searchInput.value   = '';
  filterBatch.value   = '';
  filterSection.value = '';
  renderTable(allStudents);
});

// QR Modal
window.showQR = function(id) {
  const s = allStudents.find(s => s.id === id);
  if (!s) return;
  document.getElementById('modalQR').src               = s.qrImage || '';
  document.getElementById('modalName').textContent     = s.name;
  document.getElementById('modalRoll').textContent     = s.rollNumber || s.studentId;
  document.getElementById('modalDetails').textContent  = `${s.batch || '—'} · ${s.section || '—'}`;
  document.getElementById('modalTitle').textContent    = `${s.name}'s QR Code`;
  document.getElementById('modalOverlay').classList.add('show');

  // Store for print page
  localStorage.setItem('printStudent', JSON.stringify(s));

  // Print button opens print page
  document.querySelector('.print-btn').onclick = () => {
    window.open('/pages/print-card.html', '_blank');
  };
};

document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('modalOverlay').classList.remove('show');
});
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay'))
    document.getElementById('modalOverlay').classList.remove('show');
});

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

// Also update students route to return rollNumber field
// Make sure backend sends rollNumber not just studentId

loadStudents();