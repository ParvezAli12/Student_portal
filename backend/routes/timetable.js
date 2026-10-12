const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { protectTeacher, protectStudent } = require('../middleware/auth');
const router  = express.Router();

const dataPath = (file) => path.join(__dirname, '../data', file);
const readJSON = (file) => JSON.parse(fs.readFileSync(dataPath(file), 'utf8'));

// GET /api/timetable/subject/:subjectId — get all scheduled dates for a subject
router.get('/subject/:subjectId', protectTeacher, (req, res) => {
  try {
    const timetable = readJSON('timetable.json');
    const entry     = timetable.find(t => t.subjectId === req.params.subjectId);
    if (!entry) return res.status(404).json({ message: 'Timetable not found for this subject' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/timetable/today/:subjectId — get today's class if scheduled
router.get('/today/:subjectId', protectTeacher, (req, res) => {
  try {
    const timetable = readJSON('timetable.json');
    const entry     = timetable.find(t => t.subjectId === req.params.subjectId);
    if (!entry) return res.json({ hasClassToday: false });

    const today     = new Date().toISOString().split('T')[0];
    const hasClass  = entry.classDates.includes(today);
    res.json({ hasClassToday: hasClass, today });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/timetable/student — student gets their full timetable
router.get('/student', protectStudent, (req, res) => {
  try {
    const timetable = readJSON('timetable.json');
    const subjects  = readJSON('subjects.json');
    const student   = require('../data/students.json').find(s => s.id === req.student.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const enrolled = student.enrolledSubjects || [];
    const result   = timetable
      .filter(t => enrolled.includes(t.subjectId))
      .map(t => {
        const sub = subjects.find(s => s.id === t.subjectId);
        return {
          subjectId:   t.subjectId,
          subjectName: sub?.name || '—',
          subjectCode: sub?.code || '—',
          pattern:     t.pattern,
          days:        t.days,
          classDates:  t.classDates,
          totalClasses: t.classDates.length
        };
      });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;