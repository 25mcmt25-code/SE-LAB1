const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// In-memory store for simplicity
let students = [];

// LAB2 calculation logic ported to JavaScript
function computeFields(s) {
  // Calculate total marks (max 500: 5 subjects × 100 per subject)
  s.total = s.marks.reduce((sum, m) => sum + (Number(m) || 0), 0);
  
  // Percentage
  s.percentage = Math.round((s.total / 500.0) * 10000) / 100;
  
  // Grade (based on LAB2 Calculation.c)
  if (s.percentage >= 90) s.grade = 'O';
  else if (s.percentage >= 85) s.grade = 'A+';
  else if (s.percentage >= 75) s.grade = 'A';
  else if (s.percentage >= 65) s.grade = 'B+';
  else if (s.percentage >= 60) s.grade = 'B';
  else if (s.percentage >= 50) s.grade = 'C';
  else if (s.percentage >= 40) s.grade = 'D';
  else s.grade = 'F';
  
  // CGPA (based on LAB2 Calculation.c)
  if (s.percentage >= 90) s.cgpa = 10.0;
  else if (s.percentage >= 85) s.cgpa = 9.0;
  else if (s.percentage >= 75) s.cgpa = 8.0;
  else if (s.percentage >= 65) s.cgpa = 7.0;
  else if (s.percentage >= 60) s.cgpa = 6.0;
  else if (s.percentage >= 55) s.cgpa = 5.0;
  else if (s.percentage >= 50) s.cgpa = 4.0;
  else s.cgpa = 0.0;
}

router.get('/', (req, res) => {
  res.json(students);
});

router.get('/report', (req, res) => {
  const total = students.length;
  const avgPercentage = total ? Math.round((students.reduce((a, b) => a + b.percentage, 0) / total) * 100) / 100 : 0;
  const avgCGPA = total ? Math.round((students.reduce((a, b) => a + b.cgpa, 0) / total) * 100) / 100 : 0;
  const grades = students.reduce((acc, s) => { acc[s.grade] = (acc[s.grade] || 0) + 1; return acc; }, {});
  res.json({ total, avgPercentage, avgCGPA, grades });
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    const text = req.file.buffer.toString('utf8');
    const records = parse(text, { columns: true, skip_empty_lines: true });
    const added = [];
    const errors = [];
    
    records.forEach((r, idx) => {
      try {
        // Expected columns: ID/studentId, Name/name, s1_minor, s1_major, s2_minor, ..., s5_minor, s5_major
        const id = String(r.ID || r.id || r.studentId || '').trim();
        const name = String(r.Name || r.name || '').trim();
        
        if (!id || !name) {
          throw new Error('Missing ID or Name');
        }
        
        // Extract marks from subject columns (s1_minor, s1_major, etc.)
        const marks = [];
        for (let subj = 1; subj <= 5; subj++) {
          const minorKey = `s${subj}_minor`;
          const majorKey = `s${subj}_major`;
          const minor = Number(r[minorKey]) || 0;
          const major = Number(r[majorKey]) || 0;
          marks.push(minor, major); // array of 10 marks total (5 subjects × 2 marks)
        }
        
        if (marks.length !== 10) {
          throw new Error(`Expected 10 marks (5 subjects × 2), got ${marks.length}`);
        }
        
        const student = { studentId: id, name, marks };
        computeFields(student);
        students.push(student);
        added.push(student);
      } catch (e) {
        errors.push({ row: idx + 2, error: e.message }); // +2 because row 1 is header
      }
    });
    
    res.json({ added: added.length, errors, message: `Uploaded ${added.length} students` });
  } catch (err) {
    res.status(400).json({ message: 'CSV parse error', error: err.message });
  }
});

module.exports = router;
