import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dehaze as MenuIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  PlayArrow as PlayArrowIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  PowerSettingsNew as LogoutIcon,
  Security as ShieldIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useServerTest } from '../context/ServerTestContext';
import NotificationCenter from '../components/NotificationCenter';
import UnbanModal from '../components/UnbanModal';

// Import student sub-pages (we'll create these)
import StudentOverview from './student/StudentOverview';
import SearchTeachers from './student/SearchTeachers';
import TakeTest from './student/TakeTest';
import SubmitTest from './student/SubmitTest';
import TestResults from './student/TestResults';
import StudentStatistics from './student/StudentStatistics';
import ReceivedLessons from './student/ReceivedLessons';
import StudentProfile from './student/StudentProfile';
import TeacherDetails from './student/TeacherDetails';

const StudentDashboard = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { currentUser, logout, isBanned } = useAuth();
  const { sessionStarted } = useServerTest();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    if (sessionStarted && path !== '/student/take-test') {
      alert('Test topshirayotganingizda boshqa sahifalarga o\'ta olmaysiz. Avval testni yakunlang!');
      return;
    }
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };


  const menuItems = [
    { text: 'Asosiy', icon: <DashboardIcon />, path: '/student' },
    { text: 'O\'qituvchilarni izlash', icon: <SearchIcon />, path: '/student/search' },
    { text: 'Test topshirish', icon: <PlayArrowIcon />, path: '/student/take-test' },
    { text: 'Mening natijalarim', icon: <AssignmentTurnedInIcon />, path: '/student/results' },
    { text: 'Qabul qilingan darslar', icon: <SchoolIcon />, path: '/student/lessons' },
    { text: 'Statistika', icon: <BarChartIcon />, path: '/student/statistics' },
    { text: 'Ma\'lumotlarim', icon: <PersonIcon />, path: '/student/profile' },
  ];

  const drawer = (
    <Box sx={{
      backgroundColor: '#f8fafc',
      borderRight: '1px solid #e2e8f0',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Toolbar sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        minHeight: '64px',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 1
      }}
      data-aos="fade-down"
      data-aos-delay="100"
      >
        <Typography variant="h6" sx={{
          color: '#1e293b',
          fontWeight: 700,
          fontSize: '1.1rem'
        }}>
          STIM Test App
        </Typography>
      </Toolbar>
      <List sx={{ pt: 0 }}>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding sx={{ px: 1, py: 0.5 }}>
            <div data-aos="fade-right" data-aos-delay={200 + index * 50} style={{ width: '100%' }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                disabled={sessionStarted && item.path !== '/student/take-test'}
                sx={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '12px',
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background-color 0.4s ease, outline 0.4s ease, color 0.4s ease',
                  opacity: sessionStarted && item.path !== '/student/take-test' ? 0.5 : 1,
                  '&:hover': {
                    backgroundColor: sessionStarted && item.path !== '/student/take-test' ? 'transparent' : '#f1f5f9',
                    '& .MuiListItemIcon-root': {
                      color: sessionStarted && item.path !== '/student/take-test' ? '#64748b' : '#2563eb',
                    },
                    '& .MuiListItemText-primary': {
                      color: sessionStarted && item.path !== '/student/take-test' ? '#64748b' : '#2563eb',
                    }
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    '& .MuiListItemIcon-root': {
                      color: '#0284c7',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#0284c7',
                    }
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                  }
                }}
              >
                <ListItemIcon sx={{
                  color: '#64748b',
                  minWidth: '40px',
                  mr: 2
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                />
              </ListItemButton>
            </div>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box className="app-container" sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: '#ffffff',
          color: '#1e293b',
          width: '100%',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 4 }}
            >
              <MenuIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <ShieldIcon sx={{ mr: 1, color: '#2563eb', fontSize: '1.8rem' }} />
            <Typography variant="h6" noWrap component="div">
              STIM Test App
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Salom, {currentUser?.name}
          </Typography>
          {sessionStarted && (
            <Typography variant="body2" sx={{
              mr: 2,
              color: '#dc2626',
              fontWeight: 600,
              backgroundColor: '#fef2f2',
              px: 2,
              py: 0.5,
              borderRadius: '12px',
              border: '1px solid #dc2626'
            }}>
              ⚠️ Test faol
            </Typography>
          )}
          <NotificationCenter />
          <Button
            color="inherit"
            onClick={sessionStarted ? () => alert('Test topshirayotganingizda chiqa olmaysiz. Avval testni yakunlang!') : handleLogout}
            disabled={sessionStarted}
            startIcon={<LogoutIcon sx={{ fontSize: '1.4rem' }} />}
            sx={{
              opacity: sessionStarted ? 0.5 : 1,
              '&.Mui-disabled': {
                opacity: 0.5,
                cursor: 'not-allowed',
              }
            }}
          >
            Chiqish
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar Layout */}
      <Box sx={{ display: 'flex', width: '100%', mt: '64px', height: 'calc(100vh - 64px)' }}>
        {/* Navigation Sidebar */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                width: 280,
                boxSizing: 'border-box',
                backgroundColor: '#f8fafc',
                borderRight: '1px solid #e2e8f0',
                mt: '64px',
                height: 'calc(100vh - 64px)',
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Box
            sx={{
              width: 280,
              flexShrink: 0,
              backgroundColor: '#f8fafc',
              borderRight: '1px solid #e2e8f0',
              height: '100%',
              position: 'fixed',
              overflowY: 'auto',
            }}
          >
            {drawer}
          </Box>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            backgroundColor: '#ffffff',
            height: '100%',
            overflowY: 'auto',
            ml: isMobile ? 0 : '280px',
          }}
        >
          <Container maxWidth={false} data-aos="fade-in" data-aos-delay="300">
            <Routes>
              <Route path="/" element={<StudentOverview />} />
              <Route path="/search" element={<SearchTeachers />} />
              <Route path="/teacher-details/:teacherId" element={<TeacherDetails />} />
              <Route path="/take-test" element={<TakeTest />} />
              <Route path="/submit-test" element={<SubmitTest />} />
              <Route path="/results" element={<TestResults />} />
              <Route path="/lessons" element={<ReceivedLessons />} />
              <Route path="/statistics" element={<StudentStatistics />} />
              <Route path="/profile" element={<StudentProfile />} />
            </Routes>
          </Container>
        </Box>
      </Box>

      {/* Unban Modal for Banned Students */}
      <UnbanModal
        open={isBanned}
        onClose={() => {}} // Modal cannot be closed manually
      />
    </Box>
  );
};

export default StudentDashboard;