import API_BASE_URL from '../apiConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Container,
  Box,
  Typography,
  TextField,
  Paper,
  TableContainer,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
} from '@mui/material';
import {
  Reorder as ReorderIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import LoadingOverlay from './LoadingOverlay'; // Adjust path as needed

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Month filter state
  const [selectedMonth, setSelectedMonth] = useState('');

  const HARDCODED_PASSWORD = '20134507';
  const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  // Check if session is still valid
  const isSessionValid = () => {
    const sessionData = sessionStorage.getItem('auditLogsSession');
    if (!sessionData) return false;
    
    try {
      const { timestamp } = JSON.parse(sessionData);
      const now = Date.now();
      const sessionAge = now - timestamp;
      
      return sessionAge < SESSION_DURATION;
    } catch (error) {
      console.error('Error parsing session data:', error);
      return false;
    }
  };

  // Store session data
  const storeSession = () => {
    const sessionData = {
      timestamp: Date.now(),
      authenticated: true
    };
    sessionStorage.setItem('auditLogsSession', JSON.stringify(sessionData));
  };

  // Clear session data
  const clearSession = () => {
    sessionStorage.removeItem('auditLogsSession');
    setIsAuthenticated(false);
    setPasswordDialogOpen(true);
  };

  // Get remaining session time in minutes
  const getRemainingSessionTime = () => {
    const sessionData = sessionStorage.getItem('auditLogsSession');
    if (!sessionData) return 0;
    
    try {
      const { timestamp } = JSON.parse(sessionData);
      const now = Date.now();
      const sessionAge = now - timestamp;
      const remaining = SESSION_DURATION - sessionAge;
      
      return Math.max(0, Math.floor(remaining / (60 * 1000))); // Convert to minutes
    } catch (error) {
      return 0;
    }
  };

  // Check session validity periodically and update remaining time
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSession = () => {
      if (!isSessionValid()) {
        clearSession();
        setPasswordError('Session expired. Please enter password again.');
      } else {
        setRemainingTime(getRemainingSessionTime());
      }
    };

    // Check every minute
    const interval = setInterval(checkSession, 60000);
    
    // Initial check
    checkSession();
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Update remaining time every minute
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      setRemainingTime(getRemainingSessionTime());
    }, 60000); // Update every minute

    // Initial update
    setRemainingTime(getRemainingSessionTime());

    return () => clearInterval(timer);
  }, [isAuthenticated]);

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

  // Test authentication function
  const testAuth = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/audit-logs`,
        getAuthHeaders()
      );
      console.log('Auth test successful:', res.data);
    } catch (error) {
      console.error('Auth test failed:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    // Check if there's a valid session on component mount
    if (isSessionValid()) {
      setIsAuthenticated(true);
      setPasswordDialogOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = () => {
    if (passwordInput === HARDCODED_PASSWORD) {
      setPasswordError('');
      setPasswordDialogOpen(false);
      setIsAuthenticated(true);
      setLoadingMessage('Verifying access...');
      setLoading(true);

      // Store session data
      storeSession();

      // Simulate verification delay
      setTimeout(() => {
        setLoadingMessage('Loading audit logs...');
      }, 1500);
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPasswordInput('');
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/audit-logs`, getAuthHeaders());
      setLogs(response.data);

      // Simulate loading delay
      setTimeout(() => {
        setLoading(false);
        setLoadingMessage('');
      }, 2000);
    } catch (err) {
      console.error('Error fetching audit logs:', err.response?.data || err.message);
      setLoading(false);
      setLoadingMessage('');
      
      // Handle authentication errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error('Authentication failed. Please log in again.');
        // Optionally redirect to login or show error message
      }
    }
  };

  // Get unique months from logs for filter dropdown
  const getUniqueMonths = () => {
    const months = logs
      .map((log) => {
        if (log.timestamp) {
          const date = new Date(log.timestamp);
          return {
            value: `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, '0')}`,
            label: date.toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
            }),
          };
        }
        return null;
      })
      .filter(Boolean)
      .reduce((unique, month) => {
        if (!unique.some((m) => m.value === month.value)) {
          unique.push(month);
        }
        return unique;
      }, [])
      .sort((a, b) => b.value.localeCompare(a.value)); // Sort newest first

    return months;
  };

  // Filter logs based on search query and selected month
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.employeeNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.table_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.record_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetEmployeeNumber
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesMonth =
      !selectedMonth ||
      (log.timestamp && log.timestamp.startsWith(selectedMonth));

    return matchesSearch && matchesMonth;
  });

  // Pagination logic
  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleClearMonth = () => {
    setSelectedMonth('');
    setPage(0);
  };

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'create':
        return 'success';
      case 'update':
        return 'warning';
      case 'delete':
        return 'error';
      default:
        return 'default';
    }
  };

  // Show password dialog if not authenticated
  if (!isAuthenticated) {
    return (
      <Dialog
        open={passwordDialogOpen}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            bgcolor: '#6D2323',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <LockIcon />
          Audit Logs Access
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3, textAlign: 'center' }}
          >
            This section contains sensitive audit information. Please enter the
            access password.
          </Typography>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Access Password"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setPasswordError('');
            }}
            error={!!passwordError}
            helperText={passwordError}
            onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#6D2323',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6D2323',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            fullWidth
            sx={{
              bgcolor: '#6D2323',
              '&:hover': { bgcolor: '#5a1e1e' },
              py: 1.5,
            }}
          >
            Access Audit Logs
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <LoadingOverlay open={loading} message={loadingMessage} />

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            backgroundColor: '#6D2323',
            color: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            marginTop: '-7%',
            mb: 3,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <ReorderIcon sx={{ fontSize: '2.5rem', marginRight: '16px' }} />
              <Box>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{ margin: 0, fontWeight: 'bold' }}
                >
                  Audit Logs
                </Typography>
                <Typography variant="body1" sx={{ margin: 0, opacity: 0.9 }}>
                  View all recorded system activities
                </Typography>
              </Box>
            </Box>
            
            {/* Session Info and Logout */}
            <Box display="flex" alignItems="center" gap={2}>
              {remainingTime > 0 && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Session expires in: {remainingTime} min
                </Typography>
              )}
              <Button
                variant="outlined"
                onClick={clearSession}
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Filters and Search */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          flexWrap="wrap"
          gap={2}
        >
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Typography variant="h6" color="text.secondary">
              Total Records: {logs.length}
            </Typography>
            {(searchQuery || selectedMonth) && (
              <Typography variant="body2" color="text.secondary">
                Showing {filteredLogs.length} filtered results
              </Typography>
            )}
          </Box>

          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            {/* Month Filter */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Month</InputLabel>
              <Select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setPage(0);
                }}
                label="Filter by Month"
                sx={{
                  backgroundColor: 'white',
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6D2323',
                  },
                }}
                endAdornment={
                  selectedMonth && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleClearMonth}
                        sx={{ mr: 1 }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              >
                <MenuItem value="">All Months</MenuItem>
                {getUniqueMonths().map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Search Bar */}
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search by employee number, action, table name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                backgroundColor: 'white',
                borderRadius: 2,
                width: '400px',
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#6D2323',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6D2323',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#6D2323' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <ClearIcon
                      sx={{
                        color: '#6D2323',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.7 },
                      }}
                      onClick={handleClearSearch}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        {/* Table Container with Scrolling */}
        <Paper
          elevation={4}
          sx={{
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '30px',
          }}
        >
          <TableContainer
            sx={{
              maxHeight: '60vh',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#6D2323',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#5a1e1e',
              },
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5',
                      borderBottom: '2px solid #6D2323',
                      fontSize: '0.95rem',
                    }}
                  >
                    Employee Number
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5',
                      borderBottom: '2px solid #6D2323',
                      fontSize: '0.95rem',
                    }}
                  >
                    Action
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5',
                      borderBottom: '2px solid #6D2323',
                      fontSize: '0.95rem',
                    }}
                  >
                    Table Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5',
                      borderBottom: '2px solid #6D2323',
                      fontSize: '0.95rem',
                    }}
                  >
                    Record ID
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5',
                      borderBottom: '2px solid #6D2323',
                      fontSize: '0.95rem',
                    }}
                  >
                    Target Employee
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5',
                      borderBottom: '2px solid #6D2323',
                      fontSize: '0.95rem',
                    }}
                  >
                    Timestamp
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      style={{ textAlign: 'center', padding: '40px' }}
                    >
                      <Typography variant="h6" color="text.secondary">
                        {searchQuery || selectedMonth
                          ? 'No matching logs found.'
                          : 'No audit logs available.'}
                      </Typography>
                      {(searchQuery || selectedMonth) && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          Try adjusting your search criteria or filters
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: '#fafafa',
                        },
                        '&:hover': {
                          backgroundColor: '#f0f0f0',
                        },
                      }}
                    >
                      <TableCell sx={{ fontSize: '0.9rem' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {log.employeeNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.9rem' }}>
                        {log.action ? (
                          <Chip
                            label={log.action}
                            color={getActionColor(log.action)}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.9rem' }}>
                        {log.table_name || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.9rem' }}>
                        {log.record_id || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.9rem' }}>
                        {log.targetEmployeeNumber || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.9rem' }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateForDisplay(log.timestamp)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              component="div"
              count={filteredLogs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: '1px solid #e0e0e0',
                '& .MuiTablePagination-actions': {
                  '& .MuiIconButton-root': {
                    '&:hover': {
                      backgroundColor: 'rgba(109, 35, 35, 0.1)',
                    },
                  },
                },
                '& .MuiTablePagination-select': {
                  '&:focus': {
                    backgroundColor: 'rgba(109, 35, 35, 0.1)',
                  },
                },
              }}
            />
          )}
        </Paper>
      </Container>
    </>
  );
};

export default AuditLogs;
