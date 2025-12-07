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
  Home as DashboardIcon,
  Group as GroupIcon,
  AttachMoney as MoneyIcon,
  PowerSettingsNew as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// Import seller sub-pages (we'll create these)
import SellerOverview from './seller/SellerOverview';
import ManageStudents from './seller/ManageStudents';
import ManagePrices from './seller/ManagePrices';
import ManageGifts from './seller/ManageGifts';

const SellerDashboard = () => {
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
    { text: 'Umumiy', icon: <DashboardIcon />, path: '/seller' },
    { text: 'O\'quvchilarni boshqarish', icon: <GroupIcon />, path: '/seller/students' },
    { text: 'Narxlarni boshqarish', icon: <MoneyIcon />, path: '/seller/prices' },
    { text: 'Sovg\'alar', icon: <DashboardIcon />, path: '/seller/gifts' },
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
              transition: 'width 0.3s ease',
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
            transition: 'margin-left 0.3s ease',
          }}
        >
          <Container maxWidth={false}>
            <Routes>
              <Route path="/" element={<SellerOverview />} />
              <Route path="/students" element={<ManageStudents />} />
              <Route path="/prices" element={<ManagePrices />} />
              <Route path="/gifts" element={<ManageGifts />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default SellerDashboard;