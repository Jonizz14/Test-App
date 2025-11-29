import React, { useState, useEffect, useMemo } from "react";
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
  IconButton,
  Collapse,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import apiService from "../../data/apiService";

const StudentRatings = () => {
  const [originalStudents, setOriginalStudents] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [sortField, setSortField] = useState('average_score');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const allUsers = await apiService.getUsers();
        const studentUsers = allUsers.filter((user) => user.role === "student");
        
        // Load attempts data to calculate accurate test statistics
        const allAttempts = await apiService.getAttempts();
        setAttempts(allAttempts);
        

        
        // Calculate test statistics for each student
        const studentsWithStats = studentUsers.map(student => {
          const studentAttempts = allAttempts.filter(attempt => attempt.student === student.id);
          const testCount = studentAttempts.length;
          const averageScore = testCount > 0 
            ? studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / testCount
            : 0;
          
          return {
            ...student,
            total_tests_taken: testCount,
            average_score: averageScore
          };
        });
        
        setOriginalStudents(studentsWithStats);
      } catch (error) {
        console.error("Failed to load students:", error);
      }
    };
    loadStudents();
  }, []);

  const students = useMemo(() => {
    if (originalStudents.length === 0) return [];

    return [...originalStudents].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'average_score':
          aValue = a.average_score || 0;
          bValue = b.average_score || 0;
          break;
        case 'total_tests_taken':
          aValue = a.total_tests_taken || 0;
          bValue = b.total_tests_taken || 0;
          break;
        case 'name':
          aValue = (a.name || a.username || '').toLowerCase();
          bValue = (b.name || b.username || '').toLowerCase();
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        case 'class_group':
          aValue = (a.class_group || '').toLowerCase();
          bValue = (b.class_group || '').toLowerCase();
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        case 'direction':
          aValue = (a.direction || '').toLowerCase();
          bValue = (b.direction || '').toLowerCase();
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        case 'registration_date':
          aValue = a.registration_date ? new Date(a.registration_date).getTime() : 0;
          bValue = b.registration_date ? new Date(b.registration_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [sortField, sortDirection, originalStudents]);

  const handleExpandClick = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleTestCountClick = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      alert(`Testlar soni: ${student.total_tests_taken || 0}`);
    }
  };

  const handleAverageScoreClick = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      alert(`O'rtacha ball: ${(student.average_score || 0).toFixed(1)}%`);
    }
  };

  return (
    <Box
      sx={{
        py: 4,
        backgroundColor: "#ffffff",
      }}
    >
      <Box
        sx={{
          mb: 6,
          pb: 4,
          borderBottom: "1px solid #e2e8f0",
        }}
        data-aos="fade-down"
      >
        <Typography
          sx={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          O'quvchilar reytingi
        </Typography>
      </Box>

      <div data-aos="fade-up" data-aos-delay="200">
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
                  Ism
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('class_group')}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Sinflar
                  {sortField === 'class_group' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('total_tests_taken')}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Testlar soni
                  {sortField === 'total_tests_taken' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('average_score')}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  O'rtacha ball
                  {sortField === 'average_score' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('direction')}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Yo'nalish
                  {sortField === 'direction' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('registration_date')}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Ro'yxatdan o'tgan sana
                  {sortField === 'registration_date' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <React.Fragment key={student.id}>
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
                      onClick={() => handleExpandClick(student.id)}
                      sx={{
                        color: "#64748b",
                        "&:hover": {
                          backgroundColor: "#f1f5f9",
                          color: "#2563eb",
                        },
                      }}
                    >
                      {expanded[student.id] ? (
                        <KeyboardArrowUpIcon />
                      ) : (
                        <KeyboardArrowDownIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: "#1e293b",
                        fontSize: "0.875rem",
                      }}
                    >
                      {student.name || student.username}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      {student.class_group}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      onClick={() => handleTestCountClick(student.id)}
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
                      {student.total_tests_taken || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      onClick={() => handleAverageScoreClick(student.id)}
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
                      {(student.average_score || 0).toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {student.direction ? (
                      <Chip
                        label={student.direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar'}
                        size="small"
                        sx={{
                          backgroundColor: student.direction === 'natural' ? '#ecfdf5' : '#eff6ff',
                          color: student.direction === 'natural' ? '#059669' : '#2563eb',
                          fontWeight: 600,
                          borderRadius: '6px',
                          fontSize: '0.75rem'
                        }}
                      />
                    ) : (
                      <Typography sx={{ 
                        fontSize: '0.875rem', 
                        color: '#64748b',
                        fontStyle: 'italic'
                      }}>
                        To'ldirilmagan
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        color: student.registration_date ? "#1e293b" : "#64748b"
                      }}
                    >
                      {student.registration_date
                        ? new Date(student.registration_date).toLocaleDateString()
                        : "To'ldirilmagan"}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={7}
                  >
                    <Collapse
                      in={expanded[student.id]}
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
                              Display ID
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "#1e293b",
                                fontFamily: 'monospace'
                              }}
                            >
                              {student.display_id || student.username}
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
                              Status
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "#1e293b",
                              }}
                            >
                              {student.is_active ? 'Faol' : 'Nofaol'}
                            </Typography>
                          </Box>
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
      </div>

      {students.length === 0 && (
        <div data-aos="fade-up" data-aos-delay="300">
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h6" color="textSecondary">
              O'quvchilar topilmadi
            </Typography>
          </Box>
        </div>
      )}
    </Box>
  );
};

export default StudentRatings;
