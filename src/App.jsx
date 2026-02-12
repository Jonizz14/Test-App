import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import GlobalLoader from './components/GlobalLoader';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AOS from 'aos';
import 'aos/dist/aos.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { EconomyProvider } from './context/EconomyContext';
import { StatisticsProvider } from './context/StatisticsContext';
import { SettingsProvider } from './context/SettingsContext';
import { ServerTestProvider } from './context/ServerTestContext';
import { ThemeProvider as CustomThemeProvider } from './context/ThemeContext.jsx';
import { LoadingProvider } from './context/LoadingContext';
// Service Worker removed - not needed
import ScrollToTop from './components/ScrollToTop';
import RouteLoadingIndicator from './components/RouteLoadingIndicator';
import { SavedItemsProvider } from './context/SavedItemsContext';
import { SentMessagesProvider } from './context/SentMessagesContext';
import { NewsProvider } from './context/NewsContext';
import SmoothScroll from './components/SmoothScroll';
import NotesSidebar from './components/NotesSidebar';
import 'lenis/dist/lenis.css';
import MobileRestrictor from './components/MobileRestrictor';

// Lazy Load Pages for Performance Optimization
const NewsPage = React.lazy(() => import('./pages/NewsPage'));
const Home = React.lazy(() => import('./pages/Home'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const Questions = React.lazy(() => import('./pages/admin/Questions'));
const HeadAdminDashboard = React.lazy(() => import('./pages/HeadAdminDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const SellerDashboard = React.lazy(() => import('./pages/SellerDashboard'));
const ContentManagerDashboard = React.lazy(() => import('./pages/ContentManagerDashboard'));
const Docs = React.lazy(() => import('./pages/Docs'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const TheArchitect = React.lazy(() => import('./pages/TheArchitect'));


// Theme definition
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

const HeadAdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['head_admin']}>{children}</ProtectedRoute>
);

import { Box, Card, CardContent, Typography, Button, Alert, CircularProgress } from '@mui/material';

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

import HelpButton from './components/HelpButton';
import TextSelectionHandler from './components/TextSelectionHandler';
import Footer from './components/Footer';



// Animated wrapper for routes to provide smooth page transitions
const AnimatedRoutes = () => {
  const location = useLocation();

  // Check if current route is a dashboard route (no animation needed)
  const isDashboardRoute = ['/admin', '/teacher', '/student'].some(route =>
    location.pathname.startsWith(route)
  );

  return (
    <div key={isDashboardRoute ? 'dashboard' : location.pathname} className={isDashboardRoute ? '' : 'page-fade-entrance'}>
      <Routes location={location}>
        {/* Test routes - Health check and testing endpoints */}
        <Route path="/test" element={<TestPage />} />
        <Route path="/health" element={
          <div className="center p-4">
            ✅ App is healthy! Port: {window.location.port}
          </div>
        } />

        {/* Public routes - Accessible without authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/updates" element={<NewsPage />} />

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

        <Route
          path="/content-manager/*"
          element={
            <ProtectedRoute allowedRoles={['content_manager']}>
              <ContentManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Home page */}
        <Route path="/" element={<Home />} />

        {/* Contact page */}
        <Route path="/contact" element={<Contact />} />

        {/* Onboarding / Welcome page */}
        <Route path="/welcome" element={<Onboarding />} />

        {/* Documentation, FAQ and Architect pages */}
        <Route path="/docs" element={<Docs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/creator" element={<TheArchitect />} />


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
    </div>
  );
};

// Global header that only shows on chosen public routes
const GlobalHeader = () => {
  const location = useLocation();
  // Include only public routes and headadmin/seller dashboards
  const themedRoutes = ['/', '/login', '/contact', '/updates', '/headadmin', '/seller', '/student', '/content-manager', '/docs', '/faq', '/creator'];

  const isThemedRoute = themedRoutes.some(route =>
    route === '/' ? location.pathname === '/' : location.pathname.startsWith(route)
  );

  if (!isThemedRoute) return null;

  return <Header />;
};

// Global footer that only shows on chosen public routes
const GlobalFooter = () => {
  const location = useLocation();
  // Include only public routes and headadmin/seller dashboards
  const themedRoutes = ['/', '/login', '/contact', '/updates', '/docs', '/faq', '/creator'];

  const isThemedRoute = themedRoutes.some(route =>
    route === '/' ? location.pathname === '/' : location.pathname.startsWith(route)
  );

  if (!isThemedRoute) return null;

  return <Footer />;
};


import OnboardingExitGhost from './components/OnboardingExitGhost';

// Main App component - Entry point of the application
// Provides routing, authentication, theming, and error handling
function App() {
  const [isAppReady, setIsAppReady] = React.useState(false);
  const [isLoaderRemoved, setIsLoaderRemoved] = React.useState(false);
  const [showHelpOverlay, setShowHelpOverlay] = React.useState(false);

  // Unregister any old service workers on app load
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {!isLoaderRemoved && (
          <GlobalLoader
            onTransitionStart={() => setIsAppReady(true)}
            onFinished={() => setIsLoaderRemoved(true)}
          />
        )}
        <div className={`app-main-content ${isAppReady ? 'ready' : 'loading'}`}>
          <Router>
            <MobileRestrictor>
              <SmoothScroll>
                <CustomThemeProvider>
                  <LoadingProvider>
                    <AuthProvider>
                      <EconomyProvider>
                        <SentMessagesProvider>
                          <SavedItemsProvider>
                            <NewsProvider>
                              <StatisticsProvider>
                                <SettingsProvider>
                                  <ServerTestProvider>
                                    <ScrollToTop />
                                    <TextSelectionHandler />
                                    <HelpButton onClick={() => setShowHelpOverlay(true)} />
                                    <GlobalHeader />
                                    <NotesSidebar />
                                    <OnboardingExitGhost />
                                    {showHelpOverlay && (
                                      <React.Suspense fallback={null}>
                                        <Onboarding isOverlay={true} onClose={() => setShowHelpOverlay(false)} />
                                      </React.Suspense>
                                    )}
                                    {/* Global route loading indicator */}
                                    <RouteLoadingIndicator
                                      showFullScreen={false}
                                      threshold={300}
                                    />
                                    <React.Suspense fallback={
                                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                                        <CircularProgress size={40} />
                                      </Box>
                                    }>
                                      <AnimatedRoutes />
                                      <GlobalFooter />
                                    </React.Suspense>

                                  </ServerTestProvider>
                                </SettingsProvider>
                              </StatisticsProvider>
                            </NewsProvider>
                          </SavedItemsProvider>
                        </SentMessagesProvider>
                      </EconomyProvider>
                    </AuthProvider>
                  </LoadingProvider>
                </CustomThemeProvider>
              </SmoothScroll>
            </MobileRestrictor>
          </Router>
        </div>
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
    case 'content_manager':
      return <Navigate to="/content-manager" replace />;
    default:
      // Fallback to login if role is not recognized
      return <Navigate to="/login" replace />;
  }
};

export default App;
