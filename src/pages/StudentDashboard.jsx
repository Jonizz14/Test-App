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
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dehaze as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  PlayArrow as PlayArrowIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  PowerSettingsNew as LogoutIcon,
  Security as ShieldIcon,
  CheckCircle as CheckCircleIcon,
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
import StudentProfileView from './student/StudentProfileView';
import TeacherDetails from './student/TeacherDetails';
import PricingPage from './student/PricingPage';
import StudentGifts from './student/StudentGifts';

const StudentDashboard = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = React.useState(null);
  const { currentUser, logout, isBanned } = useAuth();
  const { sessionStarted } = useServerTest();
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
                onClick={() => handleNavigation(item.path)}
                disabled={sessionStarted && item.path !== '/student/take-test'}
                sx={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '12px',
                  px: sidebarCollapsed ? 1.5 : 2,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  opacity: sessionStarted && item.path !== '/student/take-test' ? 0.5 : 1,
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
          <Typography variant="body1" sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            Salom, {currentUser?.name}
            {currentUser?.is_premium && (
              <CheckCircleIcon sx={{ color: '#10b981', fontSize: '1.2rem' }} />
            )}
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
          <IconButton
            onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
            sx={{ ml: 0.5 }}
          >
            <Avatar
              src={currentUser?.profile_photo_url}
              sx={{
                width: 40,
                height: 40,
                border: '2px solid rgba(255, 255, 255, 0.8)',
                backgroundColor: currentUser?.is_premium ? '#ffffff' : '#2563eb',
                color: currentUser?.is_premium ? '#2563eb' : '#ffffff'
              }}
            >
              {currentUser?.name.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={() => setProfileMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => {
            handleNavigation('/student/profile');
            setProfileMenuAnchor(null);
          }}
          sx={{ minWidth: 150 }}
        >
          <PersonIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          Profil
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (sessionStarted) {
              alert('Test topshirayotganingizda chiqa olmaysiz. Avval testni yakunlang!');
            } else {
              handleLogout();
            }
            setProfileMenuAnchor(null);
          }}
          sx={{ minWidth: 150 }}
        >
          <LogoutIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          Chiqish
        </MenuItem>
      </Menu>

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
              <Route path="/" element={<StudentOverview />} />
              <Route path="/search" element={<SearchTeachers />} />
              <Route path="/teacher-details/:teacherId" element={<TeacherDetails />} />
              <Route path="/take-test" element={<TakeTest />} />
              <Route path="/submit-test" element={<SubmitTest />} />
              <Route path="/results" element={<TestResults />} />
              <Route path="/lessons" element={<ReceivedLessons />} />
              <Route path="/statistics" element={<StudentStatistics />} />
              <Route path="/profile" element={<StudentProfile />} />
              <Route path="/student-profile/:id" element={<StudentProfileView />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/gifts" element={<StudentGifts />} />
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