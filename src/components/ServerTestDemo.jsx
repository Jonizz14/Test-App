import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useServerTest } from '../context/ServerTestContext';
import apiService from '../data/apiService';
import { useAuth } from '../context/AuthContext';

const ServerTestDemo = () => {
  const { currentUser } = useAuth();
  const {
    currentSession,
    timeRemaining,
    isLoading,
    error,
    sessionStarted,
    startTestSession,
    continueTestSession,
    updateAnswers,
    submitTest,
    checkActiveSession,
    clearSession,
    formatTime,
    isSessionActive,
    hasTimeRemaining,
  } = useServerTest();

  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [demoAnswers, setDemoAnswers] = useState({});
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [demoScore, setDemoScore] = useState(0);

  useEffect(() => {
    loadAvailableTests();
  }, []);

  useEffect(() => {
    // Check for existing sessions on component mount
    checkForExistingSessions();
  }, []);

  const loadAvailableTests = async () => {
    try {
      const tests = await apiService.getTests({ is_active: true });
      // Filter for demo - get first few active tests
      setAvailableTests(tests.slice(0, 3));
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
  };

  const checkForExistingSessions = async () => {
    if (!currentUser) return;

    try {
      // Check for any active sessions
      const sessions = await apiService.getSessions({ 
        student: currentUser.id, 
        active_only: 'true' 
      });

      if (sessions && sessions.length > 0) {
        console.log('Found active session:', sessions[0]);
        // Could auto-continue here if desired
      }
    } catch (error) {
      console.error('Failed to check sessions:', error);
    }
  };

  const startDemoTest = async (test) => {
    try {
      setSelectedTest(test);
      setShowTestDialog(true);
      setDemoAnswers({});
      setDemoCompleted(false);
      
      // Start server session
      const session = await startTestSession(test.id);
      console.log('Demo session started:', session);
      
    } catch (error) {
      console.error('Failed to start demo test:', error);
    }
  };

  const continueDemoTest = async (test) => {
    try {
      const activeSession = await checkActiveSession(test.id);
      if (activeSession) {
        await continueTestSession(activeSession.session_id);
        setSelectedTest(test);
        setShowTestDialog(true);
        setDemoCompleted(false);
      }
    } catch (error) {
      console.error('Failed to continue demo test:', error);
    }
  };

  const handleDemoAnswerChange = (questionId, answer) => {
    const newAnswers = {
      ...demoAnswers,
      [questionId]: answer
    };
    setDemoAnswers(newAnswers);
    
    // Update server session (optional for demo)
    updateAnswers({ [questionId]: answer });
  };

  const submitDemoTest = async () => {
    try {
      const result = await submitTest();
      if (result.success) {
        setDemoScore(result.score);
        setDemoCompleted(true);
        setShowTestDialog(false);
      }
    } catch (error) {
      console.error('Failed to submit demo test:', error);
    }
  };

  const exitDemoTest = () => {
    setShowTestDialog(false);
    clearSession();
  };

  const DemoTimer = () => {
    if (!sessionStarted) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TimeIcon color="primary" />
          <Typography variant="h6">
            Qolgan vaqt: {formatTime(timeRemaining)}
          </Typography>
          <Chip 
            label={isSessionActive ? 'Faol' : 'Faol emas'} 
            color={isSessionActive ? 'success' : 'error'} 
            size="small" 
          />
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={Math.max(0, (timeRemaining / (selectedTest?.time_limit * 60 || 600)) * 100)}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', fontWeight: 700 }}>
        🕒 Server-Side Test Vaqti Demo
      </Typography>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Bu qanday ishlaydi?
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Bu demo server-side test vaqtini ko'rsatadi. Testni boshlashdan oldin sahifani yoping va qayta oching - 
          vaqt davom etishni ko'rasiz!
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="Server vaqti" color="primary" />
          <Chip label="Davomli timer" color="success" />
          <Chip label="Sahifa yangilashdan qochish" color="info" />
          <Chip label="Avtomatik tugash" color="warning" />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {demoCompleted && (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center', bgcolor: 'success.light' }}>
          <CheckIcon sx={{ fontSize: 48, color: 'success.dark', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Test muvaffaqiyatli tugallandi!
          </Typography>
          <Typography variant="h6">
            Natijangiz: {demoScore}%
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => setDemoCompleted(false)}
          >
            Boshqa test sinab ko'rish
          </Button>
        </Paper>
      )}

      {currentSession && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'info.light' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Faol test seansi
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography>
              Session ID: {currentSession.session_id}
            </Typography>
            <Chip 
              label={formatTime(timeRemaining)} 
              icon={<TimeIcon />}
              color="primary"
            />
          </Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Test: {currentSession.test_title}
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={clearSession}
          >
            Seansni tugatish
          </Button>
        </Paper>
      )}

      <Grid container spacing={3}>
        {availableTests.map((test) => (
          <Grid item xs={12} md={6} lg={4} key={test.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {test.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  {test.subject} • {test.time_limit} daqiqa
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  {test.description || 'Demo uchun test'}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip 
                    label={test.difficulty} 
                    size="small"
                    color={
                      test.difficulty === 'easy' ? 'success' :
                      test.difficulty === 'medium' ? 'warning' : 'error'
                    }
                  />
                  <Chip 
                    label={`${test.total_questions} savol`} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={() => startDemoTest(test)}
                  disabled={isLoading}
                >
                  Testni boshlash
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {availableTests.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Testlar topilmadi
          </Typography>
          <Typography sx={{ mb: 2 }}>
            Demo uchun hech qanday test mavjud emas.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={loadAvailableTests}
            startIcon={<RefreshIcon />}
          >
            Qayta yuklash
          </Button>
        </Paper>
      )}

      {/* Demo Test Dialog */}
      <Dialog 
        open={showTestDialog} 
        maxWidth="md" 
        fullWidth
        onClose={() => setShowTestDialog(false)}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>
              Demo Test: {selectedTest?.title}
            </Typography>
            <Button onClick={exitDemoTest}>
              Chiqish
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <DemoTimer />
          
          <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Demo savol: 2 + 2 nechaga teng?
            </Typography>
            
            <TextField
              fullWidth
              label="Javobingizni kiriting"
              value={demoAnswers[1] || ''}
              onChange={(e) => handleDemoAnswerChange(1, e.target.value)}
              sx={{ mb: 3 }}
            />
            
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              💡 <strong>Maslahat:</strong> Sahifani yoping va qayta oching. 
              Vaqt davom etishini ko'rasiz!
            </Typography>
          </Paper>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={exitDemoTest}>
            Chiqish
          </Button>
          <Button 
            variant="contained" 
            onClick={submitDemoTest}
            disabled={!demoAnswers[1]}
            color="primary"
          >
            Testni tugatish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServerTestDemo;