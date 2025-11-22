import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    grade: '9',
    direction: 'natural'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  // Effect to handle redirect after successful registration
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // Navigate based on role
      if (currentUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (currentUser.role === 'teacher') {
        navigate('/teacher', { replace: true });
      } else if (currentUser.role === 'student') {
        navigate('/student', { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.first_name.trim()) {
      setError('Ism kiritilishi kerak');
      return;
    }

    if (!formData.last_name.trim()) {
      setError('Familiya kiritilishi kerak');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Parollar mos kelmaydi');
      return;
    }

    if (formData.password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting registration with:', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        grade: formData.grade,
        direction: formData.direction
      });

      const registrationData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      // Add student-specific fields
      if (formData.role === 'student') {
        registrationData.grade = parseInt(formData.grade);
        registrationData.direction = formData.direction;
      }

      await register(registrationData);

      // Don't navigate here - let the useEffect handle it after state updates
      console.log('Registration API call completed successfully');

    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Hisob yaratish
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="first_name"
              label="Ism"
              name="first_name"
              autoComplete="given-name"
              autoFocus
              value={formData.first_name}
              onChange={handleChange}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="last_name"
              label="Familiya"
              name="last_name"
              autoComplete="family-name"
              value={formData.last_name}
              onChange={handleChange}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email manzil"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Ro'yxatdan o'tish</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Ro'yxatdan o'tish"
                onChange={handleChange}
              >
                <MenuItem value="student">O'quvchi</MenuItem>
                <MenuItem value="teacher">O'qituvchi</MenuItem>
              </Select>
            </FormControl>

            {/* Grade selection for students */}
            {formData.role === 'student' && (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="grade-label">Sinf</InputLabel>
                  <Select
                    labelId="grade-label"
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    label="Sinf"
                    onChange={handleChange}
                  >
                    <MenuItem value="5">5-sinf</MenuItem>
                    <MenuItem value="6">6-sinf</MenuItem>
                    <MenuItem value="7">7-sinf</MenuItem>
                    <MenuItem value="8">8-sinf</MenuItem>
                    <MenuItem value="9">9-sinf</MenuItem>
                    <MenuItem value="10">10-sinf</MenuItem>
                    <MenuItem value="11">11-sinf</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel id="direction-label">Yo'nalish</InputLabel>
                  <Select
                    labelId="direction-label"
                    id="direction"
                    name="direction"
                    value={formData.direction}
                    label="Yo'nalish"
                    onChange={handleChange}
                  >
                    <MenuItem value="natural">Tabiiy fanlar</MenuItem>
                    <MenuItem value="exact">Aniq fanlar</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Parol"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Parolni tasdiqlash"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Hisob yaratilmoqda...' : 'Hisob yaratish'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Hisobingiz bormi?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Kirish
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;