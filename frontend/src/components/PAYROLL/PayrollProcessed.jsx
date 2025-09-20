import API_BASE_URL from '../../apiConfig';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Paper,
  Typography,
  Container,
  Box,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import LoadingOverlay from '../LoadingOverlay';
import SuccessfulOverlay from '../SuccessfulOverlay';
import {
  Delete as DeleteIcon,
  Email,
  Payment,
  Save as SaveIcon,
} from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import * as XLSX from 'xlsx';
import { Checkbox } from '@mui/material';

import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

// Custom styled TableCell for Excel-like appearance
const ExcelTableCell = ({ children, header, ...props }) => (
  <TableCell
    {...props}
    sx={{
      border: '1px solid #E0E0E0',
      padding: '8px',
      backgroundColor: header ? '#F5F5F5' : 'inherit',
      fontWeight: header ? 'bold' : 'normal',
      whiteSpace: 'nowrap',
      '&:hover': {
        backgroundColor: header ? '#F5F5F5' : '#F8F8F8',
      },
      ...props.sx,
    }}
  >
    {children}
  </TableCell>
);

const PayrollProcessed = () => {
  const [finalizedData, setFinalizedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPasskey, setOpenPasskey] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFinalizedData, setFilteredFinalizedData] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successAction, setSuccessAction] = useState('');

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

  const handleDateChange = (event) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
    applyFilters(selectedDepartment, searchTerm, newDate);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTableHeight = () => {
    const rowHeight = 53;
    const headerHeight = 56;
    const paginationHeight = 52;
    const minHeight = 300;
    const maxHeight = 600;

    const contentHeight =
      Math.min(rowsPerPage, filteredFinalizedData.length) * rowHeight +
      headerHeight +
      paginationHeight;
    return Math.min(Math.max(contentHeight, minHeight), maxHeight);
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/department-table`,
          getAuthHeaders()
        );
        setDepartments(response.data);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchFinalizedPayroll = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/PayrollRoute/finalized-payroll`,
          getAuthHeaders()
        );
        setFinalizedData(res.data);
        setFilteredFinalizedData(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching finalized payroll:', err);
        setError('An error occurred while fetching the finalized payroll.');
        setLoading(false);
      }
    };
    fetchFinalizedPayroll();
  }, []);

  const handleDepartmentChange = (event) => {
    const selectedDept = event.target.value;
    setSelectedDepartment(selectedDept);
    applyFilters(selectedDept, searchTerm, selectedDate);
  };

  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    applyFilters(selectedDept, searchTerm, selectedDate);
  };

  const applyFilters = (department, search, filterDate) => {
    let filtered = [...finalizedData];

    if (department) {
      filtered = filtered.filter((record) => record.department === department);
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          (record.name || '').toLowerCase().includes(lowerSearch) ||
          (record.employeeNumber || '')
            .toString()
            .toLowerCase()
            .includes(lowerSearch)
      );
    }

    // Filter by date - check if the selected date falls within the payroll period
    if (filterDate) {
      filtered = filtered.filter((record) => {
        const startDate = new Date(record.startDate);
        const endDate = new Date(record.endDate);
        const selectedDate = new Date(filterDate);

        // Set time to start/end of day to ensure proper comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        selectedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

        // Check if the selected date falls within the payroll period
        return selectedDate >= startDate && selectedDate <= endDate;
      });
    }

    setFilteredFinalizedData(filtered);
    setPage(0);
  };

  const handleDelete = async (rowId) => {
    setOverlayLoading(true);
    try {
      // First update UI immediately
      setFinalizedData((prev) => prev.filter((item) => item.id !== rowId));
      setFilteredFinalizedData((prev) =>
        prev.filter((item) => item.id !== rowId)
      );

      // Then make API call
      await axios.delete(
        `${API_BASE_URL}/PayrollRoute/finalized-payroll/${rowId}`,
        getAuthHeaders()
      );

      // Show loading for 2-3 seconds, then success overlay
      setTimeout(() => {
        setOverlayLoading(false);
        setSuccessAction('delete');
        setSuccessOpen(true);
        setTimeout(() => setSuccessOpen(false), 2500);
      }, 2500);
    } catch (error) {
      console.error('Error deleting payroll data:', error);
      setOverlayLoading(false);
      // If API call fails, revert the UI changes
      const res = await axios.get(
        `${API_BASE_URL}/PayrollRoute/finalized-payroll`,
        getAuthHeaders()
      );
      setFinalizedData(res.data);
      setFilteredFinalizedData((prev) => {
        // Reapply current filters
        let filtered = res.data;
        if (selectedDepartment) {
          filtered = filtered.filter(
            (record) => record.department === selectedDepartment
          );
        }
        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          filtered = filtered.filter(
            (record) =>
              (record.name || '').toLowerCase().includes(lowerSearch) ||
              (record.employeeNumber || '')
                .toString()
                .toLowerCase()
                .includes(lowerSearch)
          );
        }
        return filtered;
      });
      alert('Failed to delete record. Please try again.');
    }
  };

  const initiateDelete = (rowOrIds) => {
    if (Array.isArray(rowOrIds)) {
      // Bulk delete mode
      setSelectedRow({ isBulk: true, ids: rowOrIds });
    } else {
      // Single row delete
      setSelectedRow(rowOrIds);
    }
    setOpenConfirm(true);
  };

  const handleConfirm = () => {
    setOpenConfirm(false);
    setOpenPasskey(true);
  };

  const handlePasskeySubmit = async () => {
    const HARDCODED_PASSKEY = '20134507';

    if (passkeyInput !== HARDCODED_PASSKEY) {
      alert('Incorrect Passkey.');
      setOpenPasskey(false);
      return;
    }

    setOverlayLoading(true);
    try {
      if (selectedRow.isBulk) {
        // Bulk delete
        setFinalizedData((prev) =>
          prev.filter((item) => !selectedRow.ids.includes(item.id))
        );
        setFilteredFinalizedData((prev) =>
          prev.filter((item) => !selectedRow.ids.includes(item.id))
        );

        await Promise.all(
          selectedRow.ids.map((id) =>
            axios.delete(
              `${API_BASE_URL}/PayrollRoute/finalized-payroll/${id}`,
              getAuthHeaders()
            )
          )
        );

        // Show loading for 2-3 seconds, then success overlay
        setTimeout(() => {
          setOverlayLoading(false);
          setSuccessAction('delete');
          setSuccessOpen(true);
          setTimeout(() => setSuccessOpen(false), 2500);
        }, 2500);
        setSelectedRows([]);
      } else {
        // Single delete (existing logic)
        setFinalizedData((prev) =>
          prev.filter((item) => item.id !== selectedRow.id)
        );
        setFilteredFinalizedData((prev) =>
          prev.filter((item) => item.id !== selectedRow.id)
        );

        await axios.delete(
          `${API_BASE_URL}/PayrollRoute/finalized-payroll/${selectedRow.id}`,
          {
            ...getAuthHeaders(),
            data: {
              employeeNumber: selectedRow.employeeNumber,
              name: selectedRow.name,
            },
          }
        );

        // Show loading for 2-3 seconds, then success overlay
        setTimeout(() => {
          setOverlayLoading(false);
          setSuccessAction('delete');
          setSuccessOpen(true);
          setTimeout(() => setSuccessOpen(false), 2500);
        }, 2500);
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      setOverlayLoading(false);
      // Revert UI changes on error
      const res = await axios.get(
        `${API_BASE_URL}/PayrollRoute/finalized-payroll`,
        getAuthHeaders()
      );
      setFinalizedData(res.data);
      applyFilters(selectedDepartment, searchTerm, selectedDate);
      alert('Failed to delete record(s). Please try again.');
    } finally {
      setOpenPasskey(false);
      setPasskeyInput('');
      setSelectedRow(null);
    }
  };

  const handleSaveToExcel = () => {
    // Create worksheet data
    const ws_data = [
      // Header row
      [
        'No.',
        'Name',
        'Position',
        'Rate NBC 584',
        'NBC 594',
        'Rate NBC 594',
        "NBC DIFF'L 597",
        'Increment',
        'Gross Salary',
        'ABS',
        'H',
        'M',
        'Net Salary',
        'Withholding Tax',
        'Total GSIS Deductions',
        'Total Pag-ibig Deductions',
        'PhilHealth',
        'Total Other Deductions',
        'Total Deductions',
        '1st Pay',
        '2nd Pay',
        'No.',
        'RT Ins.',
        'EC',
        'PhilHealth',
        'Pag-Ibig',
        'Pay1st Compute',
        'Pay2nd Compute',
        '',
        'No.',
        'Name',
        'Position',
        'Withholding Tax',
        'Personal Life Ret Ins',
        'GSIS Salary Loan',
        'GSIS Policy Loan',
        'gsisArrears',
        'CPL',
        'MPL',
        'EAL',
        'MPL LITE',
        'Emergency Loan (ELA)',
        'Total GSIS Deductions',
        'Pag-ibig Fund Contribution',
        'Pag-ibig 2',
        'Multi-Purpose Loan',
        'Total Pag-Ibig Deduction',
        'PhilHealth',
        'liquidatingCash',
        'LandBank Salary Loan',
        'Earist Credit COOP.',
        'FEU',
        'Total Other Deductions',
        'Total Deductions',
      ],
      // Empty row after header
      Array(57).fill(''),
    ];

    // Add data rows with empty rows in between
    filteredFinalizedData.forEach((row, index) => {
      // Helper function to convert string to number
      const toNumber = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const num = Number(value);
        if (isNaN(num)) return value;
        // Format with thousand separators but keep as number for Excel
        return num.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      };

      // Add data row with numeric values
      ws_data.push([
        index + 1,
        row.name,
        row.position,
        toNumber(row.rateNbc584),
        toNumber(row.nbc594),
        toNumber(row.rateNbc594),
        toNumber(row.nbcDiffl597),
        toNumber(row.increment),
        toNumber(row.grossSalary),
        toNumber(row.abs),
        toNumber(row.h),
        toNumber(row.m),
        toNumber(row.netSalary),
        toNumber(row.withholdingTax),
        toNumber(row.totalGsisDeds),
        toNumber(row.totalPagibigDeds),
        toNumber(row.PhilHealthContribution),
        toNumber(row.totalOtherDeds),
        toNumber(row.totalDeductions),
        toNumber(row.pay1st),
        toNumber(row.pay2nd),
        index + 1,
        toNumber(row.rtIns),
        toNumber(row.ec),
        toNumber(row.PhilHealthContribution),
        toNumber(row.pagibigFundCont),
        toNumber(row.pay1stCompute),
        toNumber(row.pay2ndCompute),
        '',
        index + 1,
        row.name,
        row.position,
        toNumber(row.withholdingTax),
        toNumber(row.personalLifeRetIns),
        toNumber(row.gsisSalaryLoan),
        toNumber(row.gsisPolicyLoan),
        toNumber(row.gsisArrears),
        toNumber(row.cpl),
        toNumber(row.mpl),
        toNumber(row.eal),
        toNumber(row.mplLite),
        toNumber(row.emergencyLoan),
        toNumber(row.totalGsisDeds),
        toNumber(row.pagibigFundCont),
        toNumber(row.pagibig2),
        toNumber(row.multiPurpLoan),
        toNumber(row.totalPagibigDeds),
        toNumber(row.PhilHealthContribution),
        toNumber(row.liquidatingCash),
        toNumber(row.landbankSalaryLoan),
        toNumber(row.earistCreditCoop),
        toNumber(row.feu),
        toNumber(row.totalOtherDeds),
        toNumber(row.totalDeductions),
      ]);

      // Add empty row after each data row
      ws_data.push(Array(57).fill(''));
    });

    // Create workbook and add the worksheet
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Data');

    // Auto-size columns
    const max_width = 20;
    const colWidths = ws_data[0].map((_, i) => {
      return {
        wch: Math.min(
          max_width,
          Math.max(...ws_data.map((row) => row[i]?.toString().length || 0))
        ),
      };
    });
    ws['!cols'] = colWidths;

    // Save to the exact directory
    XLSX.writeFile(wb, 'frontend/public/PayrollProcessed.xlsx');
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 2 }}>
      <Paper
        elevation={6}
        sx={{
          backgroundColor: '#6D2323',
          color: '#fff',
          p: 3,
          borderRadius: 3,
          borderEndEndRadius: '0',
          borderEndStartRadius: '0',
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Payment fontSize="large" />
          <Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              fontFamily="'Poppins', sans-serif"
            >
              Payroll | Processed
            </Typography>
            <Typography
              variant="body2"
              color="rgba(255,255,255,0.7)"
              fontFamily="'Poppins', sans-serif"
            >
              Viewing all processed payroll records
            </Typography>
          </Box>
        </Box>
      </Paper>
      <Box
        sx={{
          backgroundColor: 'white',
          border: '2px solid #6D2323',
          p: 1,
          mt: 0,
          mb: 2,
        }}
      >
        <TextField
          type="date"
          label="Search by Date"
          value={selectedDate}
          onChange={handleDateChange}
          sx={{
            minWidth: 200,
            bgcolor: '#fff',
            border: '1px solid #6d2323',
            borderRadius: 0,
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 0,
            },
          }}
          InputLabelProps={{
            shrink: true,
          }}
        />

        <FormControl
          variant="outlined"
          sx={{
            minWidth: 200,
            bgcolor: '#fff',
            border: '1px solid #6d2323',
            borderRadius: 0,
            '& .MuiOutlinedInput-root': {
              borderRadius: 0,
            },
          }}
        >
          <InputLabel id="department-label">Department</InputLabel>
          <Select
            labelId="department-label"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            label="Department"
          >
            <MenuItem value="">
              <em>All Departments</em>
            </MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.code}>
                {dept.description}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          variant="outlined"
          placeholder="Search Name"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{
            flex: 1,
            bgcolor: '#fff',
            border: '1px solid #6d2323',
            borderRadius: 0,
            ml: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 0,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={10}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper
              elevation={4}
              sx={{
                borderRadius: 2,
                border: '3px solid #6d2323',
                flex: 1,
                minWidth: '800px',
                maxWidth: '1600px',
                pb: 0,
                height: getTableHeight(),
                display: 'flex',
                flexDirection: 'column',
                '& .MuiTableContainer-root': {
                  flex: 1,
                  '&::-webkit-scrollbar': {
                    width: '10px',
                    height: '10px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '5px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '5px',
                    '&:hover': {
                      background: '#555',
                    },
                  },
                },
              }}
            >
              <TableContainer component={Box}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={
                            selectedRows.length > 0 &&
                            selectedRows.length <
                              filteredFinalizedData.slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage
                              ).length
                          }
                          checked={
                            filteredFinalizedData.slice(
                              page * rowsPerPage,
                              page * rowsPerPage + rowsPerPage
                            ).length > 0 &&
                            selectedRows.length ===
                              filteredFinalizedData.slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage
                              ).length
                          }
                          onChange={(e) => {
                            const currentPageRows = filteredFinalizedData.slice(
                              page * rowsPerPage,
                              page * rowsPerPage + rowsPerPage
                            );
                            if (e.target.checked) {
                              setSelectedRows((prev) => [
                                ...new Set([
                                  ...prev,
                                  ...currentPageRows.map((row) => row.id),
                                ]),
                              ]);
                            } else {
                              setSelectedRows((prev) =>
                                prev.filter(
                                  (id) =>
                                    !currentPageRows
                                      .map((row) => row.id)
                                      .includes(id)
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>

                      <ExcelTableCell header>No.</ExcelTableCell>
                      <ExcelTableCell header>Department</ExcelTableCell>
                      <ExcelTableCell header>Employee Number</ExcelTableCell>
                      <ExcelTableCell header>Start Date</ExcelTableCell>
                      <ExcelTableCell header>End Date</ExcelTableCell>
                      <ExcelTableCell header>Name</ExcelTableCell>
                      <ExcelTableCell header>Position</ExcelTableCell>
                      <ExcelTableCell header>Rate NBC 584</ExcelTableCell>
                      <ExcelTableCell header>NBC 594</ExcelTableCell>
                      <ExcelTableCell header>Rate NBC 594</ExcelTableCell>
                      <ExcelTableCell header>NBC DIFF'L 597</ExcelTableCell>
                      <ExcelTableCell header>Increment</ExcelTableCell>
                      <ExcelTableCell header>Gross Salary</ExcelTableCell>
                      <ExcelTableCell header>
                        <b>ABS</b>
                      </ExcelTableCell>
                      <ExcelTableCell header>H</ExcelTableCell>
                      <ExcelTableCell header>M</ExcelTableCell>
                      <ExcelTableCell header>Net Salary</ExcelTableCell>
                      <ExcelTableCell header>Withholding Tax</ExcelTableCell>
                      <ExcelTableCell header>
                        <b>Total GSIS Deductions</b>
                      </ExcelTableCell>
                      <ExcelTableCell header>
                        <b>Total Pag-ibig Deductions</b>
                      </ExcelTableCell>
                      <ExcelTableCell header>PhilHealth</ExcelTableCell>
                      <ExcelTableCell header>
                        {' '}
                        <b>Total Other Deductions</b>
                      </ExcelTableCell>
                      <ExcelTableCell header>
                        <b>Total Deductions</b>
                      </ExcelTableCell>
                      <ExcelTableCell header>1st Pay</ExcelTableCell>
                      <ExcelTableCell header>2nd Pay</ExcelTableCell>
                      <ExcelTableCell header>No.</ExcelTableCell>
                      <ExcelTableCell header>RT Ins.</ExcelTableCell>
                      <ExcelTableCell header>EC</ExcelTableCell>
                      <ExcelTableCell header>PhilHealth</ExcelTableCell>
                      <ExcelTableCell header>Pag-Ibig</ExcelTableCell>
                      <ExcelTableCell
                        header
                        style={{ borderLeft: '2px solid black' }}
                      >
                        Pay1st Compute
                      </ExcelTableCell>
                      <ExcelTableCell header>Pay2nd Compute</ExcelTableCell>
                      <ExcelTableCell
                        header
                        style={{ borderLeft: '2px solid black' }}
                      >
                        No.
                      </ExcelTableCell>
                      <ExcelTableCell header>Name</ExcelTableCell>
                      <ExcelTableCell>Position</ExcelTableCell>
                      <ExcelTableCell>Withholding Tax</ExcelTableCell>
                      <ExcelTableCell>Personal Life Ret Ins</ExcelTableCell>
                      <ExcelTableCell>GSIS Salary Loan</ExcelTableCell>
                      <ExcelTableCell>GSIS Policy Loan</ExcelTableCell>
                      <ExcelTableCell>gsisArrears</ExcelTableCell>
                      <ExcelTableCell>CPL</ExcelTableCell>
                      <ExcelTableCell>MPL</ExcelTableCell>
                      <ExcelTableCell> EAL</ExcelTableCell>
                      <ExcelTableCell>MPL LITE</ExcelTableCell>
                      <ExcelTableCell>Emergency Loan (ELA)</ExcelTableCell>
                      <ExcelTableCell>Total GSIS Deductions</ExcelTableCell>
                      <ExcelTableCell>
                        Pag-ibig Fund Contribution
                      </ExcelTableCell>
                      <ExcelTableCell>Pag-ibig 2</ExcelTableCell>
                      <ExcelTableCell>Multi-Purpose Loan</ExcelTableCell>
                      <ExcelTableCell>Total Pag-Ibig Deduction</ExcelTableCell>
                      <ExcelTableCell> PhilHealth</ExcelTableCell>
                      <ExcelTableCell> liquidatingCash</ExcelTableCell>
                      <ExcelTableCell>LandBank Salary Loan</ExcelTableCell>
                      <ExcelTableCell> Earist Credit COOP.</ExcelTableCell>
                      <ExcelTableCell> FEU</ExcelTableCell>
                      <ExcelTableCell> Total Other Deductions</ExcelTableCell>
                      <ExcelTableCell> Total Deductions</ExcelTableCell>
                      <ExcelTableCell>Date Submitted</ExcelTableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredFinalizedData.length > 0 ? (
                      filteredFinalizedData
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((row, index) => (
                          <TableRow
                            key={row.id}
                            sx={{
                              '&:hover': {
                                backgroundColor: '#F5F5F5 !important',
                              },
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedRows.includes(row.id)}
                                onChange={(e) => {
                                  e.stopPropagation(); // prevent row click side effects
                                  if (selectedRows.includes(row.id)) {
                                    setSelectedRows((prev) =>
                                      prev.filter((id) => id !== row.id)
                                    );
                                  } else {
                                    setSelectedRows((prev) => [
                                      ...prev,
                                      row.id,
                                    ]);
                                  }
                                }}
                              />
                            </TableCell>
                            <ExcelTableCell>
                              {page * rowsPerPage + index + 1}
                            </ExcelTableCell>
                            <ExcelTableCell>{row.department}</ExcelTableCell>
                            <ExcelTableCell>
                              {row.employeeNumber}
                            </ExcelTableCell>
                            <ExcelTableCell>{row.startDate}</ExcelTableCell>
                            <ExcelTableCell>{row.endDate}</ExcelTableCell>
                            <ExcelTableCell>{row.name}</ExcelTableCell>
                            <ExcelTableCell>{row.position}</ExcelTableCell>
                            <ExcelTableCell>
                              {row.rateNbc584
                                ? Number(row.rateNbc584).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.nbc594
                                ? Number(row.nbc594).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.rateNbc594
                                ? Number(row.rateNbc594).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.nbcDiffl597
                                ? Number(row.nbcDiffl597).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.increment
                                ? Number(row.increment).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.grossSalary
                                ? Number(row.grossSalary).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.abs
                                ? Number(row.abs).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>{row.h}</ExcelTableCell>
                            <ExcelTableCell>{row.m}</ExcelTableCell>
                            <ExcelTableCell>
                              {row.netSalary
                                ? Number(row.netSalary).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}{' '}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.withholdingTax
                                ? Number(row.withholdingTax).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.totalGsisDeds
                                ? Number(row.totalGsisDeds).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.totalPagibigDeds
                                ? Number(row.totalPagibigDeds).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.PhilHealthContribution
                                ? Number(
                                    row.PhilHealthContribution
                                  ).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.totalOtherDeds
                                ? Number(row.totalOtherDeds).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.totalDeductions
                                ? Number(row.totalDeductions).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell
                              sx={{ color: 'red', fontWeight: 'bold' }}
                            >
                              {row.pay1st
                                ? Number(row.pay1st).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}{' '}
                            </ExcelTableCell>
                            <ExcelTableCell
                              sx={{ color: 'red', fontWeight: 'bold' }}
                            >
                              {row.pay2nd
                                ? Number(row.pay2nd).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>{index + 1}</ExcelTableCell>
                            <ExcelTableCell>
                              {row.rtIns
                                ? Number(row.rtIns).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.ec
                                ? Number(row.ec).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.PhilHealthContribution
                                ? Number(
                                    row.PhilHealthContribution
                                  ).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.pagibigFundCont
                                ? Number(row.pagibigFundCont).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell
                              sx={{
                                borderLeft: '2px solid black',
                                color: 'red',
                                fontWeight: 'bold',
                              }}
                            >
                              {row.pay1stCompute
                                ? Number(row.pay1stCompute).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell
                              sx={{ color: 'red', fontWeight: 'bold' }}
                            >
                              {row.pay2ndCompute
                                ? Number(row.pay2ndCompute).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell
                              sx={{ borderLeft: '2px solid black' }}
                            >
                              {index + 1}
                            </ExcelTableCell>
                            <ExcelTableCell>{row.name}</ExcelTableCell>
                            <ExcelTableCell>{row.position}</ExcelTableCell>
                            <ExcelTableCell>
                              {row.withholdingTax
                                ? Number(row.withholdingTax).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.personalLifeRetIns
                                ? Number(row.personalLifeRetIns).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.gsisSalaryLoan
                                ? Number(row.gsisSalaryLoan).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.gsisPolicyLoan
                                ? Number(row.gsisPolicyLoan).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.gsisArrears
                                ? Number(row.gsisArrears).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.cpl
                                ? Number(row.cpl).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.mpl
                                ? Number(row.mpl).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.eal
                                ? Number(row.eal).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.mplLite
                                ? Number(row.mplLite).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.emergencyLoan
                                ? Number(row.emergencyLoan).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.totalGsisDeds
                                ? Number(row.totalGsisDeds).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.pagibigFundCont
                                ? Number(row.pagibigFundCont).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.pagibig2
                                ? Number(row.pagibig2).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.multiPurpLoan
                                ? Number(row.multiPurpLoan).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.totalPagibigDeds
                                ? Number(row.totalPagibigDeds).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.PhilHealthContribution
                                ? Number(
                                    row.PhilHealthContribution
                                  ).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.liquidatingCash
                                ? Number(row.liquidatingCash).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.landbankSalaryLoan
                                ? Number(row.landbankSalaryLoan).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.earistCreditCoop
                                ? Number(row.earistCreditCoop).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.feu
                                ? Number(row.feu).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.totalOtherDeds
                                ? Number(row.totalOtherDeds).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {row.totalDeductions
                                ? Number(row.totalDeductions).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : ''}
                            </ExcelTableCell>
                            <ExcelTableCell>
                              {new Date(row.dateCreated).toLocaleString()}
                            </ExcelTableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <ExcelTableCell colSpan={13} align="center">
                          No finalized payroll records available.
                        </ExcelTableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredFinalizedData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
                sx={{
                  borderTop: '1px solid #E0E0E0',
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows':
                    {
                      my: 'auto',
                    },
                }}
              />
            </Paper>
            <Paper
              elevation={4}
              sx={{
                borderRadius: 2,
                width: '150px', // Increased width for better button display
                height: getTableHeight(),
                display: 'flex',
                flexDirection: 'column',
                border: '3px solid #6d2323',
              }}
            >
              <Box
                sx={{
                  p: 1,
                  borderBottom: '2px solid black',
                  pb: '20px',
                  bgcolor: '#ffffff',
                  height: '12px', // Match table header height
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{ mt: '15px' }}
                >
                  Actions
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '10px',
                    height: '10px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '5px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '5px',
                    '&:hover': {
                      background: '#555',
                    },
                  },
                }}
              >
                {filteredFinalizedData.length > 0 ? (
                  filteredFinalizedData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <Box
                        key={row.id}
                        sx={{
                          mt: '6px',
                          pb: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottom: '2px solid #d1ceceff',
                          '&:nth-of-type(odd)': {
                            backgroundColor: '#FAFAFA',
                          },
                          '&:hover': {
                            backgroundColor: '#F5F5F5',
                          },
                        }}
                      >
                        <Button
                          onClick={() => {
                            if (selectedRows.includes(row.id)) {
                              // Bulk delete mode (delete all selected checkboxes)
                              initiateDelete(selectedRows);
                            } else {
                              // Single delete mode (delete only this row)
                              initiateDelete(row);
                            }
                          }}
                          variant="contained"
                          size="small"
                          startIcon={<DeleteIcon />}
                          sx={{
                            bgcolor: '#6d2323',
                            minWidth: '10px',
                            px: 1,
                            '&:hover': {
                              bgcolor: '#A31D1D',
                            },
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    ))
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>No records</Box>
                )}
              </Box>
            </Paper>
          </Box>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '16px',
              gap: '12px',
            }}
          >
            <Button
              variant="contained"
              color="success"
              onClick={() => (window.location.href = '/payroll-table')}
              size="medium"
              sx={{
                backgroundColor: '#6d2323',
                color: '#ffffff',
                textTransform: 'none',

                '&:hover': {
                  backgroundColor: '#a31d1d',
                },
              }}
              startIcon={<BusinessCenterIcon />}
            >
              View Pending Payroll
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveToExcel}
              size="medium"
              sx={{
                bgcolor: '#6D2323',
                textTransform: 'none',
                color: 'WHITE',
                '&:hover': {
                  bgcolor: '#fef9e1',
                  color: '#6d2323',
                },
              }}
            >
              Save to Excel
            </Button>

            <Button
              onClick={() => (window.location.href = '/send-payslip')}
              variant="contained"
              size="medium"
              startIcon={<Email />}
              sx={{
                bgcolor: '#6D2323',
                textTransform: 'none',
                color: 'white',
                '&:hover': {
                  bgcolor: '#fef9e1',
                  color: '#6d2323',
                },
              }}
            >
              Send Payslip
            </Button>
          </div>
        </Box>
      )}

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        PaperProps={{
          sx: {
            minWidth: '400px',
            maxWidth: '600px',
          },
        }}
      >
        <DialogTitle>Delete this record?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete{' '}
          {selectedRow?.isBulk
            ? `${selectedRow.ids.length} selected records`
            : 'this record'}
          ?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenConfirm(false)}
            style={{ color: 'black' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            style={{ backgroundColor: '#6D2323' }}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        PaperProps={{
          sx: {
            minWidth: '400px',
            maxWidth: '600px',
          },
        }}
      >
        <DialogTitle>Delete this record?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this record?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenConfirm(false)}
            style={{ color: 'black' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            style={{ backgroundColor: '#6D2323' }}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openPasskey}
        onClose={() => setOpenPasskey(false)}
        PaperProps={{
          sx: {
            minWidth: '200px',
            maxWidth: '500px',
          },
        }}
      >
        <DialogTitle>Passkey Required</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="black" sx={{ mb: 2 }}>
            Please enter the administrator passkey to confirm the deletion of
            this payroll record.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Enter a Passkey"
            type="password"
            fullWidth
            value={passkeyInput}
            onChange={(e) => setPasskeyInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenPasskey(false)}
            sx={{ color: '#000000' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePasskeySubmit}
            variant="contained"
            color="primary"
            sx={{ bgcolor: '#6D2323' }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading and Success Overlays */}
      <LoadingOverlay open={overlayLoading} message="Processing..." />
      <SuccessfulOverlay 
        open={successOpen} 
        action={successAction} 
        onClose={() => setSuccessOpen(false)} 
      />
    </Container>
  );
};

export default PayrollProcessed;
