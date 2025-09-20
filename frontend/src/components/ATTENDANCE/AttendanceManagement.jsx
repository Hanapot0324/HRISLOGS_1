import API_BASE_URL from "../../apiConfig";
import React, { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  Box,
  Typography  
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SaveAsIcon from '@mui/icons-material/SaveAs';

const AttendanceSearch = () => {
  const [personID, setPersonID] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [records, setRecords] = useState([]);

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

  const fetchRecords = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/attendance/api/view-attendance`,
        {
          personID,
          startDate,
          endDate,
        },
        getAuthHeaders()
      );
      setRecords(response.data);
    } catch (err) {
      console.error("Axios error:", err.response ? err.response.data : err);
    }
  };

  const saveAll = async () => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/attendance/api/view-attendance`,
        { records },
        getAuthHeaders()
      );
      alert(response.data.message);
    } catch (err) {
      console.error(err);
      alert("Failed to save records.");
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedRecords = [...records];
    updatedRecords[index][field] = value;
    setRecords(updatedRecords);
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
    <Container>
          <div
                      style={{
                        backgroundColor: '#6D2323',
                        color: '#ffffff',
                        padding: '20px',
                        width: '96.5%',
                        borderRadius: '8px',
                        borderBottomLeftRadius: '0px',
                        borderBottomRightRadius: '0px',
                       
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', color: '#ffffff', }}>
                        <SearchIcon sx={{ fontSize: '3rem', marginRight: '16px', marginTop: '5px', marginLeft: '5px' }} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '150%', marginBottom: '2px' }}>
                            Attendance Management
                          </h4>
                          <p style={{ margin: 0, fontSize: '85%' }}>
                          Review and manage attendance records
             
                          </p>
                        </div>
                      </div>
                      </div>
                          
    <Container sx={{bgcolor: "white", height: "90%",  paddingBottom: '30px', borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px',}}>
 {/* Month Buttons */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2, pt: 5, ml: 12.5 }}>
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
    <div>

      <TextField
        label="Employee Number"
        value={personID}
        onChange={(e) => setPersonID(e.target.value)}
        sx={{ width: "250px", marginTop: "14px",  marginLeft: '50px' }} // Adjust width and add spacing
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
                   marginTop: "14px",
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
                   marginTop: "14px",
                 }}
                 InputLabelProps={{ shrink: true }}
               />
      <Button
        sx={{marginTop: "14px", width: "200px", height: "55px", marginLeft: "10px", bgcolor: "#6D2323" }}
        margin="normal"
        variant="contained"
        color="primary"
        onClick={fetchRecords}
        startIcon={<SearchIcon />}
        
      >
        Search
      </Button>
      

      {records.length > 0 && (
        <>
          <TableContainer component={Paper} style={{ marginTop: "20px" }}>
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
                    <TableCell>{record.personID}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.Day}</TableCell>
                    <TableCell>
                      <TextField
                        value={record.timeIN || ""}
                        onChange={(e) =>
                          handleInputChange(index, "timeIN", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={record.breaktimeIN || ""}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "breaktimeIN",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={record.breaktimeOUT || ""}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "breaktimeOUT",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={record.timeOUT || ""}
                        onChange={(e) =>
                          handleInputChange(index, "timeOUT", e.target.value)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            variant="contained"
            color="secondary"
            onClick={saveAll}
            style={{ marginTop: "20px", backgroundColor: "#6d2323" }}
            startIcon={<SaveAsIcon />}
            
          >
            Save All
          </Button>
        </>
      )}
    </div>
    </Container>
    </Container>
  );
};

export default AttendanceSearch;
