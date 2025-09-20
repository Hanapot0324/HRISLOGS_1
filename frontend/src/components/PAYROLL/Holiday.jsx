import API_BASE_URL from "../../apiConfig";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, Container, Box, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Alert
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Save as SaveIcon, Cancel as CancelIcon,
  Event as EventIcon, Reorder as ReorderIcon,
  Search as SearchIcon
} from "@mui/icons-material";

const Holiday = () => {
  const [data, setData] = useState([]);
  const [newHoliday, setNewHoliday] = useState({
    description: "",
    date: "",
    status: "Active",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [openEditModal, setOpenEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const statusOptions = ["Active", "Inactive"];

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

  const filteredData = data.filter(
    (item) =>
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchHoliday();
  }, []);

  const fetchHoliday = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/holiday`, getAuthHeaders());
      setData(response.data);
    } catch (err) {
      console.error("Error fetching holiday data", err.message);
    }
  };

  const handleNewChange = (e) => {
    setNewHoliday({ ...newHoliday, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    try {
      setError("");
      if (!newHoliday.description || !newHoliday.date || !newHoliday.status) {
        setError("Please fill in all fields");
        return;
      }

      await axios.post(`${API_BASE_URL}/holiday`, newHoliday, getAuthHeaders());
      fetchHoliday();
      setNewHoliday({ description: "", date: "", status: "Active" });
    } catch (error) {
      console.error("Error adding holiday data", error);
      setError("Failed to add holiday");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      description: item.description,
      date: item.date ? new Date(item.date).toISOString().split("T")[0] : "",
      status: item.status,
    });
    setOpenEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      setError("");
      await axios.put(`${API_BASE_URL}/holiday/${editingId}`, editForm, getAuthHeaders());
      setOpenEditModal(false);
      setEditingId(null);
      fetchHoliday();
    } catch (error) {
      console.error("Error updating holiday record", error);
      setError("Failed to update record");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await axios.delete(`${API_BASE_URL}/holiday/${id}`, getAuthHeaders());
        fetchHoliday();
      } catch (error) {
        console.error("Error deleting holiday record", error);
        setError("Failed to delete record");
      }
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "#6D2323",
          color: "#ffffff",
          padding: "20px",
          borderRadius: "8px",
          borderBottomLeftRadius: "0px",
          borderBottomRightRadius: "0px",
          marginTop: "-7%"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", color: "#ffffff" }}>
          <EventIcon sx={{ fontSize: "3rem", marginRight: "16px", marginLeft: "5px" }} />
          <div>
            <h4 style={{ margin: 0, fontSize: "150%", marginBottom: "1px" }}>
              Holiday Management
            </h4>
            <p style={{ margin: 0, fontSize: "85%" }}>
              Manage and track official holidays each year
            </p>
          </div>
        </div>
      </div>

      {/* Add Form */}
      <Container
        sx={{
          backgroundColor: "#fff",
          p: 3,
          borderRadius: 2,
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          mb: 4,
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" flexWrap="wrap" gap={2}>
          <TextField
            label="Description"
            name="description"
            value={newHoliday.description}
            onChange={handleNewChange}
            InputLabelProps={{ required: false }}
            sx={{ minWidth: 300 }}
          />
          <TextField
            label="Date"
            name="date"
            type="date"
            value={newHoliday.date}
            onChange={handleNewChange}
            InputLabelProps={{ required: false, shrink: true }}
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Status"
            name="status"
            select
            value={newHoliday.status}
            onChange={handleNewChange}
            InputLabelProps={{ required: false }}
            sx={{ minWidth: 200 }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Box>

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
          Add Holiday
        </Button>
      </Container>

      {/* Table */}
      <div
        style={{
          marginTop: "5px",
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "30px"
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <ReorderIcon sx={{ color: "#6D2323", fontSize: "2rem", marginRight: 1 }} />
            <Typography variant="h5" sx={{ color: "#000", fontWeight: "bold"}}>
              Holiday Records
            </Typography>
          </Box>

          <TextField
            size="small"
            variant="outlined"
            placeholder="Search by Holiday"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ backgroundColor: "white", borderRadius: 1, width: "300px" }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "#6D2323", marginRight: 1 }} />,
            }}
          />
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>No.</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                  <Typography variant="h6">No matching records found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{formatDateForDisplay(item.date)}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "inline-block",
                        px: 1,
                        py: 0.5,
                        borderRadius: "4px",
                        backgroundColor: item.status === "Active" ? "#fff" : "#fff",
                        color:  item.status === "Active" ? "#236d24ff" : "#6d2323",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                      }}
                    >
                      {item.status}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleEdit(item)}
                      variant="outlined"
                      startIcon={<EditIcon />}
                      sx={{
                        backgroundColor: "#6D2323",
                        color: "#FEF9E1",
                        width: 100,
                        mr: 1,
                        mb: 1,
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      sx={{ backgroundColor: "black", color: "white", width: 100, mb: 1 }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Holiday</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box display="flex" flexWrap="wrap" gap={2} sx={{ mt: 2 }}>
            <TextField
              label="Description"
              name="description"
              value={editForm.description || ""}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              fullWidth
            />
            <TextField
              label="Date"
              name="date"
              type="date"
              value={editForm.date || ""}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Status"
              name="status"
              select
              value={editForm.status || ""}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              fullWidth
            >
              {statusOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ backgroundColor: "#6D2323", color: "#FEF9E1", width: 100, mr: 1 }}
          >
            Save
          </Button>
          <Button
            onClick={() => setOpenEditModal(false)}
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={{ backgroundColor: "black", color: "white", width: 100 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Holiday;
