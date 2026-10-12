const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { protectTeacher, protectStudent } = require('../middleware/auth');
const router  = express.Router();

const dataPath  = (file) => path.join(__dirname, '../data', file);
const readJSON  = (file) => JSON.parse(fs.readFileSync(dataPath(file), 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));

const GRADE_SCALE = [
  { min: 85, grade: 'A+',  gpa: 4.0 },
  { min: 80, grade: 'A',  gpa: 3.66 },
  { min: 75, grade: 'B+',  gpa: 3.33 },
  { min: 70, grade: 'B',  gpa: 3.0 },
  { min: 65, grade: 'C+',  gpa: 2.66 },
  { min: 60, grade: 'C',  gpa: 2.33 },
  { min: 55, grade: 'D+',  gpa: 2.0 },
  { min: 50, grade: 'D',  gpa: 1.66 },
  { min: 45, grade: 'E+',  gpa: 1.33 },
  { min: 40, grade: 'E',  gpa: 1.0 },
  { min: 0,  grade: 'F',  gpa: 0.0 },
];

function calcGrade(total) {
  return GRADE_SCALE.find(g => total >= g.min) || { grade: 'F', gpa: 0.0 };
}

function calcTotal(marks) {
  return Math.min(marks.quiz1   || 0, 3)
       + Math.min(marks.quiz2   || 0, 3)
       + Math.min(marks.quiz3   || 0, 4)
       + Math.min(marks.assign1 || 0, 3)
       + Math.min(marks.assign2 || 0, 3)
       + Math.min(marks.assign3 || 0, 4)
       + Math.min(marks.midterm || 0, 30)
       + Math.min(marks.final   || 0, 50);
}

// Helper — get all students this teacher is allowed to manage
function getTeacherStudents(teacher) {
  const students = readJSON('students.json');
  const allowed  = [];

  for (const assignment of teacher.assignments) {
    const { batch, sections } = assignment;
    const matching = students.filter(s =>
      s.batch === batch && sections.includes(s.section)
    );
    matching.forEach(s => {
      if (!allowed.find(a => a.id === s.id)) allowed.push(s);
    });
  }
  return allowed;
}

// POST /api/marks — save marks (teacher can only save for their students)
router.post('/', protectTeacher, (req, res) => {
  try {
    const { rollNumber, subjectId, quiz1, quiz2, quiz3, assign1, assign2, assign3, midterm, final } = req.body;
    if (!rollNumber || !subjectId) return res.status(400).json({ message: 'rollNumber and subjectId required' });

    // Check teacher is assigned to this subject
    const isAssigned = req.teacher.assignments.find(a => a.subjectId === subjectId);
    if (!isAssigned) return res.status(403).json({ message: 'You are not assigned to this subject' });

    // Check student is in teacher's batch/section
    const allowedStudents = getTeacherStudents(req.teacher);
    const student = allowedStudents.find(s => s.rollNumber === rollNumber);
    if (!student) return res.status(403).json({ message: 'This student is not in your assigned sections' });

    const allMarks = readJSON('marks.json');
    const existing = allMarks.findIndex(m => m.rollNumber === rollNumber && m.subjectId === subjectId);

    const marks  = { quiz1: quiz1||0, quiz2: quiz2||0, quiz3: quiz3||0, assign1: assign1||0, assign2: assign2||0, assign3: assign3||0, midterm: midterm||0, final: final||0 };
    const total  = calcTotal(marks);
    const grade  = calcGrade(total);

    const record = {
      id:        existing >= 0 ? allMarks[existing].id : `marks-${Date.now()}`,
      rollNumber,
      subjectId,
      teacherId: req.teacher.id,
      ...marks,
      total,
      grade:     grade.grade,
      gpa:       grade.gpa,
      updatedAt: new Date().toISOString()
    };

    if (existing >= 0) allMarks[existing] = record;
    else allMarks.push(record);

    writeJSON('marks.json', allMarks);
    res.status(201).json({ message: 'Marks saved', record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/marks?subjectId=&section= — only teacher's own students
router.get('/', protectTeacher, (req, res) => {
  try {
    const { subjectId, section } = req.query;

    // Validate teacher owns this subject
    const assignment = req.teacher.assignments.find(a => a.subjectId === subjectId);
    if (!assignment) return res.status(403).json({ message: 'You are not assigned to this subject' });

    // Validate section is in teacher's assignment
    if (section && !assignment.sections.includes(section)) {
      return res.status(403).json({ message: 'You are not assigned to this section for this subject' });
    }

    const allMarks = readJSON('marks.json');
    const students = readJSON('students.json');

    // Get only this teacher's students for this subject
    const allowedRolls = students
      .filter(s => s.batch === assignment.batch && assignment.sections.includes(s.section) && (!section || s.section === section))
      .map(s => s.rollNumber);

    const filtered = allMarks
      .filter(m => m.subjectId === subjectId && allowedRolls.includes(m.rollNumber))
      .map(m => {
        const stu = students.find(s => s.rollNumber === m.rollNumber);
        return { ...m, studentName: stu?.name || '—', studentSection: stu?.section || '—' };
      });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/marks/student/:rollNumber — teacher can only view their own students
router.get('/student/:rollNumber', protectTeacher, (req, res) => {
  try {
    const allowedStudents = getTeacherStudents(req.teacher);
    const student         = allowedStudents.find(s => s.rollNumber === req.params.rollNumber);

    if (!student) {
      return res.status(403).json({ message: 'This student is not in your assigned sections' });
    }

    const allMarks = readJSON('marks.json');
    const subjects = readJSON('subjects.json');

    // Only show marks for subjects this teacher teaches
    const teacherSubjectIds = req.teacher.assignments.map(a => a.subjectId);
    const studentMarks      = allMarks
      .filter(m => m.rollNumber === req.params.rollNumber && teacherSubjectIds.includes(m.subjectId))
      .map(m => {
        const sub = subjects.find(s => s.id === m.subjectId);
        return { ...m, subjectName: sub?.name || '—', subjectCode: sub?.code || '—', creditHours: sub?.creditHours || 3 };
      });

    const totalCredits = studentMarks.reduce((sum, r) => sum + (r.creditHours || 3), 0);
    const weightedGPA  = studentMarks.reduce((sum, r) => sum + (r.gpa * (r.creditHours || 3)), 0);
    const cgpa         = totalCredits > 0 ? Math.round((weightedGPA / totalCredits) * 100) / 100 : 0;

    res.json({ student, marks: studentMarks, cgpa });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/marks/result/:rollNumber — student views their own result
router.get('/result/:rollNumber', protectStudent, (req, res) => {
  try {
    if (req.student.rollNumber !== req.params.rollNumber) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allMarks = readJSON('marks.json');
    const subjects = readJSON('subjects.json');
    const students = readJSON('students.json');
    const student  = students.find(s => s.rollNumber === req.params.rollNumber);

    const studentMarks = allMarks
      .filter(m => m.rollNumber === req.params.rollNumber)
      .map(m => {
        const sub = subjects.find(s => s.id === m.subjectId);
        return { ...m, subjectName: sub?.name || '—', subjectCode: sub?.code || '—', creditHours: sub?.creditHours || 3 };
      });

    const totalCredits = studentMarks.reduce((sum, r) => sum + (r.creditHours || 3), 0);
    const weightedGPA  = studentMarks.reduce((sum, r) => sum + (r.gpa * (r.creditHours || 3)), 0);
    const cgpa         = totalCredits > 0 ? Math.round((weightedGPA / totalCredits) * 100) / 100 : 0;

    res.json({ student, marks: studentMarks, cgpa });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/marks/my — student views their own marks
router.get('/my', protectStudent, (req, res) => {
  try {
    const allMarks = readJSON('marks.json');
    const subjects = readJSON('subjects.json');
    const students = readJSON('students.json');
    const student  = students.find(s => s.id === req.student.id);

    if (!student) return res.status(404).json({ message: 'Student not found' });

    const studentMarks = allMarks
      .filter(m => m.rollNumber === student.rollNumber)
      .map(m => {
        const sub = subjects.find(s => s.id === m.subjectId);
        return {
          ...m,
          subjectName: sub?.name       || '—',
          subjectCode: sub?.code       || '—',
          creditHours: sub?.creditHours || 3
        };
      });

    const totalCredits = studentMarks.reduce((sum, r) => sum + (r.creditHours || 3), 0);
    const weightedGPA  = studentMarks.reduce((sum, r) => sum + (r.gpa * (r.creditHours || 3)), 0);
    const cgpa         = totalCredits > 0
      ? Math.round((weightedGPA / totalCredits) * 100) / 100
      : 0;

    res.json({ student, marks: studentMarks, cgpa });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;