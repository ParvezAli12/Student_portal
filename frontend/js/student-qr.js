const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('studentToken');
const student = JSON.parse(localStorage.getItem('studentInfo') || '{}');
if (!token) window.location.href = '/pages/student-login.html';

const initials = (student.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
document.getElementById('sAvatar').textContent    = initials;
document.getElementById('sName').textContent      = student.name       || '—';
document.getElementById('sRoll').textContent      = student.rollNumber || '—';
document.getElementById('qrBigName').textContent  = student.name       || '—';
document.getElementById('qrBigRoll').textContent  = student.rollNumber || '—';
document.getElementById('qrBigBatch').textContent = student.batch      || '—';
document.getElementById('qrBigSection').textContent = student.section  || '—';
document.getElementById('qrBigImg').src           = student.qrImage    || '';

window.printQR = function() {
  localStorage.setItem('printStudent', JSON.stringify(student));
  window.open('/pages/print-card.html', '_blank');
};

const hamburger = document.getElementById('hamburger');
const sidebar   = document.querySelector('.sidebar');
const overlay   = document.getElementById('sidebarOverlay');
if (hamburger) { hamburger.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); }); }
if (overlay)   { overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); }); }
document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('studentToken'); localStorage.removeItem('studentInfo'); window.location.href = '/pages/student-login.html'; });