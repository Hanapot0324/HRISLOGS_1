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
  Paper,
  Typography,
  Container,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  TextField,
  InputAdornment,
  Button,
  Modal,
  Grid, // Added Grid import
  Checkbox,
} from '@mui/material';
import LoadingOverlay from '../LoadingOverlay';
import SuccessfulOverlay from '../SuccessfulOverlay';
import SearchIcon from '@mui/icons-material/Search';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExitToApp,
  Payment,
  BusinessCenter,
} from '@mui/icons-material';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import CircleIcon from '@mui/icons-material/Circle';

const PayrollProcess = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editRow, setEditRow] = useState(null); // Added missing state for editRow
  const [isPayrollProcessed, setIsPayrollProcessed] = useState(false);
  const [finalizedPayroll, setFinalizedPayroll] = useState([]);
  const [duplicateEmployeeNumbers, setDuplicateEmployeeNumbers] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const canSubmit = selectedRows.length > 0;

  // Test authentication function
  const testAuth = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/PayrollRoute/test-auth`,
        getAuthHeaders()
      );
      console.log('Auth test successful:', res.data);
    } catch (error) {
      console.error('Auth test failed:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    const fetchFinalizedPayroll = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/PayrollRoute/finalized-payroll`,
          getAuthHeaders()
        );
        setFinalizedPayroll(res.data);
      } catch (err) {
        console.error('Error fetching finalized payroll data:', err);
      }
    };

    fetchFinalizedPayroll();
  }, []);

  const isAlreadyFinalized = filteredData.some((fd) =>
    finalizedPayroll.some(
      (fp) =>
        fp.employeeNumber === fd.employeeNumber &&
        fp.startDate === fd.startDate &&
        fp.endDate === fd.endDate
    )
  );

  const fetchPayrollData = async (searchTerm = '') => {
    try {
      setIsSearching(true);
      const url = searchTerm
        ? `${API_BASE_URL}/PayrollRoute/payroll/search?searchTerm=${searchTerm}`
        : `${API_BASE_URL}/PayrollRoute/payroll-with-remittance`;

      const res = await axios.get(url, getAuthHeaders());
      console.log(res.data);

      // ✅ Track duplicates
      const seen = new Set();
      const duplicates = new Set();

      res.data.forEach((item) => {
        if (seen.has(item.employeeNumber)) {
          duplicates.add(item.employeeNumber);
        } else {
          seen.add(item.employeeNumber);
        }
      });

      // ✅ Normalize data
      const allData = res.data.map((item) => ({
        ...item,
        status:
          item.status === 'Processed' || item.status === 1
            ? 'Processed'
            : 'Unprocessed',
      }));

      setDuplicateEmployeeNumbers([...duplicates]);
      setFilteredData(allData);
      setData(allData);

      // ✅ Check if all processed/unprocessed
      const allProcessed = allData.every(
        (item) => item.status === 'Processed' || item.status === 1
      );

      const allUnprocessed = allData.every(
        (item) => item.status === 'Unprocessed' || item.status === 0
      );

      setIsPayrollProcessed(allProcessed);
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      setError('An error occurred while fetching the payroll data.');
    } finally {
      setIsSearching(false);
    }
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

    // Test authentication first
    testAuth();

    fetchPayrollData();
    fetchDepartments();
  }, []);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleDepartmentChange = (event) => {
    const selectedDept = event.target.value;
    setSelectedDepartment(selectedDept);
    applyFilters(selectedDept, searchTerm);
  };

  // HANDLE SEARCH IN DEPARTMENT AND SEARCH BUTTON

  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // If search term is empty, immediately reload all data
    if (!term.trim()) {
      fetchPayrollData();
      return;
    }

    // Set a new timeout for debounced search (500ms delay)
    const newTimeout = setTimeout(() => {
      console.log('Performing debounced search for:', term);
      fetchPayrollData(term);
    }, 500); // 500ms delay - adjust this value if needed

    setSearchTimeout(newTimeout);
  };

  const applyFilters = (department, search) => {
    let filtered = [...data];

    // Only apply department filter (search is now handled by backend API)
    if (department && department !== '') {
      filtered = filtered.filter((record) => record.department === department);
    }

    setFilteredData(filtered);
  };

  const handleSubmitPayroll = async () => {
    setLoading(true);
    try {
      const updatedData = filteredData.map((item) => {
        const h = item.h || 0; // Default to 0 if h is not available
        const m = item.m || 0; // Default to 0 if m is not available

        const grossSalary = item.increment
          ? (parseFloat(item.rateNbc594) || 0) +
            (parseFloat(item.nbcDiffl597) || 0) +
            (parseFloat(item.increment) || 0)
          : (parseFloat(item.rateNbc594) || 0) +
            (parseFloat(item.nbcDiffl597) || 0);

        const abs =
          grossSalary * 0.0055555525544423 * h +
          grossSalary * 0.0000925948584897 * m;

        const PhilHealthContribution =
          Math.floor(((grossSalary * 0.05) / 2) * 100) / 100;

        const personalLifeRetIns = grossSalary * 0.09;

        const netSalary = grossSalary - abs;

        const totalGsisDeds =
          (parseFloat(personalLifeRetIns) || 0) +
          (parseFloat(item.gsisSalaryLoan) || 0) +
          (parseFloat(item.gsisPolicyLoan) || 0) +
          (parseFloat(item.gsisArrears) || 0) +
          (parseFloat(item.cpl) || 0) +
          (parseFloat(item.mpl) || 0) +
          (parseFloat(item.eal) || 0) +
          (parseFloat(item.mplLite) || 0) +
          (parseFloat(item.emergencyLoan) || 0);

        const totalPagibigDeds =
          (parseFloat(item.pagibigFundCont) || 0) +
          (parseFloat(item.pagibig2) || 0) +
          (parseFloat(item.multiPurpLoan) || 0);

        const totalOtherDeds =
          (parseFloat(item.liquidatingCash) || 0) +
          (parseFloat(item.landbankSalaryLoan) || 0) +
          (parseFloat(item.earistCreditCoop) || 0) +
          (parseFloat(item.feu) || 0);

        const totalDeductions =
          (parseFloat(item.withholdingTax) || 0) +
          (parseFloat(PhilHealthContribution) || 0) +
          (parseFloat(totalGsisDeds) || 0) +
          (parseFloat(totalPagibigDeds) || 0) +
          (parseFloat(totalOtherDeds) || 0);

        const pay1stCompute = netSalary - totalDeductions;
        const pay2ndCompute = (netSalary - totalDeductions) / 2;

        const pay1st = pay2ndCompute;
        const pay2nd =
          (parseFloat(pay1stCompute) || 0) -
          parseFloat((parseFloat(pay1st) || 0).toFixed(0));

        const rtIns = grossSalary * 0.12;

        return {
          ...item,
          totalGsisDeds: totalGsisDeds.toFixed(2),
          totalPagibigDeds: totalPagibigDeds.toFixed(2),
          totalOtherDeds: totalOtherDeds.toFixed(2),
          grossSalary,
          abs: abs.toFixed(2),
          netSalary: netSalary.toFixed(2),
          totalDeductions: totalDeductions.toFixed(2),
          PhilHealthContribution: PhilHealthContribution.toFixed(2),
          personalLifeRetIns: personalLifeRetIns.toFixed(2),
          pay1stCompute: pay1stCompute.toFixed(2),
          pay2ndCompute: pay2ndCompute.toFixed(2),
          pay1st: pay1st.toFixed(0),
          pay2nd: pay2nd.toFixed(2),
          rtIns: rtIns.toFixed(2),
          status: 'Processed',
        };
      });

      // Filter only selected AND not already finalized rows
      const rowsToSubmit = updatedData.filter(
        (item) =>
          selectedRows.includes(item.employeeNumber) &&
          !finalizedPayroll.some(
            (fp) =>
              fp.employeeNumber === item.employeeNumber &&
              fp.startDate === item.startDate &&
              fp.endDate === item.endDate
          )
      );

      // Ensure all required fields are present and have correct data types
      const processedRowsToSubmit = rowsToSubmit.map((item) => ({
        ...item,
        // Ensure numeric fields are properly formatted
        grossSalary: parseFloat(item.grossSalary) || 0,
        abs: parseFloat(item.abs) || 0,
        h: parseInt(item.h) || 0,
        m: parseInt(item.m) || 0,
        s: parseInt(item.s) || 0,
        netSalary: parseFloat(item.netSalary) || 0,
        withholdingTax: parseFloat(item.withholdingTax) || 0,
        personalLifeRetIns: parseFloat(item.personalLifeRetIns) || 0,
        totalGsisDeds: parseFloat(item.totalGsisDeds) || 0,
        totalPagibigDeds: parseFloat(item.totalPagibigDeds) || 0,
        totalOtherDeds: parseFloat(item.totalOtherDeds) || 0,
        totalDeductions: parseFloat(item.totalDeductions) || 0,
        pay1st: parseFloat(item.pay1st) || 0,
        pay2nd: parseFloat(item.pay2nd) || 0,
        pay1stCompute: parseFloat(item.pay1stCompute) || 0,
        pay2ndCompute: parseFloat(item.pay2ndCompute) || 0,
        rtIns: parseFloat(item.rtIns) || 0,
        ec: parseFloat(item.ec) || 0,
        // Ensure all other numeric fields are properly formatted
        rateNbc584: parseFloat(item.rateNbc584) || 0,
        nbc594: parseFloat(item.nbc594) || 0,
        rateNbc594: parseFloat(item.rateNbc594) || 0,
        nbcDiffl597: parseFloat(item.nbcDiffl597) || 0,
        increment: parseFloat(item.increment) || 0,
        gsisSalaryLoan: parseFloat(item.gsisSalaryLoan) || 0,
        gsisPolicyLoan: parseFloat(item.gsisPolicyLoan) || 0,
        gsisArrears: parseFloat(item.gsisArrears) || 0,
        cpl: parseFloat(item.cpl) || 0,
        mpl: parseFloat(item.mpl) || 0,
        eal: parseFloat(item.eal) || 0,
        mplLite: parseFloat(item.mplLite) || 0,
        emergencyLoan: parseFloat(item.emergencyLoan) || 0,
        pagibigFundCont: parseFloat(item.pagibigFundCont) || 0,
        pagibig2: parseFloat(item.pagibig2) || 0,
        multiPurpLoan: parseFloat(item.multiPurpLoan) || 0,
        liquidatingCash: parseFloat(item.liquidatingCash) || 0,
        landbankSalaryLoan: parseFloat(item.landbankSalaryLoan) || 0,
        earistCreditCoop: parseFloat(item.earistCreditCoop) || 0,
        feu: parseFloat(item.feu) || 0,
        PhilHealthContribution: parseFloat(item.PhilHealthContribution) || 0,
      }));

      console.log('Submitting payroll data:', processedRowsToSubmit);

      // Check if we have any data to submit
      if (processedRowsToSubmit.length === 0) {
        setLoading(false);
        alert('No payroll records selected for submission.');
        return;
      }

      //  Update main payroll database (payroll-with-remittance)
      const updateErrors = [];
      for (const item of processedRowsToSubmit) {
        try {
          await axios.put(
            `${API_BASE_URL}/PayrollRoute/payroll-with-remittance/${item.employeeNumber}`,
            item,
            getAuthHeaders()
          );
        } catch (error) {
          console.error(`Error updating payroll for ${item.employeeNumber}:`, error);
          updateErrors.push(`${item.employeeNumber}: ${error.response?.data?.error || error.message}`);
        }
      }

      if (updateErrors.length > 0) {
        console.warn('Some payroll updates failed:', updateErrors);
        // Continue with finalized payroll submission even if some updates failed
      }

      //  Update finalized payroll database (finalized-payroll)
      console.log('Submitting to finalized payroll with audit logging...');
      const finalizedResponse = await axios.post(
        `${API_BASE_URL}/PayrollRoute/finalized-payroll`,
        processedRowsToSubmit,
        getAuthHeaders()
      );
      console.log('Finalized payroll response:', finalizedResponse.data);

      //  Update UI state with new data
      const updatedFilteredData = filteredData.map((row) => {
        const match = processedRowsToSubmit.find(
          (item) => item.employeeNumber === row.employeeNumber
        );
        return match ? { ...row, status: 'Processed' } : row;
      });

      setFilteredData(updatedFilteredData);
      setData(updatedFilteredData);
      setIsPayrollProcessed(true);
      
      // Show loading for 2-3 seconds, then success overlay
      setTimeout(() => {
        setLoading(false);
        setSuccessAction('submit');
        setSuccessOpen(true);
        setTimeout(() => setSuccessOpen(false), 2500);
      }, 2500);

      // Refresh finalizedPayroll from backend
      const res = await axios.get(
        `${API_BASE_URL}/PayrollRoute/finalized-payroll`,
        getAuthHeaders()
      );
      setFinalizedPayroll(res.data);
    } catch (error) {
      console.error('Error submitting payroll:', error);
      setLoading(false);
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred while submitting payroll data.';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDelete = async (rowId, employeeNumber) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/PayrollRoute/payroll-with-remittance/${rowId}/${employeeNumber}`,
        getAuthHeaders()
      );
      const newData = filteredData.filter((item) => item.id !== rowId);
      setFilteredData(newData);

      // Recalculate duplicates
      const seen = {};
      const updatedDuplicates = new Set();

      newData.forEach((item) => {
        if (seen[item.employeeNumber]) {
          updatedDuplicates.add(item.employeeNumber);
        } else {
          seen[item.employeeNumber] = true;
        }
      });

      setDuplicateEmployeeNumbers([...updatedDuplicates]);
    } catch (error) {
      console.error('Error deleting payroll data:', error);
    }
  };

  // Handle modal open and close

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setEditRow((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    setOpenModal(false);
    setEditRow(null); // Clear the modal data on cancel
  };

  const handleEdit = (rowId) => {
    const row = computedRows.find((item) => item.id === rowId);
    setEditRow(row);
    setOpenModal(true);
  };

  // THIS IS FOR THE MODAL AND IT RECALCULATES THE VALUE DATA
  const handleSave = async () => {
    setLoading(true);
    try {
      const h = editRow.h || 0;
      const m = editRow.m || 0;

      const grossSalary = editRow.increment
        ? (parseFloat(editRow.rateNbc594) || 0) +
          (parseFloat(editRow.nbcDiffl597) || 0) +
          (parseFloat(editRow.increment) || 0)
        : (parseFloat(editRow.rateNbc594) || 0) +
          (parseFloat(editRow.nbcDiffl597) || 0);

      const abs =
        grossSalary * 0.0055555525544423 * h +
        grossSalary * 0.0000925948584897 * m;
      const PhilHealthContribution =
        Math.floor(((grossSalary * 0.05) / 2) * 100) / 100;
      const personalLifeRetIns = grossSalary * 0.09;
      const netSalary = grossSalary - abs;

      const totalGsisDeds =
        (parseFloat(personalLifeRetIns) || 0) +
        (parseFloat(editRow.gsisSalaryLoan) || 0) +
        (parseFloat(editRow.gsisPolicyLoan) || 0) +
        (parseFloat(editRow.gsisArrears) || 0) +
        (parseFloat(editRow.cpl) || 0) +
        (parseFloat(editRow.mpl) || 0) +
        (parseFloat(editRow.eal) || 0) +
        (parseFloat(editRow.mplLite) || 0) +
        (parseFloat(editRow.emergencyLoan) || 0);

      const totalPagibigDeds =
        (parseFloat(editRow.pagibigFundCont) || 0) +
        (parseFloat(editRow.pagibig2) || 0) +
        (parseFloat(editRow.multiPurpLoan) || 0);

      const totalOtherDeds =
        (parseFloat(editRow.liquidatingCash) || 0) +
        (parseFloat(editRow.landbankSalaryLoan) || 0) +
        (parseFloat(editRow.earistCreditCoop) || 0) +
        (parseFloat(editRow.feu) || 0);

      const totalDeductions =
        (parseFloat(editRow.withholdingTax) || 0) +
        (parseFloat(PhilHealthContribution) || 0) +
        (parseFloat(totalGsisDeds) || 0) +
        (parseFloat(totalPagibigDeds) || 0) +
        (parseFloat(totalOtherDeds) || 0);

      const pay1stCompute = netSalary - totalDeductions;
      const pay2ndCompute = pay1stCompute / 2;

      const pay1st = pay2ndCompute;
      const pay2nd =
        pay1stCompute - parseFloat((parseFloat(pay1st) || 0).toFixed(0));

      const rtIns = grossSalary * 0.12;

      const updatedRow = {
        ...editRow,
        h,
        m,
        grossSalary,
        abs,
        PhilHealthContribution,
        personalLifeRetIns,
        netSalary,
        totalGsisDeds,
        totalPagibigDeds,
        totalOtherDeds,
        totalDeductions,
        pay1st,
        pay2nd,
        rtIns,
      };

      const response = await axios.put(
        `${API_BASE_URL}/PayrollRoute/payroll-with-remittance/${editRow.employeeNumber}`,
        updatedRow,
        getAuthHeaders()
      );

      console.log('Payroll record updated successfully:', response.data);
      setOpenModal(false);

      setFilteredData((prevData) =>
        prevData.map((item) =>
          item.employeeNumber === updatedRow.employeeNumber
            ? { ...item, ...updatedRow }
            : item
        )
      );

      // Show loading for 2-3 seconds, then success overlay
      setTimeout(() => {
        setLoading(false);
        setSuccessAction('edit');
        setSuccessOpen(true);
        setTimeout(() => setSuccessOpen(false), 2500);
      }, 2500);
    } catch (error) {
      console.error('Error updating payroll:', error);
      setLoading(false);
      setError('Failed to update payroll data.');
    }
  };

  const employeeFields = [
    'employeeNumber',
    'name',
    'position',
    'department',
    'startDate',
    'endDate',
  ];
  const salaryRateandAdjustments = [
    'rateNbc584',
    'nbc594',
    'rateNbc594',
    'nbcDiffl597',
    'increment',
  ];
  const SalaryComputation = ['abs', 'h', 'm'];
  const MandatoryDeductions = [
    'withholdingTax',
    'totalGsisDeds',
    'totalPagibigDeds',
    'PhilHealthContribution',
    'totalOtherDeds',
    'totalDeductions',
  ];
  const PayrollDisbursement = ['pay1st', 'pay2nd', 'ec'];

  const GsisDeductions = [
    'personalLifeRetIns',
    'gsisSalaryLoan',
    'gsisPolicyLoan',
    'gsisArrears',
    'mpl',
    'eal',
    'cpl',
    'mplLite',
    'emergencyLoan',
  ];

  const PagIbigDeductions = ['pagibigFundCont', 'multiPurpLoan', 'pagibig2'];

  const totalOtherDeductions = [
    'liquidatingCash',
    'earistCreditCoop',
    'feu',
    'landbankSalaryLoan',
  ];

  // COMPUTATION:

  const computedRows = filteredData.map((item) => {
    const h = item.h || 0; // Default to 0 if h is not available
    const m = item.m || 0; // Default to 0 if m is not availabl

    const grossSalary = item.increment
      ? (parseFloat(item.rateNbc594) || 0) +
        (parseFloat(item.nbcDiffl597) || 0) +
        (parseFloat(item.increment) || 0)
      : (parseFloat(item.rateNbc594) || 0) +
        (parseFloat(item.nbcDiffl597) || 0);

    const abs =
      grossSalary * 0.0055555525544423 * h +
      grossSalary * 0.0000925948584897 * m;
    const PhilHealthContribution =
      Math.floor(((grossSalary * 0.05) / 2) * 100) / 100;
    const personalLifeRetIns = grossSalary * 0.09;

    const netSalary = grossSalary - abs;

    const totalGsisDeds =
      (parseFloat(personalLifeRetIns) || 0) +
      (parseFloat(item.gsisSalaryLoan) || 0) +
      (parseFloat(item.gsisPolicyLoan) || 0) +
      (parseFloat(item.gsisArrears) || 0) +
      (parseFloat(item.cpl) || 0) +
      (parseFloat(item.mpl) || 0) +
      (parseFloat(item.eal) || 0) +
      (parseFloat(item.mplLite) || 0) +
      (parseFloat(item.emergencyLoan) || 0);

    const totalPagibigDeds =
      (parseFloat(item.pagibigFundCont) || 0) +
      (parseFloat(item.pagibig2) || 0) +
      (parseFloat(item.multiPurpLoan) || 0);

    const totalOtherDeds =
      (parseFloat(item.liquidatingCash) || 0) +
      (parseFloat(item.landbankSalaryLoan) || 0) +
      (parseFloat(item.earistCreditCoop) || 0) +
      (parseFloat(item.feu) || 0);

    const totalDeductions =
      (parseFloat(item.withholdingTax) || 0) +
      (parseFloat(PhilHealthContribution) || 0) +
      (parseFloat(totalGsisDeds) || 0) +
      (parseFloat(totalPagibigDeds) || 0) +
      (parseFloat(totalOtherDeds) || 0);

    const pay1stCompute = netSalary - totalDeductions;
    const pay2ndCompute = (netSalary - totalDeductions) / 2;

    const pay1st = pay2ndCompute;
    const pay2nd =
      (parseFloat(pay1stCompute) || 0) -
      parseFloat((parseFloat(pay1st) || 0).toFixed(0));

    const rtIns = grossSalary * 0.12;

    return {
      ...item,
      h,
      m,
      totalGsisDeds: totalGsisDeds.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalPagibigDeds: totalPagibigDeds.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalOtherDeds: totalOtherDeds.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      grossSalary: grossSalary.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      abs: abs.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      netSalary: netSalary.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalDeductions: totalDeductions.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      PhilHealthContribution: PhilHealthContribution.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      personalLifeRetIns: personalLifeRetIns.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      pay1stCompute: pay1stCompute.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      pay2ndCompute: pay2ndCompute.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      pay1st: pay1st.toLocaleString('en-US', {
        maximumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      pay2nd: pay2nd.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      rtIns: rtIns.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  });

  return (
    <Container maxWidth="xl" sx={{ mt: -18, mb: 4 }}>
      <Paper
        elevation={6}
        sx={{
          backgroundColor: '#6D2323',
          color: '#fff',
          p: 3,
          borderRadius: 3,
          borderEndEndRadius: '0',
          borderEndStartRadius: '0',
          marginTop: ' 12%',
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
              Payroll | Processing
            </Typography>
            <Typography
              variant="body2"
              color="rgba(255,255,255,0.7)"
              fontFamily="'Poppins', sans-serif"
            >
              Manage employee records and calculates accurately
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/*STATUS, SEARCH BAR TAS YUNG DEPARMENT*/}
      <Box
        sx={{
          backgroundColor: 'white',
          border: '2px solid #6D2323',
          p: 1,
          mt: 0,
        }}
      >
        <Box display="flex" alignItems="center" gap={0} sx={{ width: '100%' }}>
          {/* Stats Box */}
          <Box
            display="flex"
            alignItems="center"
            gap={6}
            sx={{
              p: 0,
              border: '1px solid #6d2323',
              borderRadius: 0,
              marginRight: '2px',
            }}
          >
            <Box display="flex" alignItems="flex-end" gap={2}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Typography
                  fontWeight="bold"
                  sx={{ color: '#6D2323', fontSize: '1.2rem' }}
                >
                  {filteredData.length}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  fontSize="13px"
                  sx={{ color: '#000000', marginLeft: '5px' }}
                >
                  EMPLOYEE'S
                </Typography>
              </Box>
              <PeopleIcon sx={{ color: 'black', fontSize: '2.5rem' }} />
            </Box>

            <Box display="flex" alignItems="flex-end" gap={2}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Typography
                  fontWeight="bold"
                  sx={{ color: 'green', fontSize: '1.2rem' }}
                >
                  {
                    filteredData.filter((emp) => emp.status === 'Processed')
                      .length
                  }
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  fontSize="13.6px"
                  sx={{ color: '#000000' }}
                >
                  PROCESSED
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ color: 'green', fontSize: '3rem' }} />
            </Box>

            <Box display="flex" alignItems="flex-end" gap={2}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Typography
                  fontWeight="bold"
                  sx={{ color: '#FFA500', fontSize: '1.2rem' }}
                >
                  {
                    filteredData.filter((emp) => emp.status !== 'Processed')
                      .length
                  }
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  fontSize="13.5px"
                  sx={{ color: '#000000' }}
                >
                  PENDING
                </Typography>
              </Box>
              <ReceiptIcon sx={{ color: '#FFA500', fontSize: '3rem' }} />
            </Box>
          </Box>

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
            placeholder={isSearching ? 'Searching...' : 'Search Name'}
            value={searchTerm}
            onChange={handleSearchChange}
            disabled={isSearching}
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
                  {isSearching ? (
                    <CircleIcon
                      sx={{
                        color: '#6d2323',
                        animation: 'pulse 1s infinite',
                        '@keyframes pulse': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                          '100%': { opacity: 1 },
                        },
                      }}
                    />
                  ) : (
                    <SearchIcon />
                  )}
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {duplicateEmployeeNumbers.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Duplicate employee number(s) found:{' '}
              {duplicateEmployeeNumbers.join(', ')}. These rows are highlighted
              in red.
            </Alert>
          )}
          <Box sx={{ width: '100%' }}>
            <Box
              display="flex"
              gap={3}
              alignItems="flex-start"
              minWidth="1300px"
            >
              <Paper
                elevation={4}
                sx={{
                  marginTop: '5px',
                  border: '3px solid #6d2323 ',
                  paddingTop: '2px',
                  width: 1060,
                }}
              >
                {' '}
                {/*TABLE HEADER */}
                <TableContainer
                  component={Box}
                  sx={{
                    minHeight: 100,
                    height: 350,
                    minWidth: 100,
                    width: 1060,
                    borderRadius: 1,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  <Table stickyHeader>
                    <TableHead sx={{ backgroundColor: '#be1010ff' }}>
                      <TableRow
                        sx={{
                          '& > th': {
                            borderBottom: '.20px solid #080808ff',
                            borderRight: '.20px solid #080808ff',
                            backgroundColor: '#ffffff',

                            fontWeight: 'bold',
                            whiteSpace: 'nowrap', // ❗️Prevents the text from wrapping
                            overflow: 'hidden', // Optional: hides any overflowed content
                            textOverflow: 'ellipsis', // Optional: adds "..." if text is too long
                          },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={
                              selectedRows.length > 0 &&
                              selectedRows.length <
                                computedRows.filter(
                                  (row) =>
                                    !finalizedPayroll.some(
                                      (fp) =>
                                        fp.employeeNumber ===
                                          row.employeeNumber &&
                                        fp.startDate === row.startDate &&
                                        fp.endDate === row.endDate
                                    )
                                ).length
                            }
                            checked={
                              selectedRows.length ===
                              computedRows.filter(
                                (row) =>
                                  !finalizedPayroll.some(
                                    (fp) =>
                                      fp.employeeNumber ===
                                        row.employeeNumber &&
                                      fp.startDate === row.startDate &&
                                      fp.endDate === row.endDate
                                  )
                              ).length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRows(
                                  computedRows
                                    .filter(
                                      (row) =>
                                        !finalizedPayroll.some(
                                          (fp) =>
                                            fp.employeeNumber ===
                                              row.employeeNumber &&
                                            fp.startDate === row.startDate &&
                                            fp.endDate === row.endDate
                                        )
                                    )
                                    .map((row) => row.employeeNumber)
                                );
                              } else {
                                setSelectedRows([]);
                              }
                            }}
                          />
                        </TableCell>

                        <TableCell>No.</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Employee Number</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>Rate NBC 584</TableCell>
                        <TableCell>NBC 594</TableCell>
                        <TableCell>Rate NBC 594</TableCell>
                        <TableCell>NBC DIFF'L 597</TableCell>
                        <TableCell>Increment</TableCell>
                        <TableCell>Gross Salary</TableCell>
                        <TableCell>
                          <b>ABS</b>
                        </TableCell>
                        <TableCell>H</TableCell>
                        <TableCell>M</TableCell>
                        <TableCell>Net Salary</TableCell>
                        <TableCell>Withholding Tax</TableCell>
                        <TableCell>
                          <b>Total GSIS Deductions</b>
                        </TableCell>
                        <TableCell>
                          <b>Total Pag-ibig Deductions</b>
                        </TableCell>
                        <TableCell>PhilHealth</TableCell>
                        <TableCell>
                          {' '}
                          <b>Total Other Deductions</b>
                        </TableCell>
                        <TableCell>
                          <b>Total Deductions</b>
                        </TableCell>
                        <TableCell>1st Pay</TableCell>
                        <TableCell>2nd Pay</TableCell>
                        <TableCell>No.</TableCell>
                        <TableCell>RT Ins.</TableCell>
                        <TableCell>EC</TableCell>
                        <TableCell>PhilHealth</TableCell>
                        <TableCell>Pag-Ibig</TableCell>
                        <TableCell style={{ color: 'red', fontWeight: 'bold' }}>
                          Pay1st Compute{' '}
                        </TableCell>
                        <TableCell style={{ color: 'red', fontWeight: 'bold' }}>
                          Pay2nd Compute{' '}
                        </TableCell>
                        <br />

                        <TableCell
                          style={{ borderLeft: '2px solid black' }}
                        ></TableCell>

                        <TableCell>No.</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>Withholding Tax</TableCell>
                        <TableCell>Personal Life Ret Ins</TableCell>
                        <TableCell>GSIS Salary Loan</TableCell>
                        <TableCell>GSIS Policy Loan</TableCell>
                        <TableCell>gsisArrears</TableCell>
                        <TableCell>CPL</TableCell>
                        <TableCell>MPL</TableCell>
                        <TableCell> EAL</TableCell>
                        <TableCell>MPL LITE</TableCell>
                        <TableCell>Emergency Loan (ELA)</TableCell>
                        <TableCell>Total GSIS Deductions</TableCell>
                        <TableCell>Pag-ibig Fund Contribution</TableCell>
                        <TableCell>Pag-ibig 2</TableCell>
                        <TableCell>Multi-Purpose Loan</TableCell>
                        <TableCell>Total Pag-Ibig Deduction</TableCell>
                        <TableCell> PhilHealth</TableCell>
                        <TableCell> liquidatingCash</TableCell>
                        <TableCell>LandBank Salary Loan</TableCell>
                        <TableCell> Earist Credit COOP.</TableCell>
                        <TableCell> FEU</TableCell>
                        <TableCell> Total Other Deductions</TableCell>
                        <TableCell> Total Deductions</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filteredData.length > 0 &&
                        computedRows.map((row, index) => {
                          const isFinalized = finalizedPayroll.some(
                            (fp) =>
                              fp.employeeNumber === row.employeeNumber &&
                              fp.startDate === row.startDate &&
                              fp.endDate === row.endDate
                          );

                          const hasNoFinalized = finalizedPayroll.length === 0;
                          const submitButtonEnabled =
                            canSubmit || hasNoFinalized;

                          return (
                            <TableRow
                              key={`${row.employeeNumber}-${row.dateCreated}`}
                              sx={{
                                backgroundColor:
                                  duplicateEmployeeNumbers.includes(
                                    row.employeeNumber
                                  )
                                    ? 'rgba(255, 0, 0, 0.1)'
                                    : '#fdfdfd',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedRows.includes(
                                    row.employeeNumber
                                  )}
                                  onChange={() => {
                                    if (
                                      selectedRows.includes(row.employeeNumber)
                                    ) {
                                      setSelectedRows((prev) =>
                                        prev.filter(
                                          (id) => id !== row.employeeNumber
                                        )
                                      );
                                    } else {
                                      setSelectedRows((prev) => [
                                        ...prev,
                                        row.employeeNumber,
                                      ]);
                                    }
                                  }}
                                  disabled={isFinalized}
                                />
                              </TableCell>

                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{row.department}</TableCell>
                              <TableCell>{row.employeeNumber}</TableCell>
                              <TableCell>{row.startDate}</TableCell>
                              <TableCell>{row.endDate}</TableCell>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.position}</TableCell>
                              <TableCell>
                                {row.rateNbc584
                                  ? Number(row.rateNbc584).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.nbc594
                                  ? Number(row.nbc594).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.rateNbc594
                                  ? Number(row.rateNbc594).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.nbcDiffl597
                                  ? Number(row.nbcDiffl597).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.increment
                                  ? Number(row.increment).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>{row.grossSalary}</TableCell>
                              <TableCell>
                                <b>{row.abs}</b>
                              </TableCell>
                              <TableCell>{row.h}</TableCell>
                              <TableCell>{row.m}</TableCell>
                              <TableCell>{row.netSalary} </TableCell>
                              <TableCell>{row.withholdingTax}</TableCell>
                              <TableCell>{row.totalGsisDeds}</TableCell>
                              <TableCell>{row.totalPagibigDeds}</TableCell>
                              <TableCell>
                                {row.PhilHealthContribution}
                              </TableCell>
                              <TableCell>{row.totalOtherDeds}</TableCell>
                              <TableCell>{row.totalDeductions}</TableCell>
                              <TableCell
                                sx={{ color: 'red', fontWeight: 'bold' }}
                              >
                                {row.pay1st}{' '}
                              </TableCell>
                              <TableCell
                                sx={{ color: 'red', fontWeight: 'bold' }}
                              >
                                {row.pay2nd}
                              </TableCell>

                              <TableCell>{index + 1}</TableCell>

                              <TableCell>{row.rtIns}</TableCell>
                              <TableCell>{row.ec}</TableCell>
                              <TableCell>
                                {row.PhilHealthContribution}
                              </TableCell>

                              <TableCell>{row.pagibigFundCont}</TableCell>
                              <TableCell>{row.pay1stCompute}</TableCell>
                              <TableCell>{row.pay2ndCompute}</TableCell>
                              <br />

                              <TableCell
                                style={{ borderLeft: '2px solid black' }}
                              ></TableCell>

                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.position}</TableCell>
                              <TableCell>
                                {row.withholdingTax
                                  ? Number(row.withholdingTax).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>{row.personalLifeRetIns}</TableCell>
                              <TableCell>
                                {row.gsisSalaryLoan
                                  ? Number(row.gsisSalaryLoan).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.gsisPolicyLoan
                                  ? Number(row.gsisPolicyLoan).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.gsisArrears
                                  ? Number(row.gsisArrears).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>

                              <TableCell>
                                {row.cpl
                                  ? Number(row.cpl).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : ''}
                              </TableCell>

                              <TableCell>
                                {row.mpl
                                  ? Number(row.mpl).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.eal
                                  ? Number(row.eal).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.mplLite
                                  ? Number(row.eal).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.emergencyLoan
                                  ? Number(row.eal).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : ''}
                              </TableCell>
                              <TableCell>{row.totalGsisDeds}</TableCell>
                              <TableCell>
                                {row.pagibigFundCont
                                  ? Number(row.pagibigFundCont).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.pagibig2
                                  ? Number(row.pagibig2).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.multiPurpLoan
                                  ? Number(row.multiPurpLoan).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>{row.totalPagibigDeds}</TableCell>
                              <TableCell>
                                {row.PhilHealthContribution}
                              </TableCell>
                              <TableCell>
                                {row.liquidatingCash
                                  ? Number(row.liquidatingCash).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.landbankSalaryLoan
                                  ? Number(
                                      row.landbankSalaryLoan
                                    ).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.earistCreditCoop
                                  ? Number(row.earistCreditCoop).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : ''}
                              </TableCell>
                              <TableCell>
                                {row.feu
                                  ? Number(row.feu).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : ''}
                              </TableCell>
                              <TableCell>{row.totalOtherDeds}</TableCell>
                              <TableCell>{row.totalDeductions}</TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 'bold',
                                  color:
                                    row.status === 'Processed'
                                      ? 'green'
                                      : 'red',
                                }}
                              >
                                {row.status}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
                {}
                {filteredData.length === 0 && (
                  <Typography
                    variant="h6"
                    align="center"
                    color="error"
                    sx={{ mt: 3, fontFamily: "'Poppins', sans-serif" }}
                  >
                    No Data Available
                  </Typography>
                )}
              </Paper>

              <Paper
                elevation={4}
                sx={{
                  borderRadius: 1,
                  pt: 1.2,
                  pb: 1.2,
                  mt: 0.7,
                  width: 190,
                  height: 335,
                  overflowX: 'hidden',
                  border: '3px solid #6d2323',
                }}
              >
                <TableContainer component={Box} sx={{ overflowX: 'hidden' }}>
                  <Table
                    stickyHeader
                    sx={{ width: '100%', tableLayout: 'fixed' }}
                  >
                    <TableHead sx={{ backgroundColor: '#ffffff' }}>
                      <TableRow
                        style={{
                          alignItems: 'center',
                          textAlign: 'center',
                          fontFamily: 'poppins, sans-serif',
                          fontWeight: 'bold',
                        }}
                      >
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 'bold',
                            fontFamily: 'poppins, sans-serif',
                          }}
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filteredData.length > 0 ? (
                        computedRows.map((row, index) => {
                          const isFinalized = finalizedPayroll.some(
                            (fp) =>
                              fp.employeeNumber === row.employeeNumber &&
                              fp.startDate === row.startDate &&
                              fp.endDate === row.endDate
                          );

                          return (
                            <TableRow
                              key={`actions-${row.employeeNumber}-${row.dateCreated}`}
                            >
                              {/* Edit column */}
                              <TableCell>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    gap: '5px' /* space between buttons */,
                                  }}
                                >
                                  <Button
                                    onClick={() => handleEdit(row.id)}
                                    variant="contained"
                                    color="primary"
                                    startIcon={<EditIcon />}
                                    style={{
                                      backgroundColor: isFinalized
                                        ? '#D3D3D3'
                                        : '#6D2323',
                                      color: isFinalized
                                        ? '#A9A9A9'
                                        : '#FEF9E1',
                                      textTransform: 'none',
                                      width: '85px',
                                      opacity: isFinalized ? 0.6 : 1,
                                      pointerEvents: isFinalized
                                        ? 'none'
                                        : 'auto',
                                      padding: '0px',
                                    }}
                                    disabled={isFinalized}
                                  >
                                    Edit
                                  </Button>

                                  <Button
                                    onClick={() =>
                                      handleDelete(row.id, row.employeeNumber)
                                    }
                                    variant="contained"
                                    startIcon={<DeleteIcon />}
                                    style={{
                                      backgroundColor: isFinalized
                                        ? '#D3D3D3'
                                        : '#000000',
                                      color: isFinalized
                                        ? '#A9A9A9'
                                        : '#ffffff',
                                      textTransform: 'none',
                                      width: '85px',
                                      opacity: isFinalized ? 0.6 : 1,
                                      pointerEvents: isFinalized
                                        ? 'none'
                                        : 'auto',
                                    }}
                                    disabled={isFinalized}
                                  >
                                    Delete
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No Data Available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          </Box>
        </>
      )}

      <Box display="flex" justifyContent="flex-end" mt={2} mr={2} gap={2}>
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="success"
            onClick={() => setShowConfirmation(true)}
            disabled={!canSubmit}
            sx={{
              backgroundColor: '#6d2323',
              color: canSubmit ? '#ffffff' : '#0c0b0bff',
              textTransform: 'none',
              height: '40px',
              width: '220px',
              marginTop: 2,
              opacity: canSubmit ? 1 : 0.6,
              pointerEvents: canSubmit ? 'auto' : 'none',
              border: canSubmit ? 'none' : '2px solid #6d2323',
              '&:hover': {
                backgroundColor: '#a31d1d',
              },
            }}
            startIcon={<ExitToApp />}
          >
            Export Payroll Records
          </Button>
        </Box>

        <Button
          variant="contained"
          color="success"
          onClick={() => (window.location.href = '/payroll-processed')}
          sx={{
            backgroundColor: '#6d2323',
            color: '#ffffff',
            textTransform: 'none',
            height: '40px',
            width: '220px',
            marginTop: 2,
            '&:hover': {
              backgroundColor: '#a31d1d',
            },
          }}
          startIcon={<BusinessCenter />}
        >
          View Processed Payroll
        </Button>
      </Box>

      <Modal open={openModal} onClose={handleCancel}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 800,
            bgcolor: 'background.paper',
            p: 4,
            borderRadius: 2,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {editRow && (
            <>
              <Typography variant="h5" mb={3}>
                Edit Payroll Record
              </Typography>

              {/* Employee Info */}
              <Typography variant="h6" gutterBottom>
                Employee Information
              </Typography>
              <Grid container spacing={2}>
                {employeeFields.map((field) => (
                  <Grid item xs={6} key={field}>
                    {field === 'department' ? (
                      // Department field with dropdown
                      <FormControl fullWidth>
                        <InputLabel id="department-label">
                          Department
                        </InputLabel>
                        <Select
                          labelId="department-label"
                          id="department-select"
                          name={field}
                          value={editRow[field] || ''}
                          onChange={handleModalChange}
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
                    ) : (
                      // Other fields with text input
                      <TextField
                        fullWidth
                        label={field}
                        name={field}
                        value={editRow[field] || ''}
                        onChange={handleModalChange}
                        InputLabelProps={{
                          style: { fontSize: '15px' }, // Make the label bigger
                        }}
                        InputProps={{
                          style: { fontSize: '15px' }, // Make the input text bigger
                        }}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>

              {/* MODAL EDIT*/}
              {/* Salary Info */}
              <Typography variant="h6" mt={4} gutterBottom>
                Salary Rate and Adjustments
              </Typography>
              <Grid container spacing={2}>
                {salaryRateandAdjustments.map((field) => (
                  <Grid item xs={6} key={field}>
                    <TextField
                      fullWidth
                      label={field}
                      name={field}
                      value={editRow[field] || ''}
                      onChange={handleModalChange}
                      disabled={field === 'rateNbc594'}
                      InputProps={{
                        style:
                          field === 'rateNbc594'
                            ? {
                                fontWeight: 'bold',
                                color: 'black',
                                fontSize: '15px',
                              }
                            : undefined,
                      }}
                      InputLabelProps={{
                        style: { fontSize: '15px' }, // Make the label bigger
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Deductions */}
              <Typography variant="h6" mt={5} gutterBottom>
                Absent Deductions
              </Typography>
              <Grid container spacing={2}>
                {SalaryComputation.map((field) => (
                  <Grid item xs={6} key={field}>
                    <TextField
                      fullWidth
                      label={field}
                      name={field}
                      value={editRow[field] || ''}
                      onChange={handleModalChange}
                      InputLabelProps={{
                        style: { fontSize: '15px' }, // Make the label bigger
                      }}
                      InputProps={{
                        style: { fontSize: '15px' }, // Make the input text bigger
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" mt={4} gutterBottom>
                Payroll Disbursement
              </Typography>
              <Grid container spacing={2}>
                {PayrollDisbursement.map((field) => (
                  <Grid item xs={6} key={field}>
                    <TextField
                      fullWidth
                      label={field}
                      name={field}
                      value={editRow[field] || ''}
                      onChange={handleModalChange}
                      InputLabelProps={{
                        style: { fontSize: '15px' }, // Make the label bigger
                      }}
                      InputProps={{
                        style: { fontSize: '15px' }, // Make the input text bigger
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" mt={4} gutterBottom>
                GSIS Deductions
              </Typography>
              <Grid container spacing={2}>
                {GsisDeductions.map((field) => (
                  <Grid item xs={6} key={field}>
                    <TextField
                      fullWidth
                      label={field}
                      name={field}
                      value={editRow[field] || ''}
                      onChange={handleModalChange}
                      InputLabelProps={{
                        style: { fontSize: '15px' }, // Make the label bigger
                      }}
                      InputProps={{
                        style: { fontSize: '15px' }, // Make the input text bigger
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" mt={4} gutterBottom>
                PAGIBIG Deductions
              </Typography>
              <Grid container spacing={2}>
                {PagIbigDeductions.map((field) => (
                  <Grid item xs={6} key={field}>
                    <TextField
                      fullWidth
                      label={field}
                      name={field}
                      value={editRow[field] || ''}
                      onChange={handleModalChange}
                      InputLabelProps={{
                        style: { fontSize: '15px' }, // Make the label bigger
                      }}
                      InputProps={{
                        style: { fontSize: '15px' }, // Make the input text bigger
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" mt={4} gutterBottom>
                Total Other Deductions
              </Typography>
              <Grid container spacing={2}>
                {totalOtherDeductions.map((field) => (
                  <Grid item xs={6} key={field}>
                    <TextField
                      fullWidth
                      label={field}
                      name={field}
                      value={editRow[field] || ''}
                      onChange={handleModalChange}
                      InputLabelProps={{
                        style: { fontSize: '15px' }, // Make the label bigger
                      }}
                      InputProps={{
                        style: { fontSize: '15px' }, // Make the input text bigger
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Other Info */}
              <Box mt={4} mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Total Contributions & Deductions
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {MandatoryDeductions.map((field) => (
                  <Grid item xs={6} key={field}>
                    <TextField
                      fullWidth
                      label={field}
                      name={field}
                      value={editRow[field] || ''}
                      onChange={handleModalChange}
                      InputLabelProps={{
                        style: { fontSize: '15px' }, // Make the label bigger
                      }}
                      InputProps={{
                        style: { fontSize: '15px' }, // Make the input text bigger
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Save / Cancel */}
              <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  startIcon={<SaveIcon />}
                  style={{
                    textTransform: 'none',
                    width: '100px',
                    backgroundColor: '#6D2323',
                    color: '#FEF9E1',
                  }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  startIcon={<CancelIcon />}
                  style={{
                    textTransform: 'none',
                    width: '100px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
      <Modal open={showConfirmation} onClose={() => setShowConfirmation(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
            width: 400,
          }}
        >
          <Typography variant="body2" mb={2}>
            Please confirm that all the data provided are accurate before
            proceeding. Are you sure you want to submit the payroll records?
          </Typography>

          <Box display="flex" justifyContent="center" gap={2}>
            <Button
              variant="outlined"
              style={{ color: 'black' }}
              onClick={() => setShowConfirmation(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              style={{ backgroundColor: '#6D2323', width: '120px' }}
              color="success"
              onClick={async () => {
                setIsSubmitting(true);
                setShowConfirmation(false);
                await handleSubmitPayroll(); // THIS is your real submit function
                setIsSubmitting(false);
              }}
              disabled={isSubmitting}
            >
              Yes
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Loading and Success Overlays */}
      <LoadingOverlay open={loading} message="Processing..." />
      <SuccessfulOverlay 
        open={successOpen} 
        action={successAction} 
        onClose={() => setSuccessOpen(false)} 
      />
    </Container>
  );
};

export default PayrollProcess;
