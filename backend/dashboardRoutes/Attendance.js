const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const jwt = require('jsonwebtoken'); // add this near the top

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

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'earist_hris',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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

  const employeeNumber =
    user && typeof user === 'object' && user.employeeNumber
      ? user.employeeNumber
      : user || null;

  db.query(
    auditQuery,
    [employeeNumber, action, tableName, recordId, targetEmployeeNumber],
    (err) => {
      if (err) {
        console.error('Error inserting audit log:', err);
      }
    }
  );
}

// Endpoint to fetch attendance records
router.get('/api/attendance', authenticateToken, (req, res) => {
  const { personId, startDate, endDate } = req.query;
  const sql = `
    SELECT attendanceRecord.*, users.employeeNumber, users.username,
    users.employmentCategory, officialtime.*
    FROM attendanceRecord 
    JOIN users ON attendanceRecord.personID = users.employeeNumber 
    JOIN officialtime ON attendanceRecord.Day = officialtime.day
    WHERE attendanceRecord.personID = ? 
    AND attendanceRecord.date BETWEEN ? AND ?
  `;
  db.query(sql, [personId, startDate, endDate], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).json({ error: 'Error fetching data' });
      return;
    }
    logAudit(
      req.user,
      'view',
      'Attendance Module',
      `${startDate} && ${endDate}`,
      personId
    );
    res.json(results);
  });
});

// Endpoint to check if attendance record exists
router.get('/api/check-attendance', authenticateToken, (req, res) => {
  const { personID, date } = req.query;
  const sql = `SELECT EXISTS(SELECT * FROM attendanceRecord WHERE personID = ? AND date = ?) AS exists`;
  db.query(sql, [personID, date], (err, results) => {
    if (err) throw err;
    logAudit(req.user, 'search', 'attendance', date, personID);
    res.json(results[0]);
  });
});

// Endpoint to update attendance records
router.post('/api/update-attendance', authenticateToken, (req, res) => {
  const { records } = req.body;

  const promises = records.map((record) => {
    const sql = `UPDATE attendanceRecord SET timeIN = ?, breaktimeIN = ?, breaktimeOUT = ?, timeOUT = ? WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.query(
        sql,
        [
          record.timeIN,
          record.breaktimeIN,
          record.breaktimeOUT,
          record.timeOUT,
          record.id,
        ],
        (err) => {
          if (err) return reject(err);
          logAudit(
            req.user,
            'update',
            'Attendance Module',
            record.id,
            record.personID
          );
          resolve();
        }
      );
    });
  });

  Promise.all(promises)
    .then(() => res.json({ message: 'Records updated successfully' }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Additional endpoint for attendance with date filtering
router.post('/api/attendance', authenticateToken, (req, res) => {
  const { personID, startDate, endDate } = req.body;

  const query = `
    SELECT PersonID, AttendanceDateTime, AttendanceState 
    FROM AttendanceRecordInfo 
    WHERE PersonID = ? 
    AND AttendanceDateTime BETWEEN ? AND ?`;

  const startTimestamp = new Date(startDate).getTime();
  const endTimestamp = new Date(endDate).getTime();

  db.query(query, [personID, startTimestamp, endTimestamp], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    logAudit(
      req.user,
      'search',
      'Device Attendance Records',
      `${startDate} && ${endDate}`,
      personID
    );

    const records = results.map((record) => {
      const date = new Date(record.AttendanceDateTime);
      const options = {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      };
      const manilaDate = date.toLocaleString('en-PH', options);

      return {
        PersonID: record.PersonID,
        Date: manilaDate.split(',')[0],
        Time: manilaDate.split(',')[1].trim(),
        AttendanceState: record.AttendanceState,
      };
    });

    res.json(records);
  });
});

// Endpoint to fetch all attendance records with specific time columns
router.post('/api/all-attendance', authenticateToken, (req, res) => {
  const { personID, startDate, endDate } = req.body;

  const query = `
    SELECT 
      PersonID, PersonName,
      DATE_FORMAT(FROM_UNIXTIME(AttendanceDateTime/1000), '%Y-%m-%d') AS Date,
      MIN(CASE WHEN AttendanceState = 1 THEN AttendanceDateTime END) AS Time1,
      MIN(CASE WHEN AttendanceState = 2 THEN AttendanceDateTime END) AS Time2,
      MIN(CASE WHEN AttendanceState = 3 THEN AttendanceDateTime END) AS Time3,
      MAX(CASE WHEN AttendanceState = 4 THEN AttendanceDateTime END) AS Time4
    FROM AttendanceRecordInfo
    WHERE PersonID = ? AND AttendanceDateTime BETWEEN ? AND ?
    GROUP BY Date, PersonID, PersonName;
  `;

  const startTimestamp = new Date(startDate).getTime();
  const endTimestamp = new Date(endDate).getTime();

  db.query(query, [personID, startTimestamp, endTimestamp], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    logAudit(
      req.user,
      'search',
      'Device Attendance Records',
      `${startDate} && ${endDate}`,
      personID
    );

    const records = results.map((record) => {
      const convertToManilaTime = (timestamp) => {
        if (!timestamp) return null;
        const date = new Date(timestamp);
        return date
          .toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
          })
          .split(', ')[1];
      };

      return {
        PersonID: record.PersonID,
        PersonName: record.PersonName,
        Date: record.Date,
        Time1: convertToManilaTime(record.Time1),
        Time2: convertToManilaTime(record.Time2),
        Time3: convertToManilaTime(record.Time3),
        Time4: convertToManilaTime(record.Time4),
      };
    });

    res.json(records);
  });
});

// Endpoint to save attendance records
router.post('/api/save-attendance', authenticateToken, (req, res) => {
  const { records } = req.body;

  const promises = records.map((record) => {
    return new Promise((resolve, reject) => {
      const checkSql = `SELECT EXISTS(SELECT * FROM attendanceRecord WHERE personID = ? AND date = ?) AS recordExists`;
      db.query(checkSql, [record.personID, record.date], (err, checkResult) => {
        if (err) return reject(err);

        const exists = checkResult[0].recordExists;
        if (exists) {
          resolve({
            status: 'exists',
            personID: record.personID,
            date: record.date,
          });
        } else {
          const insertSql = `INSERT INTO attendanceRecord (personID, date, day, timeIN, breaktimeIN, breaktimeOUT, timeOUT) VALUES (?, ?, ?, ?, ?, ?, ?)`;
          db.query(
            insertSql,
            [
              record.personID,
              record.date,
              record.Day,
              record.timeIN,
              record.breaktimeIN,
              record.breaktimeOUT,
              record.timeOUT,
            ],
            (err) => {
              if (err) return reject(err);
              logAudit(
                req.user,
                'create',
                'Attendance Management',
                record.date,
                record.personID
              );
              resolve({
                status: 'saved',
                personID: record.personID,
                date: record.date,
              });
            }
          );
        }
      });
    });
  });

  Promise.all(promises)
    .then((results) => res.json(results))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Fetch records
router.post('/api/view-attendance', authenticateToken, (req, res) => {
  const { personID, startDate, endDate } = req.body;

  const query = `
    SELECT 
      ar.personID, 
      ar.date, 
      DAYNAME(ar.date) AS Day, 
      ar.timeIN, ar.breaktimeIN, ar.breaktimeOUT, ar.timeOUT, 
      p.*, 
      ot.officialTimeIN, ot.officialTimeOUT
    FROM attendanceRecord ar
    INNER JOIN person_table p ON ar.personID = p.agencyEmployeeNum
    INNER JOIN (
      SELECT day, MIN(officialTimeIN) AS officialTimeIN, MIN(officialTimeOUT) AS officialTimeOUT
      FROM officialtime
      GROUP BY day
    ) ot ON DAYNAME(ar.date) = ot.day
    WHERE ar.personID = ? AND ar.date BETWEEN ? AND ?
    ORDER BY ar.date ASC;
  `;

  db.query(query, [personID, startDate, endDate], (err, results) => {
    if (err) return res.status(500).send(err);
    logAudit(
      req.user,
      'view',
      'Overall DTR',
      `${startDate} && ${endDate}`,
      personID
    );
    res.send(results);
  });
});

// Update records
router.put('/api/view-attendance', authenticateToken, (req, res) => {
  const { records } = req.body;

  const updatePromises = records.map((record) => {
    const query = `
      UPDATE attendanceRecord
      SET timeIN = ?, breaktimeIN = ?, breaktimeOUT = ?, timeOUT = ?
      WHERE personID = ? AND date = ?
    `;

    const params = [
      record.timeIN,
      record.breaktimeIN,
      record.breaktimeOUT,
      record.timeOUT,
      record.personID,
      record.date,
    ];

    return new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) reject(err);
        else {
          logAudit(
            req.user,
            'update',
            'Overall DTR',
            record.date,
            record.personID
          );
          resolve(result);
        }
      });
    });
  });

  Promise.all(updatePromises)
    .then(() => res.send({ message: 'Records updated successfully.' }))
    .catch((err) => res.status(500).send(err));
});

// GET API for fetching attendance records
router.get('/api/dtr', authenticateToken, (req, res) => {
  const { personID, startDate, endDate } = req.query;

  if (!personID || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: 'Missing required query parameters.' });
  }

  const query = `
    SELECT 
      id, date, personID,  time 
    FROM 
      attendancerecord 
    WHERE 
      personID = ? AND date BETWEEN ? AND ?
  `;

  db.query(query, [personID, startDate, endDate], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Database query failed.' });
    }
    logAudit(
      req.user,
      'view',
      'attendancerecord',
      `${startDate} && ${endDate}`,
      personID
    );
    res.json(results);
  });
});

// Insert overall attendance record
router.post('/api/overall_attendance', authenticateToken, (req, res) => {
  const {
    personID,
    startDate,
    endDate,
    totalRenderedTimeMorning,
    totalRenderedTimeMorningTardiness,
    totalRenderedTimeAfternoon,
    totalRenderedTimeAfternoonTardiness,
    totalRenderedHonorarium,
    totalRenderedHonorariumTardiness,
    totalRenderedServiceCredit,
    totalRenderedServiceCreditTardiness,
    totalRenderedOvertime,
    totalRenderedOvertimeTardiness,
    overallRenderedOfficialTime,
    overallRenderedOfficialTimeTardiness,
  } = req.body;

  const query = `
    INSERT INTO overall_attendance_record (
      personID, 
      startDate, 
      endDate, 
      totalRenderedTimeMorning,
      totalRenderedTimeMorningTardiness,
      totalRenderedTimeAfternoon,
      totalRenderedTimeAfternoonTardiness,
      totalRenderedHonorarium,
      totalRenderedHonorariumTardiness,
      totalRenderedServiceCredit,
      totalRenderedServiceCreditTardiness,
      totalRenderedOvertime,
      totalRenderedOvertimeTardiness,
      overallRenderedOfficialTime,
      overallRenderedOfficialTimeTardiness
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      personID,
      startDate,
      endDate,
      totalRenderedTimeMorning,
      totalRenderedTimeMorningTardiness,
      totalRenderedTimeAfternoon,
      totalRenderedTimeAfternoonTardiness,
      totalRenderedHonorarium,
      totalRenderedHonorariumTardiness,
      totalRenderedServiceCredit,
      totalRenderedServiceCreditTardiness,
      totalRenderedOvertime,
      totalRenderedOvertimeTardiness,
      overallRenderedOfficialTime,
      overallRenderedOfficialTimeTardiness,
    ],
    (error, results) => {
      if (error) {
        console.error('Error inserting data:', error);
        return res.status(500).json({ message: 'Database error', error });
      }
      logAudit(
        req.user,
        'create',
        'Overall Attendance Record',
        `${startDate} && ${endDate}`,
        personID
      );
      res.status(201).json({
        message: 'Attendance record saved successfully',
        data: results,
      });
    }
  );
});

// Fetch overall attendance record
router.get('/api/overall_attendance_record', authenticateToken, (req, res) => {
  const { personID, startDate, endDate } = req.query;
  console.log('Received parameters:', { personID, startDate, endDate });

  const query = `
   SELECT 
  overall_attendance_record.*, 
  department_assignment.code 
FROM 
  overall_attendance_record
LEFT JOIN 
  department_assignment 
ON 
  department_assignment.employeeNumber = overall_attendance_record.personID
WHERE 
  overall_attendance_record.personID = ? 
  AND overall_attendance_record.startDate >= ? 
  AND overall_attendance_record.endDate <= ?
`;

  db.query(query, [personID, startDate, endDate], (error, results) => {
    if (error) {
      console.error('Error Fetching data:', error);
      return res.status(500).json({ message: 'Database error', error });
    }
    logAudit(
      req.user,
      'search',
      'Overall Attendance Record',
      `${startDate} && ${endDate}`,
      personID
    );
    res.status(200).json({
      message: 'Overall attendance record fetched successfully',
      data: results,
    });
  });
});

// Update overall attendance record
router.put(
  '/api/overall_attendance_record/:id',
  authenticateToken,
  (req, res) => {
    const {
      personID,
      startDate,
      endDate,
      totalRenderedTimeMorning,
      totalRenderedTimeMorningTardiness,
      totalRenderedTimeAfternoon,
      totalRenderedTimeAfternoonTardiness,
      totalRenderedHonorarium,
      totalRenderedHonorariumTardiness,
      totalRenderedServiceCredit,
      totalRenderedServiceCreditTardiness,
      totalRenderedOvertime,
      totalRenderedOvertimeTardiness,
      overallRenderedOfficialTime,
      overallRenderedOfficialTimeTardiness,
    } = req.body;

    const { id } = req.params;

    const checkQuery = `
    SELECT * FROM overall_attendance_record WHERE personID = ? AND startDate = ? AND endDate = ? AND id != ?;
  `;
    console.log('Checking for duplicates with', {
      personID,
      startDate,
      endDate,
      id,
    });

    db.query(
      checkQuery,
      [personID, startDate, endDate, id],
      (checkError, checkResults) => {
        if (checkError) {
          return res.status(500).json({
            message: 'Database error while checking for duplicates',
            error: checkError,
          });
        }

        if (checkResults.length > 0) {
          return res.status(400).json({
            message:
              'Duplicate record found with the same personID, startDate, and endDate',
          });
        }

        const query = `
      UPDATE overall_attendance_record SET
      personID = ?, 
      startDate = ?, 
      endDate = ?, 
      totalRenderedTimeMorning = ?, 
      totalRenderedTimeMorningTardiness = ?, 
      totalRenderedTimeAfternoon = ?, 
      totalRenderedTimeAfternoonTardiness = ?, 
      totalRenderedHonorarium = ?, 
      totalRenderedHonorariumTardiness = ?, 
      totalRenderedServiceCredit = ?, 
      totalRenderedServiceCreditTardiness = ?, 
      totalRenderedOvertime = ?, 
      totalRenderedOvertimeTardiness = ?, 
      overallRenderedOfficialTime = ?, 
      overallRenderedOfficialTimeTardiness = ? 
      WHERE id = ?;
    `;

        db.query(
          query,
          [
            personID,
            startDate,
            endDate,
            totalRenderedTimeMorning,
            totalRenderedTimeMorningTardiness,
            totalRenderedTimeAfternoon,
            totalRenderedTimeAfternoonTardiness,
            totalRenderedHonorarium,
            totalRenderedHonorariumTardiness,
            totalRenderedServiceCredit,
            totalRenderedServiceCreditTardiness,
            totalRenderedOvertime,
            totalRenderedOvertimeTardiness,
            overallRenderedOfficialTime,
            overallRenderedOfficialTimeTardiness,
            id,
          ],
          (error, results) => {
            if (error) {
              console.error(error);
              return res.status(500).json({ message: 'Database error', error });
            }
            logAudit(
              req.user,
              'update',
              'Overall Attendance Record',
              id,
              personID
            );
            res
              .status(200)
              .json({ message: 'Record updated successfully', data: results });
          }
        );
      }
    );
  }
);

// Delete overall attendance record
router.delete(
  '/api/overall_attendance_record/:id/:personID',
  authenticateToken,
  (req, res) => {
    const { id, personID } = req.params;

    const query = `
    DELETE FROM overall_attendance_record 
    WHERE id = ? AND personID = ?
  `;

    db.query(query, [id, personID], (err, result) => {
      if (err) {
        console.error('Error deleting attendance entry:', err);
        return res.status(500).send({ message: 'Internal Server Error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).send({
          message: 'Attendance record not found or personID mismatch',
        });
      }

      logAudit(req.user, 'delete', 'overall_attendance_record', id, personID);
      res.status(200).send({ message: 'Attendance entry deleted' });
    });
  }
);

// fetch audit logs
router.get('/api/audit-log', (req, res) => {
  const sql = `SELECT * FROM audit_log ORDER BY timestamp DESC`;
  db.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ error: 'Error fetching audit logs' });
    res.json(results);
  });
});

module.exports = router;
