const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
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



// SALARY GRADE TABLE START
// Create
router.post('/salary-grade', authenticateToken, (req, res) => {
    const { effectivityDate, sg_number, step1, step2, step3, step4, step5, step6, step7, step8 } = req.body;
   
    const query = 'INSERT INTO salary_grade_table (effectivityDate, sg_number, step1, step2, step3, step4, step5, step6, step7, step8) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [effectivityDate, sg_number, step1, step2, step3, step4, step5, step6, step7, step8];
   
    db.query(query, values, (err, results) => {
      if (err) {
        console.error('Error inserting data:', err);
        res.status(500).send('Error inserting data');
      } else {
        try {
          logAudit(req.user, 'Insert', 'salary_grade_table', results.insertId, null);
        } catch (e) {
          console.error('Audit log error:', e);
        }
        res.status(200).send('Salary grade added successfully');
      }
    });
  });
 
 
  // Read (Get all records)
  router.get('/salary-grade', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM salary_grade_table';
   
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Error fetching data');
      } else {
        try {
          logAudit(req.user, 'View', 'salary_grade_table', null, null);
        } catch (e) {
          console.error('Audit log error:', e);
        }
        res.status(200).json(results);
      }
    });
  });
 
 
  // Update (Update a record by ID)
  router.put('/salary-grade/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { effectivityDate, sg_number, step1, step2, step3, step4, step5, step6, step7, step8 } = req.body;
   
    const query = 'UPDATE salary_grade_table SET effectivityDate = ?, sg_number = ?, step1 = ?, step2 = ?, step3 = ?, step4 = ?, step5 = ?, step6 = ?, step7 = ?, step8 = ? WHERE id = ?';
    const values = [effectivityDate, sg_number, step1, step2, step3, step4, step5, step6, step7, step8, id];
   
    db.query(query, values, (err, results) => {
      if (err) {
        console.error('Error updating data:', err);
        res.status(500).send('Error updating data');
      } else {
        try {
          logAudit(req.user, 'Update', 'salary_grade_table', id, null);
        } catch (e) {
          console.error('Audit log error:', e);
        }
        res.status(200).send('Salary grade updated successfully');
      }
    });
  });
 
 
  // Delete (Delete a record by ID)
  router.delete('/salary-grade/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
   
    const query = 'DELETE FROM salary_grade_table WHERE id = ?';
   
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error deleting data:', err);
        res.status(500).send('Error deleting data');
      } else {
        try {
          logAudit(req.user, 'Delete', 'salary_grade_table', id, null);
        } catch (e) {
          console.error('Audit log error:', e);
        }
        res.status(200).send('Salary grade deleted successfully');
      }
    });
  });


module.exports = router;

