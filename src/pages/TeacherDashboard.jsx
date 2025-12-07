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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  BarChart as BarChartIcon,
  PowerSettingsNew as LogoutIcon,
  School as SchoolIcon,
  Security as ShieldIcon,
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
import StudentProfileView from './student/StudentProfileView';

const TeacherDashboard = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
      <List sx={{ pt: 2 }}>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding sx={{ px: 1, py: 0.5 }}>
            <div style={{ width: '100%' }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '12px',
                  px: sidebarCollapsed ? 1.5 : 2,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  transition: 'background-color 0.4s ease, outline 0.4s ease, color 0.4s ease',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                    '& .MuiListItemIcon-root': {
                      color: '#2563eb',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#2563eb',
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
                  }
                }}
              >
                <ListItemIcon sx={{
                  color: '#64748b',
                  minWidth: sidebarCollapsed ? 'auto' : '40px',
                  mr: sidebarCollapsed ? 0 : 2
                }}>
                  {item.icon}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  />
                )}
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
          {!isMobile && (
            <IconButton
              color="inherit"
              aria-label="toggle sidebar"
              edge="start"
              onClick={handleSidebarToggle}
              sx={{
                mr: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#e2e8f0',
                }
              }}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon sx={{ fontSize: '1.2rem' }} />
              ) : (
                <ChevronLeftIcon sx={{ fontSize: '1.2rem' }} />
              )}
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          </Box>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Salom, {currentUser?.name}
          </Typography>
          <NotificationCenter />
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon sx={{ fontSize: '1.4rem' }} />}>
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
              width: sidebarCollapsed ? 80 : 280,
              flexShrink: 0,
              backgroundColor: '#f8fafc',
              borderRight: '1px solid #e2e8f0',
              height: '100%',
              position: 'fixed',
              overflowY: 'auto',
              transition: 'width 0.3s ease-in-out',
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
            ml: isMobile ? 0 : (sidebarCollapsed ? '80px' : '280px'),
            transition: 'margin-left 0.3s ease-in-out',
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
              <Route path="/student-profile/:id" element={<StudentProfileView />} />
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
