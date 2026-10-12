require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/scan',       require('./routes/scan'));
app.use('/api/students',   require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.use('/api/marks', require('./routes/marks'));

app.use('/api/timetable', require('./routes/timetable'));

// Serve frontend static files
const frontendPath = path.resolve(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

app.listen(process.env.PORT || 5000, () => {
  console.log('Server running on http://localhost:5000');
  console.log('Open: http://localhost:5000/pages/teacher-login.html');
});