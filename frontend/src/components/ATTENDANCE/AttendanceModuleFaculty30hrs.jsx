import API_BASE_URL from "../../apiConfig";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Button, Container, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { useNavigate } from 'react-router-dom';
import { WorkHistory } from "@mui/icons-material";


const AttendanceModuleFaculty = () => {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
    const navigate = useNavigate();

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
  

      

  const handleSubmit = async (e) => {
    e.preventDefault();
    localStorage.setItem('employeeNumber', employeeNumber);
    localStorage.setItem('startDate', startDate);
    localStorage.setItem('endDate', endDate);
    
    
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance/api/attendance`, {
        params: {
          personId: employeeNumber,
          startDate,
          endDate,
        },
        ...getAuthHeaders(),
      });

      const processedData = response.data.map((row) => {
        const { timeIN, timeOUT, breaktimeIN, breaktimeOUT, officialBreaktimeIN, officialBreaktimeOUT, officialTimeIN, officialTimeOUT, officialHonorariumTimeIN, officialHonorariumTimeOUT, officialServiceCreditTimeIN, officialServiceCreditTimeOUT, officialOverTimeIN, officialOverTimeOUT } = row;

        const defaultTime = "132:00:00 AM";
        // Parse the times for comparison
        const parsedDefaultTime = dayjs(`2024-01-01 ${defaultTime}`, "YYYY-MM-DD hh:mm:ss A");

        const parsedTimeIN = dayjs(`2024-01-01 ${timeIN}`, "YYYY-MM-DD hh:mm:ss A"); // Example date
        const parsedTimeOUT = dayjs(`2024-01-01 ${timeOUT}`, "YYYY-MM-DD hh:mm:ss A");
        const parsedBreaktimeIN = dayjs(`2024-01-01 ${breaktimeIN}`, "YYYY-MM-DD hh:mm:ss A"); // Example date
        const parsedBreaktimeOUT = dayjs(`2024-01-01 ${breaktimeOUT}`, "YYYY-MM-DD hh:mm:ss A");
        const parsedOfficialBreaktimeIN = dayjs(`2024-01-01 ${officialBreaktimeIN}`, "YYYY-MM-DD hh:mm:ss A"); // Example date
        const parsedOfficialBreaktimeOUT = dayjs(`2024-01-01 ${officialBreaktimeOUT}`, "YYYY-MM-DD hh:mm:ss A");
        const parsedOfficialTimeIN = dayjs(`2024-01-01 ${officialTimeIN}`, "YYYY-MM-DD hh:mm:ss A"); // Example date
        const parsedOfficialTimeOUT = dayjs(`2024-01-01 ${officialTimeOUT}`, "YYYY-MM-DD hh:mm:ss A");
        const parsedOfficialHonorariumTimeIN = dayjs(`2024-01-01 ${officialHonorariumTimeIN}`, "YYYY-MM-DD hh:mm:ss A"); // Example date
        const parsedOfficialHonorariumTimeOUT = dayjs(`2024-01-01 ${officialHonorariumTimeOUT}`, "YYYY-MM-DD hh:mm:ss A");
        const parsedOfficialServiceCreditTimeIN = dayjs(`2024-01-01 ${officialServiceCreditTimeIN}`, "YYYY-MM-DD hh:mm:ss A"); // Example date
        const parsedOfficialServiceCreditTimeOUT = dayjs(`2024-01-01 ${officialServiceCreditTimeOUT}`, "YYYY-MM-DD hh:mm:ss A");
        const parsedOfficialOverTimeIN = dayjs(`2024-01-01 ${officialOverTimeIN}`, "YYYY-MM-DD hh:mm:ss A"); // Example date
        const parsedOfficialOverTimeOUT = dayjs(`2024-01-01 ${officialOverTimeOUT}`, "YYYY-MM-DD hh:mm:ss A");

        const OfficialTimeMorning = parsedTimeIN.isBefore(parsedOfficialTimeIN) ? parsedOfficialTimeIN.format("hh:mm:ss A") : parsedTimeIN.format("hh:mm:ss A");

        const OfficialTimeAfternoon = parsedTimeOUT.isAfter(parsedOfficialTimeOUT) ? parsedOfficialTimeOUT.format("hh:mm:ss A") : parsedTimeOUT.format("hh:mm:ss A");

        const HonorariumTimeIN = parsedTimeIN.isBefore(parsedOfficialHonorariumTimeIN) ? parsedOfficialHonorariumTimeIN.format("hh:mm:ss A") : parsedTimeIN.format("hh:mm:ss A");

        const HonorariumTimeOUT = parsedTimeOUT.isAfter(parsedOfficialHonorariumTimeOUT) ? parsedOfficialHonorariumTimeOUT.format("hh:mm:ss A") : parsedTimeOUT.format("hh:mm:ss A");

        const ServiceCreditTimeIN = parsedTimeIN.isBefore(parsedOfficialServiceCreditTimeIN) ? parsedOfficialServiceCreditTimeIN.format("hh:mm:ss A") : parsedTimeIN.format("hh:mm:ss A");

        const ServiceCreditTimeOUT = parsedTimeOUT.isAfter(parsedOfficialServiceCreditTimeOUT) ? parsedOfficialServiceCreditTimeOUT.format("hh:mm:ss A") : parsedTimeOUT.format("hh:mm:ss A");

        const OverTimeIN = parsedTimeIN.isBefore(parsedOfficialOverTimeIN) ? parsedOfficialOverTimeIN.format("hh:mm:ss A") : parsedTimeIN.format("hh:mm:ss A");

        const OverTimeOUT = parsedTimeOUT.isAfter(parsedOfficialOverTimeOUT) ? parsedOfficialOverTimeOUT.format("hh:mm:ss A") : parsedTimeOUT.format("hh:mm:ss A");

        const OfficialBreakAM = parsedBreaktimeIN.isAfter(parsedOfficialBreaktimeIN) ? parsedOfficialBreaktimeIN.format("hh:mm:ss A") : parsedBreaktimeIN.format("hh:mm:ss A");

        const OfficialBreakPM = parsedBreaktimeOUT.isAfter(parsedOfficialBreaktimeOUT) ? parsedBreaktimeOUT.format("hh:mm:ss A") : parsedOfficialBreaktimeOUT.format("hh:mm:ss A");

        // start faculty render

        // rendered time
        // Convert time strings to Date objects
        const startDateFaculty = new Date(`01/01/2000 ${timeIN}`);
        const endDateFaculty = new Date(`01/01/2000 ${timeOUT}`);
        const startOfficialTimeFaculty = new Date(`01/01/2000 ${officialTimeIN}`);
        const endOfficialTimeFaculty = new Date(`01/01/2000 ${officialTimeOUT}`);

        const defaultTimeFaculty = "00:00:00 AM";
        const midnightFaculty = new Date(`01/01/2000 ${defaultTimeFaculty}`);

        const timeinfaculty = startDateFaculty > endOfficialTimeFaculty ? midnightFaculty : startDateFaculty < startOfficialTimeFaculty ? startOfficialTimeFaculty : startDateFaculty;
        const timeoutfaculty = timeinfaculty === midnightFaculty ? midnightFaculty : endDateFaculty < endOfficialTimeFaculty ? endDateFaculty : endOfficialTimeFaculty;

        // Calculate difference in milliseconds
        const diffMs = timeoutfaculty - timeinfaculty;

        // Convert milliseconds to hours, minutes, seconds
        const hoursFaculty = Math.floor(diffMs / (1000 * 60 * 60));
        const minutesFaculty = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secondsFaculty = Math.floor((diffMs % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS RENDERERED TIME
        const formattedFacultyRenderedTime = [String(hoursFaculty).padStart(2, "0"), String(minutesFaculty).padStart(2, "0"), String(secondsFaculty).padStart(2, "0")].join(":");

        //end rendered time

        //  max rendered time

        // Calculate difference in milliseconds MAX RENDERED TIME
        const diffMsFaculty = endOfficialTimeFaculty - startOfficialTimeFaculty;

        // Convert milliseconds to hours, minutes, seconds
        const hoursFacultyMRT = Math.floor(diffMsFaculty / (1000 * 60 * 60));
        const minutesFacultyMRT = Math.floor((diffMsFaculty % (1000 * 60 * 60)) / (1000 * 60));
        const secondsFacultyMRT = Math.floor((diffMsFaculty % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS
        const formattedFacultyMaxRenderedTime = [String(hoursFacultyMRT).padStart(2, "0"), String(minutesFacultyMRT).padStart(2, "0"), String(secondsFacultyMRT).padStart(2, "0")].join(":");

        // Calculate difference in milliseconds MAX RENDERED TIME

        const tardFinalformattedFacultyRenderedTime = new Date(`01/01/2000 ${formattedFacultyRenderedTime}`);
        const tardFinalformattedFacultyMaxRenderedTime = new Date(`01/01/2000 ${formattedFacultyMaxRenderedTime}`);

        const finalcalcFaculty = tardFinalformattedFacultyMaxRenderedTime - tardFinalformattedFacultyRenderedTime;

        // Convert milliseconds to hours, minutes, seconds
        const hoursfinalcalcFaculty = Math.floor(finalcalcFaculty / (1000 * 60 * 60));
        const minutesfinalcalcFaculty = Math.floor((finalcalcFaculty % (1000 * 60 * 60)) / (1000 * 60));
        const secondsfinalcalcFaculty = Math.floor((finalcalcFaculty % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS
        const formattedfinalcalcFaculty = [String(hoursfinalcalcFaculty).padStart(2, "0"), String(minutesfinalcalcFaculty).padStart(2, "0"), String(secondsfinalcalcFaculty).padStart(2, "0")].join(":");

        // // end max rendered time

        // HN ------------------------------------------------------------------------------

        // rendered time
        // Convert time strings to Date objects
        const startDateFacultyHN = new Date(`01/01/2000 ${timeIN}`);
        const endDateFacultyHN = new Date(`01/01/2000 ${timeOUT}`);
        const startOfficialTimeFacultyHN = new Date(`01/01/2000 ${officialHonorariumTimeIN}`);
        const endOfficialTimeFacultyHN = new Date(`01/01/2000 ${officialHonorariumTimeOUT}`);

        const defaultTimeFacultyHN = "00:00:00 AM";
        const midnightFacultyHN = new Date(`01/01/2000 ${defaultTimeFacultyHN}`);

        const timeinfacultyHN = endDateFacultyHN < startOfficialTimeFacultyHN ? midnightFacultyHN : startDateFacultyHN > endOfficialTimeFacultyHN ? midnightFacultyHN : startDateFacultyHN < startOfficialTimeFacultyHN ? startOfficialTimeFacultyHN : startDateFacultyHN;
        const timeoutfacultyHN = timeinfacultyHN === midnightFacultyHN ? midnightFacultyHN : endDateFacultyHN < startOfficialTimeFacultyHN ? midnightFacultyHN : endDateFacultyHN < endOfficialTimeFacultyHN ? endDateFacultyHN : endOfficialTimeFacultyHN;

        // Calculate difference in milliseconds
        const diffMsHN = timeoutfacultyHN - timeinfacultyHN;

        // Convert milliseconds to hours, minutes, seconds
        const hoursFacultyHN = Math.floor(diffMsHN / (1000 * 60 * 60));
        const minutesFacultyHN = Math.floor((diffMsHN % (1000 * 60 * 60)) / (1000 * 60));
        const secondsFacultyHN = Math.floor((diffMsHN % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS RENDERERED TIME
        const formattedFacultyRenderedTimeHN = [String(hoursFacultyHN).padStart(2, "0"), String(minutesFacultyHN).padStart(2, "0"), String(secondsFacultyHN).padStart(2, "0")].join(":");

        //end rendered time

        //  max rendered time

        // Calculate difference in milliseconds MAX RENDERED TIME
        const diffMsFacultyHN = endOfficialTimeFacultyHN - startOfficialTimeFacultyHN;

        // Convert milliseconds to hours, minutes, seconds
        const hoursFacultyMRTHN = Math.floor(diffMsFacultyHN / (1000 * 60 * 60));
        const minutesFacultyMRTHN = Math.floor((diffMsFacultyHN % (1000 * 60 * 60)) / (1000 * 60));
        const secondsFacultyMRTHN = Math.floor((diffMsFacultyHN % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS
        const formattedFacultyMaxRenderedTimeHN = [String(hoursFacultyMRTHN).padStart(2, "0"), String(minutesFacultyMRTHN).padStart(2, "0"), String(secondsFacultyMRTHN).padStart(2, "0")].join(":");

        // Calculate difference in milliseconds MAX RENDERED TIME

        const tardFinalformattedFacultyRenderedTimeHN = new Date(`01/01/2000 ${formattedFacultyRenderedTimeHN}`);
        const tardFinalformattedFacultyMaxRenderedTimeHN = new Date(`01/01/2000 ${formattedFacultyMaxRenderedTimeHN}`);

        const finalcalcFacultyHN = tardFinalformattedFacultyMaxRenderedTimeHN - tardFinalformattedFacultyRenderedTimeHN;

        // Convert milliseconds to hours, minutes, seconds
        const hoursfinalcalcFacultyHN = Math.floor(finalcalcFacultyHN / (1000 * 60 * 60));
        const minutesfinalcalcFacultyHN = Math.floor((finalcalcFacultyHN % (1000 * 60 * 60)) / (1000 * 60));
        const secondsfinalcalcFacultyHN = Math.floor((finalcalcFacultyHN % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS
        const formattedfinalcalcFacultyHN = [String(hoursfinalcalcFacultyHN).padStart(2, "0"), String(minutesfinalcalcFacultyHN).padStart(2, "0"), String(secondsfinalcalcFacultyHN).padStart(2, "0")].join(":");

        // // end max rendered time
        //HN END-----------------------------------------------------------------------------

        // SC ------------------------------------------------------------------------------

        // rendered time
        // Convert time strings to Date objects
        const startDateFacultySC = new Date(`01/01/2000 ${timeIN}`);
        const endDateFacultySC = new Date(`01/01/2000 ${timeOUT}`);
        const startOfficialTimeFacultySC = new Date(`01/01/2000 ${officialServiceCreditTimeIN}`);
        const endOfficialTimeFacultySC = new Date(`01/01/2000 ${officialServiceCreditTimeOUT}`);

        const defaultTimeFacultySC = "00:00:00 AM";
        const midnightFacultySC = new Date(`01/01/2000 ${defaultTimeFacultySC}`);

        const timeinfacultySC = endDateFacultySC < startOfficialTimeFacultySC ? midnightFacultySC : startDateFacultySC > endOfficialTimeFacultySC ? midnightFacultySC : startDateFacultySC < startOfficialTimeFacultySC ? startOfficialTimeFacultySC : startDateFacultySC;
        const timeoutfacultySC = timeinfacultySC === midnightFacultySC ? midnightFacultySC : endDateFacultySC < startOfficialTimeFacultySC ? midnightFacultySC : endDateFacultySC < endOfficialTimeFacultySC ? endDateFacultySC : endOfficialTimeFacultySC;

        // Calculate difference in milliseconds
        const diffMsSC = timeoutfacultySC - timeinfacultySC;

        // Convert milliseconds to hours, minutes, seconds
        const hoursFacultySC = Math.floor(diffMsSC / (1000 * 60 * 60));
        const minutesFacultySC = Math.floor((diffMsSC % (1000 * 60 * 60)) / (1000 * 60));
        const secondsFacultySC = Math.floor((diffMsSC % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS RENDERERED TIME
        const formattedFacultyRenderedTimeSC = [String(hoursFacultySC).padStart(2, "0"), String(minutesFacultySC).padStart(2, "0"), String(secondsFacultySC).padStart(2, "0")].join(":");

        //end rendered time

        //  max rendered time

        // Calculate difference in milliseconds MAX RENDERED TIME
        const diffMsFacultySC = endOfficialTimeFacultySC - startOfficialTimeFacultySC;

        // Convert milliseconds to hours, minutes, seconds
        const hoursFacultyMRTSC = Math.floor(diffMsFacultySC / (1000 * 60 * 60));
        const minutesFacultyMRTSC = Math.floor((diffMsFacultySC % (1000 * 60 * 60)) / (1000 * 60));
        const secondsFacultyMRTSC = Math.floor((diffMsFacultySC % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS
        const formattedFacultyMaxRenderedTimeSC = [String(hoursFacultyMRTSC).padStart(2, "0"), String(minutesFacultyMRTSC).padStart(2, "0"), String(secondsFacultyMRTSC).padStart(2, "0")].join(":");

        // Calculate difference in milliseconds MAX RENDERED TIME

        const tardFinalformattedFacultyRenderedTimeSC = new Date(`01/01/2000 ${formattedFacultyRenderedTimeSC}`);
        const tardFinalformattedFacultyMaxRenderedTimeSC = new Date(`01/01/2000 ${formattedFacultyMaxRenderedTimeSC}`);

        const finalcalcFacultySC = tardFinalformattedFacultyMaxRenderedTimeSC - tardFinalformattedFacultyRenderedTimeSC;

        // Convert milliseconds to hours, minutes, seconds
        const hoursfinalcalcFacultySC = Math.floor(finalcalcFacultySC / (1000 * 60 * 60));
        const minutesfinalcalcFacultySC = Math.floor((finalcalcFacultySC % (1000 * 60 * 60)) / (1000 * 60));
        const secondsfinalcalcFacultySC = Math.floor((finalcalcFacultySC % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS
        const formattedfinalcalcFacultySC = [String(hoursfinalcalcFacultySC).padStart(2, "0"), String(minutesfinalcalcFacultySC).padStart(2, "0"), String(secondsfinalcalcFacultySC).padStart(2, "0")].join(":");

        // // end max rendered time
        //SC END-----------------------------------------------------------------------------

        // OT ------------------------------------------------------------------------------

        // rendered time
        // Convert time strings to Date objects
        const startDateFacultyOT = new Date(`01/01/2000 ${timeIN}`);
        const endDateFacultyOT = new Date(`01/01/2000 ${timeOUT}`);
        const startOfficialTimeFacultyOT = new Date(`01/01/2000 ${officialOverTimeIN}`);
        const endOfficialTimeFacultyOT = new Date(`01/01/2000 ${officialOverTimeOUT}`);

        const defaultTimeFacultyOT = "00:00:00 AM";
        const midnightFacultyOT = new Date(`01/01/2000 ${defaultTimeFacultyOT}`);

        const timeinfacultyOT = endDateFacultyOT < startOfficialTimeFacultyOT ? midnightFacultyOT : startDateFacultyOT > endOfficialTimeFacultyOT ? midnightFacultyOT : startDateFacultyOT < startOfficialTimeFacultyOT ? startOfficialTimeFacultyOT : startDateFacultyOT;
        const timeoutfacultyOT = timeinfacultyOT === midnightFacultyOT ? midnightFacultyOT : endDateFacultyOT < startOfficialTimeFacultyOT ? midnightFacultyOT : endDateFacultyOT < endOfficialTimeFacultyOT ? endDateFacultyOT : endOfficialTimeFacultyOT;

        // Calculate difference in milliseconds
        const diffMsOT = timeoutfacultyOT - timeinfacultyOT;

        // Convert milliseconds to hours, minutes, seconds
        const hoursFacultyOT = Math.floor(diffMsOT / (1000 * 60 * 60));
        const minutesFacultyOT = Math.floor((diffMsOT % (1000 * 60 * 60)) / (1000 * 60));
        const secondsFacultyOT = Math.floor((diffMsOT % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS RENDERERED TIME
        const formattedFacultyRenderedTimeOT = [String(hoursFacultyOT).padStart(2, "0"), String(minutesFacultyOT).padStart(2, "0"), String(secondsFacultyOT).padStart(2, "0")].join(":");

        //end rendered time

        //  max rendered time

        // Calculate difference in milliseconds MAX RENDERED TIME
        const diffMsFacultyOT = endOfficialTimeFacultyOT - startOfficialTimeFacultyOT;

        // Convert milliseconds to hours, minutes, seconds
        const hoursFacultyMRTOT = Math.floor(diffMsFacultyOT / (1000 * 60 * 60));
        const minutesFacultyMRTOT = Math.floor((diffMsFacultyOT % (1000 * 60 * 60)) / (1000 * 60));
        const secondsFacultyMRTOT = Math.floor((diffMsFacultyOT % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS
        const formattedFacultyMaxRenderedTimeOT = [String(hoursFacultyMRTOT).padStart(2, "0"), String(minutesFacultyMRTOT).padStart(2, "0"), String(secondsFacultyMRTOT).padStart(2, "0")].join(":");

        // Calculate difference in milliseconds MAX RENDERED TIME

        const tardFinalformattedFacultyRenderedTimeOT = new Date(`01/01/2000 ${formattedFacultyRenderedTimeOT}`);
        const tardFinalformattedFacultyMaxRenderedTimeOT = new Date(`01/01/2000 ${formattedFacultyMaxRenderedTimeOT}`);

        const finalcalcFacultyOT = tardFinalformattedFacultyMaxRenderedTimeOT - tardFinalformattedFacultyRenderedTimeOT;

        // Convert milliseconds to hours, minutes, seconds
        const hoursfinalcalcFacultyOT = Math.floor(finalcalcFacultyOT / (1000 * 60 * 60));
        const minutesfinalcalcFacultyOT = Math.floor((finalcalcFacultyOT % (1000 * 60 * 60)) / (1000 * 60));
        const secondsfinalcalcFacultyOT = Math.floor((finalcalcFacultyOT % (1000 * 60)) / 1000);

        // Format output as HH:MM:SS
        const formattedfinalcalcFacultyOT = [String(hoursfinalcalcFacultyOT).padStart(2, "0"), String(minutesfinalcalcFacultyOT).padStart(2, "0"), String(secondsfinalcalcFacultyOT).padStart(2, "0")].join(":");

        // // end max rendered time
        //OT END-----------------------------------------------------------------------------

        return {
          ...row,
          HonorariumTimeIN,
          HonorariumTimeOUT,
          ServiceCreditTimeIN,
          ServiceCreditTimeOUT,
          OverTimeIN,
          OverTimeOUT,
          officialTimeIN,
          officialTimeOUT,
          officialHonorariumTimeIN,
          officialHonorariumTimeOUT,
          officialServiceCreditTimeIN,
          officialServiceCreditTimeOUT,
          officialOverTimeIN,
          officialOverTimeOUT,
          OfficialTimeMorning,
          OfficialTimeAfternoon,

          timeIN,
          timeOUT,
          OfficialBreakPM,
          breaktimeIN,
          breaktimeOUT,

          midnightFaculty,
          finalcalcFaculty,

          formattedfinalcalcFaculty,
          formattedFacultyRenderedTime,

          formattedFacultyMaxRenderedTime,

          formattedfinalcalcFacultyHN,
          formattedFacultyRenderedTimeHN,

          formattedFacultyMaxRenderedTimeHN,

          formattedfinalcalcFacultySC,
          formattedFacultyRenderedTimeSC,

          formattedFacultyMaxRenderedTimeSC,

          formattedfinalcalcFacultyOT,
          formattedFacultyRenderedTimeOT,

          formattedFacultyMaxRenderedTimeOT,
        };
      });

      setAttendanceData(processedData);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  };

  const saveOverallAttendance = async () => {
    /* ───── duplicate guard ───── */
    try {
      const dup = await axios.get(
        `${API_BASE_URL}/attendance/api/overall_attendance_record`,
        { params: { personID: employeeNumber, startDate, endDate }, ...getAuthHeaders() }
      );
      if (dup.data?.data?.length) {
        alert(
          `Record for PERSON ID ${employeeNumber} covering ` +
          `${startDate}–${endDate} already exists.`
        );
        return;           // stop; prevents duplicate save
      }

      navigate('/attendance_summary');

    } catch (e) {
      console.error("Duplicate‑check failed:", e);
      alert("Could not verify duplicates. Saving aborted.");
      return;
    }
    /* ─────────────────────────── */
  
    console.log("Employee Number:", employeeNumber);
    const record = {
      personID: employeeNumber,
      startDate,
      endDate,
  
      totalRenderedTimeMorning: "00:00:00",
      totalRenderedTimeMorningTardiness: "00:00:00",
  
      totalRenderedTimeAfternoon: "00:00:00",
      totalRenderedTimeAfternoonTardiness: "00:00:00",
  
      totalRenderedHonorarium: calculateTotalRenderedTimeHN(),
      totalRenderedHonorariumTardiness: calculateTotalRenderedTimeTardinessHN(),
  
      totalRenderedServiceCredit: calculateTotalRenderedTimeSC(),
      totalRenderedServiceCreditTardiness: calculateTotalRenderedTimeTardinessSC(),
  
      totalRenderedOvertime: calculateTotalRenderedTimeOT(),
      totalRenderedOvertimeTardiness: calculateTotalRenderedTimeTardinessOT(),
  
      overallRenderedOfficialTime: calculateTotalRenderedTime(),
      overallRenderedOfficialTimeTardiness: calculateTotalRenderedTimeTardiness(),
    };
  
    try {
      const response = await axios.post(
        `${API_BASE_URL}/attendance/api/overall_attendance`,
        record,
        getAuthHeaders()
      );
      alert(response.data.message || "Attendance record saved successfully!");
    } catch (error) {
      console.error("Error saving overall attendance:", error);
      alert("Failed to save attendance record.");
    }
  };
  

  // TIME IN AND TIME OUT
  const calculateTotalRenderedTime = () => {
    if (!attendanceData || attendanceData.length === 0) {
      return "00:00:00"; // Handle empty data gracefully
    }

    let totalSeconds = 0;

    attendanceData.forEach((row) => {
      const facultyRenderedTime = !row.officialTimeIN || !row.timeOUT || row.formattedFacultyRenderedTime === "NaN:NaN:NaN" ? "00:00:00" : row.formattedFacultyRenderedTime;

      const [hours, minutes, seconds] = facultyRenderedTime.split(":").map(Number);
      totalSeconds += hours * 3600 + minutes * 60 + seconds;
    });

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;

    //const OverAll = `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSecs).padStart(2, "0")}`;

    // return `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSecs).padStart(2, "0")}`;

    // Return computed time
    const overallTime = `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSecs).padStart(2, "0")}`;
    return overallTime;
  };

  const calculateTotalRenderedTimeTardiness = () => {
    let totalSeconds = 0;

    attendanceData.forEach((row) => {
      const facultyRenderedTimeTardiness = !row.officialTimeIN || !row.timeOUT || row.formattedfinalcalcFaculty === "NaN:NaN:NaN" ? row.formattedFacultyMaxRenderedTime : row.formattedfinalcalcFaculty;

      const [hours, minutes, seconds] = facultyRenderedTimeTardiness.split(":").map(Number);
      totalSeconds += hours * 3600 + minutes * 60 + seconds;
    });

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;

    return `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSecs).padStart(2, "0")}`;
  };
  // TIME IN AND TIME OUT END

  // TIME IN AND TIME OUT HONORARUIM
  const calculateTotalRenderedTimeHN = () => {
    let totalSeconds = 0;

    attendanceData.forEach((row) => {
      const facultyRenderedTimeHN = !row.officialTimeIN || !row.timeOUT || row.formattedFacultyRenderedTimeHN === "NaN:NaN:NaN" ? "00:00:00" : row.formattedFacultyRenderedTimeHN;

      const [hours, minutes, seconds] = facultyRenderedTimeHN.split(":").map(Number);
      totalSeconds += hours * 3600 + minutes * 60 + seconds;
    });

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;

    return `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSecs).padStart(2, "0")}`;
  };

  const calculateTotalRenderedTimeTardinessHN = () => {
    let totalSeconds = 0;

    attendanceData.forEach((row) => {
      const facultyRenderedTimeTardinessHN = !row.officialTimeIN || !row.timeOUT || row.formattedfinalcalcFacultyHN === "NaN:NaN:NaN" ? row.formattedFacultyMaxRenderedTimeHN : row.formattedfinalcalcFacultyHN;

      const [hours, minutes, seconds] = facultyRenderedTimeTardinessHN.split(":").map(Number);
      totalSeconds += hours * 3600 + minutes * 60 + seconds;
    });

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;

    return `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSecs).padStart(2, "0")}`;
  };
  // TIME IN AND TIME OUT END HONORARIUM

  // TIME IN AND TIME OUT ServiceCredit
  const calculateTotalRenderedTimeSC = () => {
    let totalSeconds = 0;

    attendanceData.forEach((row) => {
      const facultyRenderedTimeSC = !row.officialTimeIN || !row.timeOUT || row.formattedFacultyRenderedTimeSC === "NaN:NaN:NaN" ? "00:00:00" : row.formattedFacultyRenderedTimeSC;

      const [hours, minutes, seconds] = facultyRenderedTimeSC.split(":").map(Number);
      totalSeconds += hours * 3600 + minutes * 60 + seconds;
    });

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;

    return `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSecs).padStart(2, "0")}`;
  };

  const calculateTotalRenderedTimeTardinessSC = () => {
    let totalSeconds = 0;

    attendanceData.forEach((row) => {
      const facultyRenderedTimeTardinessSC = !row.officialTimeIN || !row.timeOUT || row.formattedfinalcalcFacultySC === "NaN:NaN:NaN" ? row.formattedFacultyMaxRenderedTimeSC : row.formattedfinalcalcFacultySC;

      const [hours, minutes, seconds] = facultyRenderedTimeTardinessSC.split(":").map(Number);
      totalSeconds += hours * 3600 + minutes * 60 + seconds;
    });

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;

    return `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSecs).padStart(2, "0")}`;
  };
  // TIME IN AND TIME OUT END Service Credit

  // TIME IN AND TIME OUT OverTime
  const calculateTotalRenderedTimeOT = () => {
    let totalSeconds = 0;

    attendanceData.forEach((row) => {
      const facultyRenderedTimeOT = !row.officialTimeIN || !row.timeOUT || row.formattedFacultyRenderedTimeOT === "NaN:NaN:NaN" ? "00:00:00" : row.formattedFacultyRenderedTimeOT;

      const [hours, minutes, seconds] = facultyRenderedTimeOT.split(":").map(Number);
      totalSeconds += hours * 3600 + minutes * 60 + seconds;
    });

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;

    return `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSecs).padStart(2, "0")}`;
  };

  const calculateTotalRenderedTimeTardinessOT = () => {
    let totalSeconds = 0;

    attendanceData.forEach((row) => {
      const facultyRenderedTimeTardinessOT = !row.officialTimeIN || !row.timeOUT || row.formattedfinalcalcFacultyOT === "NaN:NaN:NaN" ? row.formattedFacultyMaxRenderedTimeOT : row.formattedfinalcalcFacultyOT;

      const [hours, minutes, seconds] = facultyRenderedTimeTardinessOT.split(":").map(Number);
      totalSeconds += hours * 3600 + minutes * 60 + seconds;
    });

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;

    return `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSecs).padStart(2, "0")}`;
  };
  // TIME IN AND TIME OUT END OverTime

  const currentYear = 2024;
  const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const handleMonthClick = (monthIndex) => {
    const year = 2024;
  
    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 0)); // last day of month
  
    // format as YYYY-MM-DD (ISO format expected by <TextField type="date" />)
    const formattedStart = start.toISOString().substring(0, 10);
    const formattedEnd = end.toISOString().substring(0, 10);
  
    setStartDate(formattedStart);
    setEndDate(formattedEnd);
  };

  return (
    <Container sx={{ mt: 2, backgroundColor: '#FEF9E1', pb: 4 }} maxWidth={false}>
    {/* card wrapper */}
    
          <div
                      style={{
                        backgroundColor: '#6D2323',
                        color: '#ffffff',
                        padding: '20px',
                        width: '96.6%',
                        borderRadius: '8px',
                        borderBottomLeftRadius: '0px',
                        borderBottomRightRadius: '0px',
                       
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', color: '#ffffff', }}>
                        <WorkHistory sx={{ fontSize: '3rem', marginRight: '16px', marginTop: '5px', marginLeft: '5px' }} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '150%', marginBottom: '2px' }}>
                            Attendance Report for Faculty (30hrs)
                          </h4>
                          <p style={{ margin: 0, fontSize: '85%' }}>
                          Generate and review all attendance records of 30 hours faculty employees
             
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
      {/* header band */}
       {/* Month Buttons */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2, ml: 12.7 }}>
                {months.map((month, index) => (
                  <Button key={month} variant="contained" onClick={() => handleMonthClick(index)} sx={{ backgroundColor: "#6D2323", color: "white", "&:hover": { backgroundColor: "#d4bd99" } }}>
                    {month}
                  </Button>
                ))}
              </Box>
      


      {/* filters */}
      <Box display="flex" gap={2}>
        <TextField
          label="Employee Number"
          variant="outlined"
          value={employeeNumber}
          onChange={(e) => setEmployeeNumber(e.target.value)}
          sx={{ width: '250px', marginTop: "14px" }}
          required
          InputLabelProps={{ shrink: true }}
        />
        <TextField
               label="Start Date"
               type="date"
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               required
               sx={{
                 width: "250px",
                 height: "54px",
                 marginLeft: "10px",
                 marginTop: "14px",
               }}
               InputLabelProps={{ shrink: true }}
             />
             <TextField
               label="End Date"
               type="date"
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               required
               sx={{
                 width: "250px",
                 height: "54px",
                 marginLeft: "10px",
                 marginTop: "14px",
               }}
               InputLabelProps={{ shrink: true }}
             />
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit}
          sx={{ marginTop: "14px", backgroundColor: '#6D2323', color: '#FEF9E1', height: 56, flexGrow: 1 }}
        >
          Generate Report
        </Button>
      </Box>
        

        {attendanceData.length > 0 && (
          <TableContainer
            component={Paper}
            sx={{
              mt: 4,
              borderRadius: 2,
              boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
              overflowX: 'auto',
            }}
            >            
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      width: "150px",
                      maxWidth: "150px",
                      minWidth: "150px",
                      textAlign: "center", // Optional: ensures text alignment remains consistent
                      overflow: "hidden", // Optional: handle overflow
                      textOverflow: "ellipsis", // Optional: adds ellipsis for overflowing text
                      whiteSpace: "nowrap", // Optional: prevents text wrapping
                    }}
                  >
                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#E5D0AC",
                      fontWeight: "bold",
                      width: "100px",
                      maxWidth: "150px",
                      minWidth: "120px",
                      textAlign: "center", // Optional: ensures text alignment remains consistent
                      overflow: "hidden", // Optional: handle overflow
                      textOverflow: "ellipsis", // Optional: adds ellipsis for overflowing text
                      whiteSpace: "nowrap",
                    }}
                  >
                    Day
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "150px",
                      maxWidth: "150px",
                      minWidth: "120px",
                      textAlign: "center", // Optional: ensures text alignment remains consistent
                      overflow: "hidden", // Optional: handle overflow
                      textOverflow: "ellipsis", // Optional: adds ellipsis for overflowing text
                      whiteSpace: "nowrap", // Optional: prevents text wrapping
                    }}
                  >
                    Time IN
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#E5D0AC",
                      fontWeight: "bold",
                      width: "100px",
                      maxWidth: "150px",
                      minWidth: "120px",
                      textAlign: "center", // Optional: ensures text alignment remains consistent
                      overflow: "hidden", // Optional: handle overflow
                      textOverflow: "ellipsis", // Optional: adds ellipsis for overflowing text
                      whiteSpace: "nowrap",
                    }}
                  >
                    Official Time IN
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "150px",
                      maxWidth: "150px",
                      minWidth: "120px",
                      textAlign: "center", // Optional: ensures text alignment remains consistent
                      overflow: "hidden", // Optional: handle overflow
                      textOverflow: "ellipsis", // Optional: adds ellipsis for overflowing text
                      whiteSpace: "nowrap", // Optional: prevents text wrapping
                    }}
                  >
                    Time OUT
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#E5D0AC",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    Official Time OUT
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#F2B28C",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    Official Regular Duty Rendered Time
                  </TableCell>

                  <TableCell
                    sx={{
                      backgroundColor: "#ffd2d2",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    Tardiness (Official Regular Duty)
                  </TableCell>

                  <TableCell>Honorarium Time IN</TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#E5D0AC",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    OFFICIAL Honorarium Time IN
                  </TableCell>
                  <TableCell>Honorarium Time OUT</TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#E5D0AC",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    OFFICIAL Honorarium Time OUT
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#F2B28C",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    Honorarium Rendered Time
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#ffd2d2",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    TARDINESS (HONORARIUM)
                  </TableCell>

                  <TableCell>Service Credit Time IN</TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#E5D0AC",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    OFFICIAL Service Credit Time IN
                  </TableCell>
                  <TableCell>Service Credit Time OUT</TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#E5D0AC",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    OFFICIAL Service Credit Time OUT
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#F2B28C",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    Service Credit Rendered Time
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#ffd2d2",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    TARDINESS (SERVICE CREDIT)
                  </TableCell>

                  <TableCell>Overtime Time IN</TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#E5D0AC",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    OFFICIAL Overtime Time IN
                  </TableCell>
                  <TableCell>Overtime Time OUT</TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#E5D0AC",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    OFFICIAL Overtime Time OUT
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#F2B28C",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    Overtime Rendered Time
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#ffd2d2",
                      fontWeight: "bold",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    TARDINESS (OVERTIME)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                      }}
                    >
                      {row.date}
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#E5D0AC",
                        fontWeight: "bold",
                        width: "100px",
                        maxWidth: "150px",
                        minWidth: "120px",
                        textAlign: "center", // Optional: ensures text alignment remains consistent
                        overflow: "hidden", // Optional: handle overflow
                        textOverflow: "ellipsis", // Optional: adds ellipsis for overflowing text
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.day}
                    </TableCell>
                    <TableCell>{row.timeIN}</TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#E5D0AC",
                        fontWeight: "bold",
                        width: "120px",
                        textAlign: "center",
                      }}
                    >
                      {row.officialTimeIN}
                    </TableCell>
                    <TableCell>{row.timeOUT}</TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#E5D0AC",
                        fontWeight: "bold",
                        width: "120px",
                        textAlign: "center",
                      }}
                    >
                      {row.officialTimeOUT}
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#F2B28C",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {!row.officialTimeIN || !row.timeOUT || row.formattedFacultyRenderedTime === "NaN:NaN:NaN" ? "00:00:00" : row.formattedFacultyRenderedTime}
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#ffd2d2",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {!row.officialTimeIN || !row.timeOUT || row.formattedfinalcalcFaculty === "NaN:NaN:NaN" ? row.formattedFacultyMaxRenderedTime : row.formattedfinalcalcFaculty}
                    </TableCell>

                    <TableCell>{row.officialHonorariumTimeIN === "00:00:00 AM" ? "N/A" : row.timeIN}</TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#E5D0AC",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {row.officialHonorariumTimeIN === "00:00:00 AM" ? "N/A" : row.officialHonorariumTimeIN}
                    </TableCell>
                    <TableCell>{row.officialHonorariumTimeOUT === "00:00:00 AM" ? "N/A" : row.timeOUT}</TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#E5D0AC",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {row.officialHonorariumTimeOUT === "00:00:00 AM" ? "N/A" : row.officialHonorariumTimeOUT}
                    </TableCell>

                    <TableCell
                      sx={{
                        backgroundColor: "#F2B28C",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {!row.officialTimeIN || !row.timeOUT || row.formattedFacultyRenderedTimeHN === "NaN:NaN:NaN" ? "00:00:00" : row.formattedFacultyRenderedTimeHN}
                    </TableCell>
                    {/*    ----------------------HN  ------------------------------*/}
                    <TableCell
                      sx={{
                        backgroundColor: "#ffd2d2",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {!row.officialTimeIN || !row.timeOUT || row.formattedfinalcalcFacultyHN === "NaN:NaN:NaN" ? row.formattedFacultyMaxRenderedTimeHN : row.formattedfinalcalcFacultyHN}
                    </TableCell>
                    {/*    ----------------------HN  ------------------------------*/}

                    <TableCell>{row.officialServiceCreditTimeIN === "00:00:00 AM" ? "N/A" : row.timeIN}</TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#E5D0AC",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {row.officialServiceCreditTimeIN === "00:00:00 AM" ? "N/A" : row.officialServiceCreditTimeIN}
                    </TableCell>
                    <TableCell>{row.officialServiceCreditTimeOUT === "00:00:00 AM" ? "N/A" : row.timeOUT}</TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#E5D0AC",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {row.officialServiceCreditTimeOUT === "00:00:00 AM" ? "N/A" : row.officialServiceCreditTimeOUT}
                    </TableCell>

                    <TableCell
                      sx={{
                        backgroundColor: "#F2B28C",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {!row.officialTimeSC || !row.timeOUT || row.formattedFacultyRenderedTimeSC === "NaN:NaN:NaN" ? "00:00:00" : row.formattedFacultyRenderedTimeSC}
                    </TableCell>
                    {/*    ----------------------SC  ------------------------------*/}
                    <TableCell
                      sx={{
                        backgroundColor: "#ffd2d2",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {!row.officialTimeIN || !row.timeOUT || row.formattedfinalcalcFacultySC === "NaN:NaN:NaN" ? row.formattedFacultyMaxRenderedTimeSC : row.formattedfinalcalcFacultySC}
                    </TableCell>
                    {/*    ----------------------SC  ------------------------------*/}

                    <TableCell>{row.officialOverTimeIN === "00:00:00 AM" ? "N/A" : row.timeIN}</TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#E5D0AC",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {row.officialOverTimeIN === "00:00:00 AM" ? "N/A" : row.officialOverTimeIN}
                    </TableCell>
                    <TableCell>{row.officialOverTimeOUT === "00:00:00 AM" ? "N/A" : row.timeOUT}</TableCell>
                    <TableCell sx={{ backgroundColor: "#E5D0AC", fontWeight: "bold", width: "100px", textAlign: "center" }}>{row.officialOverTimeOUT === "00:00:00 AM" ? "N/A" : row.officialOverTimeOUT}</TableCell>

                    <TableCell
                      sx={{
                        backgroundColor: "#F2B28C",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {!row.officialTimeIN || !row.timeOUT || row.formattedFacultyRenderedTimeOT === "NaN:NaN:NaN" ? "00:00:00" : row.formattedFacultyRenderedTimeOT}
                    </TableCell>

                    {/*    ----------------------OT  ------------------------------*/}
                    <TableCell
                      sx={{
                        backgroundColor: "#ffd2d2",
                        fontWeight: "bold",
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {!row.officialTimeIN || !row.timeOUT || row.formattedfinalcalcFacultyOT === "NaN:NaN:NaN" ? row.formattedFacultyMaxRenderedTimeOT : row.formattedfinalcalcFacultyOT}
                    </TableCell>
                    {/*    ----------------------OT  ------------------------------*/}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} sx={{ fontWeight: "bold", textAlign: "right" }}>
                    Total Rendered Time (Morning):
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "#F2B28C",
                    }}
                  >
                    {calculateTotalRenderedTime()}
                  </TableCell>
                  <TableCell
                    colSpan={1}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "#ffd2d2",
                    }}
                  >
                    {calculateTotalRenderedTimeTardiness()}
                  </TableCell>
                  <TableCell colSpan={3} sx={{ fontWeight: "bold", textAlign: "right" }}>
                    Total Rendered Time (Honorarium):
                  </TableCell>
                  <TableCell colSpan={2} sx={{ fontWeight: "bold", textAlign: "center", backgroundColor: "#F2B28C" }}>
                    {calculateTotalRenderedTimeHN()}
                  </TableCell>
                  <TableCell
                    colSpan={1}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "#ffd2d2",
                    }}
                  >
                    {calculateTotalRenderedTimeTardinessHN()}
                  </TableCell>
                  <TableCell colSpan={3} sx={{ fontWeight: "bold", textAlign: "right" }}>
                    Total Rendered Time (Service Credit):
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "#F2B28C",
                    }}
                  >
                    {calculateTotalRenderedTimeSC()}
                  </TableCell>
                  <TableCell
                    colSpan={1}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "#ffd2d2",
                    }}
                  >
                    {calculateTotalRenderedTimeTardinessSC()}
                  </TableCell>

                  <TableCell colSpan={3} sx={{ fontWeight: "bold", textAlign: "right" }}>
                    Total Rendered Time (Overtime):
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "#F2B28C",
                    }}
                  >
                    {calculateTotalRenderedTimeOT()}
                  </TableCell>
                  <TableCell
                    colSpan={1}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "#ffd2d2",
                    }}
                  >
                    {calculateTotalRenderedTimeTardinessOT()}
                  </TableCell>
                  {/* <TableCell colSpan={3} sx={{ fontWeight: "bold", textAlign: "right" }}>
                    Total Rendered Time (ALL Overtime):
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "#bafac6",
                    }}
                  >
                    DUMMY
                  </TableCell>
                  <TableCell
                    colSpan={1}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "#ffd2d2",
                    }}
                  >
                    DUMMY
                  </TableCell> */}
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} sx={{ fontWeight: "bold", textAlign: "right" }}>
                    Overall Rendered Official Time <br /> {startDate} to {endDate}:
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "#E5D0AC",
                    }}
                  >
                    {calculateTotalRenderedTime()}
                  </TableCell>
                  <TableCell colSpan={3} sx={{ fontWeight: "bold", textAlign: "right" }}>
                    Overall Tardiness Ofiicial Time <br /> {startDate} to {endDate}:
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    sx={{
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: "red",
                    }}
                  >
                    {calculateTotalRenderedTimeTardiness()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}

       
      </Box>
       {/* save button */}
       <Button
          fullWidth
          onClick={saveOverallAttendance}
          variant="contained"
           sx={{ bgcolor: '#6D2323', color: '#FEF9E1', width: '100%', mb: 4 }}
        >
          Save Record
        </Button>
    </Container>
  );
};

export default AttendanceModuleFaculty;
