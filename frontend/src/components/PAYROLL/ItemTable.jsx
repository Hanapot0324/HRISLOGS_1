import API_BASE_URL from "../../apiConfig";
import React, { useState, useEffect } from "react";
import axios from "axios";
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
  FormControl,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close,
} from "@mui/icons-material";

import LabelIcon from '@mui/icons-material/Label';
import SearchIcon from '@mui/icons-material/Search';
import ReorderIcon from '@mui/icons-material/Reorder';
import LoadingOverlay from '../LoadingOverlay';
import SuccessfullOverlay from '../SuccessfulOverlay';

const ItemTable = () => {
  const [data, setData] = useState([]);
  const [newItem, setNewItem] = useState({
    item_description: "",
    employeeID: "",
    name: "",
    item_code: "",
    salary_grade: "",
    step: "",
    effectivityDate: "",
  });
  const [editItem, setEditItem] = useState(null);
  const [originalItem, setOriginalItem] = useState(null); // Store original data for cancel
  const [isEditing, setIsEditing] = useState(false); // Track edit mode
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
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/item-table`, getAuthHeaders());
      setData(res.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/item-table`, newItem, getAuthHeaders());
      setNewItem({
        item_description: "",
        employeeID: "",
        name: "",
        item_code: "",
        salary_grade: "",
        step: "",
        effectivityDate: "",
      });
      setTimeout(() => {     
      setLoading(false);  
      setSuccessAction("adding");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2000);
    }, 300);  
      fetchItems();
    } catch (err) {
      console.error('Error adding data:', err);
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/item-table/${editItem.id}`, editItem, getAuthHeaders());
      setEditItem(null);
      setOriginalItem(null);
      setIsEditing(false);
      fetchItems();
      setSuccessAction("edit");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2000);
    } catch (err) {
      console.error('Error updating data:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/item-table/${id}`, getAuthHeaders());
      setEditItem(null);
      setOriginalItem(null);
      setIsEditing(false);
      fetchItems();
      setSuccessAction("delete");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2000);
    } catch (err) {
      console.error('Error deleting data:', err);
    }
  };

  const handleChange = (field, value, isEdit = false) => {
    if (isEdit) {
      setEditItem({ ...editItem, [field]: value });
    } else {
      setNewItem({ ...newItem, [field]: value });
    }
  };

  // Handle opening the modal (view mode initially)
  const handleOpenModal = (item) => {
    setEditItem({ ...item });
    setOriginalItem({ ...item });
    setIsEditing(false);
  };

  // Handle entering edit mode
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setEditItem({ ...originalItem });
    setIsEditing(false);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setEditItem(null);
    setOriginalItem(null);
    setIsEditing(false);
  };

  const inputStyle = { marginRight: 10, marginBottom: 10, width: 300.25 };

  return (
    <Container sx={{ mt: 0, }}>

      {/* Loading Overlay */}
      <LoadingOverlay open={loading} message="Adding item record..."  />
      
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
            <LabelIcon
              sx={{ fontSize: "3rem", mr: 2, mt: "5px", ml: "5px" }}
            />
            <Box>
              <Typography variant="h5" sx={{ mb: 0.5 }}>
                Item Information
              </Typography>
              <Typography variant="body2">
                Insert Your Item Information
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
              {/* Position */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Position
                </Typography>
                <TextField
                  value={newItem.item_description}
                  onChange={(e) => handleChange("item_description", e.target.value)}
                  fullWidth
                  style={inputStyle}
                />
              </Grid>

              {/* Employee Number */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Employee Number
                </Typography>
                <TextField
                  value={newItem.employeeID}
                  onChange={(e) => handleChange("employeeID", e.target.value)}
                  fullWidth
                  style={inputStyle}
                />
              </Grid>

              {/* Name */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Name
                </Typography>
                <TextField
                  value={newItem.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  fullWidth
                  style={inputStyle}
                />
              </Grid>

              {/* Item Code */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Item Code
                </Typography>
                <TextField
                  value={newItem.item_code}
                  onChange={(e) => handleChange("item_code", e.target.value)}
                  fullWidth
                  style={inputStyle}
                />
              </Grid>

              {/* Salary Grade */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Salary Grade
                </Typography>
                <FormControl fullWidth style={inputStyle}>
                  <Autocomplete
                    freeSolo
                    options={[...Array(33)].map((_, index) => `${index + 1}`)}
                    value={newItem.salary_grade}
                    onChange={(event, newValue) =>
                      handleChange("salary_grade", newValue || "")
                    }
                    onInputChange={(event, newInputValue) =>
                      handleChange("salary_grade", newInputValue)
                    }
                    renderInput={(params) => (
                      <TextField {...params} />
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Step */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Step
                </Typography>
                <FormControl fullWidth style={inputStyle}>
                  <Autocomplete
                    freeSolo
                    options={[...Array(8)].map((_, index) => `step${index + 1}`)}
                    value={newItem.step}
                    onChange={(event, newValue) =>
                      handleChange("step", newValue || "")
                    }
                    onInputChange={(event, newInputValue) =>
                      handleChange("step", newInputValue)
                    }
                    renderInput={(params) => (
                      <TextField {...params} />
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Effectivity Date */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Effectivity Date
                </Typography>
                <TextField
                  value={newItem.effectivityDate}
                  onChange={(e) => handleChange("effectivityDate", e.target.value)}
                  fullWidth
                  style={inputStyle}
                />
              </Grid>
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
              Item Records
            </Typography>
            <Typography variant="body2">
              View and manage item information
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
            {/* Subtitle */}
            <Typography
              variant="subtitle2"
              sx={{ color: "#6D2323", mb: 1 }}
            >
              Search Records using Employee Number
            </Typography>

            {/* Search Box */}
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
              .filter((item) => {
                const employeeID = item.employeeID?.toString() || "";
                const name = item.name?.toLowerCase() || "";
                const search = searchTerm.toLowerCase();
                return employeeID.includes(search) || name.includes(search);
              })
              .map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Box
                    onClick={() => handleOpenModal(item)}
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
                    {/* Employee Number */}
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
                      {item.employeeID}
                    </Typography>

                    {/* Position Pill */}
                    <Chip
                      label={item.item_description}
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
            {data.filter((item) => {
              const employeeID = item.employeeID?.toString() || "";
              const name = item.name?.toLowerCase() || "";
              const search = searchTerm.toLowerCase();
              return employeeID.includes(search) || name.includes(search);
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

        <Modal
          open={!!editItem}
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
            {editItem && (
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
                    {isEditing ? "Edit Item Information" : "Item Information"}
                  </Typography>
                  <IconButton onClick={handleCloseModal} sx={{ color: "#fff" }}>
                    <Close />
                  </IconButton>
                </Box>

                {/* Modal Content (Form Style) */}
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {/* Position */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                        Position
                      </Typography>
                      <TextField
                        value={editItem.item_description}
                        onChange={(e) =>
                          setEditItem({ ...editItem, item_description: e.target.value })
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

                    {/* Employee Number */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                        Employee Number
                      </Typography>
                      <TextField
                        value={editItem.employeeID}
                        onChange={(e) =>
                          setEditItem({ ...editItem, employeeID: e.target.value })
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

                    {/* Name */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                        Name
                      </Typography>
                      <TextField
                        value={editItem.name}
                        onChange={(e) =>
                          setEditItem({ ...editItem, name: e.target.value })
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

                    {/* Item Code */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                        Item Code
                      </Typography>
                      <TextField
                        value={editItem.item_code}
                        onChange={(e) =>
                          setEditItem({ ...editItem, item_code: e.target.value })
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

                    {/* Salary Grade */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                        Salary Grade
                      </Typography>
                      {isEditing ? (
                        <Autocomplete
                          freeSolo
                          options={[...Array(33)].map((_, index) => `${index + 1}`)}
                          value={editItem.salary_grade}
                          onChange={(event, newValue) =>
                            setEditItem({ ...editItem, salary_grade: newValue || "" })
                          }
                          onInputChange={(event, newInputValue) =>
                            setEditItem({ ...editItem, salary_grade: newInputValue })
                          }
                          renderInput={(params) => (
                            <TextField {...params} fullWidth />
                          )}
                        />
                      ) : (
                        <TextField
                          value={editItem.salary_grade}
                          fullWidth
                          disabled
                          sx={{
                            "& .MuiInputBase-input.Mui-disabled": {
                              WebkitTextFillColor: "#000000",
                              color: "#000000"
                            }
                          }}
                        />
                      )}
                    </Grid>

                    {/* Step */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                        Step
                      </Typography>
                      {isEditing ? (
                        <Autocomplete
                          freeSolo
                          options={[...Array(8)].map((_, index) => `step${index + 1}`)}
                          value={editItem.step}
                          onChange={(event, newValue) =>
                            setEditItem({ ...editItem, step: newValue || "" })
                          }
                          onInputChange={(event, newInputValue) =>
                            setEditItem({ ...editItem, step: newInputValue })
                          }
                          renderInput={(params) => (
                            <TextField {...params} fullWidth />
                          )}
                        />
                      ) : (
                        <TextField
                          value={editItem.step}
                          fullWidth
                          disabled
                          sx={{
                            "& .MuiInputBase-input.Mui-disabled": {
                              WebkitTextFillColor: "#000000",
                              color: "#000000"
                            }
                          }}
                        />
                      )}
                    </Grid>

                    {/* Effectivity Date */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                        Effectivity Date
                      </Typography>
                      <TextField
                        value={editItem.effectivityDate}
                        onChange={(e) =>
                          setEditItem({ ...editItem, effectivityDate: e.target.value })
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
                      // View mode buttons
                      <>
                        <Button
                          onClick={() => handleDelete(editItem.id)}
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
                      // Edit mode buttons
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

export default ItemTable;