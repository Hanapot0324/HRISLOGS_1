import API_BASE_URL from '../../apiConfig';
import React, { useRef, forwardRef, useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import Search from '@mui/icons-material/Search';


import WorkIcon from '@mui/icons-material/Work';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import logo from '../../assets/logo.png';
import hrisLogo from '../../assets/hrisLogo.png';
import SuccessfulOverlay from '../SuccessfulOverlay';


const PayslipOverall = forwardRef(({ employee }, ref) => {
  const payslipRef = ref || useRef();


  const [allPayroll, setAllPayroll] = useState([]);
  const [displayEmployee, setDisplayEmployee] = useState(employee || null);
  const [loading, setLoading] = useState(!employee);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState({
    open: false,
    type: '', // "success" or "error"
    action: '', // "create", "edit", "delete", "send"
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


  const [search, setSearch] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [filteredPayroll, setFilteredPayroll] = useState([]);
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


  // Fetch payroll data
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


  const downloadPDF = async () => {
    if (!displayEmployee) return;


    // 1. Identify current month/year from displayEmployee
    const currentStart = new Date(displayEmployee.startDate);
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
          p.employeeNumber === displayEmployee.employeeNumber &&
          new Date(p.startDate).getMonth() === month &&
          new Date(p.startDate).getFullYear() === year
      );
      return { payroll, label };
    });


    // 4. PDF setup
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
        // ✅ Normal payslip
        setDisplayEmployee(payroll);
        await new Promise((resolve) => setTimeout(resolve, 300)); // wait DOM update


        const input = payslipRef.current;
        const canvas = await html2canvas(input, { scale: 2, useCORS: true });
        imgData = canvas.toDataURL('image/png');
      } else {
        // ❌ Missing → create "No Data" placeholder
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


    // 6. Save file
    pdf.save(`${displayEmployee.name || 'EARIST'}-Payslips-3Months.pdf`);


    setModal({
      open: true,
      type: 'success',
      action: 'download',
    });


    // Restore current employee in UI
    setDisplayEmployee(displayEmployee);
  };


  // Send Payslip via Gmail
  const sendPayslipViaGmail = async () => {
    if (!displayEmployee) return;


    setSending(true);
    try {
      // 1. Identify current month/year
      const currentStart = new Date(displayEmployee.startDate);
      const currentMonth = currentStart.getMonth();
      const currentYear = currentStart.getFullYear();


      // 2. Collect last 3 months (current + 2 previous)
      const monthsToGet = [0, 1, 2].map((i) => {
        const d = new Date(currentYear, currentMonth - i, 1);
        return {
          month: d.getMonth(),
          year: d.getFullYear(),
          label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        };
      });


      // 3. Find records
      const records = monthsToGet.map(({ month, year, label }) => {
        const payroll = allPayroll.find(
          (p) =>
            p.employeeNumber === displayEmployee.employeeNumber &&
            new Date(p.startDate).getMonth() === month &&
            new Date(p.startDate).getFullYear() === year
        );
        return { payroll, label };
      });


      // 4. PDF setup
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


      // 5. Render each slot (same as downloadPDF)
      for (let i = 0; i < records.length; i++) {
        const { payroll, label } = records[i];
        let imgData;


        if (payroll) {
          setDisplayEmployee(payroll);
          await new Promise((resolve) => setTimeout(resolve, 300));
          const input = payslipRef.current;
          const canvas = await html2canvas(input, { scale: 2, useCORS: true });
          imgData = canvas.toDataURL('image/png');
        } else {
          // No Data placeholder
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


        pdf.addImage(
          imgData,
          'PNG',
          positions[i],
          yOffset,
          contentWidth,
          contentHeight
        );
      }


      // 6. Convert PDF to Blob
      const pdfBlob = pdf.output('blob');
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `${displayEmployee.name}_payslip.pdf`);
      formData.append('name', displayEmployee.name);
      formData.append('employeeNumber', displayEmployee.employeeNumber);


      // 7. Send to backend
      const res = await axios.post(
        `${API_BASE_URL}/SendPayslipRoute/send-payslip`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );


      if (res.data.success) {
        setModal({
          open: true,
          type: 'success',
          action: 'gmail',
        });
      } else {
        setModal({
          open: true,
          type: 'error',
          message: res.data.error || 'Failed to send payslip.',
        });
      }
    } catch (err) {
      console.error('Error sending payslip:', err);
      setModal({
        open: true,
        type: 'error',
        message: 'An error occurred while sending the payslip.',
      });
    } finally {
      // ✅ restore current employee
      setDisplayEmployee(displayEmployee);
      setSending(false);
    }
  };


  // For Search
  const handleSearch = () => {
    if (!search.trim()) return;


    const result = allPayroll.filter(
      (emp) =>
        emp.employeeNumber.toString().includes(search.trim()) ||
        emp.name.toLowerCase().includes(search.trim().toLowerCase())
    );


    if (result.length > 0) {
      setFilteredPayroll(result);
      setDisplayEmployee(null); // ❌ don’t auto-display
      setSelectedMonth(''); // reset month filter
      setHasSearched(true);
    } else {
      setFilteredPayroll([]);
      setDisplayEmployee(null);
      setSelectedMonth('');
      setHasSearched(true);
    }
  };


  // For Clear / Reset
  const clearSearch = () => {
    setSearch('');
    setHasSearched(false);
    setSelectedMonth('');
    setFilteredPayroll([]);
    if (employee) {
      setDisplayEmployee(employee);
    } else {
      setDisplayEmployee(null);
    }
  };


  // 📅 Month filter
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    const monthIndex = months.indexOf(month);


    const result = filteredPayroll.filter((emp) => {
      if (!emp.startDate) return false;
      const empMonth = new Date(emp.startDate).getMonth();
      return empMonth === monthIndex;
    });


    setDisplayEmployee(result.length > 0 ? result[0] : null);
  };


  return (
    <Container maxWidth="10%">
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
              Payslip Records
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              Generate and manage all employee payslip records
            </Typography>
          </Box>
        </Box>
      </Paper>


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
        {/* Search Bar */}
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search by Employee # or Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#6D2323', marginRight: 1 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: 'white',
              borderRadius: 1,
              flex: 1,
            }}
          />
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={!search.trim()}
              sx={{
                backgroundColor: '#6D2323',
                '&:hover': { backgroundColor: '#B22222' },
                '&:disabled': { backgroundColor: '#ccc' },
              }}
            >
              Search Employee
            </Button>
            <Button
              variant="outlined"
              onClick={clearSearch}
              sx={{
                borderColor: '#6D2323',
                color: '#6D2323',
                '&:hover': {
                  borderColor: '#B22222',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              Clear
            </Button>
          </Box>
        </Box>


        {/* Month Filter */}
        <Typography
          variant="subtitle2"
          color={hasSearched ? 'textSecondary' : 'textDisabled'}
        >
          Filter By Month {!hasSearched && '(Search for an employee first)'}
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {months.map((m) => (
            <Button
              key={m}
              variant={m === selectedMonth ? 'contained' : 'outlined'}
              size="small"
              disabled={!hasSearched}
              sx={{
                backgroundColor: m === selectedMonth ? '#6D2323' : '#fff',
                color:
                  m === selectedMonth
                    ? '#fff'
                    : hasSearched
                    ? '#6D2323'
                    : '#ccc',
                borderColor: hasSearched ? '#6D2323' : '#ccc',
                '&:hover': {
                  backgroundColor: hasSearched
                    ? m === selectedMonth
                      ? '#B22222'
                      : '#f5f5f5'
                    : '#fff',
                },
                '&:disabled': {
                  backgroundColor: '#f5f5f5',
                  color: '#ccc',
                  borderColor: '#ccc',
                },
              }}
              onClick={() => handleMonthSelect(m)}
            >
              {m}
            </Button>
          ))}
        </Box>
      </Box>


      {/* Payslip Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={10}>
          <CircularProgress sx={{ color: '#6D2323' }} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : displayEmployee ? (
        <Paper
          ref={payslipRef}
          elevation={4}
          sx={{
            p: 3,
            mt: 2,
            border: '2px solid black',
            borderRadius: 1,
            backgroundColor: '#fff',
            fontFamily: 'Arial, sans-serif',
            position: 'relative', // ✅ important for watermark positioning
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            src={hrisLogo}
            alt="Watermark"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.07, // ✅ makes it faint like a watermark
              width: '100%', // adjust size as needed
              pointerEvents: 'none', // ✅ so it doesn’t block clicks/selections
              userSelect: 'none',
            }}
          />
          {/* Header */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
            sx={{
              background: 'linear-gradient(to right, #6d2323, #a31d1d)',
              borderRadius: '2px',
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
                EULOGIO “AMANG” RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY
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
                value: displayEmployee.pay1st
                  ? `₱${parseFloat(displayEmployee.pay2nd).toLocaleString()}`
                  : '',
              },
            ].map((row, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  borderBottom: '1px solid black', // ✅ always show border
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
            <Typography>plus PERA – 2,000.00</Typography>
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
      ) : selectedMonth ? (
        <Alert
          severity="info"
          sx={{
            mt: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.8)', // lighter bg
            border: '1px solid #6d2323',
            color: '#6d2323',
            '& .MuiAlert-icon': { color: '#6D2323' }, // icon same color
          }}
        >
          There's no payslip saved for the month of <b>{selectedMonth}.</b>
        </Alert>
      ) : hasSearched ? (
        <Alert
          severity="info"
          sx={{
            mt: 3,
            backgroundColor: 'rgba(109, 35, 35, 0.1)', // lighter bg
            color: '#6D2323',
            '& .MuiAlert-icon': { color: '#6D2323' }, // icon same color
          }}
        >
          Please select a month to view your payslip.
        </Alert>
      ) : null}


      {/* Download Button */}
      {/* Action Buttons */}
      {displayEmployee && (
        <Box display="flex" justifyContent="center" mt={2} gap={2} mb={3}>
          <Button
            variant="contained"
            onClick={downloadPDF}
            sx={{
              backgroundColor: '#6D2323',
              '&:hover': { backgroundColor: '#B22222' },
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
            }}
          >
            Download Payslip | PDF
          </Button>


          <Button
            variant="contained"
            onClick={sendPayslipViaGmail}
            disabled={sending}
            sx={{
              backgroundColor: '#000000',
              '&:hover': { backgroundColor: '#2f2f2f' },
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
            }}
          >
            {sending ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Send via Gmail'
            )}
          </Button>
        </Box>
      )}
      <Dialog
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
      >
        <SuccessfulOverlay
          open={modal.open && modal.type === 'success'}
          action={modal.action}
          onClose={() => setModal({ ...modal, open: false })}
        />


        {modal.type === 'error' && (
          <div style={{ color: 'red', padding: '20px' }}>
            {modal.message || 'An error occurred'}
          </div>
        )}
      </Dialog>
    </Container>
  );
});


export default PayslipOverall;



