import API_BASE_URL from '../../apiConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  Box,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import { Search, EventNote } from '@mui/icons-material';

const AttendanceUserState = () => {
  const loggedInEmployeeNumber = localStorage.getItem('employeeNumber') || '';

  const today = new Date();
  const formattedToday = today.toISOString().substring(0, 10);

  const [personID, setPersonID] = useState(loggedInEmployeeNumber);
  const [startDate, setStartDate] = useState(formattedToday);
  const [endDate, setEndDate] = useState(formattedToday);
  const [records, setRecords] = useState([]);
  const [submittedID, setSubmittedID] = useState('');
  const [error, setError] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    console.log(
      'Token from localStorage:',
      token ? 'Token exists' : 'No token found'
    );
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token starts with:', token.substring(0, 20) + '...');
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  };

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const handleMonthClick = (monthIndex) => {
    const year = 2024; //new Date().getFullYear();
    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 0));
    setStartDate(start.toISOString().substring(0, 10));
    setEndDate(end.toISOString().substring(0, 10));
  };

  useEffect(() => {
    const fetchRecords = async () => {
      if (!personID || !startDate || !endDate) return;
      try {
        // Use POST endpoint that returns PersonID, Date, Time, AttendanceState
        const response = await axios.post(
          `${API_BASE_URL}/attendance/api/attendance`,
          { personID, startDate, endDate },
          getAuthHeaders()
        );
        setRecords(response.data);
        setSubmittedID(personID);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch attendance records');
      }
    };
    fetchRecords();
  }, [personID, startDate, endDate]);

  const inputStyle = { width: 250 };

  return (
    <Container sx={{ mt: 4 }}>
      {/* Header */}
      <Box
        sx={{
          backgroundColor: '#6D2323',
          color: '#ffffff',
          p: 2.5,
          borderRadius: 2,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <Box display="flex" alignItems="center">
          <EventNote sx={{ fontSize: '3rem', mr: 2 }} />
          <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              Attendance Record State
            </Typography>
            <Typography variant="body2">
              Review attendance records states
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Form Box */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          border: '1px solid #6D2323',
          borderTop: 'none',
          borderRadius: 2,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
      >
        {/* Month Buttons */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {months.map((month, index) => (
            <Button
              key={month}
              variant="contained"
              onClick={() => handleMonthClick(index)}
              sx={{
                backgroundColor: '#6D2323',
                color: '#FEF9E1',
                '&:hover': { backgroundColor: '#5a1d1d' },
                minWidth: 60,
              }}
            >
              {month}
            </Button>
          ))}
        </Box>

        {/* Date Fields */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Employee Number"
            value={personID}
            disabled
            sx={inputStyle}
          />
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            sx={inputStyle}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            sx={inputStyle}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {submittedID && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            display: 'inline-block',
            border: '1px solid #6D2323',
            borderRadius: 2,
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 2px 6px rgba(0,0,0,0.1)',
            width: '96%',
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#6D2323', mb: 0.5 }}>
            Employee Number:
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: '#6D2323', fontWeight: 'bold' }}
          >
            {submittedID}
          </Typography>

          {/* Attendance Table */}
          <Paper elevation={3}>
            <TableContainer
              component={Paper}
              sx={{ mt: 3, mb: 6, border: '1px solid #6D2323' }}
            >
              <Table>
                <TableHead sx={{ backgroundColor: '#6D2323' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#FEF9E1', fontWeight: 'bold' }}>
                      Employee Number
                    </TableCell>
                    <TableCell sx={{ color: '#FEF9E1', fontWeight: 'bold' }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ color: '#FEF9E1', fontWeight: 'bold' }}>
                      Time
                    </TableCell>
                    <TableCell sx={{ color: '#FEF9E1', fontWeight: 'bold' }}>
                      Attendance State
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{ p: 3, color: '#8B0000' }}
                      >
                        No data found for employee <b>{submittedID}</b> for the
                        period of{' '}
                        <b>
                          {startDate
                            ? new Date(startDate).toLocaleString('default', {
                                month: 'long',
                              })
                            : ''}
                        </b>
                        .
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                          '&:hover': { backgroundColor: '#f1e6e6' },
                        }}
                      >
                        <TableCell>{record.PersonID}</TableCell>
                        <TableCell>{record.Date}</TableCell>
                        <TableCell>{record.Time}</TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 'bold',
                            color:
                              record.AttendanceState === 0 ||
                              record.AttendanceState === 'UnCategorized'
                                ? 'red'
                                : 'black',
                          }}
                        >
                          {record.AttendanceState === 4
                            ? 'Time OUT'
                            : record.AttendanceState === 3
                            ? 'Breaktime OUT'
                            : record.AttendanceState === 2
                            ? 'Breaktime IN'
                            : record.AttendanceState === 1
                            ? 'Time IN'
                            : 'UnCategorized'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default AttendanceUserState;
