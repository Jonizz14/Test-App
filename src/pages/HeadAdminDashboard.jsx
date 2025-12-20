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
  Badge,
} from '@mui/material';
import {
  Dehaze as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Home as DashboardIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Leaderboard as LeaderboardIcon,
  PowerSettingsNew as LogoutIcon,
  Security as ShieldIcon,
  Notifications as NotificationsIcon,
  AdminPanelSettings as AdminIcon,
  History as ActivityIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiService from '../data/apiService';
import NotificationCenter from '../components/NotificationCenter';

// Import head admin sub-pages (we'll create these)
import HeadAdminOverview from './headadmin/HeadAdminOverview';
import ManageAdmins from './headadmin/ManageAdmins';
import AddAdmin from './headadmin/AddAdmin';
import AdminDetails from './headadmin/AdminDetails';
import SiteActivity from './headadmin/SiteActivity';
import ContactMessages from './headadmin/ContactMessages';

// Import components
import BannedStudentsModal from '../components/BannedStudentsModal';

const HeadAdminDashboard = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [bannedStudents, setBannedStudents] = React.useState([]);
  const [modalOpen, setModalOpen] = React.useState(false);

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

  // Fetch banned students and pending admins
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await apiService.getUsers();
        const users = usersData.results || usersData;
        const banned = users.filter(user => user.role === 'student' && user.is_banned);
        setBannedStudents(banned);


      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Handle unbanning a student
  const handleUnbanStudent = async (studentId) => {
    try {
      await apiService.unbanUser(studentId);
      // Refresh banned students list
      const usersData = await apiService.getUsers();
      const users = usersData.results || usersData;
      const banned = users.filter(user => user.role === 'student' && user.is_banned);
      setBannedStudents(banned);
    } catch (error) {
      console.error('Failed to unban student:', error);
    }
  };

  const menuItems = [
    { text: 'Umumiy', icon: <DashboardIcon />, path: '/headadmin' },
    {
      text: 'Adminlarni boshqarish',
      icon: <AdminIcon />,
      path: '/headadmin/admins'
    },
    {
      text: 'Xabarlar',
      icon: <EmailIcon />,
      path: '/headadmin/messages'
    },
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
            <ShieldIcon sx={{ mr: 1, color: '#dc2626' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Head Admin Panel
            </Typography>
          </Box>
          {bannedStudents.length > 0 && (
            <IconButton
              color="inherit"
              onClick={() => setModalOpen(true)}
              sx={{
                mr: 2,
                color: '#dc2626',
                '&:hover': {
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                }
              }}
              title={`${bannedStudents.length} ta bloklangan o'quvchi bor`}
            >
              <Badge badgeContent={bannedStudents.length} color="error">
                <NotificationsIcon sx={{ fontSize: '1.3rem' }} />
              </Badge>
            </IconButton>
          )}

          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {currentUser?.name} (Head Admin)
          </Typography>
          <NotificationCenter />
          <Button
            variant="outlined"
            onClick={handleLogout}
            startIcon={<LogoutIcon sx={{ fontSize: '1.4rem' }} />}
            sx={{
              border: 'none',
              color: '#64748b',
              '&:hover': {
                backgroundColor: '#f1f5f9',
                border: 'none'
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
              <Route path="/" element={<HeadAdminOverview />} />
              <Route path="/admins" element={<ManageAdmins />} />
              <Route path="/add-admin" element={<AddAdmin />} />
              <Route path="/edit-admin/:id" element={<AddAdmin />} />
              <Route path="/admin-details/:id" element={<AdminDetails />} />
              <Route path="/messages" element={<ContactMessages />} />
            </Routes>
          </Container>
        </Box>
      </Box>

      {/* Banned Students Modal */}
      <BannedStudentsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        bannedStudents={bannedStudents}
        onUnbanStudent={handleUnbanStudent}
      />
    </Box>
  );
};

export default HeadAdminDashboard;