import API_BASE_URL from "../../apiConfig";
import React, { useState } from "react";
import axios from "axios";
import { Box, TextField, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { useNavigate } from "react-router-dom";


const formatTime = (time) => {
  if (!time) return "N/A";

  if (time.includes("AM") || time.includes("PM")) {
    const [hour, minute, second] = time.split(/[: ]/);
    const paddedHour = hour.padStart(2, "0");
    return `${paddedHour}:${minute}:${second} ${time.slice(-2)}`;
  }

  const [hour, minute, second] = time.split(":");
  const hour24 = parseInt(hour, 10);
  const hour12 = hour24 % 12 || 12;
  const ampm = hour24 < 12 ? "AM" : "PM";
  return `${String(hour12).padStart(2, "0")}:${minute}:${second} ${ampm}`;
};

const getDayOfWeek = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "long" });
};

const ViewAttendanceRecord = () => {
  const [personID, setPersonID] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [records, setRecords] = useState([]);
  const [personName, setPersonName] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/attendance/api/all-attendance`, {
        personID, 
        startDate, 
        endDate
      }, getAuthHeaders());

      setRecords(response.data);

      if (response.data.length > 0) {
        setPersonName(response.data[0].PersonName);
      } else {
        setPersonName("");
      }
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
    const end = new Date(Date.UTC(year, monthIndex + 1, 0)); 

    const formattedStart = start.toISOString().substring(0, 10);
    const formattedEnd = end.toISOString().substring(0, 10);

    setStartDate(formattedStart);
    setEndDate(formattedEnd);
  };

  const navigate = useNavigate();

 const handleSaveRecords = async () => {
    try {
      const formattedRecords = records.map((record) => ({
        personID: record.PersonID,
        date: record.Date,
        Day: getDayOfWeek(record.Date),
        timeIN: record.Time1 ? formatTime(record.Time1) : null,
        breaktimeIN: record.Time2 ? formatTime(record.Time2) : null,
        breaktimeOUT: record.Time3 ? formatTime(record.Time3) : null,
        timeOUT: record.Time4 ? formatTime(record.Time4) : null,
      }));

      const response = await axios.post(`${API_BASE_URL}/attendance/api/save-attendance`, {
        records: formattedRecords,
      }, getAuthHeaders());

      const savedMessages = response.data.map((result) =>
        result.status === "exists"
          ? `Record for ${result.personID} on ${result.date} already exists.`
          : `Record for ${result.personID} on ${result.date} saved successfully.`
      );

      alert(savedMessages.join("\n"));
    } catch (error) {
      console.error("Error saving attendance records:", error);
    }
  };

   const handleSaveAndNavigate = async (path) => {
    await handleSaveRecords();
    navigate(path);
  };




  return (
    <Container>
      <div style={{ backgroundColor: '#6D2323', color: '#ffffff', padding: '20px', width: '96.5%', borderRadius: '8px', borderBottomLeftRadius: '0px', borderBottomRightRadius: '0px', }}>
        <div style={{ display: 'flex', alignItems: 'center', color: '#ffffff' }}>
          <SearchIcon sx={{ fontSize: '3rem', marginRight: '16px', marginTop: '5px', marginLeft: '5px' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '150%', marginBottom: '2px' }}>View Device Attendance Records</h4>
            <p style={{ margin: 0, fontSize: '85%' }}>Generate and review attendance records</p>
          </div>
        </div>
      </div>

      <Container sx={{ bgcolor: "white", height: "90%", paddingTop: "-5px", paddingBottom: '-10px', borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px', border: '1px solid #6d2323', borderTop: 'none'}}>
        {/* Month Buttons */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2, pt: 5, ml: 12.7 }}>
          {months.map((month, index) => (
            <Button key={month} variant="contained" onClick={() => handleMonthClick(index)} sx={{ backgroundColor: "#6D2323", color: "white", "&:hover": { backgroundColor: "#d4bd99" } }}>
              {month}
            </Button>
          ))}
        </Box>

        <div style={{ padding: "10px", marginLeft:'-10px'}}>
          <form onSubmit={handleSubmit} style={{ marginBottom: "16px" }}>
            <TextField
              label="Employee Number"
              value={personID}
              onChange={(e) => setPersonID(e.target.value)}
              required
              fullWidth
              margin="normal"
              sx={{ width: "250px", marginLeft: "50px" }}
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              sx={{ width: "250px", height: "54px", marginLeft: "10px", marginTop: "14px" }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              sx={{ width: "250px", height: "54px", marginLeft: "10px", marginTop: "14px" }}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" color="primary" type="submit" sx={{ width: "200px", height: "54px", marginLeft: "10px", marginTop: "14px", bgcolor: "#6D2323" }} startIcon={<SearchIcon />}>
              Search Record
            </Button>
          </form>

          {personName && (
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', bgcolor: '#6D2323', color: 'white', borderRadius: '5px', padding: '10px' }}>
              Device Record for <b>{personName}</b>
            </Typography>
          )}
          {records.length > 0 && (
            <TableContainer component={Paper} style={{ marginBottom: "5px" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee Number</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Day</TableCell>
                    <TableCell>Time IN</TableCell>
                    <TableCell>Breaktime IN</TableCell>
                    <TableCell>Breaktime OUT</TableCell>
                    <TableCell>Time OUT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.PersonID}</TableCell>
                      <TableCell>{record.Date}</TableCell>
                      <TableCell>{getDayOfWeek(record.Date)}</TableCell>
                      <TableCell>{formatTime(record.Time1)}</TableCell>
                      <TableCell>{formatTime(record.Time2)}</TableCell>
                      <TableCell>{formatTime(record.Time3)}</TableCell>
                      <TableCell>{formatTime(record.Time4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleSaveAndNavigate('/attendance_module_faculty')}
              startIcon={<SaveAsIcon />}
               sx={{
                mt: 2,
                ml: "150px",
                mb: 2,
                backgroundColor: "#6D2323",
                "&:hover": {
                  backgroundColor: "#a31d1d",
                },
              }}

            >
              Save Faculty 30hrs
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleSaveAndNavigate('/attendance_module_faculty_40hrs')}
              startIcon={<SaveAsIcon />}
              sx={{ 
                marginTop: "16px", 
                marginLeft: '20px', 
                marginBottom: '20px',
                backgroundColor: '#6D2323', 
                "&:hover": {
                  backgroundColor: "#a31d1d",
                }, 
               }}
             
            >
              Save Faculty Designated
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleSaveAndNavigate('/attendance_module')}
              sx={{ marginTop: "16px", backgroundColor: '#6D2323', marginLeft: '20px', marginBottom: '20px', "&:hover": {
                  backgroundColor: "#a31d1d",
                },  }}
              startIcon={<SaveAsIcon />}
            >
            Save Non-Teaching
            </Button>
          </>
        </div>
      </Container>
    </Container>
  );
};

export default ViewAttendanceRecord;
