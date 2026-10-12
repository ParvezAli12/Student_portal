const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { protectTeacher } = require('../middleware/auth');
const router  = express.Router();

const dataPath  = (file) => path.join(__dirname, '../data', file);
const readJSON  = (file) => JSON.parse(fs.readFileSync(dataPath(file), 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));

router.post('/', protectTeacher, (req, res) => {
  try {
    const { qrData, subjectId, section, date } = req.body;

    const students   = readJSON('students.json');
    const attendance = readJSON('attendance.json');
    const subjects   = readJSON('subjects.json');

    // Find student by QR (roll number)
    const student = students.find(s => s.rollNumber === qrData || s.qrData === qrData);
    if (!student) {
      return res.status(404).json({ message: `Invalid QR. No student found for: ${qrData}` });
    }

    // Validate section
    if (student.section !== section) {
      return res.status(403).json({
        message: `Wrong section. ${student.name} is in ${student.section}, not ${section}`,
        studentName: student.name
      });
    }

    // Validate batch matches subject
    const subject = subjects.find(s => s.id === subjectId);
    if (subject && student.batch !== subject.batch) {
      return res.status(403).json({
        message: `Wrong batch. ${student.name} is ${student.batch} student but subject is for ${subject.batch}`,
        studentName: student.name
      });
    }

    // Check correction window for past dates
    const classDate = new Date(date);
    const today     = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays  = Math.floor((today - classDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      return res.status(403).json({ message: 'Correction window expired. Cannot mark attendance older than 7 days.' });
    }

    // Check duplicate
    const duplicate = attendance.find(a =>
      a.studentId === student.id && a.subjectId === subjectId && a.date === date
    );
    if (duplicate) {
      return res.status(409).json({
        message: 'Already marked present',
        studentName: student.name,
        studentId:   student.rollNumber
      });
    }

    // Save attendance
    const record = {
      id:         `att-${Date.now()}`,
      studentId:  student.id,
      rollNumber: student.rollNumber,
      subjectId,
      teacherId:  req.teacher.id,
      section,
      batch:      student.batch,
      date,
      status:     'present',
      scannedAt:  new Date().toISOString()
    };

    attendance.push(record);
    writeJSON('attendance.json', attendance);

    res.status(201).json({
      message: 'Marked present',
      student: {
        name:       student.name,
        rollNumber: student.rollNumber,
        section:    student.section,
        batch:      student.batch
      },
      record: { date: record.date, scannedAt: record.scannedAt }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;