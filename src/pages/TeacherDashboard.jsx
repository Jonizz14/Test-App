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
  Assessment as AssessmentIcon,
  Add as AddIcon,
  BarChart as BarChartIcon,
  ExitToApp as LogoutIcon,
  School as SchoolIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from '../components/NotificationCenter';

// Import teacher sub-pages
import TeacherOverview from './teacher/TeacherOverview';
import CreateTest from './teacher/CreateTest';
import MyTests from './teacher/MyTests';
import TeacherStatistics from './teacher/TeacherStatistics';
import TestDetails from './teacher/TestDetails';
import StudentResult from './teacher/StudentResult';
import SentLessons from './teacher/SentLessons';

const TeacherDashboard = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Asosiy', icon: <DashboardIcon />, path: '/teacher' },
    { text: 'Test yaratish', icon: <AddIcon />, path: '/teacher/create-test' },
    { text: 'Mening testlarim', icon: <AssessmentIcon />, path: '/teacher/my-tests' },
    { text: 'Yuborilgan darslar', icon: <SchoolIcon />, path: '/teacher/sent-lessons' },
    { text: 'Statistika', icon: <BarChartIcon />, path: '/teacher/statistics' },
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
              <Route path="/" element={<TeacherOverview />} />
              <Route path="/create-test" element={<CreateTest />} />
              <Route path="/edit-test/:testId" element={<CreateTest />} />
              <Route path="/my-tests" element={<MyTests />} />
              <Route path="/test-details/:testId" element={<TestDetails />} />
              <Route path="/student-result/:attemptId" element={<StudentResult />} />
              <Route path="/sent-lessons" element={<SentLessons />} />
              <Route path="/statistics" element={<TeacherStatistics />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default TeacherDashboard;
