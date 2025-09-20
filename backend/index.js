const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const fileUpload = require('express-fileupload');

const webtoken = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyparser = require('body-parser');
const xlsx = require('xlsx');
const childrenRouter = require('./dashboardRoutes/Children');

const EligibilityRoute = require('./dashboardRoutes/Eligibility');
const VoluntaryWork = require('./dashboardRoutes/Voluntary');
const CollegeRoute = require('./dashboardRoutes/College');
const VocationalRoute = require('./dashboardRoutes/Vocational');
const PersonalRoute = require('./dashboardRoutes/PersonalInfo');
const WorkExperienceRoute = require('./dashboardRoutes/WorkExperience');
const OtherInfo = require('./dashboardRoutes/OtherSkills');
const GraduateRoute = require('./dashboardRoutes/Graduate');

const AllData = require('./dashboardRoutes/DataRoute');
const Attendance = require('./dashboardRoutes/Attendance');

const SalaryGradeTable = require('./payrollRoutes/SalaryGradeTable');
const Remittance = require('./payrollRoutes/Remittance');

const Leave = require('./dashboardRoutes/Leave');
const SendPayslip = require('./payrollRoutes/SendPayslip');

const Payroll = require('./payrollRoutes/Payroll');

const app = express();

const nodemailer = require('nodemailer');
require('dotenv').config();

app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth header:', authHeader);
  console.log('Token:', token ? 'Token exists' : 'No token');

  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      console.log('JWT verification error:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.log('Decoded JWT:', user); // 👈 see what fields are in the token
    req.user = user;
    next();
  });
}

function logAudit(
  user,
  action,
  tableName,
  recordId,
  targetEmployeeNumber = null
) {
  const auditQuery = `
    INSERT INTO audit_log (employeeNumber, action, table_name, record_id, targetEmployeeNumber, timestamp)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    auditQuery,
    [user.employeeNumber, action, tableName, recordId, targetEmployeeNumber],
    (err) => {
      if (err) {
        console.error('Error inserting audit log:', err);
      }
    }
  );
}

// Allow requests from frontend
// Define allowed origins
const allowedOrigins = [
  'http://localhost:5137', // Local dev
  'http://192.168.10.14:5137', // LAN
  'http://136.239.248.42:5137', // Public
];

// Use CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // if you need cookies or auth headers
  })
);
app.use(bodyparser.json());
app.use(express.urlencoded({ extended: true }));

// File upload configurations
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile_pictures/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

// Create necessary directories
const profilePicturesDir = path.join(__dirname, 'uploads', 'profile_pictures');
if (!fs.existsSync(profilePicturesDir)) {
  fs.mkdirSync(profilePicturesDir, { recursive: true });
}

app.use('/uploads', express.static('uploads'));
app.use('/ChildrenRoute', childrenRouter);
app.use('/VoluntaryRoute', VoluntaryWork);
app.use('/eligibilityRoute', EligibilityRoute);
app.use('/college', CollegeRoute);
app.use('/GraduateRoute', GraduateRoute);
app.use('/vocational', VocationalRoute);
app.use('/personalinfo', PersonalRoute);
app.use('/WorkExperienceRoute', WorkExperienceRoute);
app.use('/OtherInfo', OtherInfo);

app.use('/allData', AllData);
app.use('/attendance', Attendance);

app.use('/SalaryGradeTable', SalaryGradeTable);
app.use('/Remittance', Remittance);

app.use('/leaveRoute', Leave);
app.use('/SendPayslipRoute', SendPayslip);
app.use('/PayrollRoute', Payroll);

//MYSQL CONNECTION
// Determine which database host to use based on environment
const getDbHost = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DB_HOST_PUBLIC;
  } else if (process.env.NODE_ENV === 'local') {
    return process.env.DB_HOST_LOCAL;
  } else {
    return 'localhost'; // fallback for development
  }
};

//MYSQL CONNECTION
const db = mysql.createPool({
  host: getDbHost(),
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'earist_hris',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Ensure audit_log table exists
const ensureAuditLogTableSQL = `
  CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employeeNumber VARCHAR(64) NULL,
    action VARCHAR(512) NOT NULL,
    table_name VARCHAR(128) NULL,
    record_id INT NULL,
    targetEmployeeNumber VARCHAR(64) NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

db.query(ensureAuditLogTableSQL, (err) => {
  if (err) {
    console.error('Failed to ensure audit_log table exists:', err);
  } else {
    console.log('audit_log table is ready.');
  }
});

const PORT = process.env.WEB_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = db;

// Audit log
function insertAuditLog(employeeNumber, action) {
  const sql = `INSERT INTO audit_log (employeeNumber, action) VALUES (?, ?)`;
  db.query(sql, [employeeNumber, action], (err, result) => {
    if (err) {
      console.error('Error inserting audit log:', err);
    } else {
      console.log('Audit log inserted:', result.insertId);
    }
  });
}

// Test connection
//db.getConnection((err, connection) => {
//if (err) {
//  console.error("Database connection failed:", err);
//return;
//}
//console.log("Database Connected");
//connection.release(); // Important: release connection back to the pool
//});

//RESET PASSWORD (BAGO 'TO - HANNA)
// Add this after your other middleware configurations
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // ✅ allow Gmail cert
  },
});

const twoFACodes = {}; // { email: { code, expiresAt } }

// Forgot password start
// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map();

// Generate random 6-digit code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Forgot password route - send verification code
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user exists
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ error: 'No account found with this email address' });
      }

      const user = results[0];
      const verificationCode = generateVerificationCode();

      // Store code with 15-minute expiration
      verificationCodes.set(email, {
        code: verificationCode,
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        userId: user.id,
      });

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #A31D1D;">Password Reset Request</h2>
            <p>Hello ${user.username},</p>
            <p>You requested to reset your password. Below is the verification code that you requested.
            </p> <p>Verification code:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #A31D1D; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
            </div>
            <p>This code will expire in 15 minutes. Make sure to use the code before expiration.</p>
            <p>Please ignore this message if you didn't request this password reset.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated message from your HRIS system.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ message: 'Verification code sent to your email' });
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify code route
app.post('/verify-reset-code', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ error: 'Email and verification code are required' });
  }

  const storedData = verificationCodes.get(email);

  if (!storedData) {
    return res
      .status(400)
      .json({ error: 'No verification code found. Please request a new one.' });
  }

  if (Date.now() > storedData.expires) {
    verificationCodes.delete(email);
    return res.status(400).json({
      error: 'Verification code has expired. Please request a new one.',
    });
  }

  if (storedData.code !== code) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  res.json({
    message: 'Code verified successfully',
    userId: storedData.userId,
    verified: true,
  });
});

// Reset password route
app.post('/reset-password', async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const storedData = verificationCodes.get(email);

  if (!storedData) {
    return res
      .status(400)
      .json({ error: 'Invalid or expired session. Please start over.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const query = 'UPDATE users SET password = ? WHERE email = ?';
    db.query(query, [hashedPassword, email], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update password' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Clean up the verification code
      verificationCodes.delete(email);

      res.json({ message: 'Password updated successfully' });
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// REGISTER
app.post('/register', async (req, res) => {
  const { username, email, password, employeeNumber } = req.body;

  try {
    // hash the password
    const hashedPass = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (
        username,
        email,
        role,
        password,
        employeeNumber,
        employmentCategory,
        access_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
      username,
      email,
      'staff', // default role
      hashedPass,
      employeeNumber,
      1, // default employmentCategory
      'user', // default access_level
    ]);

    res.status(200).send({ message: 'User Registered Successfully' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).send({ error: 'Failed to register user' });
  }
});

//LOGIN
app.post('/login', (req, res) => {
  const { employeeNumber, password } = req.body;

  const query = `SELECT * FROM users WHERE employeeNumber = ?
   
    `;
  db.query(query, [employeeNumber], async (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0)
      return res
        .status(400)
        .send({ message: 'User not found or Employee Number does not match' });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(400).send({ message: 'Invalid Credentials' });

    const token = webtoken.sign(
      {
        id: user.id,
        username: user.username,
        employeeNumber: user.employeeNumber,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );
    res.status(200).send({
      token,
      email: user.email,
      role: user.role,
      employeeNumber: user.employeeNumber,
    });
  });
});

// send 2FA code
app.post('/send-2fa-code', async (req, res) => {
  const { email, employeeNumber } = req.body;
  if (!email || !employeeNumber) {
    return res
      .status(400)
      .json({ error: 'Email and employee number required' });
  }

  // Fetch user to get username
  const query =
    'SELECT username FROM users WHERE email = ? AND employeeNumber = ?';
  db.query(query, [email, employeeNumber], async (err, result) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result[0];

    // generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // store in memory (indexed by email)
    twoFACodes[email] = { code, expiresAt };

    try {
      await transporter.sendMail({
        from: '"EARIST HR Testing" <yourgmail@gmail.com>',
        to: email,
        subject: 'Login Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #A31D1D;">Login Verification</h2>
            <p>Hello ${user.username},</p>
            <p>We detected a login attempt to your account. For your security, please verify your identity by entering the verification code below:</p>
            
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #A31D1D; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
            </div>
            
            <p>This code will expire in 2 minutes. Do not share it with anyone.</p>
            <p>If this login attempt wasn’t made by you, we recommend securing your account immediately.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated message from your HRIS system.</p>
          </div>
        `,
      });

      res.json({ message: 'Verification code sent' });
    } catch (err) {
      console.error('Email send error:', err);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });
});

// verify code
app.post('/verify-2fa-code', (req, res) => {
  const { email, code } = req.body;
  const record = twoFACodes[email];

  if (!record) {
    return res
      .status(400)
      .json({ error: 'No code found. Please request again.' });
  }

  if (Date.now() > record.expiresAt) {
    delete twoFACodes[email];
    return res
      .status(400)
      .json({ error: 'Code expired. Please request a new one.' });
  }

  if (record.code !== code) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  res.json({ verified: true });
});

// complete login (issue JWT)
app.post('/complete-2fa-login', (req, res) => {
  const { email, employeeNumber } = req.body;

  // Lookup user in database using either email or employeeNumber
  const query = `SELECT * FROM users WHERE email = ? OR employeeNumber = ?`;

  db.query(query, [email, employeeNumber], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result[0];

    // Clean up the 2FA code since login is successful
    delete twoFACodes[email];

    // Generate JWT with actual user data
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        employeeNumber: user.employeeNumber,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'secret', // Match your main login JWT secret
      { expiresIn: '1h' }
    );

    res.json({
      token,
      role: user.role,
      employeeNumber: user.employeeNumber,
      email: user.email,
    });
  });
});

//data
app.get('/data', (req, res) => {
  const query = `SELECT * FROM learning_and_development_table`;
  db.query(query, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(result);
  });
});

//Read
app.get('/learning_and_development_table', (req, res) => {
  const query = 'SELECT * FROM learning_and_development_table';
  db.query(query, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(result);
  });
});

//Add
app.post('/learning_and_development_table', (req, res) => {
  const {
    titleOfProgram,
    dateFrom,
    dateTo,
    numberOfHours,
    typeOfLearningDevelopment,
    conductedSponsored,
    person_id,
  } = req.body;
  const query =
    'INSERT INTO learning_and_development_table (titleOfProgram, dateFrom, dateTo, numberOfHours, typeOfLearningDevelopment, conductedSponsored, person_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(
    query,
    [
      titleOfProgram,
      dateFrom,
      dateTo,
      numberOfHours,
      typeOfLearningDevelopment,
      conductedSponsored,
      person_id,
    ],
    (err, result) => {
      if (err) return res.status(500).send(err);
      insertAuditLog(
        person_id || 'SYSTEM',
        `Added Program for ${person_id} in Learning and Development Program`
      );
      res.status(201).send({ message: 'Item created', id: result.insertId });
    }
  );
});

//Update
app.put('/learning_and_development_table/:id', (req, res) => {
  const {
    titleOfProgram,
    dateFrom,
    dateTo,
    numberOfHours,
    typeOfLearningDevelopment,
    conductedSponsored,
    person_id,
  } = req.body;
  const { id } = req.params;
  const query =
    'UPDATE learning_and_development_table SET titleOfProgram = ?, dateFrom = ?, dateTo = ?, numberOfHours = ?, typeOfLearningDevelopment = ?, conductedSponsored = ?, person_id = ? WHERE id = ?';
  db.query(
    query,
    [
      titleOfProgram,
      dateFrom,
      dateTo,
      numberOfHours,
      typeOfLearningDevelopment,
      conductedSponsored,
      person_id,
      id,
    ],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(200).send({ message: 'Item updated' });
    }
  );
});

//delete
app.delete('/learning_and_development_table/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM learning_and_development_table WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ message: 'Item deleted' });
  });
});

// File uploads
// Convert Excel date to normalized UTC date
function excelDateToUTCDate(excelDate) {
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

app.post(
  '/upload_learning_and_development_table',
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // Read the uploaded XLS file
      const workbook = xlsx.readFile(req.file.path);
      const sheet_name = workbook.SheetNames[0];
      const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name]);

      // Log the uploaded data for troubleshooting
      console.log('Uploaded employee info data:', sheet);

      // Insert data into MySQL
      sheet.forEach((row) => {
        const titleOfProgram = row.titleOfProgram;
        const dateFrom = excelDateToUTCDate(row.dateFrom);
        const formattedDateFrom = dateFrom.toISOString().split('T')[0];
        const dateTo = excelDateToUTCDate(row.dateTo);
        const formattedDateTo = dateTo.toISOString().split('T')[0];
        const numberOfHours = row.numberOfHours;
        const typeOfLearningDevelopment = row.typeOfLearningDevelopment;
        const conductedSponsored = row.conductedSponsored;

        const query =
          'INSERT INTO learning_and_development_table (titleOfProgram, dateFrom, dateTo, numberOfHours, typeOfLearningDevelopment, conductedSponsored) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(
          query,
          [
            titleOfProgram,
            formattedDateFrom,
            formattedDateTo,
            numberOfHours,
            typeOfLearningDevelopment,
            conductedSponsored,
          ],
          (err, result) => {
            if (err) {
              console.error('Error inserting data into the table', err);
              return;
            }
            console.log('Data inserted into the table successfully:', result);
          }
        );
      });

      // Send response after insertion
      res.json({
        message: 'Excel file uploaded and data inserted successfully',
      });
    } catch (error) {
      console.error('Error processing uploaded XLS file:', error);
      res.status(500).json({ error: 'Error processing uploaded XLS file' });
    } finally {
      // Delete the uploaded file to save space on the server
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error deleting uploaded file:', err);
        } else {
          console.log('Uploaded excel file deleted');
        }
      });
    }
  }
);

// Get settings
app.get('/api/settings', (req, res) => {
  db.query('SELECT * FROM settings WHERE id = 1', (err, result) => {
    if (err) throw err;
    res.send(result[0]);
  });
});

// Helper function to delete old logo
const deleteOldLogo = (logoUrl) => {
  if (!logoUrl) return; // If no logo URL, exit early

  const logoPath = path.join(__dirname, logoUrl); // Construct the full path to the logo file
  fs.unlink(logoPath, (err) => {
    if (err) {
      console.error(`Error deleting old logo at ${logoPath}: ${err}`);
    } else {
      console.log(`Previous logo at ${logoPath} deleted successfully.`);
    }
  });
};

// Update settings
app.post('/api/settings', upload.single('logo'), (req, res) => {
  const companyName = req.body.company_name || '';
  const headerColor = req.body.header_color || '#ffffff';
  const footerText = req.body.footer_text || '';
  const footerColor = req.body.footer_color || '#ffffff';
  const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;

  // Check if settings already exist
  db.query('SELECT * FROM settings WHERE id = 1', (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      // Existing settings found

      const oldLogoUrl = result[0].logo_url; // Save old logo URL for deletion

      // Update existing settings
      const query =
        'UPDATE settings SET company_name = ?, header_color = ?, footer_text = ?, footer_color = ?' +
        (logoUrl ? ', logo_url = ?' : '') +
        ' WHERE id = 1';
      const params = [companyName, headerColor, footerText, footerColor];
      if (logoUrl) params.push(logoUrl);

      db.query(query, params, (err) => {
        if (err) throw err;

        // If there's a new logo, delete the old one
        if (logoUrl && oldLogoUrl) {
          deleteOldLogo(oldLogoUrl);
        }

        res.send({ success: true });
      });
    } else {
      // Insert new settings
      const query =
        'INSERT INTO settings (company_name, header_color, footer_text, footer_color, logo_url) VALUES (?, ?, ?, ?, ?)';
      db.query(
        query,
        [companyName, headerColor, footerText, footerColor, logoUrl],
        (err) => {
          if (err) throw err;
          res.send({ success: true });
        }
      );
    }
  });
});

// Fetch official time records for a person_id (Monday to Sunday)
app.get('/officialtimetable/:employeeID', authenticateToken, (req, res) => {
  const { employeeID } = req.params;
  const sql = 'SELECT * FROM officialtime WHERE employeeID = ? ORDER BY id';

  db.query(sql, [employeeID], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      logAudit(req.user, `View`, 'Official Time', null, employeeID);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    res.json(results);
  });
});

app.post('/officialtimetable', authenticateToken, (req, res) => {
  const { employeeID, records } = req.body;

  if (!records || records.length === 0) {
    return res.status(400).json({ message: 'No records to insert or update.' });
  }

  // Prepare values for bulk insert
  const values = records.map((r) => [
    employeeID,
    r.day,
    r.officialTimeIN,
    r.officialBreaktimeIN,
    r.officialBreaktimeOUT,
    r.officialTimeOUT,
    r.officialHonorariumTimeIN,
    r.officialHonorariumTimeOUT,
    r.officialServiceCreditTimeIN,
    r.officialServiceCreditTimeOUT,
    r.officialOverTimeIN,
    r.officialOverTimeOUT,
    r.breaktime,
  ]);

  const sql = `
    INSERT INTO officialtime (
      employeeID, 
      day,
      officialTimeIN,
      officialBreaktimeIN,
      officialBreaktimeOUT,
      officialTimeOUT,
      officialHonorariumTimeIN,
      officialHonorariumTimeOUT,
      officialServiceCreditTimeIN,
      officialServiceCreditTimeOUT,
      officialOverTimeIN,
      officialOverTimeOUT,
      breaktime
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      officialTimeIN = VALUES(officialTimeIN),
      officialBreaktimeIN = VALUES(officialBreaktimeIN),
      officialBreaktimeOUT = VALUES(officialBreaktimeOUT),
      officialTimeOUT = VALUES(officialTimeOUT),
      officialHonorariumTimeIN = VALUES(officialHonorariumTimeIN),
      officialHonorariumTimeOUT = VALUES(officialHonorariumTimeOUT),
      officialServiceCreditTimeIN = VALUES(officialServiceCreditTimeIN),
      officialServiceCreditTimeOUT = VALUES(officialServiceCreditTimeOUT),
      officialOverTimeIN = VALUES(officialOverTimeIN),
      officialOverTimeOUT = VALUES(officialOverTimeOUT),
      breaktime = VALUES(breaktime)
  `;

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('Error inserting or updating records:', err);
      return res.status(500).json({ error: err.message });
    }
    try {
      logAudit(
        req.user,
        `Insert official time-table for ${employeeID} (${records.length} rows)`,
        'Official Time',
        null,
        employeeID
      );
    } catch (e) {
      console.error('Audit log error:', e);
    }
    res.json({ message: 'Records inserted or updated successfully' });
  });
});

// EXCEL UPLOAD FOR OFFICIAL TIME

app.post(
  '/upload-excel-faculty-official-time',
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
        defval: null,
      });

      if (!sheet.length) {
        return res.status(400).json({ message: 'Excel file is empty.' });
      }

      const cleanedSheet = sheet.map((row) => {
        const cleanedRow = {};
        for (const key in row) {
          const cleanKey = key.replace(/\u00A0/g, '').trim();
          cleanedRow[cleanKey] = row[key];
        }
        return cleanedRow;
      });

      let insertedCount = 0;
      let updatedCount = 0;

      for (const row of cleanedSheet) {
        const {
          employeeID,
          day,
          officialTimeIN,
          officialBreaktimeIN,
          officialBreaktimeOUT,
          officialTimeOUT,
          officialHonorariumTimeIN,
          officialHonorariumTimeOUT,
          officialServiceCreditTimeIN,
          officialServiceCreditTimeOUT,
          officialOverTimeIN,
          officialOverTimeOUT,
        } = row;

        if (!employeeID || !day) continue;

        const checkQuery = `SELECT id FROM officialtime WHERE employeeID = ? AND day = ?`;
        const checkValues = [employeeID, day];

        try {
          const [rows] = await db.promise().query(checkQuery, checkValues);

          if (rows.length > 0) {
            // Exists – perform UPDATE
            const updateQuery = `
            UPDATE officialtime SET
              officialTimeIN = ?,
              officialBreaktimeIN = ?,
              officialBreaktimeOUT = ?,
              officialTimeOUT = ?,
              officialHonorariumTimeIN = ?,
              officialHonorariumTimeOUT = ?,
              officialServiceCreditTimeIN = ?,
              officialServiceCreditTimeOUT = ?,
              officialOverTimeIN = ?,
              officialOverTimeOUT = ?
            WHERE employeeID = ? AND day = ?
          `;

            const updateValues = [
              officialTimeIN,
              officialBreaktimeIN,
              officialBreaktimeOUT,
              officialTimeOUT,
              officialHonorariumTimeIN,
              officialHonorariumTimeOUT,
              officialServiceCreditTimeIN,
              officialServiceCreditTimeOUT,
              officialOverTimeIN,
              officialOverTimeOUT,
              employeeID,
              day,
            ];

            const [result] = await db
              .promise()
              .query(updateQuery, updateValues);
            if (result.affectedRows > 0) updatedCount++;
          } else {
            // Not found – perform INSERT
            const insertQuery = `
            INSERT INTO officialtime (
              employeeID, day,
              officialTimeIN,
              officialBreaktimeIN,
              officialBreaktimeOUT,
              officialTimeOUT,
              officialHonorariumTimeIN,
              officialHonorariumTimeOUT,
              officialServiceCreditTimeIN,
              officialServiceCreditTimeOUT,
              officialOverTimeIN,
              officialOverTimeOUT
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

            const insertValues = [
              employeeID,
              day,
              officialTimeIN,
              officialBreaktimeIN,
              officialBreaktimeOUT,
              officialTimeOUT,
              officialHonorariumTimeIN,
              officialHonorariumTimeOUT,
              officialServiceCreditTimeIN,
              officialServiceCreditTimeOUT,
              officialOverTimeIN,
              officialOverTimeOUT,
            ];

            const [result] = await db
              .promise()
              .query(insertQuery, insertValues);
            if (result.affectedRows > 0) insertedCount++;
          }
        } catch (err) {
          console.error(
            `Error processing row for employeeID: ${employeeID}, day: ${day}`,
            err.message
          );
        }
      }

      // Delete the uploaded file after processing
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });

      try {
        logAudit(
          req.user,
          `Upload official time Excel (inserted: ${insertedCount}, updated: ${updatedCount})`,
          'Official Time',
          null,
          null
        );
      } catch (e) {
        console.error('Audit log error:', e);
      }
      res.json({
        message: 'Upload complete.',
        inserted: insertedCount,
        updated: updatedCount,
      });
    } catch (error) {
      console.error('Error processing Excel file:', error);
      res.status(500).json({ message: 'Error processing Excel file.' });
    }
  }
);

//////// ROLES

app.get('/api/user-role/:user', (req, res) => {
  const { user } = req.params;
  const query = 'SELECT role FROM users where id = ?';
  db.query(query, [user], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.lengt > 0) {
      res.json({ role: results[0].role });
    } else {
      console.log(res);
      res.status(400).json({ error: 'User not found' });
    }
  });
});

// Get all records (Include `dateCreated`)
app.get('/api/item-table', authenticateToken, (req, res) => {
  const sql = `
    SELECT id, item_description, employeeID, name, item_code, salary_grade, step, effectivityDate, dateCreated
    FROM item_table
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Database Query Error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    
    try {
      logAudit(req.user, 'View', 'item_table', null, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.json(result);
  });
});

// Add new item (Do NOT include `dateCreated` — it auto-generates)
app.post('/api/item-table', authenticateToken, (req, res) => {
  const {
    item_description,
    employeeID,
    name,
    item_code,
    salary_grade,
    step,
    effectivityDate,
  } = req.body;

  const sql = `
    INSERT INTO item_table (item_description, employeeID, name, item_code, salary_grade, step, effectivityDate)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [
      item_description,
      employeeID,
      name,
      item_code,
      salary_grade,
      step,
      effectivityDate,
    ],
    (err, result) => {
      if (err) {
        console.error('Database Insert Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      
      try {
        logAudit(req.user, 'Insert', 'item_table', result.insertId, employeeID);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      
      res.json({
        message: 'Item record added successfully',
        id: result.insertId,
      });
    }
  );
});

// Update item (Do NOT touch `dateCreated`)
app.put('/api/item-table/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    item_description,
    employeeID,
    name,
    item_code,
    salary_grade,
    step,
    effectivityDate,
  } = req.body;

  const sql = `
    UPDATE item_table SET
      item_description = ?,
      employeeID = ?,
      name = ?,
      item_code = ?,
      salary_grade = ?,
      step = ?,
      effectivityDate = ?
   
    WHERE id = ?
  `;
  db.query(
    sql,
    [
      item_description,
      employeeID,
      name,
      item_code,
      salary_grade,
      step,
      effectivityDate,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error('Database Update Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      try {
        logAudit(req.user, 'Update', 'item_table', id, employeeID);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      
      res.json({ message: 'Item record updated successfully' });
    }
  );
});

// Delete item
app.delete('/api/item-table/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM item_table WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Database Delete Error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    try {
      logAudit(req.user, 'Delete', 'item_table', id, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.json({ message: 'Item record deleted successfully' });
  });
});

// Get all records
app.get('/api/salary-grade-status', authenticateToken, (req, res) => {
  db.query('SELECT * FROM salary_grade_status', (err, result) => {
    if (err) res.status(500).send(err);
    else {
      try {
        logAudit(req.user, 'View', 'salary_grade_status', null, null);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      res.json(result);
    }
  });
});

// Add a new record
app.post('/api/salary-grade-status', authenticateToken, (req, res) => {
  const { effectivityDate, step_number, status } = req.body;

  const sql = `
    INSERT INTO salary_grade_status (effectivityDate, step_number, status)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [effectivityDate, step_number, status], (err, result) => {
    if (err) res.status(500).send(err);
    else {
      try {
        logAudit(req.user, 'Insert', 'salary_grade_status', result.insertId, null);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      res.json({ message: 'Record added successfully', id: result.insertId });
    }
  });
});

// Update a record
app.put('/api/salary-grade-status/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { effectivityDate, step_number, status } = req.body;

  const sql = `
    UPDATE salary_grade_status
    SET effectivityDate = ?, step_number = ?, status = ?
    WHERE id = ?
  `;

  db.query(sql, [effectivityDate, step_number, status, id], (err) => {
    if (err) res.status(500).send(err);
    else {
      try {
        logAudit(req.user, 'Update', 'salary_grade_status', id, null);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      res.json({ message: 'Record updated successfully' });
    }
  });
});

// Delete a record
app.delete('/api/salary-grade-status/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM salary_grade_status WHERE id = ?', [id], (err) => {
    if (err) res.status(500).send(err);
    else {
      try {
        logAudit(req.user, 'Delete', 'salary_grade_status', id, null);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      res.json({ message: 'Record deleted successfully' });
    }
  });
});

// Get all department table
app.get('/api/department-table', authenticateToken, (req, res) => {
  db.query('SELECT * FROM department_table', (err, results) => {
    if (err) return res.status(500).send(err);
    
    try {
      logAudit(req.user, 'View', 'department_table', null, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.json(results);
  });
});

// Get a single department table by ID
app.get('/api/department-table/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT * FROM department_table WHERE id = ?',
    [id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.length === 0)
        return res.status(404).send('Department not found');
      
      try {
        logAudit(req.user, 'View', 'department_table', id, null);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      
      res.json(result[0]);
    }
  );
});

// Add a new department table
app.post('/api/department-table', authenticateToken, (req, res) => {
  const { code, description } = req.body;
  if (!code || !description)
    return res.status(400).send('Code and description are required');

  const sql = `INSERT INTO department_table (code, description) VALUES (?, ?)`;
  db.query(sql, [code, description], (err, result) => {
    if (err) return res.status(500).send(err);
    
    try {
      logAudit(req.user, 'Insert', 'department_table', result.insertId, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.status(201).json({ id: result.insertId, code, description });
  });
});

// Update a department table
app.put('/api/department-table/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { code, description } = req.body;

  const sql = `UPDATE department_table SET code = ?, description = ? WHERE id = ?`;
  db.query(sql, [code, description, id], (err, result) => {
    if (err) return res.status(500).send(err);
    
    try {
      logAudit(req.user, 'Update', 'department_table', id, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.send('Department updated successfully');
  });
});

// Delete a department table
app.delete('/api/department-table/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM department_table WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).send(err);
    
    try {
      logAudit(req.user, 'Delete', 'department_table', id, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.send('Department deleted successfully');
  });
});

/////////////////////////////////////////////////////////////////////////////
// Get all department assignments
app.get('/api/department-assignment', authenticateToken, (req, res) => {
  db.query('SELECT * FROM department_assignment', (err, results) => {
    if (err) return res.status(500).send(err);
    
    try {
      logAudit(req.user, 'View', 'department_assignment', null, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.json(results);
  });
});

// Get a single department assignment by ID
app.get('/api/department-assignment/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT * FROM department_assignment WHERE id = ?',
    [id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.length === 0)
        return res.status(404).send('Department Assignment not found');
      
      try {
        logAudit(req.user, 'View', 'department_assignment', id, null);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      
      res.json(result[0]);
    }
  );
});

// Add a new department assignment (now using department code)
app.post('/api/department-assignment', authenticateToken, (req, res) => {
  const { code, name, employeeNumber } = req.body;
  if (!code || !employeeNumber)
    return res.status(400).send('Code and Employee Number are required');

  const sql = `INSERT INTO department_assignment (code, name, employeeNumber) VALUES (?, ?, ?)`;
  db.query(sql, [code, name, employeeNumber], (err, result) => {
    if (err) return res.status(500).send(err);
    
    try {
      logAudit(req.user, 'Insert', 'department_assignment', result.insertId, employeeNumber);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.status(201).json({ id: result.insertId, code, name, employeeNumber });
  });
});

// Update a department assignment (by ID)
app.put('/api/department-assignment/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { code, name, employeeNumber } = req.body;

  const sql = `UPDATE department_assignment SET code = ?, name = ?, employeeNumber = ? WHERE id = ?`;
  db.query(sql, [code, name, employeeNumber, id], (err, result) => {
    if (err) return res.status(500).send(err);
    
    try {
      logAudit(req.user, 'Update', 'department_assignment', id, employeeNumber);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.send('Department assignment updated successfully');
  });
});

// Delete a department assignment
app.delete('/api/department-assignment/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.query(
    'DELETE FROM department_assignment WHERE id = ?',
    [id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      
      try {
        logAudit(req.user, 'Delete', 'department_assignment', id, null);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      
      res.send('Department assignment deleted successfully');
    }
  );
});

// LEAVE

app.get('/leave', (req, res) => {
  const sql = `SELECT * FROM leave_table`;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Database Query Error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(result);
  });
});

app.post('/leave', (req, res) => {
  const { leave_code, description, number_hours, status } = req.body;

  if (!leave_code) {
    return res.status(400).json({ error: 'Leave code is required' });
  }

  const sql = `INSERT INTO leave_table (leave_code, description, number_hours, status) VALUES (?,?,?,?)`;
  db.query(
    sql,
    [leave_code, description, number_hours, status],
    (err, result) => {
      if (err) {
        console.error('Database Insert Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      res.status(201).json({
        message: 'Leave record added successfully',
        id: result.insertId,
      });
    }
  );
});

app.put('/leave/:id', (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  const { leave_code, description, number_hours, status } = req.body;

  if (!leave_code) {
    return res.status(400).json({ error: 'Leave code is required' });
  }

  const sql = `UPDATE leave_table SET leave_code = ?, description = ?, number_hours = ?, status = ? WHERE id = ?`;
  db.query(
    sql,
    [leave_code, description, number_hours, status, id],
    (err, result) => {
      if (err) {
        console.error('Database Update Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Leave record not found' });
      }

      res.json({ message: 'Leave record updated successfully' });
    }
  );
});

app.delete('/leave/:id', (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  const sql = `DELETE FROM leave_table WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Database Delete Error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Leave record not found' });
    }

    res.json({ message: 'Leave record deleted successfully' });
  });
});

//LEAVE ASSIGNMENT START
// CREATE Leave Assignment
app.post('/leave_assignment', (req, res) => {
  const { employeeID, leaveID, noOfLeaves } = req.body;
  const sql =
    'INSERT INTO leave_assignment (employeeID, leaveID, noOfLeaves) VALUES (?, ?, ?)';
  db.query(sql, [employeeID, leaveID, noOfLeaves], (err, result) => {
    if (err) return res.status(500).json(err);
    res
      .status(201)
      .json({ message: 'Leave Assignment Created', id: result.insertId });
  });
});

// READ Leave Assignments
app.get('/leave_assignment', (req, res) => {
  const sql = 'SELECT * FROM leave_assignment';
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// UPDATE Leave Assignment
app.put('/leave_assignment/:id', (req, res) => {
  const { id } = req.params;
  const { employeeID, leaveID, noOfLeaves } = req.body;
  const sql =
    'UPDATE leave_assignment SET employeeID=?, leaveID=?, noOfLeaves=? WHERE id=?';
  db.query(sql, [employeeID, leaveID, noOfLeaves, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Leave Assignment Updated' });
  });
});

// DELETE Leave Assignment
app.delete('/leave_assignment/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM leave_assignment WHERE id=?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Leave Assignment Deleted' });
  });
});

// HOLIDAY

app.get('/holiday', authenticateToken, (req, res) => {
  const sql = `SELECT * FROM holiday`;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Database Query Error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    
    try {
      logAudit(req.user, 'View', 'holiday', null, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.json(result);
  });
});

app.post('/holiday', authenticateToken, (req, res) => {
  const { description, date, status } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  const sql = `INSERT INTO holiday (description, date, status) VALUES (?, ?, ?)`;
  db.query(sql, [description, date, status], (err, result) => {
    if (err) {
      console.error('Database Insert Error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    try {
      logAudit(req.user, 'Insert', 'holiday', result.insertId, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }

    res.status(201).json({
      message: 'Holiday record added successfully',
      id: result.insertId,
    });
  });
});

app.put('/holiday/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  const { description, date, status } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  const sql = `UPDATE holiday SET description = ?, date = ?, status = ? WHERE id = ?`;
  db.query(sql, [description, date, status, id], (err, result) => {
    if (err) {
      console.error('Database Update Error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hol record not found' });
    }

    try {
      logAudit(req.user, 'Update', 'holiday', id, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }

    res.json({ message: 'Hol record updated successfully' });
  });
});

app.delete('/holiday/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  const sql = `DELETE FROM holiday WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Database Delete Error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hol record not found' });
    }

    try {
      logAudit(req.user, 'Delete', 'holiday', id, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }

    res.json({ message: 'Hol record deleted successfully' });
  });
});

app.get('/personalinfo/person_table/:employeeNumber', (req, res) => {
  const { employeeNumber } = req.params;
  const query = 'SELECT * FROM person_table WHERE agencyEmployeeNum = ?';

  db.query(query, [employeeNumber], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (result.length === 0) {
      return res.status(404).send('Employee not found');
    }

    res.status(200).send(result[0]); // Send first matched result
  });
});

app.get('/college/college-table/:employeeNumber', (req, res) => {
  const { employeeNumber } = req.params;
  const query = 'SELECT * FROM college_table WHERE person_id = ?';

  db.query(query, [employeeNumber], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (result.length === 0) {
      return res.status(404).send('Employee not found');
    }

    res.status(200).send(result[0]); // Send first matched result
  });
});

app.get(`/GraduateRoute/graduate-table/:employeeNumber`, (req, res) => {
  const { employeeNumber } = req.params;
  const query = `SELECT * FROM graduate_table WHERE person_id = ?`;

  db.query(query, [employeeNumber], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Always respond with 200. If nothing found, send null
    res.status(200).send(result.length > 0 ? result[0] : null);
  });
});

app.get('/vocational/vocational-table/:employeeNumber', (req, res) => {
  const { employeeNumber } = req.params;
  const query = 'SELECT * FROM vocational_table WHERE person_id = ?';

  db.query(query, [employeeNumber], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (result.length === 0) {
      return res.status(404).send('Employee not found');
    }

    res.status(200).send(result[0]); // Send first matched result
  });
});

for (let i = 1; i <= 12; i++) {
  app.get(`/childrenRoute/children-table${i}/:employeeNumber`, (req, res) => {
    const { employeeNumber } = req.params;
    const query = `SELECT * FROM children_table WHERE person_id = ? AND incValue=${i}`;

    db.query(query, [employeeNumber], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }

      if (result.length === 0) {
        return res.status(404).send('Employee not found');
      }

      res.status(200).send(result[0]); // Send first matched result
    });
  });
}

for (let i = 1; i <= 7; i++) {
  app.get(`/eligibilityRoute/eligibility${i}/:employeeNumber`, (req, res) => {
    const { employeeNumber } = req.params;
    const query = `SELECT * FROM eligibility_table WHERE person_id = ? AND incValue = ?`;

    db.query(query, [employeeNumber, i], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }

      // Always respond with 200. If nothing found, send null
      res.status(200).send(result.length > 0 ? result[0] : null);
    });
  });
}

for (let i = 1; i <= 26; i++) {
  app.get(
    `/WorkExperienceRoute/work-experience-table${i}/:employeeNumber`,
    (req, res) => {
      const { employeeNumber } = req.params;
      const query = `SELECT * FROM work_experience_table WHERE person_id = ? AND incValue = ?`;

      db.query(query, [employeeNumber, i], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).send('Internal Server Error');
        }

        // Always respond with 200. If nothing found, send null
        res.status(200).send(result.length > 0 ? result[0] : null);
      });
    }
  );
}

for (let i = 1; i <= 7; i++) {
  app.get(`/VoluntaryRoute/voluntary-work${i}/:employeeNumber`, (req, res) => {
    const { employeeNumber } = req.params;
    const query = `SELECT * FROM voluntary_work_table WHERE person_id = ? AND incValue = ?`;

    db.query(query, [employeeNumber, i], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }

      // Always respond with 200. If nothing found, send null
      res.status(200).send(result.length > 0 ? result[0] : null);
    });
  });
}

for (let i = 1; i <= 21; i++) {
  app.get(`/learning_and_development_table${i}/:employeeNumber`, (req, res) => {
    const { employeeNumber } = req.params;
    const query = `SELECT * FROM learning_and_development_table WHERE person_id = ? AND incValue = ?`;

    db.query(query, [employeeNumber, i], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }

      // Always respond with 200. If nothing found, send null
      res.status(200).send(result.length > 0 ? result[0] : null);
    });
  });
}

for (let i = 1; i <= 7; i++) {
  app.get(`/OtherInfo/other-information${i}/:employeeNumber`, (req, res) => {
    const { employeeNumber } = req.params;
    const query = `SELECT * FROM other_information_table WHERE person_id = ? AND incValue = ?`;

    console.log(
      `Request received for incValue ${i} and employeeNumber ${employeeNumber}`
    );

    db.query(query, [employeeNumber, i], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }

      res.status(200).json(result.length > 0 ? result[0] : null); // use json() to ensure proper format
    });
  });
}

app.post('/api/philhealth', authenticateToken, (req, res) => {
  const { employeeNumber, PhilHealthContribution } = req.body;

  const query =
    'INSERT INTO philhealth (employeeNumber, PhilHealthContribution) VALUES (?, ?)';
  db.query(query, [employeeNumber, PhilHealthContribution], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    try {
      logAudit(req.user, 'Insert', 'philhealth', results.insertId, employeeNumber);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res
      .status(201)
      .json({ message: 'PhilHealth contribution added successfully' });
  });
});

app.get('/api/philhealth', authenticateToken, (req, res) => {
  db.query('SELECT * FROM philhealth', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    try {
      logAudit(req.user, 'View', 'philhealth', null, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.json(results);
  });
});

app.put('/api/philhealth/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { employeeNumber, PhilHealthContribution } = req.body;

  const query =
    'UPDATE philhealth SET employeeNumber = ?, PhilHealthContribution = ? WHERE id = ?';
  db.query(
    query,
    [employeeNumber, PhilHealthContribution, id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Contribution not found' });
      }
      
      try {
        logAudit(req.user, 'Update', 'philhealth', id, employeeNumber);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      
      res.json({ message: 'PhilHealth contribution updated successfully' });
    }
  );
});

app.delete('/api/philhealth/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM philhealth WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Contribution not found' });
    }
    
    try {
      logAudit(req.user, 'Delete', 'philhealth', id, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.json({ message: 'PhilHealth contribution deleted successfully' });
  });
});

// BULK REGISTER
app.post('/excel-register', async (req, res) => {
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ message: 'No users data provided' });
  }

  const results = [];
  const errors = [];

  try {
    await Promise.all(
      users.map(
        (user) =>
          new Promise((resolve) => {
            const queryCheck = 'SELECT * FROM users WHERE employeeNumber = ?';
            db.query(queryCheck, [user.employeeNumber], (err, existingUser) => {
              if (err) {
                errors.push(
                  `Error checking user ${user.employeeNumber}: ${err.message}`
                );
                return resolve();
              }

              if (existingUser.length > 0) {
                errors.push(
                  `Employee number ${user.employeeNumber} already exists`
                );
                return resolve();
              }

              const hashedPassword = bcrypt.hashSync(user.password, 10);
              const queryInsert =
                'INSERT INTO users (username, email, role, password, employeeNumber, employmentCategory, access_level) VALUES (?, ?, ?, ?, ?, ?, ?)';

              db.query(
                queryInsert,
                [
                  user.username,
                  user.email,
                  'staff',
                  hashedPassword,
                  user.employeeNumber,
                  '0',
                  'user',
                ],
                (err) => {
                  if (err) {
                    errors.push(
                      `Error processing user ${user.employeeNumber}: ${err.message}`
                    );
                  } else {
                    results.push({
                      employeeNumber: user.employeeNumber,
                      username: user.username,
                      status: 'success',
                    });
                  }
                  resolve();
                }
              );
            });
          })
      )
    );

    // Send final results AFTER all queries are processed
    res.json({
      message: 'Bulk registration completed',
      successful: results,
      errors: errors,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// app.listen(5000, () => {
//   console.log('Server runnning');
// });

// Profile picture upload endpoint
app.post(
  '/upload-profile-picture/:employeeNumber',
  profileUpload.single('profile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { employeeNumber } = req.params;
      const filePath = `/uploads/profile_pictures/${req.file.filename}`;

      // Update the person_table with the new profile picture path
      const query =
        'UPDATE person_table SET profile_picture = ? WHERE agencyEmployeeNum = ?';

      db.query(query, [filePath, employeeNumber], (err, result) => {
        if (err) {
          console.error('Error updating profile picture:', err);
          return res
            .status(500)
            .json({ error: 'Failed to update profile picture' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({
          message: 'Profile picture updated successfully',
          filePath: filePath,
        });
      });
    } catch (error) {
      console.error('Error in profile picture upload:', error);
      res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  }
);

// Announcements endpoints
app.get('/api/announcements', (req, res) => {
  const query = 'SELECT * FROM announcements ORDER BY date DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching announcements:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

app.post('/api/announcements', upload.single('image'), (req, res) => {
  const { title, about, date } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const query =
    'INSERT INTO announcements (title, about, date, image) VALUES (?, ?, ?, ?)';
  db.query(query, [title, about, date, image], (err, result) => {
    if (err) {
      console.error('Error creating announcement:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({
      message: 'Announcement created successfully',
      id: result.insertId,
    });
  });
});

// Update announcement
app.put('/api/announcements/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, about, date } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  // Build query dynamically if image is updated
  let query, params;
  if (image) {
    query =
      'UPDATE announcements SET title = ?, about = ?, date = ?, image = ? WHERE id = ?';
    params = [title, about, date, image, id];
  } else {
    query =
      'UPDATE announcements SET title = ?, about = ?, date = ? WHERE id = ?';
    params = [title, about, date, id];
  }

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error updating announcement:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ message: 'Announcement updated successfully' });
  });
});

app.delete('/api/announcements/:id', (req, res) => {
  const { id } = req.params;

  // First get the announcement to check if it has an image
  const getQuery = 'SELECT image FROM announcements WHERE id = ?';
  db.query(getQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // If there's an image, delete it from the filesystem
    if (results[0].image) {
      const imagePath = path.join(__dirname, results[0].image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting image:', err);
      });
    }

    // Delete the announcement from the database
    const deleteQuery = 'DELETE FROM announcements WHERE id = ?';
    db.query(deleteQuery, [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json({ message: 'Announcement deleted successfully' });
    });
  });
});

app.get('/audit-logs', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM audit_log ORDER BY timestamp DESC';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching audit logs:', err);
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
    
    try {
      logAudit(req.user, 'View', 'audit_log', null, null);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    
    res.json(result);
  });
});
