const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('teacherToken');
const teacher = JSON.parse(localStorage.getItem('teacherInfo') || '{}');
if (!token) window.location.href = '/pages/teacher-login.html';

document.getElementById('teacherName').textContent = teacher.name       || '—';
document.getElementById('teacherEmp').textContent  = teacher.employeeId || '—';

const subjectsByBatch = {
  '2023F': [
    { id: '2023F-OS',  name: 'Operating Systems' },
    { id: '2023F-DSA', name: 'Data Structures & Algorithms' },
    { id: '2023F-TW',  name: 'Technical Writing' },
    { id: '2023F-DB',  name: 'Database Management System' },
    { id: '2023F-SRE', name: 'Software Requirement Engineering' }
  ],
  '2023S': [
    { id: '2023S-OOP', name: 'Object Oriented Programming' },
    { id: '2023S-CS',  name: 'Communication Skills' },
    { id: '2023S-LA',  name: 'Linear Algebra' },
    { id: '2023S-SDA', name: 'Software Dev Architecture' },
    { id: '2023S-AP',  name: 'Applied Physics' }
  ],
  '2022F': [
    { id: '2022F-IS',  name: 'Information Security' },
    { id: '2022F-EC',  name: 'E-Commerce' },
    { id: '2022F-BPE', name: 'Business Process Engineering' },
    { id: '2022F-WE',  name: 'Web Engineering' },
    { id: '2022F-SQA', name: 'Software Quality Assurance' }
  ]
};

// Sync batch selects
const rollBatch = document.getElementById('rollBatch');
const batch     = document.getElementById('batch');
const rollNum   = document.getElementById('rollNum');
const preview   = document.getElementById('rollPreview');

function updatePreview() {
  const b = rollBatch.value;
  const n = rollNum.value ? String(rollNum.value).padStart(3, '0') : '???';
  preview.textContent = `${b}-BSE-${n}`;
  batch.value = b;
  renderSubjects(b);
}

rollBatch.addEventListener('change', updatePreview);
rollNum.addEventListener('input', updatePreview);

batch.addEventListener('change', () => {
  rollBatch.value = batch.value;
  updatePreview();
});

function renderSubjects(b) {
  const grid = document.getElementById('subjectsGrid');
  const subs = subjectsByBatch[b] || [];
  if (!subs.length) {
    grid.innerHTML = '<div class="subjects-empty">No subjects found for this batch</div>';
    return;
  }
  grid.innerHTML = subs.map(s => `
    <label class="subject-check" id="lbl-${s.id}">
      <input type="checkbox" value="${s.id}" checked onchange="toggleCheck(this)"/>
      <div class="check-box">
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span class="subject-label">${s.name}</span>
    </label>
  `).join('');

  // Mark all checked by default
  grid.querySelectorAll('.subject-check').forEach(l => l.classList.add('checked'));
}

window.toggleCheck = function(cb) {
  const lbl = document.getElementById('lbl-' + cb.value);
  if (cb.checked) lbl.classList.add('checked');
  else lbl.classList.remove('checked');
};

// Auto-select section based on roll number
rollNum.addEventListener('input', () => {
  const n = parseInt(rollNum.value);
  const sec = document.getElementById('section');
  if (n >= 1  && n <= 30)  sec.value = 'SE-A';
  if (n >= 31 && n <= 60)  sec.value = 'SE-B';
  if (n >= 61 && n <= 90)  sec.value = 'SE-C';
  updatePreview();
});

// Init
renderSubjects('2023F');
updatePreview();

// Form submit
const form = document.getElementById('addStudentForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const section  = document.getElementById('section').value;
  const batchVal = batch.value;
  const numVal   = rollNum.value;

  if (!name || !email || !password || !section || !numVal) {
    showAlert('error', 'Please fill in all fields.');
    return;
  }

  const rollNumber = `${batchVal}-BSE-${String(numVal).padStart(3, '0')}`;
  const checked    = [...document.querySelectorAll('.subjects-grid input[type="checkbox"]:checked')].map(c => c.value);

  if (!checked.length) {
    showAlert('error', 'Please select at least one subject.');
    return;
  }

  setLoading(true);
  try {
    const res  = await fetch(`${API}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, rollNumber, email, password, section, batch: batchVal, enrolledSubjects: checked })
    });
    const data = await res.json();

    if (!res.ok) {
      showAlert('error', data.message || 'Failed to register student.');
      return;
    }

    showAlert('success', `${name} registered successfully!`);
    showQR(data.student);
    form.reset();
    renderSubjects('2023F');
    updatePreview();
  } catch (err) {
    showAlert('error', 'Cannot connect to server.');
  } finally {
    setLoading(false);
  }
});

function showQR(student) {
  document.getElementById('qrPlaceholder').style.display = 'none';
  document.getElementById('qrResult').style.display      = 'flex';
  document.getElementById('qrImage').src                 = student.qrImage;
  document.getElementById('qrName').textContent          = student.name;
  document.getElementById('qrRoll').textContent          = student.rollNumber;
  document.getElementById('qrBatch').textContent         = student.batch    || '—';
  document.getElementById('qrSection').textContent       = student.section  || '—';

  // Store for print page
  localStorage.setItem('printStudent', JSON.stringify(student));

  // Update print button to open print page
  document.getElementById('printBtn').onclick = () => {
    window.open('/pages/print-card.html', '_blank');
  };
}

function showAlert(type, msg) {
  const el = document.getElementById(type === 'error' ? 'errorAlert' : 'successAlert');
  const hide = document.getElementById(type === 'error' ? 'successAlert' : 'errorAlert');
  el.textContent    = msg;
  el.style.display  = 'block';
  hide.style.display = 'none';
  setTimeout(() => el.style.display = 'none', 5000);
}

function setLoading(on) {
  const btn  = document.getElementById('submitBtn');
  const spin = document.getElementById('spinner');
  const txt  = document.getElementById('btnText');
  btn.disabled       = on;
  spin.style.display = on ? 'block' : 'none';
  txt.textContent    = on ? 'Registering…' : 'Register Student & Generate QR';
}

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

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/pages/teacher-login.html';
});

