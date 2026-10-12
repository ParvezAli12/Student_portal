const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, '../data', file), 'utf8'));

const protectTeacher = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const teachers = readJSON('teachers.json');
    const teacher = teachers.find(t => t.id === decoded.id);
    if (!teacher) return res.status(401).json({ message: 'Teacher not found' });
    req.teacher = teacher;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const protectStudent = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const students = readJSON('students.json');
    const student = students.find(s => s.id === decoded.id);
    if (!student) return res.status(401).json({ message: 'Student not found' });
    req.student = student;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { protectTeacher, protectStudent };