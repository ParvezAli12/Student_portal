const { useState, useEffect } = React;

const API     = 'http://localhost:5000/api';
const token   = localStorage.getItem('studentToken');
const student = JSON.parse(localStorage.getItem('studentInfo') || '{}');

// ── Custom Hook: fetches and caches the daily quote ──
function useDailyQuote() {
  const [quote, setQuote]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchQuote() {
      try {
        const res  = await fetch(`${API}/quote/today`);
        const data = await res.json();
        if (!cancelled) setQuote(data);
      } catch {
        if (!cancelled) setQuote({ quote: 'Stay curious. Stay consistent.', author: 'SSUET Portal' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchQuote();
    return () => { cancelled = true; }; // cleanup on unmount
  }, []); // run once on mount

  return { quote, loading };
}

// ── Custom Hook: fetches student attendance + marks together ──
function useStudentOverview() {
  const [data, setData] = useState({ attendance: [], marks: [], cgpa: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [attRes, marksRes] = await Promise.all([
          fetch(`${API}/attendance/my`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/marks/my`,      { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const attendance = await attRes.json();
        const marksData  = await marksRes.json();

        setData({
          attendance: Array.isArray(attendance) ? attendance : [],
          marks:      marksData.marks || [],
          cgpa:       marksData.cgpa  || 0
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { ...data, loading, error };
}

// ── Quote of the Day card ──
function QuoteCard() {
  const { quote, loading } = useDailyQuote();

  return (
    <div className="card s-card" style={{ marginBottom: '1.25rem', background: '#1B3A2D', border: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <span style={{ fontSize: '20px' }}>💡</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '8px' }}>
            Thought for Today
          </div>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading today's quote…</div>
          ) : (
            <>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: 'white', lineHeight: 1.5, marginBottom: '6px' }}>
                "{quote.quote}"
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                — {quote.author}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Attendance row component ──
function AttendanceRow({ subject }) {
  const pct = subject.percentage || 0;
  const cls = pct >= 75 ? 'ok' : pct >= 60 ? 'mid' : 'low';
  const color = pct >= 75 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy)' }}>{subject.subject}</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{subject.present} / {subject.total} classes</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '100px' }}>
          <div className="att-bar-bg"><div className={`att-bar-fill ${cls}`} style={{ width: `${pct}%` }}></div></div>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color, minWidth: '40px', textAlign: 'right' }}>{pct}%</div>
      </div>
    </div>
  );
}

// ── Marks row component ──
function MarksRow({ mark }) {
  return (
    <div className="marks-summary-row">
      <div>
        <div className="msub-name">{mark.subjectName}</div>
        <div className="msub-code">{mark.subjectCode}</div>
      </div>
      <div className="msub-right">
        <div className="msub-total">{mark.total || 0}<span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 400 }}>/100</span></div>
        <div className={`msub-grade grade-${mark.grade || 'F'}`}>{mark.grade || 'F'}</div>
      </div>
    </div>
  );
}

// ── Main Dashboard App ──
function StudentDashboard() {
  const { attendance, marks, cgpa, loading, error } = useStudentOverview();
  const [now] = useState(new Date());

  const avgAttendance = attendance.length
    ? Math.round(attendance.reduce((s, a) => s + (a.percentage || 0), 0) / attendance.length)
    : 0;

  const lowSubjects = attendance.filter(a => a.percentage < 75);

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  return (
    <>
      <div className="s-topbar">
        <div>
          <div className="page-title">Welcome, {student.name?.split(' ')[0] || 'Student'}</div>
          <div className="page-sub">
            {now.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <a href="/pages/student-qr.html" className="qr-shortcut">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3v3M21 21h-3M16 16h.01"/></svg>
          My QR Code
        </a>
      </div>

      <QuoteCard />

      {lowSubjects.length > 0 && (
        <div className="warning-banner">
          <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>⚠ You have {lowSubjects.length} subject{lowSubjects.length > 1 ? 's' : ''} with attendance below 75% — {lowSubjects.map(s => s.subject).join(', ')}</span>
        </div>
      )}

      <div className="s-stats-grid">
        <div className="s-stat-card">
          <div className="s-stat-icon att-icon">
            <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="s-stat-val">{loading ? '—' : `${avgAttendance}%`}</div>
          <div className="s-stat-label">Avg Attendance</div>
        </div>
        <div className="s-stat-card">
          <div className="s-stat-icon sub-icon">
            <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
          </div>
          <div className="s-stat-val">{(student.enrolledSubjects || []).length}</div>
          <div className="s-stat-label">Enrolled Subjects</div>
        </div>
        <div className="s-stat-card">
          <div className="s-stat-icon gpa-icon">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
          </div>
          <div className="s-stat-val">{loading ? '—' : cgpa.toFixed(2)}</div>
          <div className="s-stat-label">CGPA</div>
        </div>
        <div className="s-stat-card">
          <div className="s-stat-icon sec-icon">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div className="s-stat-val">{student.section} · {student.batch}</div>
          <div className="s-stat-label">Section</div>
        </div>
      </div>

      <div className="card s-card" style={{ marginBottom: '1.25rem' }}>
        <div className="s-card-title">Attendance Overview</div>
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : error ? (
          <div className="empty-state" style={{ color: '#DC2626' }}>Failed to load: {error}</div>
        ) : attendance.length === 0 ? (
          <div className="empty-state">No attendance records yet</div>
        ) : (
          attendance.map((s, i) => <AttendanceRow key={i} subject={s} />)
        )}
      </div>

      <div className="card s-card">
        <div className="s-card-title">Marks Summary</div>
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : marks.length === 0 ? (
          <div className="empty-state">No marks entered yet</div>
        ) : (
          marks.map((m, i) => <MarksRow key={i} mark={m} />)
        )}
      </div>
    </>
  );
}

// Mount the React app
const root = ReactDOM.createRoot(document.getElementById('reactDashboardRoot'));
root.render(<StudentDashboard />);