import React from 'react';
import { Box, CircularProgress, LinearProgress, Typography, Skeleton } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components for enhanced loading visuals
const LoadingContainer = styled(Box)(({ theme, fullScreen }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  minHeight: fullScreen ? '100vh' : '200px',
  gap: theme.spacing(2),
}));

const SpinnerContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

// Basic spinner component
export const LoadingSpinner = ({
  size = 40,
  color = 'primary',
  thickness = 4,
  message = 'Yuklanmoqda...',
  fullScreen = false
}) => (
  <LoadingContainer fullScreen={fullScreen}>
    <CircularProgress
      size={size}
      color={color}
      thickness={thickness}
      sx={{ mb: message ? 1 : 0 }}
    />
    {message && (
      <Typography variant="body2" color="text.secondary" align="center">
        {message}
      </Typography>
    )}
  </LoadingContainer>
);

// Linear progress component with message
export const LoadingProgress = ({
  message = 'Yuklanmoqda...',
  fullScreen = false,
  color = 'primary',
  variant = 'indeterminate'
}) => (
  <LoadingContainer fullScreen={fullScreen}>
    <Box sx={{ width: '100%', maxWidth: 300 }}>
      <LinearProgress color={color} variant={variant} />
    </Box>
    {message && (
      <Typography variant="body2" color="text.secondary" align="center">
        {message}
      </Typography>
    )}
  </LoadingContainer>
);

// Skeleton loader for cards
export const CardSkeleton = ({ count = 1, height = 120 }) => (
  <Box>
    {Array.from({ length: count }).map((_, index) => (
      <Box key={index} sx={{ mb: 2 }}>
        <Skeleton
          variant="rectangular"
          height={height}
          sx={{ borderRadius: 1, mb: 1 }}
        />
        <Skeleton variant="text" height={20} width="80%" />
        <Skeleton variant="text" height={20} width="60%" />
      </Box>
    ))}
  </Box>
);

// Skeleton loader for lists
export const ListSkeleton = ({ count = 5, showAvatar = true }) => (
  <Box>
    {Array.from({ length: count }).map((_, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {showAvatar && (
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            sx={{ mr: 2 }}
          />
        )}
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" height={20} width="70%" />
          <Skeleton variant="text" height={16} width="50%" />
        </Box>
      </Box>
    ))}
  </Box>
);

// Skeleton loader for tables
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box>
    {/* Header skeleton */}
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, mb: 1 }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} variant="text" height={20} />
      ))}
    </Box>
    {/* Row skeletons */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, mb: 1 }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" height={16} />
        ))}
      </Box>
    ))}
  </Box>
);

// Dashboard skeleton for main dashboard pages
export const DashboardSkeleton = () => (
  <Box>
    {/* Page header */}
    <Box sx={{ mb: 3 }}>
      <Skeleton variant="text" height={32} width="40%" />
      <Skeleton variant="text" height={20} width="60%" />
    </Box>

    {/* Stats cards */}
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Box key={index} sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
          <Skeleton variant="text" height={24} width="60%" />
          <Skeleton variant="text" height={32} width="40%" />
        </Box>
      ))}
    </Box>

    {/* Main content */}
    <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
      <Box>
        <CardSkeleton count={2} height={150} />
      </Box>
      <Box>
        <ListSkeleton count={6} />
      </Box>
    </Box>
  </Box>
);

// Button with loading state
export const LoadingButton = ({
  loading = false,
  children,
  _disabled,
  _variant = 'contained',
  color = 'primary',
  _size = 'medium',
  ..._props
}) => (
  <Box sx={{ position: 'relative', display: 'inline-block' }}>
    <Box
      sx={{
        opacity: loading ? 0.6 : 1,
        pointerEvents: loading ? 'none' : 'auto',
      }}
    >
      {children}
    </Box>
    {loading && (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <CircularProgress size={20} color={color} />
      </Box>
    )}
  </Box>
);

// Page loading overlay
export const PageLoadingOverlay = ({
  isLoading,
  message = 'Yuklanmoqda...',
  children
}) => {
  if (!isLoading) return children;

  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <SpinnerContainer>
          <CircularProgress size={50} />
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
        </SpinnerContainer>
      </Box>
    </Box>
  );
};

// Inline loading indicator for smaller components
export const InlineLoading = ({ size = 20, color = 'inherit' }) => (
  <CircularProgress size={size} color={color} sx={{ mr: 1 }} />
);

// Pulse loading animation for text content
export const PulseSkeleton = ({ width = '100%', height = 20 }) => (
  <Skeleton
    variant="text"
    width={width}
    height={height}
    animation="pulse"
  />
);

// Full screen loading component
export const FullScreenLoader = ({ message = 'Yuklanmoqda...', color = 'primary' }) => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      zIndex: 9999,
    }}
  >
    <SpinnerContainer>
      <CircularProgress size={60} color={color} />
      <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </SpinnerContainer>
  </Box>
);

export default {
  LoadingSpinner,
  LoadingProgress,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  LoadingButton,
  PageLoadingOverlay,
  InlineLoading,
  PulseSkeleton,
  FullScreenLoader
};