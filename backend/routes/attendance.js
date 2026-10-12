const express = require('express');
const fs = require('fs');
const path = require('path');
const { protectTeacher, protectStudent } = require('../middleware/auth');
const router = express.Router();

const dataPath = (file) => path.join(__dirname, '../data', file);
const readJSON  = (file) => JSON.parse(fs.readFileSync(dataPath(file), 'utf8'));

// GET /api/attendance/session
router.get('/session', protectTeacher, (req, res) => {
  try {
    const { section, subjectId, date } = req.query;
    const attendance = readJSON('attendance.json');
    const students   = readJSON('students.json');
    const records = attendance
      .filter(a => a.section === section && a.subjectId === subjectId && a.date === date)
      .map(a => {
        const student = students.find(s => s.id === a.studentId);
        return {
          ...a,
          studentName: student?.name,
          studentIdNo: student?.rollNumber,
          rollNumber:  student?.rollNumber
        };
      });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/conducted
router.get('/conducted', protectTeacher, (req, res) => {
  try {
    const { section, subjectId } = req.query;
    if (!section || !subjectId) return res.json({ conducted: 0 });
    
    const attendance  = readJSON('attendance.json');
    const uniqueDates = [...new Set(
      attendance
        .filter(a => a.section === section && a.subjectId === subjectId)
        .map(a => a.date)
    )];
    res.json({ conducted: uniqueDates.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/attendance/remove — unmark a student's attendance (correction)
router.post('/remove', protectTeacher, (req, res) => {
  try {
    const { rollNumber, subjectId, section, date } = req.body;

    // Check correction window — only allow within 7 days
    const classDate = new Date(date);
    const today     = new Date();
    today.setHours(0,0,0,0);
    const diffDays  = Math.floor((today - classDate) / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      return res.status(403).json({ message: 'Correction window expired. Cannot edit attendance older than 7 days.' });
    }

    const students   = readJSON('students.json');
    const attendance = readJSON('attendance.json');
    const student    = students.find(s => s.rollNumber === rollNumber);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const before = attendance.length;
    const updated = attendance.filter(a =>
      !(a.studentId === student.id && a.subjectId === subjectId && a.date === date)
    );

    if (updated.length === before) {
      return res.status(404).json({ message: 'No attendance record found to remove' });
    }

    writeJSON('attendance.json', updated);
    res.json({ message: `Attendance removed for ${student.name} on ${date}` });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/stats
router.get('/stats', protectTeacher, (req, res) => {
  try {
    const { rollNumber, subjectId } = req.query;
    if (!rollNumber || !subjectId) return res.json({ conducted: 0, attended: 0, missed: 0 });

    const attendance    = readJSON('attendance.json');
    const forSubject    = attendance.filter(a => a.subjectId === subjectId);
    const uniqueDates   = [...new Set(forSubject.map(a => a.date))];
    const studentAtt    = forSubject.filter(a => a.rollNumber === rollNumber && a.status === 'present');

    res.json({
      conducted: uniqueDates.length,
      attended:  studentAtt.length,
      missed:    Math.max(0, uniqueDates.length - studentAtt.length)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/my — student views their own attendance
router.get('/my', protectStudent, (req, res) => {
  try {
    const attendance = readJSON('attendance.json');
    const subjects   = readJSON('subjects.json');
    const myRecords  = attendance.filter(a => a.studentId === req.student.id || a.rollNumber === req.student.rollNumber);

    const grouped = {};
    for (const r of myRecords) {
      const sub = subjects.find(s => s.id === r.subjectId);
      if (!sub) continue;
      if (!grouped[r.subjectId]) {
        grouped[r.subjectId] = { subject: sub.name, code: sub.code, total: 0, present: 0, records: [] };
      }
      grouped[r.subjectId].total++;
      if (r.status === 'present') grouped[r.subjectId].present++;
      grouped[r.subjectId].records.push({ date: r.date, status: r.status });
    }

    res.json(Object.values(grouped).map(s => ({
      ...s,
      percentage: s.total ? Math.round((s.present / s.total) * 100) : 0
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;