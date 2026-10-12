const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('studentToken');
const student = JSON.parse(localStorage.getItem('studentInfo') || '{}');
if (!token) window.location.href = '/pages/student-login.html';

const initials = (student.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
document.getElementById('sAvatar').textContent        = initials;
document.getElementById('sName').textContent          = student.name       || '—';
document.getElementById('sRoll').textContent          = student.rollNumber || '—';
document.getElementById('profileAvatar').textContent  = initials;
document.getElementById('profileName').textContent    = student.name       || '—';
document.getElementById('profileRoll').textContent    = student.rollNumber || '—';
document.getElementById('pfEmail').textContent        = student.email      || '—';
document.getElementById('pfBatch').textContent        = student.batch      || '—';
document.getElementById('pfSection').textContent      = student.section    || '—';
document.getElementById('pfSubjects').textContent     = (student.enrolledSubjects || []).length + ' subjects';

// Change password
document.getElementById('pwForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPw').value;
  const newPassword     = document.getElementById('newPw').value;
  const confirmPassword = document.getElementById('confirmPw').value;
  const errEl  = document.getElementById('pwError');
  const sucEl  = document.getElementById('pwSuccess');
  const btn    = document.getElementById('pwBtn');
  const spin   = document.getElementById('pwSpinner');
  const btnTxt = document.getElementById('pwBtnText');

  errEl.style.display = 'none';
  sucEl.style.display = 'none';

  if (!currentPassword || !newPassword || !confirmPassword) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.style.display = 'block'; return;
  }
  if (newPassword !== confirmPassword) {
    errEl.textContent = 'New passwords do not match.';
    errEl.style.display = 'block'; return;
  }
  if (newPassword.length < 6) {
    errEl.textContent = 'New password must be at least 6 characters.';
    errEl.style.display = 'block'; return;
  }

  btn.disabled = true;
  spin.style.display = 'block';
  btnTxt.textContent = 'Changing…';

  try {
    const res  = await fetch(`${API}/auth/student/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.message || 'Failed';
      errEl.style.display = 'block';
    } else {
      sucEl.textContent = '✓ Password changed successfully';
      sucEl.style.display = 'block';
      document.getElementById('pwForm').reset();
    }
  } catch {
    errEl.textContent = 'Cannot connect to server.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    spin.style.display = 'none';
    btnTxt.textContent = 'Change Password';
  }
});

const hamburger = document.getElementById('hamburger');
const sidebar   = document.querySelector('.sidebar');
const overlay   = document.getElementById('sidebarOverlay');
if (hamburger) { hamburger.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); }); }
if (overlay)   { overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); }); }
document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('studentToken'); localStorage.removeItem('studentInfo'); window.location.href = '/pages/student-login.html'; });