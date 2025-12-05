import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import PremiumModal from '../../components/PremiumModal';

const ManageStudents = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const usersData = await apiService.getUsers();
      const users = usersData.results || usersData;
      const studentUsers = users.filter(user => user.role === 'student');
      setStudents(studentUsers);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.display_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class_group?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  const handleTogglePremium = (student, currentStatus) => {
    if (currentStatus) {
      // Revoke premium directly
      revokePremium(student.id);
    } else {
      // Open modal to grant premium with pricing
      setSelectedStudent(student);
      setPremiumModalOpen(true);
    }
  };

  const handleGrantPremium = async (studentId, pricingPlan) => {
    try {
      // Grant premium with pricing information
      const response = await apiService.patch(`/users/${studentId}/grant_student_premium/`, {
        pricing_id: pricingPlan.id
      });

      // Reload students to get updated data
      await loadStudents();
      setSuccessMessage(`Premium berildi: ${pricingPlan.plan_name} - $${pricingPlan.discounted_price}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to grant premium:', error);
      alert('Premium berishda xatolik yuz berdi');
    }
  };

  const revokePremium = async (studentId) => {
    try {
      await apiService.patch(`/users/${studentId}/revoke_premium/`);

      // Reload students to get updated data
      await loadStudents();
      setSuccessMessage('Premium olib tashlandi');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to revoke premium:', error);
      alert('Premium olib tashlashda xatolik yuz berdi');
    }
  };

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
          O'quvchilarni boshqarish
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          O'quvchilarga premium status bering yoki olib tashlang
        </Typography>
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Alert
          severity="success"
          sx={{
            mb: 4,
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#059669',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}
        >
          ✅ {successMessage}
        </Alert>
      )}

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="O'quvchi nomini, ID yoki sinfini qidiring..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#64748b' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              '&:hover fieldset': {
                borderColor: '#2563eb'
              }
            }
          }}
        />
      </Box>

      {/* Students Table */}
      <Paper sx={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 3 }}>Ism</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Sinf</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Yo'nalish</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Premium Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                    {searchTerm ? 'Hech narsa topilmadi' : 'O\'quvchilar yo\'q'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} sx={{
                    '&:hover': {
                      backgroundColor: '#f8fafc'
                    }
                  }}>
                    <TableCell sx={{ py: 3 }}>
                      <Typography sx={{ fontWeight: 500, color: '#1e293b' }}>
                        {student.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      {student.display_id}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      {student.class_group || 'Noma\'lum'}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      {student.direction === 'natural' ? 'Tabiiy fanlar' :
                       student.direction === 'exact' ? 'Aniq fanlar' : 'Yo\'nalish yo\'q'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={student.is_premium ? <StarIcon /> : <StarBorderIcon />}
                        label={student.is_premium ? 'Premium bor' : 'Yo\'q'}
                        sx={{
                          backgroundColor: student.is_premium ? '#fef3c7' : '#f3f4f6',
                          color: student.is_premium ? '#d97706' : '#64748b',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleTogglePremium(student, student.is_premium)}
                        sx={{
                          borderColor: student.is_premium ? '#d97706' : '#2563eb',
                          color: student.is_premium ? '#d97706' : '#2563eb',
                          '&:hover': {
                            backgroundColor: student.is_premium ? '#fef3c7' : '#eff6ff',
                            borderColor: student.is_premium ? '#d97706' : '#2563eb'
                          }
                        }}
                      >
                        {student.is_premium ? 'Premium olib tashlash' : 'Premium berish'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Premium Modal */}
      <PremiumModal
        open={premiumModalOpen}
        onClose={() => {
          setPremiumModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onConfirm={handleGrantPremium}
      />
    </Box>
  );
};

export default ManageStudents;