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
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  ExitToApp as LogoutIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from '../components/NotificationCenter';
import UnbanModal from '../components/UnbanModal';

// Import student sub-pages (we'll create these)
import StudentOverview from './student/StudentOverview';
import SearchTeachers from './student/SearchTeachers';
import TakeTest from './student/TakeTest';
import TestResults from './student/TestResults';
import StudentStatistics from './student/StudentStatistics';
import ReceivedLessons from './student/ReceivedLessons';
import StudentProfile from './student/StudentProfile';
import TestDetails from './student/TestDetails';
import TeacherDetails from './student/TeacherDetails';

const StudentDashboard = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const { currentUser, logout, isBanned } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDrawerOpen(!drawerOpen);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Asosiy', icon: <DashboardIcon />, path: '/student' },
    { text: 'O\'qituvchilarni izlash', icon: <SearchIcon />, path: '/student/search' },
    { text: 'Test topshirish', icon: <AssessmentIcon />, path: '/student/take-test' },
    { text: 'Mening natijalarim', icon: <AssessmentIcon />, path: '/student/results' },
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
      }}>
        <img 
          src="/src/assets/image.png" 
          alt="STIM Test App Logo" 
          style={{ 
            height: '32px', 
            width: 'auto',
            maxWidth: '60px'
          }} 
        />
        <Typography variant="h6" sx={{ 
          color: '#1e293b',
          fontWeight: 700,
          fontSize: '1.1rem'
        }}>
          STIM Test App
        </Typography>
      </Toolbar>
      <List sx={{ pt: 0 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                },
                '&.Mui-selected': {
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  '& .MuiListItemIcon-root': {
                    color: '#0284c7',
                  }
                }
              }}
            >
              <ListItemIcon sx={{
                color: '#64748b',
                minWidth: '40px'
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
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 4 }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <ShieldIcon sx={{ mr: 1, color: '#2563eb' }} />
            <Typography variant="h6" noWrap component="div">
              STIM Anti-Cheat System
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Salom, {currentUser?.name}
          </Typography>
          <NotificationCenter />
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
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
          <Container maxWidth={false}>
            <Routes>
              <Route path="/" element={<StudentOverview />} />
              <Route path="/search" element={<SearchTeachers />} />
              <Route path="/teacher-details/:teacherId" element={<TeacherDetails />} />
              <Route path="/take-test" element={<TakeTest />} />
              <Route path="/test-details/:testId" element={<TestDetails />} />
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