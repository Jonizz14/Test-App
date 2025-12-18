import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AOS from 'aos';
import 'aos/dist/aos.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { StatisticsProvider } from './context/StatisticsContext';
import { ServerTestProvider } from './context/ServerTestContext';

// Import pages (we'll create these next)
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import HeadAdminDashboard from './pages/HeadAdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import SellerDashboard from './pages/SellerDashboard';
import NotFoundPage from './pages/NotFoundPage';
import Home from './pages/Home';
import PricingSelection from './pages/PricingSelection';
import Questions from './pages/admin/Questions';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue accent color
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Role-based route components
const AdminRoute = ({ children }) => {
  const { currentUser } = useAuth();

  // If admin hasn't selected a plan yet, redirect to pricing
  if (currentUser && currentUser.role === 'admin' && !currentUser.is_premium && !currentUser.admin_premium_plan) {
    return <Navigate to="/pricing" replace />;
  }

  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>;
};

const TeacherRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['teacher']}>{children}</ProtectedRoute>
);

const StudentRoute = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      {children}
    </ProtectedRoute>
  );
};

const SellerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['seller']}>{children}</ProtectedRoute>
);

const HeadAdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['head_admin']}>{children}</ProtectedRoute>
);

import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';

// Error Boundary Component - Catches and handles React errors gracefully
// Provides user-friendly error messages and recovery options
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            bgcolor: 'background.default'
          }}
        >
          <Card sx={{ maxWidth: 400, width: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="error" gutterBottom>
                Error Occurred
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The application is not working. Please reload the page or try a different port.
              </Typography>
              <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
                Error: {this.state.error?.message}
              </Alert>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => window.location.reload()}
                >
                  Reload
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.href = '/test'}
                >
                  Test Page
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Test component to check if app is working - Health check page
const TestPage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default'
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" color="primary" gutterBottom>
            STIM Test App is Working!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            If you can see this page, the app is working.
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              URL: {window.location.href}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Port: {window.location.port}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => window.location.href = '/login'}
          >
            Go to Login Page
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

// Main App component - Entry point of the application
// Provides routing, authentication, theming, and error handling
function App() {

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <StatisticsProvider>
            <ServerTestProvider>
              <Router>
              <Routes>
                {/* Test routes - Health check and testing endpoints */}
                <Route path="/test" element={<TestPage />} />
                <Route path="/health" element={
                  <div className="center p-4">
                    ✅ App is healthy! Port: {window.location.port}
                  </div>
                } />

                {/* Public routes - Accessible without authentication */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pricing" element={<PricingSelection />} />
                <Route path="/user/password/questions" element={<Questions />} />

                {/* Protected routes - Require authentication and specific roles */}
                <Route
                  path="/headadmin/*"
                  element={
                    <HeadAdminRoute>
                      <HeadAdminDashboard />
                    </HeadAdminRoute>
                  }
                />

                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/teacher/*"
                  element={
                    <TeacherRoute>
                      <TeacherDashboard />
                    </TeacherRoute>
                  }
                />

                <Route
                  path="/student/*"
                  element={
                    <StudentRoute>
                      <StudentDashboard />
                    </StudentRoute>
                  }
                />

                <Route
                  path="/seller/*"
                  element={
                    <SellerRoute>
                      <SellerDashboard />
                    </SellerRoute>
                  }
                />

                {/* Home page */}
                <Route path="/" element={<Home />} />

                {/* Dashboard redirect based on user role */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleBasedRedirect />
                    </ProtectedRoute>
                  }
                />

                {/* 404 page - Catch all unmatched routes */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
            </ServerTestProvider>
          </StatisticsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Component to redirect based on user role - Handles post-login navigation
const RoleBasedRedirect = () => {
  const { currentUser } = useAuth();

  // Redirect users to their appropriate dashboard based on role
  switch (currentUser?.role) {
    case 'head_admin':
      return <Navigate to="/headadmin" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'student':
      return <Navigate to="/student" replace />;
    case 'seller':
      return <Navigate to="/seller" replace />;
    default:
      // Fallback to login if role is not recognized
      return <Navigate to="/login" replace />;
  }
};

export default App;
