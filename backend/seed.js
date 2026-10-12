const bcrypt  = require('bcryptjs');
const QRCode  = require('qrcode');
const fs      = require('fs');
const path    = require('path');

const dataPath  = (file) => path.join(__dirname, 'data', file);
const readJSON  = (file) => JSON.parse(fs.readFileSync(dataPath(file), 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));

async function seed() {
  const hash        = await bcrypt.hash('password123', 12);
  const studentHash = await bcrypt.hash('student123',  12);

  // ── SUBJECTS ──
  const subjects = [
    { id: '2023F-OS',  name: 'Operating Systems',                code: 'OS-301',  batch: '2023F', creditHours: 3 },
    { id: '2023F-DSA', name: 'Data Structures & Algorithms',     code: 'DSA-302', batch: '2023F', creditHours: 3 },
    { id: '2023F-TW',  name: 'Technical Writing',                code: 'TW-303',  batch: '2023F', creditHours: 3 },
    { id: '2023F-DB',  name: 'Database Management System',       code: 'DB-304',  batch: '2023F', creditHours: 3 },
    { id: '2023F-SRE', name: 'Software Requirement Engineering', code: 'SRE-305', batch: '2023F', creditHours: 3 },
    { id: '2023S-OOP', name: 'Object Oriented Programming',      code: 'OOP-301', batch: '2023S', creditHours: 3 },
    { id: '2023S-CS',  name: 'Communication Skills',             code: 'CS-302',  batch: '2023S', creditHours: 3 },
    { id: '2023S-LA',  name: 'Linear Algebra',                   code: 'LA-303',  batch: '2023S', creditHours: 3 },
    { id: '2023S-SDA', name: 'Software Dev Architecture',        code: 'SDA-304', batch: '2023S', creditHours: 3 },
    { id: '2023S-AP',  name: 'Applied Physics',                  code: 'AP-305',  batch: '2023S', creditHours: 3 },
    { id: '2022F-IS',  name: 'Information Security',             code: 'IS-401',  batch: '2022F', creditHours: 3 },
    { id: '2022F-EC',  name: 'E-Commerce',                       code: 'EC-402',  batch: '2022F', creditHours: 3 },
    { id: '2022F-BPE', name: 'Business Process Engineering',     code: 'BPE-403', batch: '2022F', creditHours: 3 },
    { id: '2022F-WE',  name: 'Web Engineering',                  code: 'WE-404',  batch: '2022F', creditHours: 3 },
    { id: '2022F-SQA', name: 'Software Quality Assurance',       code: 'SQA-405', batch: '2022F', creditHours: 3 },
  ];

  // ── TEACHERS ──
  const teachers = [
    {
      id: 't1', name: 'Dr. Imran Khalid', email: 'imran@ssuet.edu.pk',
      passwordHash: hash, employeeId: 'EMP-001',
      assignments: [
        { subjectId: '2023F-OS',  subjectName: 'Operating Systems',   batch: '2023F', sections: ['SE-A','SE-B','SE-C'] },
        { subjectId: '2023S-AP',  subjectName: 'Applied Physics',      batch: '2023S', sections: ['SE-A','SE-B','SE-C'] },
        { subjectId: '2022F-IS',  subjectName: 'Information Security', batch: '2022F', sections: ['SE-A','SE-B','SE-C'] },
      ]
    },
    {
      id: 't2', name: 'Ms. Ayesha Siddiqui', email: 'ayesha@ssuet.edu.pk',
      passwordHash: hash, employeeId: 'EMP-002',
      assignments: [
        { subjectId: '2023F-DB',  subjectName: 'Database Management System', batch: '2023F', sections: ['SE-A','SE-B','SE-C'] },
        { subjectId: '2022F-EC',  subjectName: 'E-Commerce',                 batch: '2022F', sections: ['SE-A','SE-B','SE-C'] },
      ]
    },
    {
      id: 't3', name: 'Mr. Bilal Hassan', email: 'bilal@ssuet.edu.pk',
      passwordHash: hash, employeeId: 'EMP-003',
      assignments: [
        { subjectId: '2023F-DSA', subjectName: 'Data Structures & Algorithms', batch: '2023F', sections: ['SE-A','SE-B','SE-C'] },
        { subjectId: '2023S-OOP', subjectName: 'Object Oriented Programming',  batch: '2023S', sections: ['SE-A','SE-B','SE-C'] },
        { subjectId: '2022F-WE',  subjectName: 'Web Engineering',               batch: '2022F', sections: ['SE-A','SE-B','SE-C'] },
      ]
    },
    {
      id: 't4', name: 'Dr. Fatima Zahra', email: 'fatima@ssuet.edu.pk',
      passwordHash: hash, employeeId: 'EMP-004',
      assignments: [
        { subjectId: '2023S-LA',  subjectName: 'Linear Algebra',             batch: '2023S', sections: ['SE-A','SE-B','SE-C'] },
        { subjectId: '2022F-SQA', subjectName: 'Software Quality Assurance', batch: '2022F', sections: ['SE-A','SE-B','SE-C'] },
      ]
    },
    {
      id: 't5', name: 'Mr. Usman Tariq', email: 'usman@ssuet.edu.pk',
      passwordHash: hash, employeeId: 'EMP-005',
      assignments: [
        { subjectId: '2023F-SRE', subjectName: 'Software Requirement Engineering', batch: '2023F', sections: ['SE-A','SE-B','SE-C'] },
        { subjectId: '2023S-SDA', subjectName: 'Software Dev Architecture',         batch: '2023S', sections: ['SE-A','SE-B','SE-C'] },
        { subjectId: '2022F-BPE', subjectName: 'Business Process Engineering',      batch: '2022F', sections: ['SE-A','SE-B','SE-C'] },
      ]
    },
    {
      id: 't6', name: 'Ms. Nadia Rehman', email: 'nadia@ssuet.edu.pk',
      passwordHash: hash, employeeId: 'EMP-006',
      assignments: [
        { subjectId: '2023F-TW', subjectName: 'Technical Writing',    batch: '2023F', sections: ['SE-A','SE-B','SE-C'] },
        { subjectId: '2023S-CS', subjectName: 'Communication Skills', batch: '2023S', sections: ['SE-A','SE-B','SE-C'] },
      ]
    },
  ];

  // ── STUDENT NAMES — mixed male & female ──
  const namePool = {
    '2023F': [
      // SE-A (001-030)
      'Ali Raza',          'Sana Mirza',        'Hamza Khan',        'Ayesha Noor',       'Usman Tariq',
      'Fatima Zahra',      'Omar Farooq',        'Nimra Hussain',     'Talha Siddiqui',    'Zara Ahmed',
      'Adeel Hussain',     'Hira Malik',         'Arslan Butt',       'Madiha Qureshi',    'Rizwan Shah',
      'Sadia Iqbal',       'Fahad Chaudhry',     'Amna Baig',         'Asad Mehmood',      'Rabia Nawaz',
      'Waqas Ali',         'Mehwish Anwar',      'Shahzaib Khan',     'Nadia Sheikh',      'Moiz Hassan',
      'Aqsa Javed',        'Daniyal Abbas',      'Bushra Akhtar',     'Taimoor Aziz',      'Sumbul Dar',
      // SE-B (031-060)
      'Bilal Ahmed',       'Saira Khan',         'Faisal Malik',      'Lubna Tariq',       'Zain Ul Abideen',
      'Mariam Farooq',     'Hassan Raza',        'Kiran Hussain',     'Kamran Shah',       'Noor Fatima',
      'Saad Iqbal',        'Palwasha Butt',      'Jawad Mirza',       'Sidra Qureshi',     'Nabeel Ahmed',
      'Anum Shah',         'Imran Nawaz',        'Farah Iqbal',       'Muneeb Akhtar',     'Sana Baig',
      'Shoaib Anwar',      'Aroha Mehmood',      'Rehman Dar',        'Fiza Ali',          'Aqib Javed',
      'Uzma Anwar',        'Haris Baig',         'Tasmia Sheikh',     'Zunair Abbas',      'Mahra Aziz',
      // SE-C (061-090)
      'Zubair Ahmed',      'Laila Khan',         'Nasir Tariq',       'Rida Farooq',       'Pervez Hussain',
      'Samia Raza',        'Omer Shah',          'Ghazala Iqbal',     'Kashif Baig',       'Misbah Butt',
      'Tariq Mirza',       'Sobia Qureshi',      'Amir Shah',         'Zainab Iqbal',      'Danish Baig',
      'Naila Mehmood',     'Waseem Nawaz',       'Fariha Ali',        'Shakeel Anwar',     'Rukhsar Dar',
      'Ejaz Sheikh',       'Sumera Abbas',       'Qasim Akhtar',      'Nazia Aziz',        'Nadeem Ahmed',
      'Saima Khan',        'Irfan Tariq',        'Rabail Farooq',     'Mazhar Hussain',    'Tanzila Raza'
    ],
    '2023S': [
      // SE-A
      'Ahsan Malik',       'Saba Noor',          'Rehan Siddiqui',    'Huma Zahra',        'Junaid Ahmed',
      'Amira Hussain',     'Waleed Khan',        'Shazia Baig',       'Salman Shah',       'Nafeesa Iqbal',
      'Bilal Qureshi',     'Fauzia Butt',        'Asim Nawaz',        'Ruqaiya Ali',       'Kamran Anwar',
      'Samina Sheikh',     'Farhan Abbas',       'Mehreen Akhtar',    'Umar Aziz',         'Tahira Ahmed',
      'Shahid Khan',       'Nosheen Tariq',      'Adnan Farooq',      'Sahar Hussain',     'Rizwan Raza',
      'Pakeeza Shah',      'Naveed Iqbal',       'Irum Baig',         'Khalid Butt',       'Maham Mirza',
      // SE-B
      'Fawad Qureshi',     'Sana Shah',          'Imtiaz Iqbal',      'Lubna Baig',        'Tariq Nawaz',
      'Amna Ali',          'Zahid Anwar',        'Faiza Sheikh',      'Aamir Abbas',       'Nida Akhtar',
      'Mohsin Aziz',       'Zara Ahmed',         'Sabir Khan',        'Humaira Tariq',     'Waqar Farooq',
      'Maryam Hussain',    'Nadeem Raza',        'Raheela Shah',      'Qasim Iqbal',       'Bushra Baig',
      'Aslam Butt',        'Sadia Mirza',        'Azhar Qureshi',     'Nazia Shah',        'Tanveer Iqbal',
      'Iram Baig',         'Mansoor Nawaz',      'Sumaira Ali',       'Haroon Anwar',      'Zobia Sheikh',
      // SE-C
      'Shehzad Abbas',     'Amber Akhtar',       'Wasif Aziz',        'Komal Ahmed',       'Iftikhar Khan',
      'Rabia Tariq',       'Muzammil Farooq',    'Sidra Hussain',     'Alamgir Raza',      'Naila Shah',
      'Bashir Iqbal',      'Fareeha Baig',       'Zulfiqar Butt',     'Madiha Mirza',      'Shakir Qureshi',
      'Uzma Shah',         'Munir Iqbal',        'Sana Baig',         'Ghulam Nawaz',      'Sobia Ali',
      'Habib Anwar',       'Nida Sheikh',        'Liaquat Abbas',     'Saima Akhtar',      'Javed Aziz',
      'Hina Ahmed',        'Mehmood Khan',       'Amara Tariq',       'Saleem Farooq',     'Zainab Hussain'
    ],
    '2022F': [
      // SE-A
      'Parvez Ali',        'Sana Malik',         'Arif Siddiqui',     'Hira Zahra',        'Naeem Ahmed',
      'Amna Hussain',      'Kashif Khan',        'Shazia Baig',       'Tariq Shah',        'Nafeesa Iqbal',
      'Bilal Mirza',       'Fauzia Butt',        'Asim Nawaz',        'Ruqaiya Ali',       'Kamran Anwar',
      'Samina Sheikh',     'Farhan Abbas',       'Mehreen Akhtar',    'Umar Aziz',         'Tahira Ahmed',
      'Shahid Tariq',      'Nosheen Khan',       'Adnan Farooq',      'Sahar Hussain',     'Rizwan Raza',
      'Pakeeza Shah',      'Naveed Iqbal',       'Irum Baig',         'Khalid Butt',       'Maham Mirza',
      // SE-B
      'Fawad Qureshi',     'Sara Shah',          'Imtiaz Iqbal',      'Lubna Baig',        'Tariq Nawaz',
      'Amna Ali',          'Zahid Anwar',        'Faiza Sheikh',      'Aamir Abbas',       'Nida Akhtar',
      'Mohsin Aziz',       'Zara Ahmed',         'Sabir Khan',        'Humaira Tariq',     'Waqar Farooq',
      'Maryam Hussain',    'Nadeem Raza',        'Raheela Shah',      'Qasim Iqbal',       'Bushra Baig',
      'Aslam Butt',        'Sadia Mirza',        'Azhar Qureshi',     'Nazia Shah',        'Tanveer Iqbal',
      'Iram Baig',         'Mansoor Nawaz',      'Sumaira Ali',       'Haroon Anwar',      'Zobia Sheikh',
      // SE-C
      'Shehzad Abbas',     'Amber Akhtar',       'Wasif Aziz',        'Komal Ahmed',       'Iftikhar Khan',
      'Rabia Tariq',       'Muzammil Farooq',    'Sidra Hussain',     'Alamgir Raza',      'Naila Shah',
      'Bashir Iqbal',      'Fareeha Baig',       'Zulfiqar Butt',     'Madiha Mirza',      'Shakir Qureshi',
      'Uzma Shah',         'Munir Iqbal',        'Sana Baig',         'Ghulam Nawaz',      'Sobia Ali',
      'Habib Anwar',       'Nida Sheikh',        'Liaquat Abbas',     'Saima Akhtar',      'Javed Aziz',
      'Hina Ahmed',        'Mehmood Khan',       'Amara Tariq',       'Saleem Farooq',     'Zainab Hussain'
    ]
  };

  const batchSubjects = {
    '2023F': ['2023F-OS','2023F-DSA','2023F-TW','2023F-DB','2023F-SRE'],
    '2023S': ['2023S-OOP','2023S-CS','2023S-LA','2023S-SDA','2023S-AP'],
    '2022F': ['2022F-IS','2022F-EC','2022F-BPE','2022F-WE','2022F-SQA'],
  };

  const sections = [
    { section: 'SE-A', from: 1,  to: 30,  nameStart: 0  },
    { section: 'SE-B', from: 31, to: 60,  nameStart: 30 },
    { section: 'SE-C', from: 61, to: 90,  nameStart: 60 },
  ];

  const batches = ['2023F', '2023S', '2022F'];
  const students = [];
  let seedIndex  = 1;

  for (const batch of batches) {
    for (const sec of sections) {
      for (let i = 0; i < 30; i++) {
        const num        = String(sec.from + i).padStart(3, '0');
        const rollNumber = `${batch}-BSE-${num}`;
        const name       = namePool[batch][sec.nameStart + i];
        const qrImage    = await QRCode.toDataURL(rollNumber, {
          errorCorrectionLevel: 'H', width: 300, margin: 2
        });

        students.push({
          id:               `stu-${batch}-${sec.section}-${String(i+1).padStart(2,'0')}`,
          name,
          rollNumber,
          email:            `${rollNumber.toLowerCase().replace(/-/g,'.')}@student.ssuet.edu.pk`,
          passwordHash:     studentHash,
          section:          sec.section,
          batch,
          enrolledSubjects: batchSubjects[batch],
          qrData:           rollNumber,
          qrImage
        });

        seedIndex++;
      }
    }
  }

  writeJSON('subjects.json',   subjects);
  writeJSON('teachers.json',   teachers);
  writeJSON('students.json',   students);
  writeJSON('attendance.json', []);

  console.log('✓ subjects.json  — 15 subjects across 3 batches');
  console.log('✓ teachers.json  — 6 teachers');
  console.log(`✓ students.json  — ${students.length} students (30 per section × 3 sections × 3 batches)`);
  console.log('✓ attendance.json — cleared');
  console.log('');
  console.log('Teacher logins (password: password123):');
  teachers.forEach(t => console.log(`  ${t.email}  →  ${t.name}`));
  console.log('');
  console.log('Breakdown:');
  batches.forEach(b => {
    sections.forEach(s => {
      const from = `${b}-BSE-${String(s.from).padStart(3,'0')}`;
      const to   = `${b}-BSE-${String(s.to).padStart(3,'0')}`;
      console.log(`  ${b} ${s.section}  →  ${from} to ${to}`);
    });
  });
}

// ── TIMETABLE ──
  // Semester: June 2, 2026 → November 27, 2026
  // Patterns (Mon=1, Tue=2, Wed=3, Thu=4, Fri=5)
  const patterns = {
    A: [1, 3, 5], // Mon, Wed, Fri
    B: [2, 4, 5], // Tue, Thu, Fri
    C: [1, 3, 4], // Mon, Wed, Thu
    D: [2, 3, 5], // Tue, Wed, Fri
  };

  const subjectPatterns = {
    '2023F-OS':  'A',
    '2023F-DSA': 'B',
    '2023F-TW':  'C',
    '2023F-DB':  'D',
    '2023F-SRE': 'A',
    '2023S-OOP': 'B',
    '2023S-CS':  'A',
    '2023S-LA':  'D',
    '2023S-SDA': 'C',
    '2023S-AP':  'B',
    '2022F-IS':  'A',
    '2022F-EC':  'D',
    '2022F-BPE': 'B',
    '2022F-WE':  'C',
    '2022F-SQA': 'A',
  };

  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  function generateClassDates(patternDays) {
    const dates = [];
    const start = new Date('2026-06-02');
    const end   = new Date('2026-11-27');
    const cur   = new Date(start);

    while (cur <= end) {
      const dow = cur.getDay(); // 0=Sun,1=Mon,...,5=Fri,6=Sat
      if (patternDays.includes(dow)) {
        dates.push(cur.toISOString().split('T')[0]);
      }
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  const timetable = Object.entries(subjectPatterns).map(([subjectId, patternKey]) => {
    const patternDays = patterns[patternKey];
    const classDates  = generateClassDates(patternDays);
    return {
      subjectId,
      pattern:      patternKey,
      days:         patternDays.map(d => dayNames[d]),
      classDates,
      totalClasses: classDates.length
    };
  });

  writeJSON('timetable.json', timetable);
  console.log(`✓ timetable.json — ${timetable.length} subjects scheduled`);
  console.log(`  Sample: ${timetable[0].subjectId} → ${timetable[0].days.join('/')} → ${timetable[0].totalClasses} classes`);

seed().catch(console.error);