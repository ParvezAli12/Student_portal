const express = require('express');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { protectTeacher } = require('../middleware/auth');
const router = express.Router();

const dataPath  = (file) => path.join(__dirname, '../data', file);
const readJSON  = (file) => JSON.parse(fs.readFileSync(dataPath(file), 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));

// POST /api/students — Add new student + generate QR
router.post('/', protectTeacher, async (req, res) => {
  try {
    const { name, rollNumber, email, password, section, batch, enrolledSubjects } = req.body;

    if (!name || !rollNumber || !email || !password || !section || !batch) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const students = readJSON('students.json');

    // Check duplicate roll number
    if (students.find(s => s.rollNumber === rollNumber)) {
      return res.status(409).json({ message: `Roll number ${rollNumber} already exists` });
    }

    // Check duplicate email
    if (students.find(s => s.email === email)) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // QR data is the roll number directly
    const qrData  = rollNumber;
    const qrImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2
    });

    const passwordHash = await bcrypt.hash(password, 12);

    const newStudent = {
      id:               `stu-${Date.now()}`,
      name,
      rollNumber,
      email,
      passwordHash,
      section,
      batch,
      enrolledSubjects: enrolledSubjects || [],
      qrData,
      qrImage
    };

    students.push(newStudent);
    writeJSON('students.json', students);

    res.status(201).json({
      message: 'Student registered successfully',
      student: {
        id:               newStudent.id,
        name:             newStudent.name,
        rollNumber:       newStudent.rollNumber,
        email:            newStudent.email,
        section:          newStudent.section,
        batch:            newStudent.batch,
        enrolledSubjects: newStudent.enrolledSubjects,
        qrImage:          newStudent.qrImage
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students — Get all students (filter by section or batch)
router.get('/', protectTeacher, (req, res) => {
  try {
    let students = readJSON('students.json');

    if (req.query.section) students = students.filter(s => s.section === req.query.section);
    if (req.query.batch)   students = students.filter(s => s.batch   === req.query.batch);

    res.json(students.map(s => ({
      id:               s.id,
      name:             s.name,
      rollNumber:       s.rollNumber,
      email:            s.email,
      section:          s.section,
      batch:            s.batch,
      enrolledSubjects: s.enrolledSubjects || [],
      qrImage:          s.qrImage
    })));

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/:id — Get single student by id
router.get('/:id', protectTeacher, (req, res) => {
  try {
    const students = readJSON('students.json');
    const student  = students.find(s => s.id === req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json({
      id:               student.id,
      name:             student.name,
      rollNumber:       student.rollNumber,
      email:            student.email,
      section:          student.section,
      batch:            student.batch,
      enrolledSubjects: student.enrolledSubjects || [],
      qrImage:          student.qrImage
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/students/:id — Remove student
router.delete('/:id', protectTeacher, (req, res) => {
  try {
    let students = readJSON('students.json');
    const index  = students.findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Student not found' });

    const removed = students.splice(index, 1)[0];
    writeJSON('students.json', students);

    res.json({ message: `${removed.name} removed successfully` });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;