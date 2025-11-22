import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const NotFoundPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          The page you're looking for doesn't exist or you don't have permission to access it.
        </Typography>

        <Button
          variant="contained"
          component={Link}
          to={isAuthenticated ? "/" : "/login"}
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;