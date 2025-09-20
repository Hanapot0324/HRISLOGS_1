import API_BASE_URL from '../../apiConfig';
import React, { useRef, forwardRef, useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  Select,
  MenuItem,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import logo from '../../assets/logo.png';
import hrisLogo from '../../assets/hrisLogo.png';
import LoadingOverlay from '../LoadingOverlay';
import SuccessfulOverlay from '../SuccessfulOverlay';


const PayslipDistribution = forwardRef(({ employee }, ref) => {
  const payslipRef = ref || useRef();


  const [allPayroll, setAllPayroll] = useState([]);
  const [displayEmployee, setDisplayEmployee] = useState(employee || null);
  const [loading, setLoading] = useState(!employee);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [successOverlay, setSuccessOverlay] = useState({
    open: false,
    action: '',
  });
  const [modal, setModal] = useState({
    open: false,
    type: 'error',
    message: '',
  });

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


  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filteredPayroll, setFilteredPayroll] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);


  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];


  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);


  // Fetch payroll
  useEffect(() => {
    if (!employee) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const res = await axios.get(
            `${API_BASE_URL}/api/finalized-payroll`,
            getAuthHeaders()
          );
          setAllPayroll(res.data);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching payroll:', err);
          setError('Failed to fetch payroll data. Please try again.');
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [employee]);


  // Filter payroll by Year, Month, and Search
  useEffect(() => {
    let result = [...allPayroll];


    if (selectedMonth) {
      const monthIndex = months.indexOf(selectedMonth);
      result = result.filter((emp) => {
        if (!emp.startDate) return false;
        const date = new Date(emp.startDate);
        return (
          date.getMonth() === monthIndex && date.getFullYear() === selectedYear
        );
      });
    }


    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.name.toLowerCase().includes(q) ||
          emp.employeeNumber.toString().includes(q)
      );
    }


    setFilteredPayroll(result);
    setSelectedEmployees([]); // reset selection when filters change
  }, [selectedMonth, selectedYear, searchQuery, allPayroll]);


  // Month select
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setDisplayEmployee(null);
  };


  // Checkbox logic
  const allSelected =
    filteredPayroll.length > 0 &&
    selectedEmployees.length === filteredPayroll.length;
  const someSelected =
    selectedEmployees.length > 0 &&
    selectedEmployees.length < filteredPayroll.length;


  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedEmployees(filteredPayroll.map((emp) => emp.employeeNumber));
    } else {
      setSelectedEmployees([]);
    }
  };


  const handleSelectOne = (id) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter((empId) => empId !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };


  // Helper function to generate 3-month PDF for an employee
  const generate3MonthPDF = async (employee) => {
    // 1. Identify current month/year from employee
    const currentStart = new Date(employee.startDate);
    const currentMonth = currentStart.getMonth(); // 0-11
    const currentYear = currentStart.getFullYear();


    // 2. Collect last 3 months (current, prev, prev-1)
    const monthsToGet = [0, 1, 2].map((i) => {
      const d = new Date(currentYear, currentMonth - i, 1);
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      };
    });


    // 3. Find payroll records (or null if missing)
    const records = monthsToGet.map(({ month, year, label }) => {
      const payroll = allPayroll.find(
        (p) =>
          p.employeeNumber === employee.employeeNumber &&
          new Date(p.startDate).getMonth() === month &&
          new Date(p.startDate).getFullYear() === year
      );
      return { payroll, label };
    });


    // 4. PDF setup - landscape orientation for 3 payslips
    const pdf = new jsPDF('l', 'in', 'a4');
    const contentWidth = 3.5;
    const contentHeight = 7.1;
    const gap = 0.2;


    const totalWidth = contentWidth * 3 + gap * 2;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const yOffset = (pageHeight - contentHeight) / 2;


    const positions = [
      (pageWidth - totalWidth) / 2,
      (pageWidth - totalWidth) / 2 + contentWidth + gap,
      (pageWidth - totalWidth) / 2 + (contentWidth + gap) * 2,
    ];


    // 5. Render each of the 3 slots
    for (let i = 0; i < records.length; i++) {
      const { payroll, label } = records[i];
      let imgData;


      if (payroll) {
        // Normal payslip
        setDisplayEmployee(payroll);
        await new Promise((resolve) => setTimeout(resolve, 500)); // wait DOM update


        const input = payslipRef.current;
        const canvas = await html2canvas(input, { scale: 2, useCORS: true });
        imgData = canvas.toDataURL('image/png');
      } else {
        // Missing → create "No Data" placeholder
        const placeholderCanvas = document.createElement('canvas');
        placeholderCanvas.width = 600;
        placeholderCanvas.height = 1200;
        const ctx = placeholderCanvas.getContext('2d');


        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, placeholderCanvas.width, placeholderCanvas.height);


        ctx.fillStyle = '#6D2323';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No Data', placeholderCanvas.width / 2, 500);
        ctx.font = '20px Arial';
        ctx.fillText(`for ${label}`, placeholderCanvas.width / 2, 550);


        imgData = placeholderCanvas.toDataURL('image/png');
      }


      // Add to PDF
      pdf.addImage(
        imgData,
        'PNG',
        positions[i],
        yOffset,
        contentWidth,
        contentHeight
      );
    }


    return pdf.output('blob');
  };


  // Bulk send selected payslips with 3-month layout
  const sendSelectedPayslips = async () => {
    if (selectedEmployees.length === 0) return;


    setSending(true);
    setLoadingMessage('Generating payslips and sending via Gmail...');


    try {
      const formData = new FormData();
      let payslipMeta = [];


      // Update loading message for processing
      setLoadingMessage(
        `Processing ${selectedEmployees.length} employee payslips...`
      );


      for (const emp of filteredPayroll.filter((e) =>
        selectedEmployees.includes(e.employeeNumber)
      )) {
        // Update loading message for current employee
        setLoadingMessage(`Generating payslip for ${emp.name}...`);


        // Generate 3-month PDF for this employee
        const pdfBlob = await generate3MonthPDF(emp);
        formData.append('pdfs', pdfBlob, `${emp.name}_3month_payslip.pdf`);


        payslipMeta.push({
          name: emp.name,
          employeeNumber: emp.employeeNumber,
        });
      }


      // Update loading message for sending
      setLoadingMessage('Sending payslips via Gmail...');


      formData.append('payslips', JSON.stringify(payslipMeta));


      await axios.post(
        `${API_BASE_URL}/SendPayslipRoute/send-bulk`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );


      // Show success overlay
      setSending(false);
      setSuccessOverlay({
        open: true,
        action: 'gmail',
      });
    } catch (err) {
      console.error('Error sending bulk payslips:', err);
      setSending(false);
      setModal({
        open: true,
        type: 'error',
        message: 'An error occurred while sending bulk payslips.',
      });
    }
  };


  return (
    <Container maxWidth="lg">
      {/* Header Bar */}
      <Paper
        elevation={6}
        sx={{
          backgroundColor: 'rgb(109, 35, 35)',
          color: '#fff',
          p: 3,
          borderRadius: 3,
          borderEndEndRadius: '0',
          borderEndStartRadius: '0',
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <WorkIcon fontSize="large" />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Employee Payslip Distribution
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              Manage and distribute monthly employee payslip records
            </Typography>
          </Box>
        </Box>
      </Paper>


      {/* Filters: Search + Year + Month */}
      <Box
        mb={2}
        display="flex"
        flexDirection="column"
        gap={2}
        sx={{
          backgroundColor: 'white',
          border: '2px solid #6D2323',
          borderRadius: 2,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          p: 3,
        }}
      >
        {/* Top Row: Search on Left, Year on Right */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {/* Search Bar */}
          <TextField
            label="Search by Name or Employee Number"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ maxWidth: 400 }}
          />


          {/* Year Dropdown (Far Right) */}
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            size="small"
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </Box>


        {/* Month Buttons below */}
        <Box display="flex" flexWrap="wrap" gap={1}>
          {months.map((m) => (
            <Button
              key={m}
              variant={m === selectedMonth ? 'contained' : 'outlined'}
              size="small"
              sx={{
                backgroundColor: m === selectedMonth ? '#6D2323' : '#fff',
                color: m === selectedMonth ? '#fff' : '#6D2323',
                borderColor: '#6D2323',
                '&:hover': {
                  backgroundColor: m === selectedMonth ? '#B22222' : '#f5f5f5',
                },
              }}
              onClick={() => handleMonthSelect(m)}
            >
              {m}
            </Button>
          ))}
        </Box>
      </Box>


      {/* Employee Table */}
      {selectedMonth && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>
                    <b>Name</b>
                  </TableCell>
                  <TableCell>
                    <b>Employee Number</b>
                  </TableCell>
                  <TableCell>
                    <b>Payslip</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayroll.length > 0 ? (
                  filteredPayroll.map((emp) => {
                    const hasPayslip = !!emp.startDate;
                    return (
                      <TableRow key={emp.employeeNumber}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedEmployees.includes(
                              emp.employeeNumber
                            )}
                            onChange={() => handleSelectOne(emp.employeeNumber)}
                          />
                        </TableCell>
                        <TableCell>{emp.name}</TableCell>
                        <TableCell>{emp.employeeNumber}</TableCell>
                        <TableCell>
                          {hasPayslip ? (
                            <Typography color="green">✓ Available</Typography>
                          ) : (
                            <Typography color="red">✗ No Data</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No employee data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}


      {/* Bulk Send Button */}
      {/* Bulk Send Button */}
      {selectedMonth && filteredPayroll.length > 0 && (
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button
            variant="contained"
            onClick={sendSelectedPayslips}
            disabled={sending || selectedEmployees.length === 0}
            sx={{
              backgroundColor: '#6d2323',
              '&:hover': { backgroundColor: '#982f2fff' },
              px: 4,
              py: 1.5,
              fontSize: '1rem',
            }}
          >
            Distribute Monthly Payslips
          </Button>
        </Box>
      )}


      {sending && (
        <LoadingOverlay
          open={sending}
          message={loadingMessage || 'Processing...'}
        />
      )}
      {successOverlay.open && (
        <SuccessfulOverlay
          open={successOverlay.open}
          action={successOverlay.action}
          onClose={() => setSuccessOverlay({ open: false, action: '' })}
        />
      )}


      {/* Hidden Payslip Renderer - Updated with new layout */}
      {displayEmployee && (
        <Paper
          ref={payslipRef}
          elevation={4}
          sx={{
            p: 3,
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            mt: 2,
            border: '2px solid black',
            borderRadius: 1,
            backgroundColor: '#fff',
            fontFamily: 'Arial, sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* Watermark */}
          <Box
            component="img"
            src={hrisLogo}
            alt="Watermark"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.07,
              width: '100%',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />


          {/* Header - Updated with gradient background and dual logos */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
            sx={{
              background: 'linear-gradient(to right, #6d2323, #a31d1d)',
              borderRadius: '2px',
              p: 1,
            }}
          >
            {/* Left Logo */}
            <Box>
              <img
                src={logo}
                alt="Logo"
                style={{ width: '60px', marginLeft: '10px' }}
              />
            </Box>


            {/* Center Text */}
            <Box textAlign="center" flex={1} sx={{ color: 'white' }}>
              <Typography variant="subtitle2" sx={{ fontStyle: 'italic' }}>
                Republic of the Philippines
              </Typography>
              <Typography
                variant="subtitle5"
                fontWeight="bold"
                sx={{ ml: '25px' }}
              >
                EULOGIO "AMANG" RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY
              </Typography>
              <Typography variant="body2">Nagtahan, Sampaloc Manila</Typography>
            </Box>


            {/* Right Logo */}
            <Box>
              <img src={hrisLogo} alt="HRIS Logo" style={{ width: '80px' }} />
            </Box>
          </Box>


          {/* Rows */}
          <Box sx={{ border: '2px solid black', borderBottom: '0px' }}>
            {/* Row template */}
            {[
              {
                label: 'PERIOD:',
                value: (
                  <span style={{ fontWeight: 'bold' }}>
                    {(() => {
                      if (
                        !displayEmployee.startDate ||
                        !displayEmployee.endDate
                      )
                        return '—';
                      const start = new Date(displayEmployee.startDate);
                      const end = new Date(displayEmployee.endDate);
                      const month = start
                        .toLocaleString('en-US', { month: 'long' })
                        .toUpperCase();
                      return `${month} ${start.getDate()}-${end.getDate()} ${end.getFullYear()}`;
                    })()}
                  </span>
                ),
              },
              {
                label: 'EMPLOYEE NUMBER:',
                value: (
                  <Typography sx={{ color: 'red', fontWeight: 'bold' }}>
                    {displayEmployee.employeeNumber
                      ? `${parseFloat(displayEmployee.employeeNumber)}`
                      : ''}
                  </Typography>
                ),
              },
              {
                label: 'NAME:',
                value: (
                  <Typography sx={{ color: 'red', fontWeight: 'bold' }}>
                    {displayEmployee.name ? `${displayEmployee.name}` : ''}
                  </Typography>
                ),
              },
              {
                label: 'GROSS SALARY:',
                value: displayEmployee.grossSalary
                  ? `₱${parseFloat(
                      displayEmployee.grossSalary
                    ).toLocaleString()}`
                  : '',
              },
              {
                label: 'ABS:',
                value: displayEmployee.abs
                  ? `₱${parseFloat(displayEmployee.abs).toLocaleString()}`
                  : '',
              },
              {
                label: 'WITHHOLDING TAX:',
                value: displayEmployee.withholdingTax
                  ? `₱${parseFloat(
                      displayEmployee.withholdingTax
                    ).toLocaleString()}`
                  : '',
              },
              {
                label: 'L.RET:',
                value: displayEmployee.personalLifeRetIns
                  ? `₱${parseFloat(
                      displayEmployee.personalLifeRetIns
                    ).toLocaleString()}`
                  : '',
              },
              {
                label: 'GSIS SALARY LOAN:',
                value: displayEmployee.gsisSalaryLoan
                  ? `₱${parseFloat(
                      displayEmployee.gsisSalaryLoan
                    ).toLocaleString()}`
                  : '',
              },
              {
                label: 'POLICY:',
                value: displayEmployee.gsisPolicyLoan
                  ? `₱${parseFloat(
                      displayEmployee.gsisPolicyLoan
                    ).toLocaleString()}`
                  : '',
              },
              {
                label: 'HOUSING LOAN:',
                value: displayEmployee.gsisSalaryLoan
                  ? `₱${parseFloat(
                      displayEmployee.gsisSalaryLoan || 0
                    ).toLocaleString()}`
                  : '',
              },
              {
                label: 'GSIS ARREARS:',
                value: displayEmployee.gsisArrears
                  ? `₱${parseFloat(
                      displayEmployee.gsisArrears
                    ).toLocaleString()}`
                  : '',
              },
              {
                label: 'GFAL:',
                value: '',
              },
              {
                label: 'CPL:',
                value: displayEmployee.cpl
                  ? `₱${parseFloat(displayEmployee.cpl).toLocaleString()}`
                  : '',
              },
              {
                label: 'MPL:',
                value: displayEmployee.mpl
                  ? `₱${parseFloat(displayEmployee.mpl).toLocaleString()}`
                  : '',
              },
              {
                label: 'MPL LITE:',
                value: displayEmployee.mplLite
                  ? `₱${parseFloat(displayEmployee.mplLite).toLocaleString()}`
                  : '',
              },
              {
                label: 'ELA:',
                value: '',
              },
              {
                label: 'PAG-IBIG:',
                value: displayEmployee.pagibigFundCont
                  ? `₱${parseFloat(
                      displayEmployee.pagibigFundCont
                    ).toLocaleString()}`
                  : '',
              },
              {
                label: 'MPL:',
                value: displayEmployee.mpl
                  ? `₱${parseFloat(displayEmployee.mpl).toLocaleString()}`
                  : '',
              },
              {
                label: 'PHILHEALTH:',
                value: displayEmployee.PhilHealthContribution
                  ? `₱${parseFloat(
                      displayEmployee.PhilHealthContribution
                    ).toLocaleString()}`
                  : '',
              },
              {
                label: "PHILHEALTH (DIFF'L):",
                value: '',
              },
              {
                label: 'PAG-IBIG 2:',
                value: displayEmployee.PhilHealthContribution
                  ? `₱${parseFloat(
                      displayEmployee.PhilHealthContribution
                    ).toLocaleString()}`
                  : '',
              },
              {
                label: 'LBP LOAN:',
                value: '',
              },
              {
                label: 'MTSLAI:',
                value: '',
              },
              {
                label: 'ECC:',
                value: '',
              },
              {
                label: 'TO BE REFUNDED:',
                value: '',
              },
              {
                label: 'FEU:',
                value: displayEmployee.feu
                  ? `₱${parseFloat(displayEmployee.feu).toLocaleString()}`
                  : '',
              },
              {
                label: 'ESLAI:',
                value: '',
              },
              {
                label: 'TOTAL DEDUCTIONS:',
                value: displayEmployee.totalDeductions
                  ? `₱${parseFloat(
                      displayEmployee.totalDeductions
                    ).toLocaleString()}`
                  : '',
              },
              {
                label: 'NET SALARY:',
                value: displayEmployee.netSalary
                  ? `₱${parseFloat(displayEmployee.netSalary).toLocaleString()}`
                  : '',
              },
              {
                label: '1ST QUINCENA:',
                value: displayEmployee.pay1st
                  ? `₱${parseFloat(displayEmployee.pay1st).toLocaleString()}`
                  : '',
              },
              {
                label: '2ND QUINCENA:',
                value: displayEmployee.pay2nd
                  ? `₱${parseFloat(displayEmployee.pay2nd).toLocaleString()}`
                  : '',
              },
            ].map((row, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  borderBottom: '1px solid black',
                }}
              >
                {/* Left column (label) */}
                <Box sx={{ p: 1, width: '25%' }}>
                  <Typography fontWeight="bold">{row.label}</Typography>
                </Box>


                {/* Right column (value with left border) */}
                <Box
                  sx={{
                    flex: 1,
                    p: 1,
                    borderLeft: '1px solid black',
                  }}
                >
                  <Typography>{row.value}</Typography>
                </Box>
              </Box>
            ))}
          </Box>


          {/* Footer */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={2}
            sx={{ fontSize: '0.85rem' }}
          >
            <Typography>Certified Correct:</Typography>
            <Typography>plus PERA — 2,000.00</Typography>
          </Box>


          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={2}
          >
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
              GIOVANNI L. AHUNIN
            </Typography>
          </Box>
          <Typography>Director, Administrative Services</Typography>
        </Paper>
      )}


      {/* Modal */}
      <Dialog
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
      >
        <DialogTitle>
          {/* ✅ Custom success overlay */}
          <SuccessfulOverlay
            open={modal.open && modal.type === 'success'}
            action={modal.action}
            onClose={() => setModal({ ...modal, open: false })}
          />


          {/* ❌ Error fallback */}
          {modal.type === 'error' && (
            <div style={{ color: 'red', fontWeight: 'bold' }}>❌ Error</div>
          )}
        </DialogTitle>


        <DialogContent>
          <Typography>{modal.message}</Typography>
        </DialogContent>


        <DialogActions>
          <Button onClick={() => setModal({ ...modal, open: false })} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
});


export default PayslipDistribution;





