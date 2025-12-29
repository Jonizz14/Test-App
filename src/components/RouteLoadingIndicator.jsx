import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { LoadingSpinner, FullScreenLoader } from './LoadingComponents';

// Route-based loading indicator that shows different loading states
// based on the current route and loading context
const RouteLoadingIndicator = ({ 
  showFullScreen = false,
  customMessages = {},
  threshold = 500 // Minimum time to show loader (prevents flashing)
}) => {
  const location = useLocation();
  const { isLoading, hasAnyLoading } = useLoading();
  
  // Define route-specific loading messages
  const routeMessages = {
    '/admin': 'Admin ma\'lumotlari yuklanmoqda...',
    '/admin/teachers': 'O\'qituvchilar ro\'yxati yuklanmoqda...',
    '/admin/students': 'O\'quvchilar ro\'yxati yuklanmoqda...',
    '/admin/test-stats': 'Test statistikasi yuklanmoqda...',
    '/student': 'O\'quvchi ma\'lumotlari yuklanmoqda...',
    '/student/take-test': 'Test tayyorlanmoqda...',
    '/student/results': 'Natijalar yuklanmoqda...',
    '/teacher': 'O\'qituvchi ma\'lumotlari yuklanmoqda...',
    '/seller': 'Sotuvchi ma\'lumotlari yuklanmoqda...',
    '/headadmin': 'Head admin ma\'lumotlari yuklanmoqda...',
    ...customMessages
  };

  // Get loading message for current route
  const getCurrentMessage = () => {
    const path = location.pathname;
    
    // Find the most specific matching route
    for (const [route, message] of Object.entries(routeMessages)) {
      if (path.startsWith(route)) {
        return message;
      }
    }
    
    // Default message
    return 'Yuklanmoqda...';
  };

  // Check if current route should show loading
  const shouldShowLoading = () => {
    const path = location.pathname;
    
    // Routes that typically show loading
    const loadingRoutes = [
      '/admin',
      '/student', 
      '/teacher',
      '/seller',
      '/headadmin'
    ];
    
    return loadingRoutes.some(route => path.startsWith(route));
  };

  // Get loading state for current route
  const getRouteLoadingState = () => {
    const path = location.pathname;
    
    // Map routes to loading state keys
    const routeLoadingMap = {
      '/admin': 'admin_dashboard',
      '/admin/teachers': 'teachers_list',
      '/admin/students': 'students_list',
      '/admin/test-stats': 'test_statistics',
      '/student': 'student_dashboard',
      '/student/take-test': 'test_loading',
      '/student/results': 'results_loading',
      '/teacher': 'teacher_dashboard',
      '/seller': 'seller_dashboard',
      '/headadmin': 'head_admin_dashboard'
    };
    
    for (const [route, loadingKey] of Object.entries(routeLoadingMap)) {
      if (path.startsWith(route)) {
        return isLoading(loadingKey) || isLoading('route_navigation');
      }
    }
    
    return false;
  };

  // Show loading if route should have loading and there's actual loading
  const shouldShow = shouldShowLoading() && (getRouteLoadingState() || hasAnyLoading());

  // Don't render anything if not needed
  if (!shouldShow) {
    return null;
  }

  const message = getCurrentMessage();
  const loadingState = getRouteLoadingState();

  // Full screen loader for major page transitions
  if (showFullScreen && (loadingState || hasAnyLoading())) {
    return (
      <FullScreenLoader 
        message={message}
        color="primary"
      />
    );
  }

  // Inline loading indicator for content areas
  return (
    <LoadingSpinner 
      size={30}
      color="primary"
      message={message}
      fullScreen={false}
    />
  );
};

// Higher-order component to wrap routes with loading indicator
export const withRouteLoading = (WrappedComponent, options = {}) => {
  return function RouteLoadingWrapper(props) {
    return (
      <>
        <RouteLoadingIndicator {...options} />
        <WrappedComponent {...props} />
      </>
    );
  };
};

// Component for page-level loading with skeleton
export const PageLoadingWrapper = ({ 
  children, 
  isLoading, 
  skeleton = null,
  message = 'Yuklanmoqda...',
  minHeight = '200px'
}) => {
  if (isLoading) {
    return (
      <div style={{ minHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {skeleton || (
          <LoadingSpinner 
            size={40}
            color="primary"
            message={message}
            fullScreen={false}
          />
        )}
      </div>
    );
  }
  
  return children;
};

// Loading state hook for route-based loading
export const useRouteLoading = () => {
  const { isLoading, setLoading } = useLoading();
  
  const startRouteLoading = React.useCallback((route) => {
    setLoading(`route_${route}`, true);
  }, [setLoading]);
  
  const stopRouteLoading = React.useCallback((route) => {
    setLoading(`route_${route}`, false);
  }, [setLoading]);
  
  const isRouteLoading = React.useCallback((route) => {
    return isLoading(`route_${route}`);
  }, [isLoading]);
  
  return {
    startRouteLoading,
    stopRouteLoading,
    isRouteLoading,
    setLoading,
    isLoading
  };
};

// Loading progress bar for long-running operations
export const LoadingProgressBar = ({ 
  progress = 0, 
  show = false, 
  message = 'Yuklanmoqda...',
  color = 'primary' 
}) => {
  if (!show) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderBottom: '1px solid #e0e0e0',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      color: '#666'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        border: '2px solid #f3f3f3',
        borderTop: `2px solid var(--mui-palette-primary-main, #1976d2)`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span>{message}</span>
      {progress > 0 && (
        <div style={{
          flex: 1,
          height: '4px',
          backgroundColor: '#f0f0f0',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: 'var(--mui-palette-primary-main, #1976d2)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}
      {progress > 0 && <span>{Math.round(progress)}%</span>}
    </div>
  );
};

// Global loading overlay for critical operations
export const GlobalLoadingOverlay = ({ 
  isVisible, 
  message = 'Iltimos kuting...',
  progress = null,
  canCancel = false,
  onCancel = null 
}) => {
  if (!isVisible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #1976d2',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
          {message}
        </h3>
        {progress !== null && (
          <div style={{
            margin: '16px 0',
            height: '6px',
            backgroundColor: '#f0f0f0',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#1976d2',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
        {canCancel && onCancel && (
          <button 
            onClick={onCancel}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Bekor qilish
          </button>
        )}
      </div>
    </div>
  );
};

export default RouteLoadingIndicator;