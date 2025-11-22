import React, { useState, useEffect } from 'react';
import { Typography, Box, Chip } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import apiService from '../data/apiService';

const StudentCompletionStats = () => {
  const { currentUser } = useAuth();
  const [averageScore, setAverageScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.id) {
      loadAttemptStats();
    }
  }, [currentUser?.id]);

  const loadAttemptStats = async () => {
    try {
      setLoading(true);

      // Load student's attempts
      const attemptsResponse = await apiService.getAttempts({ student: currentUser.id });
      const attempts = attemptsResponse.results || attemptsResponse;

      // Calculate average score percentage
      const averageScore = attempts.length > 0
        ? attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / attempts.length
        : 0;

      setAverageScore(Math.round(averageScore));
    } catch (error) {
      console.error('Error loading attempt stats:', error);
      setAverageScore(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
        <Typography variant="body2" color="inherit">
          Yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
      <Chip
        label={`O'rtacha ball: ${averageScore}%`}
        size="small"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          fontWeight: 'bold',
          '& .MuiChip-label': {
            fontSize: '0.75rem'
          }
        }}
      />
    </Box>
  );
};

export default StudentCompletionStats;