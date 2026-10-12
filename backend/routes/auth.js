const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const fs      = require('fs');
const path    = require('path');
const { protectTeacher, protectStudent } = require('../middleware/auth');
const router  = express.Router();

const dataPath  = (file) => path.join(__dirname, '../data', file);
const readJSON  = (file) => JSON.parse(fs.readFileSync(dataPath(file), 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));
const sign      = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// ── TEACHER LOGIN ──
router.post('/teacher/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const teachers = readJSON('teachers.json');
    const teacher  = teachers.find(t => t.email === email);
    if (!teacher) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, teacher.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({
      token: sign(teacher.id),
      teacher: {
        id:          teacher.id,
        name:        teacher.name,
        email:       teacher.email,
        employeeId:  teacher.employeeId,
        assignments: teacher.assignments
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── STUDENT LOGIN ──
router.post('/student/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    if (!studentId || !password)
      return res.status(400).json({ message: 'Roll number and password required' });
    const students = readJSON('students.json');
    const student  = students.find(s => s.rollNumber === studentId);
    if (!student) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, student.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({
      token: sign(student.id),
      student: {
        id:               student.id,
        name:             student.name,
        rollNumber:       student.rollNumber,
        email:            student.email,
        section:          student.section,
        batch:            student.batch,
        enrolledSubjects: student.enrolledSubjects || [],
        qrImage:          student.qrImage
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── STUDENT CHANGE PASSWORD ──
router.post('/student/change-password', protectStudent, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both fields required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const students = readJSON('students.json');
    const idx      = students.findIndex(s => s.id === req.student.id);
    if (idx === -1) return res.status(404).json({ message: 'Student not found' });

    const match = await bcrypt.compare(currentPassword, students[idx].passwordHash);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    students[idx].passwordHash = await bcrypt.hash(newPassword, 12);
    writeJSON('students.json', students);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;