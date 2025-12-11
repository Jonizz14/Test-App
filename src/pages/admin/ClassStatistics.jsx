import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const ClassStatistics = () => {
  const [originalClasses, setOriginalClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState({});
  const [sortField, setSortField] = useState('averageScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    const loadClassStatistics = async () => {
      try {
        setLoading(true);

        // Fetch all necessary data
        const [usersData, attemptsData, testsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts(),
          apiService.getTests()
        ]);

        const users = usersData.results || usersData;
        const attempts = attemptsData.results || attemptsData;
        const tests = testsData.results || testsData;

        const students = users.filter(user => user.role === 'student');
        const teachers = users.filter(user => user.role === 'teacher');

        // Group students by class
        const classGroups = {};
        students.forEach(student => {
          const classGroup = student.class_group || 'Noma\'lum';
          if (!classGroups[classGroup]) {
            classGroups[classGroup] = {
              name: classGroup,
              students: [],
              curator: null
            };
          }
          classGroups[classGroup].students.push(student);
        });

        // Assign curators
        Object.keys(classGroups).forEach(className => {
          const curator = teachers.find(teacher => teacher.curator_class === className);
          if (curator) {
            classGroups[className].curator = curator;
          }
        });

        // Calculate statistics for each class
        const classStats = Object.values(classGroups).map(classGroup => {
          const classAttempts = attempts.filter(attempt =>
            classGroup.students.some(student => student.id === attempt.student)
          );

          let totalScore = 0;
          let studentsWithAttempts = 0;
          let activeStudents = 0;

          classGroup.students.forEach(student => {
            const studentAttempts = classAttempts.filter(attempt => attempt.student === student.id);
            if (studentAttempts.length > 0) {
              const studentAverage = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
              totalScore += studentAverage;
              studentsWithAttempts++;
            }

            // Active students (has login in last 30 days)
            if (student.last_login && new Date(student.last_login) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
              activeStudents++;
            }
          });

          return {
            ...classGroup,
            statistics: {
              totalStudents: classGroup.students.length,
              totalAttempts: classAttempts.length,
              averageScore: studentsWithAttempts > 0 ? Math.round(totalScore / studentsWithAttempts) : 0,
              activeStudents,
              totalTests: tests.length // This could be refined to show tests taken by class
            }
          };
        });

        setOriginalClasses(classStats);
      } catch (error) {
        console.error('Failed to load class statistics:', error);
        setError('Sinflar statistikasini yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadClassStatistics();
  }, []);

  // Filter classes based on search term
  const filteredClasses = originalClasses.filter(classGroup => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const className = classGroup.name.toLowerCase();
    const curatorName = classGroup.curator ? classGroup.curator.name.toLowerCase() : '';

    return className.includes(searchLower) || curatorName.includes(searchLower);
  });

  // Sort classes based on selected field and direction
  const classes = useMemo(() => {
    if (filteredClasses.length === 0) return [];

    return [...filteredClasses].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'averageScore':
          aValue = a.statistics.averageScore || 0;
          bValue = b.statistics.averageScore || 0;
          break;
        case 'totalAttempts':
          aValue = a.statistics.totalAttempts || 0;
          bValue = b.statistics.totalAttempts || 0;
          break;
        case 'totalStudents':
          aValue = a.statistics.totalStudents || 0;
          bValue = b.statistics.totalStudents || 0;
          break;
        case 'activeStudents':
          aValue = a.statistics.activeStudents || 0;
          bValue = b.statistics.activeStudents || 0;
          break;
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        case 'curator':
          aValue = (a.curator ? a.curator.name : '').toLowerCase();
          bValue = (b.curator ? b.curator.name : '').toLowerCase();
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [sortField, sortDirection, filteredClasses]);

  const handleViewDetails = (className) => {
    navigate(`/admin/class-details/${encodeURIComponent(className)}`);
  };

  const handleExpandClick = (className) => {
    setExpanded((prev) => ({ ...prev, [className]: !prev[className] }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleTestCountClick = (className) => {
    const classGroup = classes.find(c => c.name === className);
    if (classGroup) {
      alert(`Testlar soni: ${classGroup.statistics.totalAttempts || 0}`);
    }
  };

  const handleAverageScoreClick = (className) => {
    const classGroup = classes.find(c => c.name === className);
    if (classGroup) {
      alert(`O'rtacha ball: ${(classGroup.statistics.averageScore || 0).toFixed(1)}%`);
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Ma'lumotlar yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, backgroundColor: '#ffffff' }}>
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
          Sinflar reytingi
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Sinflarning o'zaro reytingi va statistik ko'rsatkichlari
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Sinf yoki rahbar nomini qidirish..."
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
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2563eb'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2563eb'
              }
            }
          }}
        />
      </Box>

      {/* Data Table */}
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#f8fafc",
                "& th": {
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "#1e293b",
                  borderBottom: "1px solid #e2e8f0",
                  padding: "16px",
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": {
                    backgroundColor: "#f1f5f9",
                  },
                },
              }}
            >
              <TableCell />
              <TableCell onClick={() => handleSort('name')}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Sinf
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('curator')}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Sinf rahbari
                  {sortField === 'curator' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('totalStudents')}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  O'quvchilar soni
                  {sortField === 'totalStudents' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('activeStudents')}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Faol o'quvchilar
                  {sortField === 'activeStudents' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('totalAttempts')}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Testlar soni
                  {sortField === 'totalAttempts' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('averageScore')}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  O'rtacha ball
                  {sortField === 'averageScore' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((classGroup, index) => (
              <React.Fragment key={classGroup.name}>
                <TableRow
                  sx={{
                    "&:hover": {
                      backgroundColor: "#f8fafc",
                    },
                    "& td": {
                      borderBottom: "1px solid #f1f5f9",
                      padding: "16px",
                      fontSize: "0.875rem",
                      color: "#334155",
                    },
                  }}
                >
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleExpandClick(classGroup.name)}
                      sx={{
                        color: "#64748b",
                        "&:hover": {
                          backgroundColor: "#f1f5f9",
                          color: "#2563eb",
                        },
                      }}
                    >
                      {expanded[classGroup.name] ? (
                        <KeyboardArrowUpIcon />
                      ) : (
                        <KeyboardArrowDownIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#e5e7eb' : index === 2 ? '#cd7f32' : '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: index < 3 ? '#ffffff' : '#64748b',
                        mr: 2
                      }}>
                        {index + 1}
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: "#1e293b",
                            fontSize: "0.875rem",
                          }}
                        >
                          {classGroup.name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {classGroup.curator ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {classGroup.curator.is_premium && classGroup.curator.profile_photo_url ? (
                          <Avatar
                            src={classGroup.curator.profile_photo_url}
                            sx={{
                              width: 32,
                              height: 32,
                              border: '2px solid #e2e8f0',
                              mr: 2
                            }}
                            imgProps={{
                              style: { objectFit: 'cover' }
                            }}
                          />
                        ) : (
                          <Avatar sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            mr: 2
                          }}>
                            {classGroup.curator.name ? classGroup.curator.name.charAt(0) : 'R'}
                          </Avatar>
                        )}
                        <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>
                          {classGroup.curator.name}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography sx={{
                        color: '#94a3b8',
                        fontStyle: 'italic',
                        fontSize: '0.875rem'
                      }}>
                        Rahbar yo'q
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      {classGroup.statistics.totalStudents}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        color: "#059669",
                      }}
                    >
                      {classGroup.statistics.activeStudents}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      onClick={() => handleTestCountClick(classGroup.name)}
                      sx={{
                        fontWeight: 700,
                        color: "#2563eb",
                        fontSize: "1.125rem",
                        cursor: "pointer",
                        "&:hover": {
                          textDecoration: "underline",
                          color: "#1d4ed8",
                        },
                      }}
                    >
                      {classGroup.statistics.totalAttempts || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      onClick={() => handleAverageScoreClick(classGroup.name)}
                      sx={{
                        fontWeight: 700,
                        color: "#059669",
                        fontSize: "1.125rem",
                        cursor: "pointer",
                        "&:hover": {
                          textDecoration: "underline",
                          color: "#047857",
                        },
                      }}
                    >
                      {(classGroup.statistics.averageScore || 0).toFixed(1)}%
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={8}
                  >
                    <Collapse
                      in={expanded[classGroup.name]}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box
                        sx={{
                          margin: 1,
                          p: 3,
                          backgroundColor: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <Typography
                          variant="h6"
                          gutterBottom
                          component="div"
                          sx={{
                            fontSize: "1.125rem",
                            fontWeight: 600,
                            color: "#1e293b",
                            mb: 2,
                          }}
                        >
                          Batafsil ma'lumotlar
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          <Box>
                            <Typography
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#64748b",
                                mb: 1,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Sinf kodi
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "#1e293b",
                                fontFamily: 'monospace'
                              }}
                            >
                              {classGroup.name}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#64748b",
                                mb: 1,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Rahbar
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "#1e293b",
                              }}
                            >
                              {classGroup.curator ? classGroup.curator.name : 'Yo\'q'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#64748b",
                                mb: 1,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Test muvaffaqiyati
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "#1e293b",
                              }}
                            >
                              {classGroup.statistics.totalAttempts > 0 ?
                                `${((classGroup.statistics.averageScore || 0) / 100).toFixed(1)}%` :
                                'Testlar yo\'q'
                              }
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="contained"
                            onClick={() => handleViewDetails(classGroup.name)}
                            startIcon={<VisibilityIcon />}
                            sx={{
                              backgroundColor: '#2563eb',
                              '&:hover': {
                                backgroundColor: '#1d4ed8'
                              },
                              borderRadius: '8px',
                              fontWeight: 600
                            }}
                          >
                            To'liq ko'rish
                          </Button>
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {classes.length === 0 && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Sinflar topilmadi
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ClassStatistics;