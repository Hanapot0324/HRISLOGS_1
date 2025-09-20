import API_BASE_URL from "../../apiConfig";
import React, { useState } from "react";
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Search } from "@mui/icons-material";

const AllAttendanceRecord = () => {
  const [personID, setPersonID] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [records, setRecords] = useState([]);
  const [submittedID, setSubmittedID] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/attendance/api/attendance`,
        { personID, startDate, endDate },
        getAuthHeaders()
      );
      setRecords(response.data);
      setSubmittedID(personID);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
    }
  };

  const currentYear = 2024;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const handleMonthClick = (monthIndex) => {
    const year = 2024;
  
    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 0)); // last day of month
  
    // format as YYYY-MM-DD (ISO format expected by <TextField type="date" />)
    const formattedStart = start.toISOString().substring(0, 10);
    const formattedEnd = end.toISOString().substring(0, 10);
  
    setStartDate(formattedStart);
    setEndDate(formattedEnd);
  };

  return (

    
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <div
                  style={{
                    backgroundColor: '#6D2323',
                    color: '#ffffff',
                    padding: '20px',
                    width: '96.6%',
                    borderRadius: '8px',
                    borderBottomLeftRadius: '0px',
                    borderBottomRightRadius: '0px',
                   
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', color: '#ffffff', }}>
                    <Search sx={{ fontSize: '3rem', marginRight: '16px', marginTop: '5px', marginLeft: '5px' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '150%', marginBottom: '2px' }}>
                        Attendance Record State
                      </h4>
                      <p style={{ margin: 0, fontSize: '85%' }}>
                        Review attendance records states
         
                      </p>
                    </div>
                  </div>
                  
                      </div>
                      

      {/* Form Box (white background) */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: '#ffffff',
          borderBottomLeftRadius: '5px',
          borderBottomRightRadius: '5px',
          border: '1px solid #6d2323',
          borderTop: 'none'
        }}
      >
        {/* Month Buttons */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2, ml: 12.5 }}>
                {months.map((month, index) => (
                  <Button
                    key={month}
                    variant="contained"
                    onClick={() => handleMonthClick(index)}
                    sx={{
                      backgroundColor: "#6D2323",
                      color: "white", // optional: text color for contrast
                      "&:hover": {
                        backgroundColor: "#d4bd99", // optional: slightly darker hover effect
                      },
                    }}
                  >
                    {month}
                  </Button>
                ))}
              </Box>
        
        <Box
          component="form"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
            paddingTop: 1,
          }}
          onSubmit={handleSubmit}
        >
          <TextField
            label="Employee Number"
            variant="outlined"
            value={personID}
            onChange={(e) => setPersonID(e.target.value)}
            required
            sx={{ width: "250px", marginLeft: '15px'  }}
          />
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            sx={{
              width: "250px",
              height: "54px",
              marginLeft: "10px",

            }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            sx={{
              width: "250px",
              height: "54px",
              marginLeft: "10px",
            }}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            type="submit"
            style={{
              width: "200px",
              height: "55px",
              backgroundColor: "#6D2323",
              color: "#FEF9E1",
            }}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {/* Display submitted Person ID */}
      {submittedID && (
        <Typography variant="h6" sx={{ mt: 4 }}>
          Records for Person ID: <b>{submittedID}</b>
        </Typography>
      )}

      {/* Results Table */}
      {records.length > 0 && (
        <TableContainer
          component={Paper}
          sx={{ mt: 4, mb: 6 }}
          elevation={3}
        >
          <Table style={{border:'1px solid #6d2323'}}>
            <TableHead >
              <TableRow style={{ backgroundColor: '#ffffff', border: '1px solid #6d2323' }}>
                <TableCell style={{ color: '#6d2323', fontWeight: 'bold' }}>
                  Employee Number
                </TableCell>
                <TableCell style={{ color: '#6d2323', fontWeight: 'bold' }}>
                  Date
                </TableCell>
                <TableCell style={{ color: '#6d2323', fontWeight: 'bold' }}>
                  Time
                </TableCell>
                <TableCell style={{ color: '#6d2323', fontWeight: 'bold' }}>
                  Attendance State
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.PersonID}</TableCell>
                  <TableCell>{record.Date}</TableCell>
                  <TableCell>{record.Time}</TableCell>
                  <TableCell 
                    style={{ color: record.AttendanceState === 0 || record.AttendanceState === 'UnCategorized' ? 'red' : 'black', fontWeight: 'bold'}} 
                  >
                    {record.AttendanceState === 4 ? "Time OUT" : record.AttendanceState === 3 ? "Breaktime OUT" : record.AttendanceState === 2 ? "Breaktime IN" : record.AttendanceState === 1 ? "Time IN" : "UnCategorized" } 
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AllAttendanceRecord;
