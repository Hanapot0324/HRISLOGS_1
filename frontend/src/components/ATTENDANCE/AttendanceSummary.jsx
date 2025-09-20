import API_BASE_URL from '../../apiConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Container,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Summarize,
  SummarizeOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const OverallAttendance = () => {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [editRecord, setEditRecord] = useState([]);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const storedEmployeeNumber = localStorage.getItem('employeeNumber');
    const storedStartDate = localStorage.getItem('startDate');
    const storedEndDate = localStorage.getItem('endDate');

    if (storedEmployeeNumber) setEmployeeNumber(storedEmployeeNumber);
    if (storedStartDate) setStartDate(storedStartDate);
    if (storedEndDate) setEndDate(storedEndDate);
  }, []);

  const fetchAttendanceData = async () => {
    // Check for duplicate employee number in current data

    console.log('Sending request with params: ', {
      personID: employeeNumber,
      startDate,
      endDate,
    });

    try {
      const response = await axios.get(
        `${API_BASE_URL}/attendance/api/overall_attendance_record`,
        {
          params: {
            personID: employeeNumber,
            startDate,
            endDate,
          },
          ...getAuthHeaders(),
        }
      );

      if (response.status === 200) {
        setAttendanceData(response.data.data);
      } else {
        console.error('Error: ', response.status);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('An error occurred while fetching attendance data.');
    }
  };

  const updateRecord = async () => {
    if (!editRecord || !editRecord.totalRenderedTimeMorning) return;

    try {
      await axios.put(
        `${API_BASE_URL}/attendance/api/overall_attendance_record/${editRecord.id}`,
        editRecord,
        getAuthHeaders()
      );
      alert('Record was updated successfully');
      fetchAttendanceData(); // Refresh data before clearing edit state

      window.location.reload(); // Refresh the entire page
    } catch (error) {
      console.error('Error updating record:', error);
      alert('Update failed.');
    }

    setEditRecord(null); // Clear form after update
  };

  const deleteRecord = async (id, personID) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/attendance/api/overall_attendance_record/${id}/${personID}`,
        getAuthHeaders()
      );
      fetchAttendanceData();
      alert('The Data was Successfully Deleted');
    } catch (error) {
      console.error('Delete failed:', error);
      const status = error.response?.status;
      const message =
        error.response?.data?.message || error.response?.data?.error || 'Error';
      if (status === 404) {
        alert('Record not found or personID mismatch.');
      } else if (status === 401 || status === 403) {
        alert('Unauthorized. Please login again.');
      } else {
        alert(`Failed to delete: ${message}`);
      }
    }
  };

  const submitToPayroll = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    // Check if there's data to submit
    if (!attendanceData || attendanceData.length === 0) {
      alert('No attendance data to submit.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create payload first to ensure data consistency
      const payload = attendanceData.map((record) => ({
        employeeNumber: record.personID,
        startDate: record.startDate,
        endDate: record.endDate,
        overallRenderedOfficialTimeTardiness:
          record.overallRenderedOfficialTimeTardiness,
        department: record.code,
      }));

      // Validate payload data
      const invalidRecords = payload.filter(
        (record) =>
          !record.employeeNumber || !record.startDate || !record.endDate
      );

      if (invalidRecords.length > 0) {
        alert(
          'Some records have missing required fields (Employee Number, Start Date, or End Date). Please check your data.'
        );
        return;
      }

      // Check each record for duplicates with the exact payload data
      for (const payloadRecord of payload) {
        const { employeeNumber, startDate, endDate } = payloadRecord;

        try {
          const response = await axios.get(
            `${API_BASE_URL}/PayrollRoute/payroll-with-remittance`,
            {
              ...getAuthHeaders(),
              params: { employeeNumber, startDate, endDate },
            }
          );

          if (response.data.exists) {
            alert(
              `Existing payroll entry found for Employee Number ${employeeNumber} from ${startDate} to ${endDate}. Submission cancelled.`
            );
            // Exit the entire function when duplicate is found
            return;
          }
        } catch (duplicateCheckError) {
          console.error('Error checking for duplicates:', duplicateCheckError);
          alert('Error checking for existing records. Please try again.');
          return;
        }
      }

      // Submit all records at once - only if no duplicates were found
      const submitResponse = await axios.post(
        `${API_BASE_URL}/PayrollRoute/add-rendered-time`,
        payload,
        getAuthHeaders()
      );

      // Check if submission was successful
      if (submitResponse.status === 200 || submitResponse.status === 201) {
        alert('Submitted to payroll successfully!');
        navigate('/payroll-table');
      } else {
        throw new Error(`Unexpected response status: ${submitResponse.status}`);
      }
    } catch (error) {
      console.error('Error submitting to payroll:', error);

      // More specific error messages
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          'Server error occurred';

        if (status === 409) {
          alert(
            'Duplicate entry detected. Some records may already exist in payroll.'
          );
        } else if (status === 400) {
          alert(`Invalid data: ${message}`);
        } else {
          alert(`Server error (${status}): ${message}`);
        }
      } else if (error.request) {
        // Network error
        alert('Network error. Please check your connection and try again.');
      } else {
        // Other error
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      // Always reset the submitting state
      setIsSubmitting(false);
    }
  };

  return (
    <Container
      sx={{ mt: 2, backgroundColor: '#FEF9E1', pb: 4 }}
      maxWidth={false}
    >
      <div
        style={{
          backgroundColor: '#6D2323',
          color: '#ffffff',
          padding: '20px',
          width: '96.7%',
          borderRadius: '8px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', color: '#ffffff' }}
        >
          <SummarizeOutlined
            sx={{
              fontSize: '3rem',
              marginRight: '16px',
              marginTop: '5px',
              marginLeft: '5px',
            }}
          />
          <div>
            <h4 style={{ margin: 0, fontSize: '150%', marginBottom: '2px' }}>
              Overall Attendance Report
            </h4>
            <p style={{ margin: 0, fontSize: '85%' }}>
              Generate and review summary of overall attendance records
            </p>
          </div>
        </div>
      </div>
      <Box
        sx={{
          backgroundColor: '#ffffff',
          p: 3,
          borderBottomLeftRadius: '5px',
          borderBottomRightRadius: '5px',
          boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
          mb: 3,
        }}
      >
        {/* Input Fields */}
        {/* --- filters & fetch button --- */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Employee Number"
            variant="outlined"
            value={employeeNumber}
            onChange={(e) => setEmployeeNumber(e.target.value)}
            sx={{ width: 250 }}
            required
          />

          <TextField
            label="Start Date"
            type="date"
            variant="outlined"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 200 }}
            required
          />

          <TextField
            label="End Date"
            type="date"
            variant="outlined"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 200 }}
            required
          />

          <Button
            variant="contained"
            onClick={fetchAttendanceData}
            sx={{
              backgroundColor: '#6D2323',
              color: '#FEF9E1',
              height: 56,
              flexGrow: 1 /* makes button fill remaining space nicely */,
            }}
          >
            Fetch Attendance Records
          </Button>
        </Box>

        {/* Table to Display Data */}
        <Paper sx={{ marginTop: 3, overflowX: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>ID</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b> Department </b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Employee Number</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Start Date</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>End Date</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Morning Hours</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Morning Tardiness</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Afternoon Hours</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Afternoon Tardiness</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Honorarium</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Honorarium Tardiness</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Service Credit</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Service Credit Tardiness</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Overtime</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Overtime Tardiness</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Overall Official Rendered Time</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Overall Official Tardiness Time</b>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <b>Action</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceData.map((record, index) => (
                <TableRow key={index}>
                  <TableCell style={{ textAlign: 'center' }}>
                    {record.id}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    {record.code}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.personID}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            personID: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.personID
                    )}
                  </TableCell>
                  <TableCell>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.startDate}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            startDate: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.startDate
                    )}
                  </TableCell>
                  <TableCell>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.endDate}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            endDate: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.endDate
                    )}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.totalRenderedTimeMorning}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            totalRenderedTimeMorning: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.totalRenderedTimeMorning
                    )}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.totalRenderedTimeMorningTardiness}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            totalTardAM: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.totalRenderedTimeMorningTardiness
                    )}
                  </TableCell>

                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.totalRenderedTimeAfternoon}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            totalRenderedTimeAfternoon: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.totalRenderedTimeAfternoon
                    )}
                  </TableCell>

                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.totalRenderedTimeAfternoonTardiness}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            totalRenderedTimeAfternoonTardiness: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.totalRenderedTimeAfternoonTardiness
                    )}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.totalRenderedHonorarium}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            totalRenderedHonorarium: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.totalRenderedHonorarium
                    )}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.totalRenderedHonorariumTardiness}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            TotalTatotalRenderedHonorariumTardinessrdHR:
                              e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.totalRenderedHonorariumTardiness
                    )}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.totalRenderedServiceCredit}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            totalRenderedServiceCredit: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.totalRenderedServiceCredit
                    )}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.totalRenderedServiceCreditTardiness}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            totalRenderedServiceCreditTardiness: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.totalRenderedServiceCreditTardiness
                    )}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.totalRenderedOvertime}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            totalRenderedOvertime: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.totalRenderedOvertime
                    )}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.totalRenderedOvertimeTardiness}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            totalRenderedOvertimeTardiness: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.totalRenderedOvertimeTardiness
                    )}
                  </TableCell>

                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.overallRenderedOfficialTime}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            overallRenderedOfficialTime: e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.overallRenderedOfficialTime
                    )}
                  </TableCell>

                  <TableCell style={{ textAlign: 'center' }}>
                    {editRecord && editRecord.id === record.id ? (
                      <TextField
                        value={editRecord.overallRenderedOfficialTimeTardiness}
                        onChange={(e) =>
                          setEditRecord({
                            ...editRecord,
                            overallRenderedOfficialTimeTardiness:
                              e.target.value,
                          })
                        }
                      />
                    ) : (
                      record.overallRenderedOfficialTimeTardiness
                    )}
                  </TableCell>

                  <TableCell>
                    {editRecord && editRecord.id === record.id ? (
                      <>
                        {/* Save */}
                        <Button
                          onClick={updateRecord} // original save logic
                          variant="contained"
                          style={{
                            backgroundColor: '#6D2323',
                            color: '#FEF9E1',
                            marginBottom: '5px',
                            width: '100%',
                          }}
                          startIcon={<SaveIcon />}
                        >
                          Save
                        </Button>

                        {/* Cancel */}
                        <Button
                          onClick={() => setEditRecord(null)} // original cancel logic
                          variant="contained"
                          style={{
                            backgroundColor: 'black',
                            color: 'white',
                            width: '100%',
                          }}
                          startIcon={<CancelIcon />}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => {
                            setEditRecord(record);
                          }}
                          variant="contained"
                          style={{
                            backgroundColor: '#6D2323',
                            color: '#FEF9E1',
                            width: '100%',
                            marginBottom: '5px',
                          }}
                          startIcon={<EditIcon />}
                        >
                          Edit
                        </Button>

                        <Button
                          onClick={() =>
                            deleteRecord(record.id, record.personID)
                          } // ← original delete logic kept
                          variant="contained"
                          style={{
                            backgroundColor: 'black',
                            color: 'white',
                            width: '100%',
                          }}
                          startIcon={<DeleteIcon />}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* No Data Message */}
        {attendanceData.length === 0 && (
          <Typography
            variant="body1"
            color="textSecondary"
            sx={{ marginTop: 2 }}
          >
            No records found for the given criteria.
          </Typography>
        )}
      </Box>

      <Button
        variant="contained"
        sx={{
          mt: 3,
          backgroundColor: isSubmitting ? '#9e9e9e' : '#6D2323',
          color: '#ffffff',
          width: '100%',
          fontWeight: 'bold',
          '&:hover': {
            backgroundColor: isSubmitting ? '#9e9e9e' : '#5a1e1e',
          },
        }}
        onClick={submitToPayroll}
        disabled={isSubmitting || attendanceData.length === 0}
      >
        {isSubmitting
          ? 'Submitting to Payroll...'
          : 'Submit Overall Rendered Time to Payroll'}
      </Button>
    </Container>
  );
};

export default OverallAttendance;
