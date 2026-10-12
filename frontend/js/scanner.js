const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('teacherToken');
const teacher = JSON.parse(localStorage.getItem('teacherInfo') || '{}');
if (!token) window.location.href = '/pages/teacher-login.html';

const TOTAL_CLASSES = 54;
const CORRECTION_DAYS = 7;

document.getElementById('teacherName').textContent = teacher.name       || '—';
document.getElementById('teacherEmp').textContent  = teacher.employeeId || '—';

const sectionSelect = document.getElementById('sectionSelect');
const subjectSelect = document.getElementById('subjectSelect');
const dateSelect    = document.getElementById('dateSelect');
const startBtn      = document.getElementById('startBtn');
const stopBtn       = document.getElementById('stopBtn');
const video         = document.getElementById('video');
const canvas        = document.getElementById('canvas');
const scanLine      = document.getElementById('scanLine');
const idleScreen    = document.getElementById('idleScreen');
const statusDot     = document.getElementById('statusDot');
const statusText    = document.getElementById('statusText');
const sessionBar    = document.getElementById('sessionBar');
const dateBox       = document.getElementById('dateBox');

const todayStr = new Date().toISOString().split('T')[0];
if (dateBox) dateBox.textContent = new Date().toLocaleDateString('en-PK', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

let scanning         = false;
let stream           = null;
let animId           = null;
let cooldown         = false;
let lastQR           = null;
let sectionStudents  = [];
let presentToday     = new Map();
let classesConducted = 0;
let studentHistory   = {};
let selectedDate     = '';
let timetableData    = null;
let isCorrection     = false;

const assignments = teacher.assignments || [];
const allSections = [...new Set(assignments.flatMap(a => a.sections))].sort();
allSections.forEach(s => {
  const o = document.createElement('option');
  o.value = s; o.textContent = s;
  sectionSelect.appendChild(o);
});

sectionSelect.addEventListener('change', () => {
  const sec = sectionSelect.value;
  subjectSelect.innerHTML = '<option value="">— Select Subject —</option>';
  subjectSelect.disabled  = !sec;
  dateSelect.innerHTML    = '<option value="">— Select Class Date —</option>';
  dateSelect.disabled     = true;
  startBtn.disabled       = true;
  timetableData           = null;
  if (!sec) return;
  assignments.filter(a => a.sections.includes(sec)).forEach(a => {
    const o = document.createElement('option');
    o.value = a.subjectId; o.textContent = `${a.subjectName} (${a.batch})`;
    subjectSelect.appendChild(o);
  });
});

subjectSelect.addEventListener('change', async () => {
  const subjectId = subjectSelect.value;
  dateSelect.innerHTML  = '<option value="">Loading dates…</option>';
  dateSelect.disabled   = true;
  startBtn.disabled     = true;
  timetableData         = null;
  if (!subjectId) return;

  try {
    const res  = await fetch(`${API}/timetable/subject/${subjectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    timetableData = data;
    populateDates(data.classDates || []);
  } catch (err) {
    dateSelect.innerHTML = '<option value="">Failed to load dates</option>';
    console.error(err);
  }
});

function populateDates(classDates) {
  dateSelect.innerHTML = '<option value="">— Select Class Date —</option>';

  const today    = new Date(todayStr);
  const cutoff   = new Date(todayStr);
  cutoff.setDate(cutoff.getDate() - CORRECTION_DAYS);

  // Show past 7 days + today + all future dates
  const visible = classDates.filter(d => new Date(d) >= cutoff);

  if (!visible.length) {
    dateSelect.innerHTML = '<option value="">No classes available</option>';
    return;
  }

  // Group into sections
  const past    = visible.filter(d => d < todayStr);
  const todayD  = visible.filter(d => d === todayStr);
  const future  = visible.filter(d => d > todayStr);

  if (todayD.length) {
    const og = document.createElement('optgroup');
    og.label = "Today's Class";
    todayD.forEach(d => {
      const o = document.createElement('option');
      o.value = d;
      o.textContent = formatDate(d) + ' — TODAY';
      og.appendChild(o);
    });
    dateSelect.appendChild(og);
  }

  if (past.length) {
    const og = document.createElement('optgroup');
    og.label = 'Past Classes (Editable — last 7 days)';
    [...past].reverse().forEach(d => {
      const o = document.createElement('option');
      o.value = d;
      o.textContent = formatDate(d) + ' — Edit';
      og.appendChild(o);
    });
    dateSelect.appendChild(og);
  }

  if (future.length) {
    const og = document.createElement('optgroup');
    og.label = 'Upcoming Classes';
    future.forEach(d => {
      const o = document.createElement('option');
      o.value = d;
      o.textContent = formatDate(d);
      o.disabled = true; // can't mark future
      og.appendChild(o);
    });
    dateSelect.appendChild(og);
  }

  dateSelect.disabled = false;
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PK', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}

dateSelect.addEventListener('change', () => {
  selectedDate = dateSelect.value;
  startBtn.disabled = !selectedDate;

  const notice = document.getElementById('correctionNotice');
  if (selectedDate && selectedDate < todayStr) {
    isCorrection = true;
    if (notice) notice.style.display = 'flex';
    document.getElementById('dateStatus').textContent = '⚠ Editing past class — within correction window';
    document.getElementById('dateStatus').style.color = '#D97706';
  } else {
    isCorrection = false;
    if (notice) notice.style.display = 'none';
    document.getElementById('dateStatus').textContent = selectedDate === todayStr ? "✓ Today's class" : '';
    document.getElementById('dateStatus').style.color = '#16A34A';
  }
});

// Load roster
async function loadRoster(section, subjectId, date) {
  try {
    // Get batch from selected subject option
    const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
    const subjectText    = selectedOption.textContent || '';
    // Extract batch from text like "Data Structures & Algorithms (2023F)"
    const batchMatch     = subjectText.match(/\((\w+)\)/);
    const batch          = batchMatch ? batchMatch[1] : '';

    const [stuRes, attRes, condRes] = await Promise.all([
      fetch(`${API}/students?section=${section}${batch ? '&batch=' + batch : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API}/attendance/session?section=${section}&subjectId=${subjectId}&date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API}/attendance/conducted?section=${section}&subjectId=${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    sectionStudents  = await stuRes.json();
    const attData    = await attRes.json();
    const condData   = await condRes.json();
    classesConducted = condData.conducted || 0;

    presentToday = new Map();
    if (Array.isArray(attData)) {
      attData.forEach(a => {
        const roll = a.rollNumber || a.studentIdNo;
        const time = a.scannedAt
          ? new Date(a.scannedAt).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' })
          : '—';
        if (roll) presentToday.set(roll, time);
      });
    }

    studentHistory = {};
    await Promise.all(sectionStudents.map(async s => {
      try {
        const r = await fetch(`${API}/attendance/stats?rollNumber=${s.rollNumber}&subjectId=${subjectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        studentHistory[s.rollNumber] = await r.json();
      } catch {
        studentHistory[s.rollNumber] = { conducted: 0, attended: 0, missed: 0 };
      }
    }));

    renderRoster();
    updateStats();
    updateSubmitArea();

    document.getElementById('rosterSection').style.display = 'block';
    document.getElementById('rosterMeta').textContent =
      `${section} · ${subjectSelect.options[subjectSelect.selectedIndex].text} · ${formatDate(date)} · ${sectionStudents.length} students${isCorrection ? ' · CORRECTION MODE' : ''}`;

  } catch (err) {
    console.error('Roster load failed:', err);
    document.getElementById('rosterSection').style.display = 'block';
    document.getElementById('rosterBody').innerHTML =
      '<div style="padding:2rem;text-align:center;color:#DC2626;font-size:13px">Failed to load students.</div>';
  }
}

function renderRoster() {
  const body = document.getElementById('rosterBody');
  if (!Array.isArray(sectionStudents) || !sectionStudents.length) {
    body.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--muted);font-size:13px">No students registered in this section yet.</div>';
    return;
  }

  body.innerHTML = sectionStudents.map((s, i) => {
    const isPresent  = presentToday.has(s.rollNumber);
    const time       = isPresent ? presentToday.get(s.rollNumber) : '—';
    const hist       = studentHistory[s.rollNumber] || { attended: 0 };
    const conducted  = classesConducted;
    const attended   = hist.attended || 0;
    const absent     = Math.max(0, conducted - attended);
    const pct        = conducted > 0 ? Math.round((attended / conducted) * 100) : 0;
    const pctClass   = pct >= 75 ? 'good' : pct >= 60 ? 'warn' : 'danger';
    const absentClass = absent === 0 ? 'zero' : absent >= 9 ? 'danger' : 'some';

    return `
      <div class="roster-row ${isPresent ? 'is-present' : ''}" id="roster-${s.rollNumber}">
        <div class="roster-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="roster-student">
          <div class="roster-name">${s.name}</div>
          <div class="roster-roll">${s.rollNumber}</div>
        </div>
        <div class="roster-cell">${TOTAL_CLASSES}</div>
        <div class="roster-cell">${conducted}</div>
        <div class="roster-cell">${attended}</div>
        <div class="absent-count ${absentClass}">${absent}</div>
        <div class="pct-wrap">
          <div class="pct-text ${pctClass}">${pct}%</div>
          <div class="pct-bar-bg">
            <div class="pct-bar-fill ${pctClass}" style="width:${pct}%"></div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;">
          <div class="roster-check" onclick="toggleManual('${s.rollNumber}')" title="Click to mark present/absent">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.toggleManual = async function(rollNumber) {
  if (presentToday.has(rollNumber)) {
    // Remove from present — delete attendance record
    presentToday.delete(rollNumber);
    const row = document.getElementById(`roster-${rollNumber}`);
    if (row) row.classList.remove('is-present');

    // Call backend to remove this attendance record
    try {
      await fetch(`${API}/attendance/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          rollNumber,
          subjectId: subjectSelect.value,
          section:   sectionSelect.value,
          date:      selectedDate
        })
      });
    } catch { /* ignore */ }

  } else {
    // Mark present
    const time = new Date().toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });
    presentToday.set(rollNumber, time);
    const row = document.getElementById(`roster-${rollNumber}`);
    if (row) row.classList.add('is-present');

    try {
      await fetch(`${API}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          qrData:    rollNumber,
          subjectId: subjectSelect.value,
          section:   sectionSelect.value,
          date:      selectedDate
        })
      });
    } catch { /* ignore */ }
  }
  updateStats();
  updateSubmitArea();
};

function markPresentInRoster(rollNumber) {
  const time = new Date().toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });
  presentToday.set(rollNumber, time);
  const row = document.getElementById(`roster-${rollNumber}`);
  if (row) { row.classList.add('is-present'); row.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
  if (studentHistory[rollNumber]) studentHistory[rollNumber].attended = (studentHistory[rollNumber].attended || 0) + 1;
  updateRosterRow(rollNumber);
  updateStats();
  updateSubmitArea();
}

function updateRosterRow(rollNumber) {
  const hist      = studentHistory[rollNumber] || { attended: 0 };
  const conducted = classesConducted;
  const attended  = hist.attended || 0;
  const absent    = Math.max(0, conducted - attended);
  const pct       = conducted > 0 ? Math.round((attended / conducted) * 100) : 0;
  const pctClass  = pct >= 75 ? 'good' : pct >= 60 ? 'warn' : 'danger';
  const absentClass = absent === 0 ? 'zero' : absent >= 9 ? 'danger' : 'some';

  const row = document.getElementById(`roster-${rollNumber}`);
  if (!row) return;
  const cells = row.querySelectorAll('.roster-cell');
  if (cells[2]) cells[2].textContent = attended;
  const absentEl = row.querySelector('.absent-count');
  if (absentEl) { absentEl.textContent = absent; absentEl.className = `absent-count ${absentClass}`; }
  const pctText = row.querySelector('.pct-text');
  const pctFill = row.querySelector('.pct-bar-fill');
  if (pctText) { pctText.textContent = `${pct}%`; pctText.className = `pct-text ${pctClass}`; }
  if (pctFill) { pctFill.style.width = `${pct}%`; pctFill.className = `pct-bar-fill ${pctClass}`; }
}

function updateStats() {
  const present = presentToday.size;
  const absent  = Math.max(0, sectionStudents.length - present);
  document.getElementById('statPresent').textContent   = present;
  document.getElementById('statAbsent').textContent    = absent;
  document.getElementById('statConducted').textContent = classesConducted;
}

function updateSubmitArea() {
  const area = document.getElementById('submitArea');
  if (!sectionStudents.length) return;
  area.style.display = 'flex';
  const present = presentToday.size;
  const absent  = sectionStudents.length - present;
  document.getElementById('summaryText').innerHTML =
    `<strong>${present}</strong> present &nbsp;·&nbsp; <strong>${absent}</strong> absent &nbsp;·&nbsp; ${sectionStudents.length} total · <strong>${formatDate(selectedDate)}</strong>`;
}

// Submit attendance modal
document.getElementById('submitAttBtn').addEventListener('click', () => {
  document.getElementById('attModalSub').textContent =
    `${subjectSelect.options[subjectSelect.selectedIndex].text} · ${sectionSelect.value} · ${formatDate(selectedDate)}`;
  document.getElementById('summPresent').textContent = presentToday.size;
  document.getElementById('summAbsent').textContent  = sectionStudents.length - presentToday.size;
  document.getElementById('summTotal').textContent   = sectionStudents.length;

  const list = document.getElementById('attModalList');
  list.innerHTML = sectionStudents.map((s, i) => {
    const isPresent = presentToday.has(s.rollNumber);
    const hist      = studentHistory[s.rollNumber] || { attended: 0 };
    const conducted = classesConducted;
    const attended  = hist.attended || 0;
    const pct       = conducted > 0 ? Math.round((attended / conducted) * 100) : 0;
    return `
      <div class="att-list-row ${isPresent ? 'present' : 'absent'}">
        <div class="att-list-num">${String(i+1).padStart(2,'0')}</div>
        <div>
          <div class="att-list-name">${s.name}</div>
          <div style="font-size:11px;color:var(--terra);font-weight:500">${s.rollNumber}</div>
        </div>
        <div class="att-list-roll">${pct}% (${attended}/${conducted})</div>
        <div class="att-list-badge">${isPresent ? '✓ Present' : '✗ Absent'}</div>
      </div>
    `;
  }).join('');

  document.getElementById('attModalOverlay').classList.add('show');
});

document.getElementById('attCloseBtn').addEventListener('click', async () => {
  document.getElementById('attModalOverlay').classList.remove('show');
  if (!isCorrection) classesConducted++;
  document.getElementById('statConducted').textContent = classesConducted;
  await loadRoster(sectionSelect.value, subjectSelect.value, selectedDate);
  document.getElementById('rosterSection').scrollIntoView({ behavior: 'smooth' });
});

// Start camera
startBtn.addEventListener('click', async () => {
  if (!selectedDate) { alert('Please select a class date first.'); return; }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    video.srcObject = stream;
    await video.play();
    scanning = true;
    idleScreen.style.display = 'none';
    scanLine.style.display   = 'block';
    startBtn.style.display   = 'none';
    stopBtn.style.display    = 'block';
    sectionSelect.disabled   = true;
    subjectSelect.disabled   = true;
    dateSelect.disabled      = true;
    statusDot.classList.add('on');
    statusText.textContent = isCorrection
      ? `Correction mode — editing ${formatDate(selectedDate)}`
      : `Scanning — hold student ID card up to camera`;

    sessionBar.classList.add('visible');
    document.getElementById('sessionSection').textContent = sectionSelect.value;
    document.getElementById('sessionSubject').textContent = subjectSelect.options[subjectSelect.selectedIndex].text;
    document.getElementById('sessionDate').textContent    = formatDate(selectedDate);
    document.getElementById('sessionStats').classList.add('visible');

    await loadRoster(sectionSelect.value, subjectSelect.value, selectedDate);
    tick();
  } catch (err) {
    alert('Camera access denied. Please allow camera permission.');
    console.error(err);
  }
});

stopBtn.addEventListener('click', stopScanning);

function stopScanning() {
  scanning = false;
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (animId) cancelAnimationFrame(animId);
  video.srcObject = null;
  scanLine.style.display   = 'none';
  idleScreen.style.display = 'flex';
  startBtn.style.display   = 'block';
  stopBtn.style.display    = 'none';
  sectionSelect.disabled   = false;
  subjectSelect.disabled   = false;
  dateSelect.disabled      = false;
  statusDot.classList.remove('on');
  statusText.textContent = 'Camera off — configure session to begin';
  sessionBar.classList.remove('visible');
}

function tick() {
  if (!scanning) return;
  if (video.readyState >= 2) {
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    if (code && code.data && !cooldown && code.data !== lastQR) {
      lastQR = code.data;
      handleScan(code.data);
    }
  }
  animId = requestAnimationFrame(tick);
}

async function handleScan(qrData) {
  cooldown = true;
  setTimeout(() => { cooldown = false; lastQR = null; }, 4500);

  const subjectName = subjectSelect.options[subjectSelect.selectedIndex]?.text || '—';

  try {
    const res  = await fetch(`${API}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        qrData,
        subjectId: subjectSelect.value,
        section:   sectionSelect.value,
        date:      selectedDate
      })
    });
    const data = await res.json();

    if (res.status === 201) {
      markPresentInRoster(data.student.rollNumber);
      const stats = studentHistory[data.student.rollNumber] || { attended: 0, conducted: classesConducted };
      showIDCard('success', data.student, subjectName, stats);
    } else if (res.status === 409) {
      const stats = studentHistory[qrData] || { attended: 0, conducted: classesConducted };
      showIDCard('warn',
        { name: data.studentName, rollNumber: data.studentId, batch: '—', section: sectionSelect.value },
        subjectName, stats
      );
    } else {
      showIDCard('error',
        { name: 'Scan Failed', rollNumber: qrData, batch: '—', section: '—' },
        data.message || '', null
      );
    }
  } catch {
    showIDCard('error', { name: 'Network Error', rollNumber: '', batch: '', section: '' }, '', null);
  }
}

function showIDCard(type, student, subjectName, stats) {
  const overlay = document.getElementById('idCardOverlay');
  const card    = document.getElementById('idCard');

  document.getElementById('cardName').textContent    = student.name       || '—';
  document.getElementById('cardRoll').textContent    = student.rollNumber || '—';
  document.getElementById('cardBatch').textContent   = student.batch      || '—';
  document.getElementById('cardSection').textContent = student.section    || '—';
  document.getElementById('cardTime').textContent    = new Date().toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });

  const initials = (student.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('cardAvatar').textContent = initials;

  if (stats) {
    const attended  = stats.attended  || 0;
    const conducted = stats.conducted || classesConducted;
    const missed    = Math.max(0, conducted - attended);
    const remaining = TOTAL_CLASSES - conducted;
    const pct       = conducted > 0 ? Math.round((attended / conducted) * 100) : 0;
    const pctClass  = pct >= 75 ? 'good' : pct >= 60 ? 'warn' : 'danger';

    document.getElementById('cardAttended').textContent  = `${attended} / ${conducted}`;
    document.getElementById('cardConducted').textContent = `${conducted} / ${TOTAL_CLASSES}`;
    document.getElementById('cardRemaining').textContent = remaining;
    document.getElementById('cardMissed').textContent    = missed;

    document.getElementById('cardAttended').className  = `id-field-value ${pctClass}`;
    document.getElementById('cardMissed').className    = missed === 0 ? 'id-field-value good' : missed >= 9 ? 'id-field-value danger' : 'id-field-value warn';
    document.getElementById('cardConducted').className = 'id-field-value';
    document.getElementById('cardRemaining').className = 'id-field-value';
  } else {
    ['cardAttended','cardMissed','cardConducted','cardRemaining'].forEach(id => {
      document.getElementById(id).textContent = '—';
      document.getElementById(id).className   = 'id-field-value';
    });
  }

  const footerText = document.getElementById('cardFooterText');
  const statusIcon = document.getElementById('cardStatusIcon');
  card.className   = `id-card ${type}`;

  if (type === 'success') {
    statusIcon.textContent = '✓';
    footerText.textContent = isCorrection ? '✓ Attendance Corrected' : '✓ Attendance Marked Successfully';
    footerText.style.color = '#16A34A';
  } else if (type === 'warn') {
    statusIcon.textContent = '!';
    footerText.textContent = '⚠ Already Marked for this Class';
    footerText.style.color = '#D97706';
  } else {
    statusIcon.textContent = '✗';
    footerText.textContent = '✗ ' + (subjectName || 'Error');
    footerText.style.color = '#DC2626';
  }

  overlay.classList.add('show');
  setTimeout(() => overlay.classList.remove('show'), 4000);
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/pages/teacher-login.html';
});

// Mobile sidebar
const hamburger      = document.getElementById('hamburger');
const sidebar        = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
if (hamburger) { hamburger.addEventListener('click', () => { sidebar.classList.toggle('open'); sidebarOverlay.classList.toggle('show'); }); }
if (sidebarOverlay) { sidebarOverlay.addEventListener('click', () => { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); }); }