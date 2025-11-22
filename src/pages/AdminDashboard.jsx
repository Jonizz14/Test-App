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
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// Import admin sub-pages (we'll create these)
import AdminOverview from './admin/AdminOverview';
import ManageTeachers from './admin/ManageTeachers';
import ManageStudents from './admin/ManageStudents';
import ManageTests from './admin/ManageTests';
import TestStatistics from './admin/TestStatistics';
import StudentRatings from './admin/StudentRatings';

const AdminDashboard = () => {
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
    { text: 'Umumiy', icon: <DashboardIcon />, path: '/admin' },
    { text: 'O\'qituvchilarni boshqarish', icon: <PeopleIcon />, path: '/admin/teachers' },
    { text: 'O\'quvchilarni boshqarish', icon: <PeopleIcon />, path: '/admin/students' },
    { text: 'Testlarni boshqarish', icon: <AssessmentIcon />, path: '/admin/tests' },
    { text: 'Testlar statistikasi', icon: <AssessmentIcon />, path: '/admin/test-stats' },
    { text: 'O\'quvchilar reytingi', icon: <PeopleIcon />, path: '/admin/student-ratings' },
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Test Platform Admin
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {currentUser?.name}
          </Typography>
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
              <Route path="/" element={<AdminOverview />} />
              <Route path="/teachers" element={<ManageTeachers />} />
              <Route path="/students" element={<ManageStudents />} />
              <Route path="/tests" element={<ManageTests />} />
              <Route path="/test-stats" element={<TestStatistics />} />
              <Route path="/student-ratings" element={<StudentRatings />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;