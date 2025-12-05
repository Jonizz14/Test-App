import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import {
  Group as GroupIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const SellerOverview = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    premiumStudents: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const usersData = await apiService.getUsers();
      const users = usersData.results || usersData;
      const students = users.filter(user => user.role === 'student');

      const totalStudents = students.length;
      const premiumStudents = students.filter(student => student.is_premium).length;

      // Calculate potential revenue (simplified)
      const premiumRevenue = premiumStudents * 9.99; // Assuming average price

      setStats({
        totalStudents,
        premiumStudents,
        totalRevenue: premiumRevenue,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'none',
      '&:hover': {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    }}>
      <CardContent sx={{
        p: 4,
        '&:last-child': { pb: 4 }
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#64748b',
                mb: 1
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#1e293b',
                lineHeight: 1.2
              }}
            >
              {loading ? '...' : value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color === 'primary.main' ? '#eff6ff' :
                              color === 'secondary.main' ? '#f0fdf4' :
                              color === 'success.main' ? '#ecfdf5' :
                              color === 'warning.main' ? '#fffbeb' :
                              '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ml: 2
            }}
          >
            {React.cloneElement(icon, {
              sx: {
                fontSize: '2rem',
                color: color === 'primary.main' ? '#2563eb' :
                       color === 'secondary.main' ? '#16a34a' :
                       color === 'success.main' ? '#059669' :
                       color === 'warning.main' ? '#d97706' :
                       '#64748b'
              }
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Typography
          sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 2
          }}
        >
          Seller Panel - Umumiy ma'lumotlar
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Premium obunalar va o'quvchilarni boshqarish uchun panel
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Jami o'quvchilar"
            value={stats.totalStudents}
            icon={<GroupIcon fontSize="large" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Premium o'quvchilar"
            value={stats.premiumStudents}
            icon={<StarIcon fontSize="large" />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Potensial daromad"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon={<MoneyIcon fontSize="large" />}
            color="success.main"
          />
        </Grid>
      </Grid>

      {/* Welcome Message */}
      <Paper sx={{
        p: 4,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <Typography variant="h6" gutterBottom sx={{
          fontWeight: 600,
          color: '#1e293b'
        }}>
          Xush kelibsiz, {currentUser?.name}!
        </Typography>
        <Typography variant="body1" sx={{
          color: '#334155',
          lineHeight: 1.6
        }}>
          Bu seller panel orqali siz o'quvchilarga premium status berishingiz va narxlarni boshqarishingiz mumkin.
          Chap menudan kerakli bo'limni tanlang.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SellerOverview;