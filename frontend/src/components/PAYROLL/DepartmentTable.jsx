import API_BASE_URL from "../../apiConfig";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, Container, Box
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Save as SaveIcon, Cancel as CancelIcon,
  DepartureBoard,
  Domain
} from '@mui/icons-material';


const DepartmentTable = () => {
  const [data, setData] = useState([]);
  const [newEntry, setNewEntry] = useState({
    code: "",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

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
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/department-table`, getAuthHeaders());
      setData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };


  const addEntry = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/department-table`, newEntry, getAuthHeaders());
      setNewEntry({ code: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Error adding entry", error);
    }
  };


  const startEditing = (item) => {
    setEditingId(item.id);
    setEditData({
      code: item.code,
      description: item.description,
    });
  };


  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };


  const saveEdit = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/department-table/${id}`, editData, getAuthHeaders());
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error("Error saving edit", error);
    }
  };


  const deleteEntry = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/department-table/${id}`, getAuthHeaders());
      fetchData();
    } catch (error) {
      console.error("Error deleting entry", error);
    }
  };


  return (
    <Container style={{ marginTop: '20px', backgroundColor: '#FEF9E1' , marginRight: '50px'}}>
      <div style={{
        backgroundColor: '#6D2323',
      color: '#ffffff',
      padding: '25px',
      width: '92.5%',
      marginLeft: '1px',
      borderRadius: '8px',
      borderBottomLeftRadius: '0px',
      borderBottomRightRadius: '0px',
      display: 'flex',
      }}>
        <Domain sx={{ fontSize: '3rem', marginRight: '15px', marginTop: '5px', marginLeft: '5px' }} />
     
        <div>
          <h4 style={{ margin: 0, fontSize: '150%', marginBottom: '2px' }}>
            Department Table
          </h4>
          <p style={{ margin: 0, fontSize: '85%' }}>
            Insert The Department Information
          </p>
        </div>
      </div>


      <div style={{
        backgroundColor: 'white', padding: '20px', borderRadius: '8px',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', marginBottom: '20px'
      }}>




        {/* Add New Entry Section */}
        <Box display="flex" gap={2} marginLeft="0px" marginBottom="20px">
          <TextField
            label="Code"
            value={newEntry.code}
            onChange={(e) => setNewEntry({ ...newEntry, code: e.target.value })}
            style={{ width: '220px' }}
          />
          <TextField
            label="Description"
            value={newEntry.description}
            onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
            style={{ width: '220px' }}
          />
          <Button
            onClick={addEntry}
            variant="contained"
            startIcon={<AddIcon />}
            style={{
              backgroundColor: '#6D2323', color: '#FEF9E1',
              textTransform: 'none'
            }}
          >
            Add
          </Button>
        </Box>
        </div>
        <div>


        {/* Table */}
        <Table style={{ backgroundColor: 'white' }}>
          <TableHead>
            <TableRow style={{ backgroundColor: '#6D2323' }}>
              <TableCell style={{ color: '#FEF9E1', fontWeight: 'bold' }}>NO.</TableCell>
              <TableCell style={{ color: '#FEF9E1', fontWeight: 'bold' }}>CODE</TableCell>
              <TableCell style={{ color: '#FEF9E1', fontWeight: 'bold' }}>DESCRIPTION</TableCell>
              <TableCell style={{ color: '#FEF9E1', fontWeight: 'bold' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {editingId === item.id ? (
                    <TextField
                      value={editData.code}
                      onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                      size="small"
                    />
                  ) : (
                    item.code
                  )}
                </TableCell>
                <TableCell>
                  {editingId === item.id ? (
                    <TextField
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      size="small"
                    />
                  ) : (
                    item.description
                  )}
                </TableCell>
                <TableCell>
                  {editingId === item.id ? (
                    <Box display="flex" gap={1}>
                      <Button
                        onClick={() => saveEdit(item.id)}
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<SaveIcon />}
                        style={{ textTransform: 'none',
                          width: '100px',
                          backgroundColor: '#6D2323',
                          color: '#FEF9E1'
                         }}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={cancelEditing}
                        variant="contained"
                        color="white"
                        size="small"
                        startIcon={<CancelIcon />}
                        style={{
                          textTransform: 'none',
                          width: '100px',
                          backgroundColor: '#000000',
                          color: '#ffffff'
                         }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <Box display="flex" gap={1}>
                      <Button
                        onClick={() => startEditing(item)}
                        variant="contained"
                        size="small"
                        startIcon={<EditIcon />}
                        style={{
                          backgroundColor: '#6D2323',
                          color: '#FEF9E1',
                          textTransform: 'none',
                          width: '100px'
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteEntry(item.id)}
                        variant="contained"
                        size="small"
                        startIcon={<DeleteIcon />}
                        style={{
                          backgroundColor: '#000000',
                          color: '#ffffff',
                          textTransform: 'none',
                          width: '100px'


                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Container>
  );
};


export default DepartmentTable;



