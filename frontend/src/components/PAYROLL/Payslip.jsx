import { jwtDecode } from "jwt-decode";
import React, { useRef, forwardRef, useState, useEffect } from "react";
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
  InputAdornment
} from "@mui/material";
import Search from "@mui/icons-material/Search";
import LoadingOverlay from "../LoadingOverlay";

import WorkIcon from "@mui/icons-material/Work";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import logo from "../../assets/logo.png";

const Payslip = forwardRef(({ employee }, ref) => {
  const payslipRef = ref || useRef();

  const [allPayroll, setAllPayroll] = useState([]);
  const [displayEmployee, setDisplayEmployee] = useState(employee || null);
  const [loading, setLoading] = useState(!employee);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState({ open: false, type: "success", message: "" });

  const [search, setSearch] = useState("");                // search input
  const [hasSearched, setHasSearched] = useState(false);  // flag if search was done
  const [selectedMonth, setSelectedMonth] = useState(""); // which month is selected
  const [filteredPayroll, setFilteredPayroll] = useState([]); // search r
  const [personID, setPersonID] = useState('');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    useEffect(() => {
      // Retrieve and decode the token from local storage
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setPersonID(decoded.employeeNumber); // Set the employeeNumber in state
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }
    }, []);


 useEffect(() => {
  if (!employee) {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/finalized-payroll");
        setAllPayroll(res.data); // ✅ just store everything
        setDisplayEmployee(null); // ✅ don’t auto-display until month is chosen
        setLoading(false);
      } catch (err) {
        console.error("Error fetching payroll:", err);
        setError("Failed to fetch payroll data. Please try again.");
        setLoading(false);
      }
    };

    if (personID) fetchData();
  }
}, [employee, personID]);




  
  // Download PDF
const downloadPDF = async () => {
  try {
    setLoading(true); // 🔥 show loading
    const input = payslipRef.current;
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${displayEmployee?.name || "EARIST"}-Payslip.pdf`);
  } catch (err) {
    console.error("Error generating PDF:", err);
    setModal({
      open: true,
      type: "error",
      message: "An error occurred while downloading the PDF.",
    });
  } finally {
    setLoading(false); 
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
    setDisplayEmployee(result[0]);   // ✅ show first search match
    setHasSearched(true);
  } else {
  setFilteredPayroll([]);
  setDisplayEmployee(null);   // clear display
  setSelectedMonth("");       // ✅ reset month filter
  setHasSearched(true);
}
};


// For Clear / Reset
const clearSearch = () => {
  setSearch("");
  setHasSearched(false);
  setSelectedMonth("");
  setFilteredPayroll([]);

  if (employee) {
    setDisplayEmployee(employee);
  } else if (allPayroll.length > 0) {
    setDisplayEmployee(allPayroll[0]);
  } else {
    setDisplayEmployee(null);
  }
};


// Month filter
const handleMonthSelect = (month) => {
  setSelectedMonth(month);

  const monthIndex = months.indexOf(month);

  const result = allPayroll.filter((emp) => {
    if (!emp.startDate) return false;
    const empMonth = new Date(emp.startDate).getMonth();
    return emp.employeeNumber?.toString() === personID.toString() && empMonth === monthIndex;
  });

  setFilteredPayroll(result);
  setDisplayEmployee(result.length > 0 ? result[0] : null);
  setHasSearched(true);
};




  return (
    <Container maxWidth="10%">
                <LoadingOverlay open={loading } message="Please wait..." />

      {/* Header Bar */}
      <Paper
        elevation={6}
        sx={{
          backgroundColor: "rgb(109, 35, 35)",
          color: "#fff",
          p: 3,
          borderRadius: 3,
          borderEndEndRadius: "0",
          borderEndStartRadius: "0",
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <WorkIcon fontSize="large" />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Employee Payslip Record
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              View and download employee payslip
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
        backgroundColor: "white",
        border: "2px solid #6D2323",
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
        // placeholder="Search by Employee # or Name"
        m disabled value={personID}
        onChange={(e) => setSearch(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: "#6D2323", marginRight: 1 }} />
            </InputAdornment>
          ),
        }}
        sx={{
          backgroundColor: "white",
          borderRadius: 1,
          flex: 1,
        }}
      />
      
    </Box>

    {/* Month Filter */}
    <Typography
      variant="subtitle2"
      // color={hasSearched ? "textSecondary" : "textDisabled"}
    >
      Filter By Month 
      {/* {!hasSearched && "(Search for an employee first)"} */}
    </Typography>
    <Box display="flex" flexWrap="wrap" gap={1}>
      {months.map((m) => (
        <Button
          key={m}
          variant={m === selectedMonth ? "contained" : "outlined"}
          size="small"
          // disabled={!hasSearched}
          sx={{
            backgroundColor: m === selectedMonth ? "#6D2323" : "#fff",
            color:
              m === selectedMonth
                ? "#fff"
                : hasSearched
                ? "#6D2323"
                : "#6D2323",
            borderColor: hasSearched ? "#6D2323" : "#6D2323",
            "&:hover": {
              backgroundColor: hasSearched
                ? m === selectedMonth
                  ? "#B22222"
                  : "#f5f5f5"
                : "#fff",
            },
            "&:disabled": {
              backgroundColor: "#f5f5f5",
              color: "#ccc",
              borderColor: "#ccc",
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
          <CircularProgress sx={{ color: "#6D2323" }} />
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
            border: "2px solid black",
            borderRadius: 1,
            backgroundColor: "#fff",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* Header */}
          <Box display="flex" alignItems="center" mb={2}>
          {/* Logo on the left */}
          <Box>
            <img
              src={logo}
              alt="Logo"
              style={{ width: "70px", marginRight: "5px" }}
            />
          </Box>

          {/* Text on the right */}
          <Box textAlign="center" flex={1}>
            <Typography variant="subtitle2" sx={{ fontStyle: "italic" }}>
              Republic of the Philippines
            </Typography>
            <Typography variant="subtitle5" fontWeight="bold"  sx={{ ml: '25px' }} >
              EULOGIO “AMANG” RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY
            </Typography>
            <Typography variant="body2">Nagtahan, Sampaloc Manila</Typography>
          </Box>
        </Box>


          {/* Rows */}
          <Box sx={{ border: "2px solid black", borderBottom: '0px' }}>
            {/* Row template */}
            {[
              {
                label: "PERIOD:",
                value: (
                  <span style={{ fontWeight: "bold" }}>
                    {(() => {
                      if (!displayEmployee.startDate || !displayEmployee.endDate) return "—";
                      const start = new Date(displayEmployee.startDate);
                      const end = new Date(displayEmployee.endDate);
                      const month = start.toLocaleString("en-US", { month: "long" }).toUpperCase();
                      return `${month} ${start.getDate()}-${end.getDate()} ${end.getFullYear()}`;
                    })()}
                  </span>
                ),
              },
              {
                label: "EMPLOYEE NUMBER:",
                 value: (
                  <Typography sx={{ color: "red", fontWeight: "bold" }}>
                    {displayEmployee.employeeNumber
                      ? `${parseFloat(displayEmployee.employeeNumber)}`
                      : ""}
                  </Typography>
                ),
              },
              {
                label: "NAME:",
                 value: (
                  <Typography sx={{ color: "red", fontWeight: "bold" }}>
                    {displayEmployee.name
                      ? `${(displayEmployee.name)}`
                      : ""}
                  </Typography>
                ),
              },
              {
                label: "GROSS SALARY:",
                value: displayEmployee.grossSalary
                  ? `₱${parseFloat(displayEmployee.grossSalary).toLocaleString()}`
                  : "",
              },
              {
                label: "ABS:",
                value: displayEmployee.abs
                  ? `₱${parseFloat(displayEmployee.abs).toLocaleString()}`
                  : "",
              },
              {
                label: "WITHHOLDING TAX:",
                value: displayEmployee.withholdingTax
                  ? `₱${parseFloat(displayEmployee.withholdingTax).toLocaleString()}`
                  : "",
              },
              {
                label: "L.RET:",
                value: displayEmployee.personalLifeRetIns
                  ? `₱${parseFloat(displayEmployee.personalLifeRetIns).toLocaleString()}`
                  : "",
              },
              {
                label: "GSIS SALARY LOAN:",
                value: displayEmployee.gsisSalaryLoan
                  ? `₱${parseFloat(displayEmployee.gsisSalaryLoan).toLocaleString()}`
                  : "",
              },
              {
                label: "POLICY:",
                value: displayEmployee.gsisPolicyLoan
                  ? `₱${parseFloat(displayEmployee.gsisPolicyLoan).toLocaleString()}`
                  : "",
              },

              {
                label: "HOUSING LOAN:",
                value: displayEmployee.gsisSalaryLoan
                ? `₱${parseFloat(displayEmployee.gsisSalaryLoan || 0).toLocaleString()}`
                : "", 
              },
              {
                label: "GSIS ARREARS:",
                value: displayEmployee.gsisArrears
                    ? `₱${parseFloat(displayEmployee.gsisArrears).toLocaleString()}`
                    : "",              
               },
               {
                label: "GFAL:",
                value: '',           
               },
               {
                label: "CPL:",
                value: displayEmployee.cpl
                    ? `₱${parseFloat(displayEmployee.cpl).toLocaleString()}`
                    : "",              
               },
               {
                label: "MPL:",
                value: displayEmployee.mpl
                    ? `₱${parseFloat(displayEmployee.mpl).toLocaleString()}`
                    : "",              
               },
               {
                label: "MPL LITE:",
                value: displayEmployee.mplLite
                    ? `₱${parseFloat(displayEmployee.mplLite).toLocaleString()}`
                    : "",              
               },
               {
                label: "ELA:",
                value: "",              
               },
               {
                label: "PAG-IBIG:",
                value: displayEmployee.pagibigFundCont
                    ? `₱${parseFloat(displayEmployee.pagibigFundCont).toLocaleString()}`
                    : "",              
               },
               {
                label: "MPL:",
                value: displayEmployee.mpl
                    ? `₱${parseFloat(displayEmployee.mpl).toLocaleString()}`
                    : "",              
               },
               {
                label: "PHILHEALTH:",
                value: displayEmployee.PhilHealthContribution
                    ? `₱${parseFloat(displayEmployee.PhilHealthContribution).toLocaleString()}`
                    : "",              
               },
               {
                label: "PHILHEALTH (DIFF'L):",
                value: "",              
               },
               {
                label: "PAG-IBIG 2:",
                value: displayEmployee.PhilHealthContribution
                    ? `₱${parseFloat(displayEmployee.PhilHealthContribution).toLocaleString()}`
                    : "",              
               },
               {
                label: "LBP LOAN:",
                value: "",              
               },
               {
                label: "MTSLAI:",
                value: "",              
               },
               {
                label: "ECC:",
                value: "",              
               },
               {
                label: "TO BE REFUNDED:",
                value: "",              
               },
               {
                label: "FEU:",
                value: displayEmployee.feu
                    ? `₱${parseFloat(displayEmployee.feu).toLocaleString()}`
                    : "",              
               },
              {
                label: "ESLAI:",
                value: "",              
               },
               {
                label: "TOTAL DEDUCTIONS:",
                value: displayEmployee.totalDeductions
                    ? `₱${parseFloat(displayEmployee.totalDeductions).toLocaleString()}`
                    : "",              
               },
               {
                label: "NET SALARY:",
                value: displayEmployee.netSalary
                    ? `₱${parseFloat(displayEmployee.netSalary).toLocaleString()}`
                    : "",              
               },
              {
                label: "1ST QUINCENA:",
                value: displayEmployee.pay1st
                    ? `₱${parseFloat(displayEmployee.pay1st).toLocaleString()}`
                    : "",              
               },
               {
                label: "2ND QUINCENA:",
                value: displayEmployee.pay1st
                    ? `₱${parseFloat(displayEmployee.pay2nd).toLocaleString()}`
                    : "",              
               },
            ].map((row, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  borderBottom: "1px solid black", // ✅ always show border

                }}
              >
                {/* Left column (label) */}
                <Box sx={{ p: 1, width: "25%" }}>
                  <Typography fontWeight="bold">{row.label}</Typography>
                </Box>

                {/* Right column (value with left border) */}
                <Box
                  sx={{
                    flex: 1,
                    p: 1,
                    borderLeft: "1px solid black",
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
            sx={{ fontSize: "0.85rem" }}
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
            <Typography  sx={{ fontSize: "0.85rem", fontWeight:'bold' }}
            >GIOVANNI L. AHUNIN</Typography> 
          </Box>
          <Typography>Director, Administrative Services</Typography>
        </Paper>
          ) : selectedMonth ? (
            <Alert
              severity="info"
              sx={{
                mt: 3,
                backgroundColor: "rgba(255, 255, 255, 0.8)", // lighter bg
                border: '1px solid #6d2323',
                color: "#6d2323",
                "& .MuiAlert-icon": { color: "#6D2323" },   // icon same color
              }}
            >
              There's no payslip saved for the month of <b>{selectedMonth}</b>.
            </Alert>
          ) : (
            <Alert
              severity="info"
              sx={{
                mt: 3,
                backgroundColor: "rgba(109, 35, 35, 0.1)", // lighter bg
                color: "#6D2323",
                "& .MuiAlert-icon": { color: "#6D2323" },   // icon same color
              }}
            >
              Please select a month to view your payslip.
            </Alert>
      )}

      {/* Download Button */}
      {displayEmployee && (
        <Box display="flex" justifyContent="center" mt={2} gap={2} mb={3}>
        <Button
          variant="contained"
          onClick={downloadPDF}
          sx={{
            backgroundColor: "#6D2323",
            "&:hover": { backgroundColor: "#B22222" },
            px: 4,
            py: 1.5,
            fontSize: "1.1rem",
          }}
        >
          Download Payslip | PDF
        </Button>
      </Box>

      )}
     <Dialog
      open={modal.open}
      onClose={() => setModal({ ...modal, open: false })}
    >
      <DialogTitle>
        {modal.type === "success" ? " Success" : " Error"}
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




export default Payslip;


