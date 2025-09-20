import API_BASE_URL from '../../apiConfig';
import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Grid, Container, Box, Typography} from "@mui/material";
import earistLogo from '../../assets/earistLogo.jpg';
import { AccessTime } from '@mui/icons-material';

const DailyTimeRecordFaculty = () => {
  const [personID, setPersonID] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [records, setRecords] = useState([]);
  const [employeeName, setEmployeeName] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
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

      const data = response.data;

      if (data.length > 0) {
        // Set the records
        setRecords(data);

        // Extract and set the employee name from the first record
        const { firstName, lastName } = data[0];
        setEmployeeName(`${firstName} ${lastName}`);
      } else {
        setRecords([]);
        setEmployeeName("No records found");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const printPage = () => {
    const elementsToHide = document.querySelectorAll(".no-print");
    const sidebar = document.querySelector(".MuiDrawer-root");
    const header = document.querySelector(".header");

    if (sidebar) sidebar.style.display = "none";
    if (header) header.style.display = "none";

    elementsToHide.forEach((el) => (el.style.display = "none"));
    window.print();
    elementsToHide.forEach((el) => (el.style.display = ""));
    if (sidebar) sidebar.style.display = "";
    if (header) header.style.display = "";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  const formatMonth = (dateString) => {
    const date = new Date(dateString);
    const options = { month: "long" }; // Only include the month name
    return date.toLocaleDateString(undefined, options).toUpperCase();
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

  return (
    <div className="container faculty">
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .header { display: none !important; }
            .table-wrapper { display: flex; justify-content: center; width: 100%; margin-top: -10%; margin-left: -24% }
            .table-side-by-side { display: flex; justify-content: space-between; width: 100%; }
            .table { width: 45%; margin-right: 2%; border: 1px solid black; border-collapse: collapse; }
          }
        `}
      </style>
      <div 
  style={{
    backgroundColor: '#6D2323',
    color: '#ffffff',
    padding: '20px',
    width: '95.4%',
    borderRadius: '8px',
    borderBottomLeftRadius: '0px',
    borderBottomRightRadius: '0px',
   
  }}>
        <div  style={{ display: 'flex', alignItems: 'center', color: '#ffffff', }}>
          <AccessTime sx={{ fontSize: '3rem', marginRight: '16px', marginTop: '5px', marginLeft: '5px' }} />
          <div >
            <h4  style={{ margin: 0, fontSize: '150%', marginBottom: '2px' }}>
              Overall Daily Time Record
            </h4>
            <p style={{ margin: 0, fontSize: '85%' }}>
              Manage and filters overall DTR records
            </p>
          </div>
          </div>     
        </div>
      <Container sx={{ bgcolor: 'white', borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px', paddingBottom: '50px', paddingTop:'25px'}}>
      <div className="search-container no-print">

         {/* Month Buttons */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2, ml: 1.3 }}>
                    {months.map((month, index) => (
                      <Button key={month} variant="contained" onClick={() => handleMonthClick(index)} sx={{ backgroundColor: "#6D2323", color: "white", "&:hover": { backgroundColor: "#d4bd99" } }}>
                        {month}
                      </Button>
                    ))}
                  </Box>

        <div className='textfield-container'>
          <TextField
            sx={{ width: "200px", paddingRight: "12px" }}
            m
            label="Employee Number"
            value={personID}
            onChange={(e) => setPersonID(e.target.value)}
            variant="outlined"
          />

          <TextField
            sx={{ width: "200px", paddingRight: "12px" }}
            fullWidth
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            sx={{ width: "200px", paddingRight: "12px" }}
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />

          <Button
            sx={{
              width: "200px",
              height: "55px",
              marginleft: "10px",
              margintopt: "10px",
              bgcolor: "#6D2323"
            }}
            variant="contained"
            color="primary"
            onClick={fetchRecords}
            fullWidth
          >
            Search
          </Button>
        </div>
      </div>
      </Container>
      <Container sx={{bgcolor: 'white', marginTop: '20px', marginBottom: '20px', borderRadius: '10px', width: '70.6%', }}>
      <br />
      <div className="table-container" style={{marginBottom: '5%'}}>
        <div className="table-wrapper">
          <div className="table-side-by-side">
            <table
              style={{
                border: "1px solid black",
                borderCollapse: "collapse",
                width: "58%",
              }}
              className="table side-by-side"
            >
              <thead style={{ textAlign: "center" }}>
                <tr>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                </tr>
                <div className='form-header' style={{width: '100%', display: 'flex', alignItems: 'center', marginBottom: '-30%'}}>
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        padding: "50px",
                        lineHeight: "0",
                        height: "200px",
                      }}
                    >
                      <img
                        src={earistLogo}
                        alt="EARIST Logo"
                        width="55"
                        height="55"
                      />
                    </td>
                  </tr>
                  <tr style={{
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    <td colSpan="9" style={{position: 'absolute', top: '-9.5rem', left: '-1rem', width: '20rem'}}>
                      <h6>Republic of the Philippines</h6>
                      <div style={{marginTop: '-0.5rem'}}>
                        <p style={{ fontSize: "15px", fontWeight: "bold" }}>
                          EULOGIO "AMANG" RODRIGUEZ <br /> INSTITUTE OF SCIENCE &
                          TECHNOLOGY
                        </p>
                      </div>
                      <p style={{ fontSize: "12px", fontWeight: "bold" }}>
                        Nagtahan, Sampaloc Manila
                      </p>
                      <p style={{ fontSize: "12px", marginTop: "12px" }}>
                        Civil Service Form No. 48
                      </p>
                      <h3>DAILY TIME RECORD</h3>
                    </td>
                  </tr>
                </div>
                
                  <tr >
                    <td colSpan="9" style={{ padding: "2", lineHeight: "0" }}>
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: "bold",
                          margin: "0",
                          height: "20px",
                          textAlign: "left",
                          padding: '0 1rem',
                        }}
                      >
                        NAME: {employeeName}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan="9" style={{ padding: "2", lineHeight: "0" }}>
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: "bold",
                          margin: "0",
                          height: "10px",
                          textAlign: "left",
                          padding: '0 1rem',
                        }}
                      >
                        Covered Dates: {startDate ? formatDate(startDate) : ""} -{" "}
                        {endDate ? formatDate(endDate) : ""}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td
                      colSpan="3"
                      style={{ padding: "2", lineHeight: "2", textAlign: "left", padding: '0rem 1rem' }}
                    >
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: "bold",
                          margin: "0",
                        }}
                      >
                        For the month of:{" "}
                        {startDate ? formatMonth(startDate) : ""}
                      </p>
                    </td>
                  </tr>
                
              </thead>
              <tr>
                <th
                  rowSpan="2"
                  style={{
                    textAlign: "center",
                    verticalAlign: "middle",
                    border: "1px solid black",
                  }}
                >
                  DAY
                </th>
                <th colSpan="2" style={{ border: "1px solid black" }}>
                  A.M.
                </th>
                <th style={{ border: "1px solid black" }}></th>
                <th colSpan="2" style={{ border: "1px solid black" }}>
                  P.M.
                </th>
                <th style={{ border: "1px solid black" }}></th>
                <th colSpan="2" style={{ border: "1px solid black" }}>
                  Undertime
                </th>
              </tr>
              <tr>
                <td style={{ border: "1px solid black" }}>ARRIVAL</td>
                <td style={{ border: "1px solid black" }}>DEPARTURE</td>
                <td style={{ border: "1px solid black" }}></td>
                <td style={{ border: "1px solid black" }}>ARRIVAL</td>
                <td style={{ border: "1px solid black" }}>DEPARTURE</td>
                <td style={{ border: "1px solid black" }}></td>
                <td style={{ border: "1px solid black" }}>Hours</td>
                <td style={{ border: "1px solid black" }}>Minutes</td>
              </tr>

              <tbody>
                {Array.from({ length: 31 }, (_, i) => {
                  const day = (i + 1).toString().padStart(2, "0");
                  const record = records.find((r) =>
                    r.date.endsWith(`-${day}`)
                  );

                  return (
                    <tr key={i}>
                      <td style={{ border: "1px solid black", textAlign: 'center'}}>{day}</td>
                      <td style={{ border: "1px solid black" }}>
                        {record?.timeIN || ""}
                      </td>
                      <td style={{ border: "1px solid black"}}>
                        {record?.timeOUT || ""}
                      </td>
                      <td style={{ border: "1px solid black" }}></td>
                      <td style={{ border: "1px solid black" }}>
                        {record?.breaktimeIN || ""}
                      </td>
                      <td style={{ border: "1px solid black" }}>
                        {record?.breaktimeOUT || ""}
                      </td>
                      <td style={{ border: "1px solid black" }}></td>
                      <td style={{ border: "1px solid black" }}>
                        {record?.hours || ""}
                      </td>
                      <td style={{ border: "1px solid black" }}>
                        {record?.minutes || ""}
                      </td>
                    </tr>
                  );
                })}
                
              </tbody>
              <div>
              
              </div>
            </table>            
          </div>
        </div>
      </div>
       </Container>

      <Button
        sx={{
          width: "200px",
          height: "55px",
          marginleft: "10px",
          margintopt: "10px",
          bgcolor: "#6D2323"
        }}
        className="no-print"
        variant="contained"
        color="primary"
        onClick={printPage}
        fullWidth
      >
        Print
      </Button>
    </div>
    
  );
};

export default DailyTimeRecordFaculty;
