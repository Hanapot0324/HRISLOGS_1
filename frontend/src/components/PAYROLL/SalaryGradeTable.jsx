import API_BASE_URL from "../../apiConfig";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  InputAdornment
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Upgrade,
  Search,
  Shortcut,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";


const SalaryGradeTable = () => {
  const [salaryGrades, setSalaryGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [newSalaryGrade, setNewSalaryGrade] = useState({
    effectivityDate: "",
    sg_number: "",
    step1: "", step2: "", step3: "", step4: "",
    step5: "", step6: "", step7: "", step8: ""
  });
  const [editSalaryGradeId, setEditSalaryGradeId] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    effectivityDate: "",
    step: ""
  });
  const navigate = useNavigate();

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


  useEffect(() => {
    fetchSalaryGrades();
  }, []);


  useEffect(() => {
    const { effectivityDate, step } = searchFilters;


    if (!effectivityDate && !step) {
      setFilteredGrades(salaryGrades);
      return;
    }


    const filtered = salaryGrades.filter((record) => {
      const matchDate = record.effectivityDate.toLowerCase().includes(effectivityDate.toLowerCase());
      const matchStep = [...Array(8)].some((_, i) =>
        record[`step${i + 1}`]?.toString().toLowerCase().includes(step.toLowerCase())
      );
      return matchDate && matchStep;
    });


    setFilteredGrades(filtered);
  }, [searchFilters, salaryGrades]);


  const fetchSalaryGrades = async () => {
    const response = await axios.get(`${API_BASE_URL}/SalaryGradeTable/salary-grade`, getAuthHeaders());
    setSalaryGrades(response.data);
    setFilteredGrades(response.data);
  };


  const addSalaryGrade = async () => {
    if (Object.values(newSalaryGrade).some((v) => v === "")) return;


    await axios.post(`${API_BASE_URL}/SalaryGradeTable/salary-grade`, newSalaryGrade, getAuthHeaders());
    setNewSalaryGrade({
      effectivityDate: "",
      sg_number: "",
      step1: "", step2: "", step3: "", step4: "",
      step5: "", step6: "", step7: "", step8: ""
    });
    fetchSalaryGrades();
  };


  const updateSalaryGrade = async (id) => {
    const updatedRecord = salaryGrades.find((rec) => rec.id === id);
    await axios.put(`${API_BASE_URL}/SalaryGradeTable/salary-grade/${id}`, updatedRecord, getAuthHeaders());
    setEditSalaryGradeId(null);
    fetchSalaryGrades();
  };


  const deleteSalaryGrade = async (id) => {
    await axios.delete(`${API_BASE_URL}/SalaryGradeTable/salary-grade/${id}`, getAuthHeaders());
    fetchSalaryGrades();
  };


  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.toString().split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <span key={i} style={{ backgroundColor: "yellow" }}>{part}</span>
        : part
    );
  };


  return (
    <Container>
      {/* Header */}
      <Box sx={{ backgroundColor: "#6D2323", color: "#fff", p: 3, borderRadius: "8px 8px 0 0" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Upgrade sx={{ fontSize: 60, mr: 2 }} />
          <Box>
            <Typography variant="h6">2024 First Tranche Salary Schedule</Typography>
            <Typography variant="body2">
              For Civilian Personnel of the National Government
              <br />
              Effective from <strong>January 1, 2024</strong> to <strong>December 31, 2024</strong>
            </Typography>
          </Box>
        </Box>
      </Box>


      {/* Add Salary Grade Form */}
      <Paper sx={{ p: 3, }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>Add New Salary Grade</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Effectivity Date" fullWidth value={newSalaryGrade.effectivityDate}
              onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, effectivityDate: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Salary Grade Number" fullWidth value={newSalaryGrade.sg_number}
              onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, sg_number: e.target.value })} />
          </Grid>
          {[...Array(8)].map((_, i) => (
            <Grid item xs={12} sm={3} key={i}>
              <TextField label={`Step ${i + 1}`} fullWidth
                value={newSalaryGrade[`step${i + 1}`]}
                onChange={(e) =>
                  setNewSalaryGrade({ ...newSalaryGrade, [`step${i + 1}`]: e.target.value })
                }
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button
              onClick={addSalaryGrade}
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ backgroundColor: "#6D2323", '&:hover': { backgroundColor: "#9C2A2A" } }}
            >
              Add Salary Grade
            </Button>
          </Grid>
        </Grid>
      </Paper>


      {/* Search Filters & Shortcut */}
      <Box sx={{ mt: 10, display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 2 }}>
        <TextField
          label="Search by Date"
          style={{backgroundColor: "#fff", width: "200px"}}
          value={searchFilters.effectivityDate}
          onChange={(e) => setSearchFilters({ ...searchFilters, effectivityDate: e.target.value })}
          size="small"
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: "#6D2323" }} /></InputAdornment>
          }}
        />
        <TextField
          label="Search by Step"
          style={{backgroundColor: "#fff", width: "200px"}}
          value={searchFilters.step}
          onChange={(e) => setSearchFilters({ ...searchFilters, step: e.target.value })}
          size="small"
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: "#6D2323" }} /></InputAdornment>
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          sx={{ backgroundColor: "#6D2323", '&:hover': { backgroundColor: "#9C2A2A" } }}
          startIcon={<Shortcut />}
          onClick={() => navigate('/item-table')}
        >
          Insert into item-table
        </Button>
      </Box>


      {/* Salary Grade Table */}
      <Box sx={{ mt: 3, overflowX: "auto" }}>
        <Table sx={{ backgroundColor: "#fff" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#6D2323" }}>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Effectivity Date</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>SG Number</TableCell>
              {[...Array(8)].map((_, i) => (
                <TableCell key={i} sx={{ color: "#fff", fontWeight: "bold" }}>Step {i + 1}</TableCell>
              ))}
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGrades.length === 0 ? (
              <TableRow><TableCell colSpan={11} align="center">No matching records found.</TableCell></TableRow>
            ) : (
              filteredGrades.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {editSalaryGradeId === record.id ? (
                      <TextField size="small" value={record.effectivityDate}
                        onChange={(e) => {
                          const updated = { ...record, effectivityDate: e.target.value };
                          setSalaryGrades(prev => prev.map(r => r.id === record.id ? updated : r));
                        }} />
                    ) : highlightText(record.effectivityDate, searchFilters.effectivityDate)}
                  </TableCell>
                  <TableCell>
                    {editSalaryGradeId === record.id ? (
                      <TextField size="small" value={record.sg_number}
                        onChange={(e) => {
                          const updated = { ...record, sg_number: e.target.value };
                          setSalaryGrades(prev => prev.map(r => r.id === record.id ? updated : r));
                        }} />
                    ) : highlightText(record.sg_number, searchFilters.step)}
                  </TableCell>
                  {[...Array(8)].map((_, i) => (
                    <TableCell key={i}>
                      {editSalaryGradeId === record.id ? (
                        <TextField size="small" value={record[`step${i + 1}`]}
                          onChange={(e) => {
                            const updated = { ...record, [`step${i + 1}`]: e.target.value };
                            setSalaryGrades(prev => prev.map(r => r.id === record.id ? updated : r));
                          }} />
                      ) : highlightText(record[`step${i + 1}`], searchFilters.step)}
                    </TableCell>
                  ))}
                  <TableCell>
                    {editSalaryGradeId === record.id ? (
                      <>
                        <Button onClick={() => updateSalaryGrade(record.id)}
                          sx={{ backgroundColor: "#6D2323", color: "#FEF9E1", mb: 1, width: "100%" }}
                          startIcon={<SaveIcon />} variant="contained">
                          Update
                        </Button>
                        <Button onClick={() => setEditSalaryGradeId(null)}
                          sx={{ backgroundColor: "#000", color: "#fff", width: "100%" }}
                          startIcon={<CancelIcon />} variant="contained">
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => setEditSalaryGradeId(record.id)}
                          sx={{ backgroundColor: "#6D2323", color: "#FEF9E1", mb: 1, width: "100%" }}
                          startIcon={<EditIcon />} variant="contained">
                          Edit
                        </Button>
                        <Button onClick={() => deleteSalaryGrade(record.id)}
                          sx={{ backgroundColor: "#000", color: "#fff", width: "100%" }}
                          startIcon={<DeleteIcon />} variant="contained">
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </Container>
  );
};


export default SalaryGradeTable;