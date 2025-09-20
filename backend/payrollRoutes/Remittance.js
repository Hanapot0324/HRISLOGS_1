const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');

//MYSQL CONNECTION
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'earist_hris',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Authentication middleware
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
    console.log('Decoded JWT:', user);
    req.user = user;
    next();
  });
}

// Audit logging function
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

// GET: Fetch remittance records with latest name from payroll_processing
router.get('/employee-remittance', authenticateToken, (req, res) => {
  const sql = `
    SELECT r.id, r.employeeNumber, p.name,
           r.liquidatingCash, r.gsisSalaryLoan, r.gsisPolicyLoan, r.gsisArrears,
           r.cpl, r.mpl, r.mplLite, r.emergencyLoan, r.nbc594, r.increment,
           r.pagibig, r.pagibigFundCont, r.pagibig2, r.multiPurpLoan,
           r.landbankSalaryLoan, r.earistCreditCoop, r.feu, r.created_at
    FROM remittance_table r
    LEFT JOIN payroll_processing p
      ON r.employeeNumber = p.employeeNumber
  `;

  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching data' });
    } else {
      try {
        logAudit(req.user, 'View', 'remittance_table', null, null);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      res.json(result);
    }
  });
});

// POST: Add new remittance record (no more "name")
router.post('/employee-remittance', authenticateToken, (req, res) => {
  const {
    employeeNumber,
    liquidatingCash,
    gsisSalaryLoan,
    gsisPolicyLoan,
    gsisArrears,
    cpl,
    mpl,
    mplLite,
    emergencyLoan,
    nbc594,
    increment,
    pagibig,
    pagibigFundCont,
    pagibig2,
    multiPurpLoan,
    landbankSalaryLoan,
    earistCreditCoop,
    feu,
  } = req.body;

  const sql = `
    INSERT INTO remittance_table (
      employeeNumber, liquidatingCash, gsisSalaryLoan, gsisPolicyLoan, gsisArrears,
      cpl, mpl, mplLite, emergencyLoan, nbc594, increment,
      pagibig, pagibigFundCont, pagibig2, multiPurpLoan,
      landbankSalaryLoan, earistCreditCoop, feu
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    employeeNumber,
    liquidatingCash,
    gsisSalaryLoan,
    gsisPolicyLoan,
    gsisArrears,
    cpl,
    mpl,
    mplLite,
    emergencyLoan,
    nbc594,
    increment,
    pagibig,
    pagibigFundCont,
    pagibig2,
    multiPurpLoan,
    landbankSalaryLoan,
    earistCreditCoop,
    feu,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error during POST request:', err);
      res.status(500).json({ message: 'Error adding data' });
    } else {
      try {
        logAudit(req.user, 'Insert', 'remittance_table', result.insertId, employeeNumber);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      res.status(200).json({ message: 'Data added successfully' });
    }
  });
});

// PUT: Update remittance record (no more "name")
router.put('/employee-remittance/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    employeeNumber,
    liquidatingCash,
    gsisSalaryLoan,
    gsisPolicyLoan,
    gsisArrears,
    cpl,
    mpl,
    mplLite,
    emergencyLoan,
    nbc594,
    increment,
    pagibig,
    pagibigFundCont,
    pagibig2,
    multiPurpLoan,
    landbankSalaryLoan,
    earistCreditCoop,
    feu,
  } = req.body;

  const sql = `
    UPDATE remittance_table
    SET employeeNumber = ?,
        liquidatingCash = ?,
        gsisSalaryLoan = ?,
        gsisPolicyLoan = ?,
        gsisArrears = ?,
        cpl = ?,
        mpl = ?,
        mplLite = ?,
        emergencyLoan = ?,
        nbc594 = ?,
        increment = ?,
        pagibig = ?,
        pagibigFundCont = ?,
        pagibig2 = ?,
        multiPurpLoan = ?,
        landbankSalaryLoan = ?,
        earistCreditCoop = ?,
        feu = ?
    WHERE id = ?
  `;

  const values = [
    employeeNumber,
    liquidatingCash,
    gsisSalaryLoan,
    gsisPolicyLoan,
    gsisArrears,
    cpl,
    mpl,
    mplLite,
    emergencyLoan,
    nbc594,
    increment,
    pagibig,
    pagibigFundCont,
    pagibig2,
    multiPurpLoan,
    landbankSalaryLoan,
    earistCreditCoop,
    feu,
    id,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error updating data' });
    } else {
      try {
        logAudit(req.user, 'Update', 'remittance_table', id, employeeNumber);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      res.status(200).json({ message: 'Data updated successfully' });
    }
  });
});

// DELETE
router.delete('/employee-remittance/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM remittance_table WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error deleting data' });
    } else {
      try {
        logAudit(req.user, 'Delete', 'remittance_table', id, null);
      } catch (e) {
        console.error('Audit log error:', e);
      }
      res.status(200).json({ message: 'Data deleted successfully' });
    }
  });
});

module.exports = router;
