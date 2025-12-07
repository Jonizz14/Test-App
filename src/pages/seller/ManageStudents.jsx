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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
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
  const [starPackages, setStarPackages] = useState([]);
  const [starsDialogOpen, setStarsDialogOpen] = useState(false);
  const [givingStars, setGivingStars] = useState(false);

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

      // Load star packages
      const packagesResponse = await apiService.get('/star-packages/');
      setStarPackages(packagesResponse);
    } catch (error) {
      console.error('Failed to load data:', error);
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
      const response = await apiService.patch(`/users/${studentId}/grant_premium/`, {
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

  const handleGiveStars = (student) => {
    setSelectedStudent(student);
    setStarsDialogOpen(true);
  };

  const handleGiveStarsConfirm = async (packageData) => {
    try {
      setGivingStars(true);

      const response = await apiService.giveStars(selectedStudent.id, { stars: packageData.stars });

      // Update the student in the local state with the response data
      if (response && response.student) {
        setStudents(prevStudents =>
          prevStudents.map(student =>
            student.id === selectedStudent.id ? response.student : student
          )
        );
        setFilteredStudents(prevFiltered =>
          prevFiltered.map(student =>
            student.id === selectedStudent.id ? response.student : student
          )
        );
      } else {
        // Fallback to reloading if response doesn't contain student data
        await loadStudents();
      }

      setStarsDialogOpen(false);
      setSelectedStudent(null);
      setSuccessMessage(`${packageData.stars} yulduz ${selectedStudent.name}ga berildi!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to give stars:', error);
      alert('Yulduz berishda xatolik yuz berdi');
    } finally {
      setGivingStars(false);
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
                <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 3 }}>Ism Familiya</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Login</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Sinf</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Yo'nalish</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Yulduzlar</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Premium Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
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
                        {student.name || 'Noma\'lum'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      <Typography sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        backgroundColor: '#f8fafc',
                        px: 1,
                        py: 0.5,
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {student.display_id || student.username}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      {student.class_group || 'Noma\'lum'}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      {student.direction === 'natural' ? 'Tabiiy fanlar' :
                       student.direction === 'exact' ? 'Aniq fanlar' : 'Yo\'nalish yo\'q'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StarIcon sx={{ mr: 1, color: '#f59e0b' }} />
                        <Typography sx={{
                          fontWeight: 700,
                          color: '#d97706'
                        }}>
                          {student.stars || 0}
                        </Typography>
                      </Box>
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
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
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
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleGiveStars(student)}
                          sx={{
                            backgroundColor: '#f59e0b',
                            color: '#ffffff',
                            '&:hover': {
                              backgroundColor: '#d97706'
                            }
                          }}
                        >
                          Yulduz berish
                        </Button>
                      </Box>
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

      {/* Stars Dialog */}
      <Dialog
        open={starsDialogOpen}
        onClose={() => {
          setStarsDialogOpen(false);
          setSelectedStudent(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: '#1e293b',
          fontSize: '1.25rem'
        }}>
          {selectedStudent && `${selectedStudent.name}ga yulduz berish`}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3, color: '#64748b' }}>
            Qaysi yulduz paketini tanlaysiz?
          </Typography>

          <Grid container spacing={2}>
            {starPackages.map((pkg) => (
              <Grid item xs={12} sm={6} md={4} key={pkg.id}>
                <Card sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#f59e0b',
                    boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.1)'
                  }
                }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <StarIcon sx={{ fontSize: '2rem', color: '#f59e0b', mr: 1 }} />
                      <Typography sx={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#d97706'
                      }}>
                        {pkg.stars}
                      </Typography>
                    </Box>

                    <Typography sx={{
                      fontWeight: 600,
                      color: '#1e293b',
                      mb: 1
                    }}>
                      ${pkg.discounted_price}
                    </Typography>

                    {pkg.discount_percentage > 0 && (
                      <Typography sx={{
                        fontSize: '0.75rem',
                        color: '#059669',
                        mb: 2
                      }}>
                        {pkg.discount_percentage}% chegirma
                      </Typography>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleGiveStarsConfirm(pkg)}
                      disabled={givingStars}
                      sx={{
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: '#d97706'
                        },
                        '&:disabled': {
                          backgroundColor: '#d1d5db'
                        }
                      }}
                    >
                      {givingStars ? 'Berilmoqda...' : 'Tanlash'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setStarsDialogOpen(false);
              setSelectedStudent(null);
            }}
            sx={{
              color: '#374151',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Bekor qilish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageStudents;