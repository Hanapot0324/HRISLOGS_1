import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';


const SuccessfulOverlay = ({ open, action, onClose }) => {
  // Auto-close after 2.5s
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 2500); // 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);


  if (!open) return null;


  const getMessage = () => {
    switch (action) {
      case 'create':
        return 'Successfully Created!';
      case 'edit':
        return 'Successfully Edited!';
      case 'delete':
        return 'Successfully Deleted!';
      case 'send':
        return 'Successfully Sent!';
      case 'download':
        return 'Successfully Downloaded!';
      case 'gmail':
        return 'Successfully Sent to Gmail!';
      case 'submit':
        return 'Successfully Submitted!';
      default:
        return 'Action Successful!';
    }
  };


  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background:
          'linear-gradient(135deg, #fef9e1 0%, #000000 50%, #a31d1d 100%)',
        opacity: 0.8, // 🔥 Makes entire overlay 50% transparent
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        flexDirection: 'column',
      }}
    >
      <CheckCircleIcon
        sx={{
          fontSize: 100,
          color: '#fff', // ✅ white for contrast on dark gradient
          animation: 'popIn 0.6s ease-out',
        }}
      />
      <Typography
        variant="h6"
        sx={{
          mt: 3,
          color: '#fff',
          fontWeight: 'bold',
          animation: 'fadeIn 1s ease-in-out',
        }}
      >
        {getMessage()}
      </Typography>


      <style>
        {`
          @keyframes popIn {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};


export default SuccessfulOverlay;





