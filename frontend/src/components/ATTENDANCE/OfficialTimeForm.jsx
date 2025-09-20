import API_BASE_URL from "../../apiConfig";
import React, { useState } from "react";
import axios from "axios";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";


import {
  Typography,
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
} from "@mui/material";


import LoadingOverlay from "../LoadingOverlay";
import SuccessfulOverlay from "../SuccessfulOverlay";


const OfficialTimeForm = () => {
  const [employeeID, setemployeeID] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState(false);


  const [file, setFile] = useState(null);


  const [successOpen, setSuccessOpen] = useState(false);
  const [successAction, setSuccessAction] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  };


  const defaultRecords = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map((day) => ({
    employeeID,
    day,
    officialTimeIN: "00:00:00 AM",
    officialBreaktimeIN: "00:00:00 AM",
    officialBreaktimeOUT: "00:00:00 AM",
    officialTimeOUT: "00:00:00 AM",
    officialHonorariumTimeIN: "00:00:00 AM",
    officialHonorariumTimeOUT: "00:00:00 AM",
    officialServiceCreditTimeIN: "00:00:00 AM",
    officialServiceCreditTimeOUT: "00:00:00 AM",
    officialOverTimeIN: "00:00:00 AM",
    officialOverTimeOUT: "00:00:00 AM",
    breaktime: "",
  }));


  const handleSearch = () => {
    if (!employeeID) {
      setSuccessAction("Please enter an Employee ID.");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2000);
      return;
    }


    setLoading(true);
    axios
      .get(`${API_BASE_URL}/officialtimetable/${employeeID}`,
        getAuthHeaders()
      )
      .then((res) => {
        setLoading(false);
        if (res.data.length > 0) {
          setRecords(res.data);
          setFound(true);
        } else {
          setRecords(defaultRecords);
          setFound(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setLoading(false);
        setSuccessAction("Error fetching records.");
        setSuccessOpen(true);
        setTimeout(() => setSuccessOpen(false), 2000);
      });
  };


  const handleChange = (index, field, value) => {
    const updatedRecords = [...records];
    updatedRecords[index][field] = value;
    setRecords(updatedRecords);
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employeeID) {
      setSuccessAction("Please enter a valid Employee ID.");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2000);
      return;
    }


    setLoading(true);
    axios
      .post(`${API_BASE_URL}/officialtimetable`, {
        employeeID,
        records,
      },
        getAuthHeaders()
      )
      .then((res) => {
        setLoading(false);
        setSuccessAction(found ? "Updated Successfully" : "Saved Successfully");
        setSuccessOpen(true);
        setTimeout(() => setSuccessOpen(false), 2000);
      })
      .catch((err) => {
        console.error("Error saving data:", err);
        setLoading(false);
        setSuccessAction("Error saving records.");
        setSuccessOpen(true);
        setTimeout(() => setSuccessOpen(false), 2000);
      });
  };


  const handleUpload = async () => {
    if (!file) {
      setSuccessAction("Please select a file!");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2000);
      return;
    }


    const formData = new FormData();
    formData.append("file", file);


    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/upload-excel-faculty-official-time`,
        formData,
        {
          headers: {
            ...getAuthHeaders().headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setLoading(false);
      setSuccessAction(response.data.message || "File uploaded successfully");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2000);
    } catch (error) {
      console.error("Upload error:", error);
      setLoading(false);
      setSuccessAction("Upload failed!");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2000);
    }
  };


  return (
    <Container
      sx={{ bgcolor: "white", paddingBottom: "70px", borderRadius: "10px", paddingTop: "20px" }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        p={2}
        mb={2}
        sx={{
          backgroundColor: "#6D2323",
          color: "white",
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Official Time Schedule
        </Typography>
      </Box>


      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box display="flex" gap={2}>
          <TextField
            label="Employee Number"
            variant="outlined"
            size="small"
            value={employeeID}
            onChange={(e) => setemployeeID(e.target.value)}
          />
          <Button
            variant="contained"
            sx={{ mr: 10, bgcolor: "#6D2323", "&:hover": { bgcolor: "#8B2E2E" } }}
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            Search
          </Button>
        </Box>


        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body1" fontWeight="bold">
            Upload Excel File:
          </Typography>


          <input
            type="file"
            accept=".xlsx,.xls"
            id="upload-button"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0])}
          />


          <label htmlFor="upload-button">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              sx={{
                color: "#6D2323",
                borderColor: "#6D2323",
                "&:hover": { bgcolor: "#f5f5f5", borderColor: "#6D2323" },
              }}
            >
              Choose File
            </Button>
          </label>


          {file && (
            <Typography
              variant="body2"
              sx={{ maxWidth: "180px" }}
              noWrap
            >
              {file.name}
            </Typography>
          )}


          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file}
            sx={{ bgcolor: "#6D2323", "&:hover": { bgcolor: "#8B2E2E" } }}
            startIcon={<CloudUploadIcon />}
          >
            Upload
          </Button>
        </Box>
      </Box>


      {records.length > 0 && (
        <form onSubmit={handleSubmit}>
          <TableContainer
            component={Paper}
            sx={{ maxHeight: "580px", overflow: "auto", boxShadow: 3 }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {[
                    "Employee Number",
                    "Day",
                    "Time In",
                    "Break In",
                    "Break Out",
                    "Time Out",
                    "Honorarium Time In",
                    "Honorarium Time Out",
                    "Service Credit Time In",
                    "Service Credit Time Out",
                    "Over-Time In",
                    "Over-Time Out",
                  ].map((header, i) => (
                    <TableCell
                      key={i}
                      sx={{
                        backgroundColor: "#6D2323",
                        color: "white",
                        fontWeight: "bold",
                        minWidth: "105px",
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.employeeID}
                        InputProps={{ readOnly: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.day}
                        InputProps={{ readOnly: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.officialTimeIN}
                        onChange={(e) =>
                          handleChange(index, "officialTimeIN", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.officialBreaktimeIN}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "officialBreaktimeIN",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.officialBreaktimeOUT}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "officialBreaktimeOUT",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.officialTimeOUT}
                        onChange={(e) =>
                          handleChange(index, "officialTimeOUT", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.officialHonorariumTimeIN}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "officialHonorariumTimeIN",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.officialHonorariumTimeOUT}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "officialHonorariumTimeOUT",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.officialServiceCreditTimeIN}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "officialServiceCreditTimeIN",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.officialServiceCreditTimeOUT}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "officialServiceCreditTimeOUT",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.officialOverTimeIN}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "officialOverTimeIN",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        value={record.officialOverTimeOUT}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "officialOverTimeOUT",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>


          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 2, bgcolor: "#6D2323", float: "right" }}
            startIcon={<SaveIcon />}
          >
            {found ? "Update" : "Save"}
          </Button>
        </form>
      )}


      <LoadingOverlay open={loading} message="Processing..." />
      <SuccessfulOverlay open={successOpen} action={successAction} />
    </Container>
  );
};

export default OfficialTimeForm;
