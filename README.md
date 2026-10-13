[README.md](https://github.com/user-attachments/files/33385726/README.md)
# Student Portal

A full-stack web-based Student & Teacher Portal built as a **Web Engineering course project**.

The core feature is a **live QR code attendance system** — teachers open a scanner in the browser, students hold up their ID card, and attendance is marked instantly with full class roster tracking. The system also handles marks entry, GPA calculation, result cards, and a complete student dashboard.

---

## Features

### Teacher Portal
- 🔐 Secure login with JWT authentication
- 📷 **Live QR scanner** — webcam-based, marks attendance in real time
- 📋 Class roster with live present/absent tracking per session
- 📅 Timetable-based class scheduling (Mon–Fri, 3 classes/week per subject)
- ✏️ Marks entry — Quiz, Assignment, Midterm, Final per student
- 📊 Auto-calculated grades (A+ to F) and GPA per subject
- 🖨️ Printable result cards and student ID cards with QR code
- ⚠️ At-risk student detection (below 75% attendance)
- 🔁 Attendance correction within a 7-day window
- 👥 Add students with auto-generated QR codes

### Student Portal
- 🔐 Login with Roll Number + Password
- 📊 Dashboard powered by **React 18 hooks** (`useState`, `useEffect`, custom hooks)
- 💡 Daily educational quote from ZenQuotes API (third-party API integration)
- ✅ Attendance view per subject — conducted, attended, absent, percentage
- 📝 Marks breakdown — Quiz, Assignment, Midterm, Final with grades
- 🎓 Semester result card — printable, with CGPA and overall grade
- 📱 QR code viewer and printable ID card
- 🔑 Change password from profile page

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| React (partial) | React 18 via CDN, Babel Standalone |
| Backend | Node.js, Express.js |
| Auth | JWT (jsonwebtoken), bcryptjs |
| QR Scanning | jsQR (local file) |
| QR Generation | qrcode (npm) |
| Database | JSON flat files (no MongoDB/SQL needed) |
| Third-party API | ZenQuotes API (proxied via Express) |

---

## Project Structure

```
student-portal/
├── backend/
│   ├── data/
│   │   ├── teachers.json      ← teacher accounts
│   │   ├── students.json      ← student accounts + QR data
│   │   ├── attendance.json    ← attendance records
│   │   ├── marks.json         ← marks per student per subject
│   │   ├── subjects.json      ← 15 subjects across 3 batches
│   │   └── timetable.json     ← class schedule (Jun–Nov 2026)
│   ├── middleware/
│   │   └── auth.js            ← JWT protectTeacher / protectStudent
│   ├── routes/
│   │   ├── auth.js            ← login + change password
│   │   ├── scan.js            ← QR scan → mark attendance
│   │   ├── students.js        ← student CRUD + QR generation
│   │   ├── attendance.js      ← attendance records + stats
│   │   ├── marks.js           ← marks entry + GPA calculation
│   │   ├── timetable.js       ← class schedule endpoints
│   │   └── quote.js           ← ZenQuotes API proxy
│   ├── seed.js                ← seeds all teachers, students, timetable
│   ├── server.js              ← Express app entry point
│   └── .env                   ← environment variables
└── frontend/
    ├── css/
    │   ├── main.css           ← shared styles + sidebar
    │   ├── teacher-login.css
    │   ├── teacher-dashboard.css
    │   ├── scanner.css
    │   ├── student-portal.css
    │   ├── marks-entry.css
    │   └── result-card.css
    ├── js/
    │   ├── teacher-login.js
    │   ├── teacher-dashboard.js
    │   ├── scanner.js         ← QR scan loop, roster, correction mode
    │   ├── add-student.js
    │   ├── students-list.js
    │   ├── marks-entry.js
    │   ├── result-card.js
    │   ├── student-attendance.js
    │   ├── student-marks.js
    │   ├── student-result.js
    │   ├── student-qr.js
    │   ├── student-profile.js
    │   └── jsQR.js            ← QR decoder (local, no internet needed)
    └── pages/
        ├── teacher-login.html
        ├── teacher-dashboard.html
        ├── scanner.html
        ├── add-student.html
        ├── students-list.html
        ├── marks-entry.html
        ├── result-card.html
        ├── print-card.html
        ├── student-login.html
        ├── student-dashboard.html  ← React 18 + hooks
        ├── student-attendance.html
        ├── student-marks.html
        ├── student-result.html
        ├── student-qr.html
        └── student-profile.html
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- A modern browser (Chrome recommended for camera access)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/ParvezAli12/Student_portal.git
cd Student_portal
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Set up environment variables**

Create a `.env` file inside the `backend` folder:
```
PORT=5000
JWT_SECRET=ssuet_secret_key_2024
JWT_EXPIRES_IN=8h
```

**4. Seed the database**

This creates all teachers, 270 students across 3 batches/sections, subjects, and the semester timetable:
```bash
node seed.js
```

You should see:
```
✓ subjects.json  — 15 subjects across 3 batches
✓ teachers.json  — 6 teachers
✓ students.json  — 270 students
✓ timetable.json — 15 subjects scheduled
```

**5. Start the server**
```bash
npm run dev
```

**6. Open in browser**
```
http://localhost:5000/pages/teacher-login.html
```

---

## Demo Credentials

### Teacher Logins
All teacher passwords: `password123`

| Name | Email | Subjects |
|---|---|---|
| Dr. Imran Khalid | imran@ssuet.edu.pk | Operating Systems, Applied Physics, Information Security |
| Ms. Ayesha Siddiqui | ayesha@ssuet.edu.pk | Database Management System, E-Commerce |
| Mr. Bilal Hassan | bilal@ssuet.edu.pk | Data Structures & Algorithms, OOP, Web Engineering |
| Dr. Fatima Zahra | fatima@ssuet.edu.pk | Linear Algebra, Software Quality Assurance |
| Mr. Usman Tariq | usman@ssuet.edu.pk | Software Req. Engineering, Software Dev Architecture, BPE |
| Ms. Nadia Rehman | nadia@ssuet.edu.pk | Technical Writing, Communication Skills |

### Student Logins
All student passwords: `student123`

| Batch | Section | Roll Number Range |
|---|---|---|
| 2023F | SE-A | 2023F-BSE-001 to 2023F-BSE-030 |
| 2023F | SE-B | 2023F-BSE-031 to 2023F-BSE-060 |
| 2023F | SE-C | 2023F-BSE-061 to 2023F-BSE-090 |
| 2023S | SE-A | 2023S-BSE-001 to 2023S-BSE-030 |
| 2023S | SE-B | 2023S-BSE-031 to 2023S-BSE-060 |
| 2023S | SE-C | 2023S-BSE-061 to 2023S-BSE-090 |
| 2022F | SE-A | 2022F-BSE-001 to 2022F-BSE-030 |
| 2022F | SE-B | 2022F-BSE-031 to 2022F-BSE-060 |
| 2022F | SE-C | 2022F-BSE-061 to 2022F-BSE-090 |

Example student login:
- Roll Number: `2023F-BSE-001`
- Password: `student123`

---

## Batches & Subjects

### 2023F Batch
| Subject | Code | Teacher |
|---|---|---|
| Operating Systems | OS-301 | Dr. Imran Khalid |
| Data Structures & Algorithms | DSA-302 | Mr. Bilal Hassan |
| Technical Writing | TW-303 | Ms. Nadia Rehman |
| Database Management System | DB-304 | Ms. Ayesha Siddiqui |
| Software Requirement Engineering | SRE-305 | Mr. Usman Tariq |

### 2023S Batch
| Subject | Code | Teacher |
|---|---|---|
| Object Oriented Programming | OOP-301 | Mr. Bilal Hassan |
| Communication Skills | CS-302 | Ms. Nadia Rehman |
| Linear Algebra | LA-303 | Dr. Fatima Zahra |
| Software Dev Architecture | SDA-304 | Mr. Usman Tariq |
| Applied Physics | AP-305 | Dr. Imran Khalid |

### 2022F Batch
| Subject | Code | Teacher |
|---|---|---|
| Information Security | IS-401 | Dr. Imran Khalid |
| E-Commerce | EC-402 | Ms. Ayesha Siddiqui |
| Business Process Engineering | BPE-403 | Mr. Usman Tariq |
| Web Engineering | WE-404 | Mr. Bilal Hassan |
| Software Quality Assurance | SQA-405 | Dr. Fatima Zahra |

---

## Grading Scale

| Marks | Grade | GPA |
|---|---|---|
| 85 – 100 | A+ | 4.00 |
| 80 – 84 | A | 3.66 |
| 75 – 79 | B+ | 3.33 |
| 70 – 74 | B | 3.00 |
| 65 – 69 | C+ | 2.66 |
| 60 – 64 | C | 2.33 |
| 55 – 59 | D+ | 2.00 |
| 50 – 54 | D | 1.66 |
| 45 – 49 | E+ | 1.33 |
| 40 – 44 | E | 1.00 |
| 0 – 39 | F | 0.00 |

---

## Marks Breakdown (per subject)

| Component | Marks |
|---|---|
| Quiz 1 | 3 |
| Quiz 2 | 3 |
| Quiz 3 | 4 |
| Assignment 1 | 3 |
| Assignment 2 | 3 |
| Assignment 3 | 4 |
| Midterm | 30 |
| Final Exam | 50 |
| **Total** | **100** |

---

## Semester Timetable

- **Semester:** June 2, 2026 — November 27, 2026
- **Classes per subject:** 3 per week (Mon–Fri only)
- **Total classes per subject:** ~54

| Pattern | Days |
|---|---|
| A | Monday, Wednesday, Friday |
| B | Tuesday, Thursday, Friday |
| C | Monday, Wednesday, Thursday |
| D | Tuesday, Wednesday, Friday |

---

## How the QR Attendance Works

1. Teacher logs in → opens **QR Scanner** page
2. Selects **section**, **subject**, and **class date** from the timetable
3. Camera turns on — students hold their **ID card QR code** up to the camera
4. `jsQR` decodes the QR → backend matches the roll number → marks present
5. The class **roster updates live** — present students get a green tick
6. Teacher can also **manually tick/untick** any student
7. Past classes (within 7 days) can be reopened for **correction**
8. Click **Submit Attendance** to see the full session summary

---

## API Endpoints

### Auth
```
POST /api/auth/teacher/login
POST /api/auth/student/login
POST /api/auth/student/change-password
```

### Students
```
GET  /api/students              ← list (filter by ?section=&batch=)
POST /api/students              ← create + generate QR
GET  /api/students/:id          ← single student
DELETE /api/students/:id        ← remove student
```

### Attendance
```
POST /api/scan                          ← mark attendance via QR
GET  /api/attendance/session            ← session roster (?section&subjectId&date)
GET  /api/attendance/conducted          ← classes held (?section&subjectId)
GET  /api/attendance/stats              ← student stats (?rollNumber&subjectId)
GET  /api/attendance/my                 ← student's own attendance
POST /api/attendance/remove             ← correction: unmark attendance
```

### Marks
```
POST /api/marks                         ← save/update marks
GET  /api/marks                         ← teacher: list (?subjectId&section)
GET  /api/marks/student/:rollNumber     ← teacher: student result
GET  /api/marks/my                      ← student: own marks + CGPA
```

### Timetable
```
GET /api/timetable/subject/:subjectId   ← all class dates for a subject
GET /api/timetable/today/:subjectId     ← does this subject have class today?
GET /api/timetable/student              ← student's full timetable
```

### Quote
```
GET /api/quote/today                    ← daily educational quote (ZenQuotes proxy)
```

---

## Key Concepts Demonstrated

- **REST API design** — full CRUD with Express.js routes
- **JWT Authentication** — separate tokens for teachers and students
- **Middleware** — `protectTeacher` and `protectStudent` guards on every route
- **React Hooks** — `useState`, `useEffect`, custom hooks on student dashboard
- **Third-party API integration** — ZenQuotes API proxied through Express (avoids CORS)
- **Browser APIs** — `fetch()`, `getUserMedia()` (camera), Canvas API, `localStorage`
- **DOM manipulation** — vanilla JS event listeners, dynamic innerHTML on all other pages
- **File-based persistence** — JSON flat files instead of a database (no setup required)

---

## Notes

- No database setup required — all data is stored as JSON files in `backend/data/`
- Camera access requires the page to be served over `http://localhost` — do not open HTML files directly from the file system
- Always access the portal at `http://localhost:5000/pages/teacher-login.html` not by double-clicking the HTML file
- If you get an `Invalid token` error, clear localStorage in the browser console (`localStorage.clear()`) and log in again
- The jsQR library is bundled locally in `frontend/js/jsQR.js` — no internet required for scanning

---

## Built By

**Parvez Ali** — Software Engineering Student, SSUET Karachi  
Web Engineering Course Project — 2026
