import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  CheckCircle as CheckCircleIcon,
  LocalLibrary as LocalLibraryIcon,
  EmojiPeople as EmojiPeopleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const TeacherOverview = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [myTests, setMyTests] = useState([]);
  const [myTestAttempts, setMyTestAttempts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacherData();
  }, [currentUser.id]);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      
      // Load teacher's tests from API
      const testsResponse = await apiService.getTests({ teacher: currentUser.id });
      const teacherTests = testsResponse.results || testsResponse;
      setMyTests(teacherTests);

      // Load all test attempts and filter for teacher's tests
      const attemptsResponse = await apiService.getAttempts();
      const allAttempts = attemptsResponse.results || attemptsResponse;
      const teacherAttempts = allAttempts.filter(attempt =>
        teacherTests.some(test => test.id === attempt.test)
      );
      setMyTestAttempts(teacherAttempts);

      // Load all users to get student information
      const usersResponse = await apiService.getUsers();
      const allUsers = usersResponse.results || usersResponse;
      const studentUsers = allUsers.filter(user => user.role === 'student');
      setStudents(studentUsers);

    } catch (error) {
      console.error('Error loading teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate comprehensive statistics
  const totalTests = myTests.length;
  const activeTests = myTests.filter(test => test.is_active).length;
  const totalAttempts = myTestAttempts.length;
  const uniqueStudents = new Set(myTestAttempts.map(attempt => attempt.student)).size;

  // Calculate score statistics
  const scores = myTestAttempts.map(attempt => attempt.score || 0);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const highestScore = scores.length > 0
    ? Math.round(Math.max(...scores))
    : 0;
  const lowestScore = scores.length > 0
    ? Math.round(Math.min(...scores))
    : 0;

  // Recent activity with student names and test details
  const recentAttempts = myTestAttempts
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 8)
    .map(attempt => {
      const student = students.find(s => s.id === attempt.student);
      const test = myTests.find(t => t.id === attempt.test);

      return {
        ...attempt,
        studentName: student?.name || 'Noma\'lum o\'quvchi',
        studentId: student?.display_id || student?.username || 'N/A',
        testTitle: test?.title || 'Noma\'lum test'
      };
    });

  // Test performance summary
  const testPerformance = myTests.map(test => {
    const testAttempts = myTestAttempts.filter(attempt => attempt.test === test.id);

    return {
      ...test,
      attempts: testAttempts.length
    };
  }).sort((a, b) => b.attempts - a.attempts);

  const StatCard = ({ title, value, icon, color, subtitle }) => (
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
                lineHeight: 1.2,
                mb: 1
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  fontWeight: 500
                }}
              >
                {subtitle}
              </Typography>
            )}
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

  if (loading) {
    return (
      <Box sx={{ 
        p: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          O'qituvchi paneli
        </Typography>
        <Typography sx={{ color: '#64748b', mt: 2 }}>Yuklanmoqda...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: 4,
      backgroundColor: '#ffffff'
    }}>
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 2
          }}>
            O'qituvchi paneli
          </Typography>
          <Typography sx={{
            fontSize: '1.125rem',
            color: '#64748b',
            fontWeight: 400
          }}>
            Testlaringizni boshqaring va o'quvchilarning natijalarini kuzating
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/teacher/create-test')}
          sx={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            textTransform: 'none',
            minWidth: '200px',
            '&:hover': {
              backgroundColor: '#1d4ed8',
            }
          }}
        >
          Yangi test yaratish
        </Button>
      </Box>

      {/* Main Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <StatCard
              title="Jami yaratilgan testlar"
              value={totalTests}
              icon={<AssessmentIcon />}
              color="primary.main"
              subtitle={`${activeTests} ta faol`}
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <StatCard
              title="Faol testlar"
              value={activeTests}
              icon={<QuizIcon />}
              color="success.main"
              subtitle={`${totalTests - activeTests} ta nofaol`}
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <StatCard
              title="Jami urinishlar"
              value={totalAttempts}
              icon={<EmojiPeopleIcon />}
              color="secondary.main"
              subtitle={`${uniqueStudents} ta o'quvchi`}
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <div>
            <StatCard
              title="O'rtacha ball"
              value={`${averageScore}%`}
              icon={<TrendingUpIcon />}
              color="info.main"
              subtitle="O'quvchilar natijasi"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <div>
            <StatCard
              title="Eng yuqori ball"
              value={`${highestScore}%`}
              icon={<TrendingUpIcon />}
              color="success.main"
              subtitle="O'quvchilar natijasi"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <div>
            <StatCard
              title="Eng past ball"
              value={`${lowestScore}%`}
              icon={<TrendingUpIcon />}
              color="warning.main"
              subtitle="O'quvchilar natijasi"
            />
          </div>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* My Tests with Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: '400px',
            overflow: 'auto'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography sx={{
                fontWeight: 600,
                color: '#1e293b',
                fontSize: '1.25rem',
                mb: 3
              }}>
                Mening testlarim ({totalTests} ta)
              </Typography>
              <List sx={{ p: 0 }}>
              {testPerformance.slice(0, 8).map((test) => (
                <ListItem key={test.id} divider>
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" noWrap sx={{ maxWidth: '200px' }}>
                        {test.title}
                      </Typography>
                      <Chip
                        label={test.is_active ? 'Faol' : 'Nofaol'}
                        color={test.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Typography variant="body2" color="textSecondary">
                        {test.subject} • {test.total_questions} ta savol
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={`${test.attempts} urinish`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
              ))}
              {testPerformance.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="Hali test yaratilmagan"
                    secondary="Birinchi testni yaratib boshlang"
                  />
                </ListItem>
              )}
            </List>
            {testPerformance.length > 8 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button onClick={() => navigate('/teacher/my-tests')}>
                  Barcha testlarni ko'rish
                </Button>
              </Box>
            )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Student Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: '400px',
            overflow: 'auto'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography sx={{
                fontWeight: 600,
                color: '#1e293b',
                fontSize: '1.25rem',
                mb: 3
              }}>
                O'quvchilarning so'nggi faoliyati
              </Typography>
              <List sx={{ p: 0 }}>
              {recentAttempts.map((attempt) => (
                <ListItem key={`${attempt.id}-${attempt.student}`} divider>
                  <Box display="flex" alignItems="center" width="100%">
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {attempt.studentName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {attempt.studentName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" noWrap>
                        {attempt.testTitle}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={0.5} gap={1}>
                        <Chip
                          label={`${attempt.score}%`}
                          size="small"
                          color={attempt.score >= 80 ? 'success' : attempt.score >= 60 ? 'warning' : 'error'}
                        />
                         <Typography variant="caption" color="textSecondary">
                           {new Date(attempt.submitted_at).toLocaleDateString('uz-UZ')}
                         </Typography>
                       </Box>
                     </Box>
                   </Box>
                 </ListItem>
               ))}
               {recentAttempts.length === 0 && (
                 <ListItem>
                   <ListItemText
                     primary="Hali urinishlar yo'q"
                     secondary="O'quvchilar testlarni topshirganda bu yerda ko'rinadi"
                   />
                 </ListItem>
               )}
             </List>
           </CardContent>
         </Card>
       </Grid>
     </Grid>
   </Box>
 );
};

export default TeacherOverview;