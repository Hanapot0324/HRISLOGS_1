import API_BASE_URL from '../../apiConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Chip,
  Modal,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close,
  Paid,
  Search as SearchIcon,
  Payment as ReorderIcon,
} from "@mui/icons-material";

import LoadingOverlay from '../LoadingOverlay';
import SuccessfullOverlay from '../SuccessfulOverlay';

const EmployeeRemittance = () => {
  const [data, setData] = useState([]);
  const [newRemittance, setNewRemittance] = useState({
    employeeNumber: '',
    name: '',
    liquidatingCash: '',
    gsisSalaryLoan: '',
    gsisPolicyLoan: '',
    gsisArrears: '',
    cpl: '',
    mpl: '',
    mplLite: '',
    emergencyLoan: '',
    nbc594: '',
    increment: '',
    pagibigFundCont: '',
    pagibig2: '',
    multiPurpLoan: '',
    landbankSalaryLoan: '',
    earistCreditCoop: '',
    feu: '',
  });
  const [editRemittance, setEditRemittance] = useState(null);
  const [originalRemittance, setOriginalRemittance] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successAction, setSuccessAction] = useState("");

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
    fetchRemittances();
  }, []);

  const fetchRemittances = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/Remittance/employee-remittance`, getAuthHeaders());
      setData(res.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      // Filter out empty fields
      const filteredRemittance = Object.fromEntries(
        Object.entries(newRemittance).filter(([_, value]) => value !== '')
      );
      
      await axios.post(`${API_BASE_URL}/Remittance/employee-remittance`, filteredRemittance, getAuthHeaders());
      setNewRemittance({
        employeeNumber: '',
        name: '',
        liquidatingCash: '',
        gsisSalaryLoan: '',
        gsisPolicyLoan: '',
        gsisArrears: '',
        cpl: '',
        mpl: '',
        mplLite: '',
        emergencyLoan: '',
        nbc594: '',
        increment: '',
        pagibigFundCont: '',
        pagibig2: '',
        multiPurpLoan: '',
        landbankSalaryLoan: '',
        earistCreditCoop: '',
        feu: '',
      });
      setTimeout(() => {
        setLoading(false);
        setSuccessAction("adding");
        setSuccessOpen(true);
        setTimeout(() => setSuccessOpen(false), 2000);
      }, 300);
      fetchRemittances();
    } catch (err) {
      console.error('Error adding data:', err);
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_BASE_URL}/Remittance/employee-remittance/${editRemittance.id}`, editRemittance, getAuthHeaders());
      setEditRemittance(null);
      setOriginalRemittance(null);
      setIsEditing(false);
      fetchRemittances();
      setSuccessAction("edit");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2000);
    } catch (err) {
      console.error('Error updating data:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/Remittance/employee-remittance/${id}`, getAuthHeaders());
      setEditRemittance(null);
      setOriginalRemittance(null);
      setIsEditing(false);
      fetchRemittances();
      setSuccessAction("delete");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2000);
    } catch (err) {
      console.error('Error deleting data:', err);
    }
  };

  const handleChange = (field, value, isEdit = false) => {
    if (isEdit) {
      setEditRemittance({ ...editRemittance, [field]: value });
    } else {
      setNewRemittance({ ...newRemittance, [field]: value });
    }
  };

  const handleOpenModal = (remittance) => {
    setEditRemittance({ ...remittance });
    setOriginalRemittance({ ...remittance });
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditRemittance({ ...originalRemittance });
    setIsEditing(false);
  };

  const handleCloseModal = () => {
    setEditRemittance(null);
    setOriginalRemittance(null);
    setIsEditing(false);
  };

  const inputStyle = { marginRight: 10, marginBottom: 10, width: 300.25 };

  const fieldLabels = {
    employeeNumber: 'Employee Number',
    name: 'Name',
    liquidatingCash: 'Liquidating Cash',
    gsisSalaryLoan: 'GSIS Salary Loan',
    gsisPolicyLoan: 'GSIS Policy Loan',
    gsisArrears: 'GSIS Arrears',
    cpl: 'CPL',
    mpl: 'MPL',
    mplLite: 'MPL Lite',
    emergencyLoan: 'Emergency Loan',
    nbc594: 'NBC 594',
    increment: 'Increment',
    pagibigFundCont: 'Pag-IBIG Fund Cont.',
    pagibig2: 'Pag-IBIG 2',
    multiPurpLoan: 'Multi-Purpose Loan',
    landbankSalaryLoan: 'Landbank Salary Loan',
    earistCreditCoop: 'EARIST Credit Coop',
    feu: 'FEU'
  };

  return (
    <Container sx={{ mt: 0 }}>
      {/* Loading Overlay */}
      <LoadingOverlay open={loading} message="Adding remittance record..." />
      
      {/* Success Overlay */}
      <SuccessfullOverlay open={successOpen} action={successAction} />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 4,
        }}
      >
        {/* Outer wrapper for header + content */}
        <Box sx={{ width: "75%", maxWidth: "100%" }}>
          {/* Header */}
          <Box
            sx={{
              backgroundColor: "#6D2323",
              color: "#ffffff",
              p: 2,
              borderRadius: "8px 8px 0 0",
              display: "flex",
              alignItems: "center",
              pb: '15px'
            }}
          >
            <Paid
              sx={{ fontSize: "3rem", mr: 2, mt: "5px", ml: "5px" }}
            />
            <Box>
              <Typography variant="h5" sx={{ mb: 0.5 }}>
                Employee Remittance
              </Typography>
              <Typography variant="body2">
                Insert Employee Other Deductions
              </Typography>
            </Box>
          </Box>

          {/* Content/Form */}
          <Container
            sx={{
              backgroundColor: "#fff",
              p: 3,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
              border: "1px solid #6d2323",
              width: "100%",
            }}
          >
            <Grid container spacing={3}>
              {Object.keys(newRemittance).map((field) => (
                <Grid item xs={12} sm={6} key={field}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    {fieldLabels[field]}
                  </Typography>
                  <TextField
                    value={newRemittance[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    fullWidth
                    style={inputStyle}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Add Button */}
            <Button
              onClick={handleAdd}
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                mt: 3,
                width: "100%",
                backgroundColor: "#6D2323",
                color: "#FEF9E1",
                "&:hover": { backgroundColor: "#5a1d1d" },
              }}
            >
              Add
            </Button>
          </Container>
        </Box>
      </Box>

      {/* Outer wrapper for header + content */}
      <Box sx={{ width: "75%", maxWidth: "100%", margin: "20px auto" }}>
        {/* Header */}
        <Box
          sx={{
            backgroundColor: "#ffffff",
            color: "#6d2323",
            p: 2,
            borderRadius: "8px 8px 0 0",
            display: "flex",
            alignItems: "center",
            pb: "15px",
            border: '1px solid #6d2323',
            borderBottom: 'none'
          }}
        >
          <ReorderIcon sx={{ fontSize: "3rem", mr: 2, mt: "5px", ml: "5px" }} />
          <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              Remittance Records
            </Typography>
            <Typography variant="body2">
              View and manage remittance information
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Container
          sx={{
            backgroundColor: "#fff",
            p: 3,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #6d2323",
            width: "100%",
          }}
        >
          {/* Search Section */}
          <Box sx={{ mb: 3, width: "100%" }}>
            <Typography
              variant="subtitle2"
              sx={{ color: "#6D2323", mb: 1 }}
            >
              Search Records using Employee Number
            </Typography>

            <Box display="flex" justifyContent="flex-start" alignItems="center" width="100%">
              <TextField
                size="small"
                variant="outlined"
                placeholder="Search by Employee Number or Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  backgroundColor: "white",
                  borderRadius: 1,
                  width: "100%",
                  maxWidth: "800px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#6D2323",
                    },
                    "&:hover fieldset": {
                      borderColor: "#6D2323",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#6D2323",
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: "#6D2323", marginRight: 1 }} />
                  ),
                }}
              />
            </Box>
          </Box>

          {/* Records as Boxes */}
          <Grid container spacing={2}>
            {data
              .filter((remittance) => {
                const name = remittance.name?.toLowerCase() || "";
                const employeeNumber = remittance.employeeNumber?.toString() || "";
                const search = searchTerm.toLowerCase();
                return employeeNumber.includes(search) || name.includes(search);
              })
              .map((remittance) => (
                <Grid item xs={12} sm={6} md={4} key={remittance.id}>
                  <Box
                    onClick={() => handleOpenModal(remittance)}
                    sx={{
                      border: "1px solid #6d2323",
                      borderRadius: 2,
                      p: 2,
                      cursor: "pointer",
                      transition: "0.2s",
                      "&:hover": { boxShadow: "0px 4px 10px rgba(0,0,0,0.2)" },
                      height: "80%",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", color: "black", mb: 1 }}
                    >
                      Employee Number:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", color: "#6d2323", mb: 1 }}
                    >
                      {remittance.employeeNumber}
                    </Typography>

                    <Chip
                      label={remittance.name || 'No Name'}
                      sx={{
                        backgroundColor: "#6d2323",
                        color: "#fff",
                        borderRadius: "50px",
                        px: 2,
                        fontWeight: "bold",
                        maxWidth: "100%",
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            {data.filter((remittance) => {
              const name = remittance.name?.toLowerCase() || "";
              const employeeNumber = remittance.employeeNumber?.toString() || "";
              const search = searchTerm.toLowerCase();
              return employeeNumber.includes(search) || name.includes(search);
            }).length === 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="body1"
                  sx={{ textAlign: "center", color: "#6D2323", fontWeight: "bold", mt: 2 }}
                >
                  No Records Found
                </Typography>
              </Grid>
            )}
          </Grid>
        </Container>

        {/* Modal */}
        <Modal
          open={!!editRemittance}
          onClose={handleCloseModal}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              backgroundColor: "#fff",
              border: "1px solid #6d2323",
              borderRadius: 2,
              width: "75%",
              maxWidth: "900px",
              maxHeight: "85vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            {editRemittance && (
              <>
                {/* Modal Header */}
                <Box
                  sx={{
                    backgroundColor: "#6D2323",
                    color: "#ffffff",
                    p: 2,
                    borderRadius: "8px 8px 0 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="h6">
                    {isEditing ? "Edit Remittance Information" : "Remittance Information"}
                  </Typography>
                  <IconButton onClick={handleCloseModal} sx={{ color: "#fff" }}>
                    <Close />
                  </IconButton>
                </Box>

                {/* Modal Content */}
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {Object.keys(newRemittance).map((field) => (
                      <Grid item xs={12} sm={6} key={field}>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                          {fieldLabels[field]}
                        </Typography>
                        <TextField
                          value={editRemittance[field] || ''}
                          onChange={(e) =>
                            setEditRemittance({ ...editRemittance, [field]: e.target.value })
                          }
                          fullWidth
                          disabled={!isEditing}
                          sx={{
                            "& .MuiInputBase-input.Mui-disabled": {
                              WebkitTextFillColor: "#000000",
                              color: "#000000"
                            }
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  {/* Action Buttons */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      mt: 3,
                      gap: 2,
                    }}
                  >
                    {!isEditing ? (
                      <>
                        <Button
                          onClick={() => handleDelete(editRemittance.id)}
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          sx={{
                            color: "#ffffff",
                            backgroundColor: 'black'
                          }}
                        >
                          Delete
                        </Button>
                        <Button
                          onClick={handleStartEdit}
                          variant="contained"
                          startIcon={<EditIcon />}
                          sx={{ backgroundColor: "#6D2323", color: "#FEF9E1" }}
                        >
                          Edit
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          sx={{
                            color: "#ffffff",
                            backgroundColor: 'black'
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdate}
                          variant="contained"
                          startIcon={<SaveIcon />}
                          sx={{ backgroundColor: "#6D2323", color: "#FEF9E1" }}
                        >
                          Save
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Modal>
      </Box>
    </Container>
  );
};

export default EmployeeRemittance;