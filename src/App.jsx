import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Import the new CSS system
import './styles/main.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { StatisticsProvider } from './context/StatisticsContext';
import { ServerTestProvider } from './context/ServerTestContext';

// Import pages (we'll create these next)
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import SellerDashboard from './pages/SellerDashboard';
import NotFoundPage from './pages/NotFoundPage';
import Questions from './pages/admin/Questions';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#0A1F44', // Dark blue from Tailwind
      light: '#102B60',
      dark: '#071A35',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFFFFF',
      light: '#F8FAFC',
      dark: '#E2E8F0',
      contrastText: '#0A1F44',
    },
    success: {
      main: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12, // Consistent rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
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
            borderRadius: 12,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
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
const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
);

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
        <div className="center min-h-screen bg-blue-50 p-4">
          <div className="card max-w-md text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-error mb-4">
              Xatolik yuz berdi
            </h2>
            <p className="text-secondary mb-4">
              Ilova ishlamayapti. Sahifani qayta yuklang yoki boshqa portda sinab ko'ring.
            </p>
            <p className="text-sm text-muted mb-4">
              Xato: {this.state.error?.message}
            </p>
            <div className="flex gap-2 justify-center">
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Qayta yuklash
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => window.location.href = '/test'}
              >
                Test sahifasi
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Test component to check if app is working - Health check page
const TestPage = () => {
  return (
    <div className="center p-8 text-center">
      <div className="card max-w-lg">
        <h2 className="text-3xl font-bold text-blue-600 mb-4">
          🎓 STIM Test App Ishlamoqda!
        </h2>
        <p className="text-secondary mb-4">
          Agar bu sahifani ko'rsangiz, app ishlamoqda.
        </p>
        <div className="space-y-2 mb-6">
          <p className="text-sm text-muted">
            URL: {window.location.href}
          </p>
          <p className="text-sm text-muted">
            Port: {window.location.port}
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.href = '/login'}
        >
          Login sahifasiga o'tish
        </button>
      </div>
    </div>
  );
};

// Main App component - Entry point of the application
// Provides routing, authentication, theming, and error handling
function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50,
    });
  }, []);

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
                <Route path="/user/password/questions" element={<Questions />} />

                {/* Protected routes - Require authentication and specific roles */}
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

                {/* Default redirect based on user role */}
                <Route
                  path="/"
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
