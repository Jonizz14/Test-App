import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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
import NotFoundPage from './pages/NotFoundPage';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6', // Blue-500
      light: '#60a5fa', // Blue-400
      dark: '#2563eb', // Blue-600
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1d4ed8', // Blue-700
      light: '#3b82f6', // Blue-500
      dark: '#1e40af', // Blue-800
      contrastText: '#ffffff',
    },
    success: {
      main: '#059669',
      light: '#34d399',
      dark: '#047857',
    },
    warning: {
      main: '#d97706',
      light: '#fbbf24',
      dark: '#b45309',
    },
    error: {
      main: '#dc2626',
      light: '#f87171',
      dark: '#b91c1c',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 0, // Minimal border radius
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
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
          borderRadius: 0,
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
    default:
      // Fallback to login if role is not recognized
      return <Navigate to="/login" replace />;
  }
};

export default App;
