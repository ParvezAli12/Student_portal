const API = 'http://localhost:5000/api';

const form       = document.getElementById('loginForm');
const emailEl    = document.getElementById('email');
const passEl     = document.getElementById('password');
const btn        = document.getElementById('loginBtn');
const spinner    = document.getElementById('spinner');
const btnText    = document.getElementById('btnText');
const errorDiv   = document.getElementById('errorAlert');
const successDiv = document.getElementById('successAlert');

// Redirect if already logged in
if (localStorage.getItem('teacherToken')) {
  window.location.href = 'teacher-dashboard.html';
}

// Toggle password visibility
document.getElementById('togglePw').addEventListener('click', () => {
  passEl.type = passEl.type === 'password' ? 'text' : 'password';
});

function showError(msg) {
  errorDiv.textContent     = msg;
  errorDiv.style.display   = 'block';
  successDiv.style.display = 'none';
}

function showSuccess(msg) {
  successDiv.textContent   = msg;
  successDiv.style.display = 'block';
  errorDiv.style.display   = 'none';
}

function setLoading(on) {
  btn.disabled            = on;
  spinner.style.display   = on ? 'block' : 'none';
  btnText.textContent     = on ? 'Signing in…' : 'Sign In';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorDiv.style.display = 'none';

  const email    = emailEl.value.trim();
  const password = passEl.value;

  if (!email || !password) return showError('Please fill in all fields.');

  setLoading(true);
  try {
    const res  = await fetch(`${API}/auth/teacher/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) return showError(data.message || 'Login failed');

    localStorage.setItem('teacherToken', data.token);
    localStorage.setItem('teacherInfo',  JSON.stringify(data.teacher));

    showSuccess(`Welcome, ${data.teacher.name}! Redirecting…`);
    setTimeout(() => window.location.href = 'teacher-dashboard.html', 1000);
  } catch (err) {
    showError('Cannot connect to server. Is the backend running?');
  } finally {
    setLoading(false);
  }
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