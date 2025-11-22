# Server Test Context Error Handling

This document describes error handling strategies for the server-side test timing system.

## Error Types and Handling

### 1. Session Not Found (404)
**Error Code:** `Session not found`

**Cause:** Session ID doesn't exist or has been deleted.

**Response:**
```json
{
  "error": "Session not found"
}
```

**Frontend Handling:**
- Clear any stored session data
- Show message: "Test session not found. Please start a new test."
- Reset test state to initial
- Hide test UI and show test selection

```jsx
try {
  const session = await continueTestSession(sessionId);
} catch (error) {
  if (error.response?.status === 404) {
    localStorage.removeItem('currentTestSession');
    clearSession();
    setError('Test session not found. Please start a new test.');
  }
}
```

### 2. Session Expired (410)
**Error Code:** `Test session has expired`

**Cause:** Time remaining reached zero and session was auto-expired.

**Response:**
```json
{
  "error": "Test session has expired"
}
```

**Frontend Handling:**
- Clear session data
- Show message: "Test time has expired. The test has been automatically submitted."
- Navigate to test results or show completion screen
- Prevent restarting the same test

```jsx
try {
  const session = await continueTestSession(sessionId);
} catch (error) {
  if (error.response?.status === 410) {
    setError('Test time has expired. The test has been automatically submitted.');
    // Navigate to results or completion screen
    navigate('/student/results');
  }
}
```

### 3. Test Already Completed (400)
**Error Code:** `Test already completed`

**Cause:** Student has already completed this test (attempt exists).

**Response:**
```json
{
  "error": "Test already completed"
}
```

**Frontend Handling:**
- Clear session data
- Show message: "You have already completed this test."
- Disable test start button
- Show results if available

```jsx
try {
  const session = await startTestSession(testId);
} catch (error) {
  if (error.response?.status === 400) {
    setError('You have already completed this test.');
    setTestCompleted(true);
  }
}
```

### 4. Test Not Found (404)
**Error Code:** `Test not found or inactive`

**Cause:** Test ID doesn't exist or test is not active.

**Response:**
```json
{
  "error": "Test not found or inactive"
}
```

**Frontend Handling:**
- Show message: "Test not found or is no longer available."
- Refresh test list
- Remove test from available tests

### 5. Network Errors
**Error Code:** Various network-related errors

**Cause:** Internet connection issues, server unavailable, etc.

**Response:** HTML error pages or network timeout

**Frontend Handling:**
- Show offline/connection error message
- Offer retry option
- Save current progress locally
- Don't clear test session (server session still valid)

```jsx
try {
  const result = await apiService.post('/sessions/complete_session/', data);
} catch (error) {
  if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
    setError('Connection lost. Your test session is still active.');
    setShowRetryButton(true);
    
    // Retry mechanism
    const retrySubmit = async () => {
      try {
        await submitTest();
        setShowRetryButton(false);
      } catch (retryError) {
        setError('Still unable to connect. Please check your internet connection.');
      }
    };
  }
}
```

### 6. Authentication Errors (401/403)
**Error Code:** Various authentication errors

**Cause:** Invalid or expired token, insufficient permissions.

**Response:** Authentication-related HTTP errors

**Frontend Handling:**
- Redirect to login page
- Clear all session data including test progress
- Show message: "Your session has expired. Please log in again."

```jsx
try {
  await startTestSession(testId);
} catch (error) {
  if (error.response?.status === 401 || error.response?.status === 403) {
    // Clear all data and redirect to login
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  }
}
```

## User Interface Error States

### Loading States
```jsx
// Loading during session operations
{isLoading && (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <CircularProgress size={20} />
    <Typography>Starting test...</Typography>
  </Box>
)}
```

### Error Display
```jsx
// Error messages with different severity
{error && (
  <Alert 
    severity={error.includes('expired') ? 'warning' : 'error'}
    onClose={() => setError(null)}
    action={
      error.includes('Connection') && (
        <Button color="inherit" size="small" onClick={retryOperation}>
          Retry
        </Button>
      )
    }
  >
    {error}
  </Alert>
)}
```

### Session Recovery UI
```jsx
// Automatic session recovery attempt
{!sessionStarted && !isLoading && (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Continuing your test...
    </Typography>
    <LinearProgress sx={{ mt: 2 }} />
  </Box>
)}
```

## Retry Mechanisms

### Automatic Retry for Network Errors
```jsx
const retryWithBackoff = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (error.response?.status >= 400 && error.response?.status < 500) {
        // Don't retry client errors
        throw error;
      }
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

### Manual Retry for User
```jsx
const handleManualRetry = () => {
  setError(null);
  setIsLoading(true);
  
  // Re-attempt the failed operation
  retryOperation()
    .catch(err => {
      setError('Operation failed. Please try again.');
      setIsLoading(false);
    });
};
```

## Session State Management

### Error Recovery States
```jsx
const [sessionState, setSessionState] = useState({
  isActive: false,
  isExpired: false,
  isCompleted: false,
  hasError: false,
  errorMessage: null
});

// Update state based on server response
const updateSessionState = (sessionData) => {
  setSessionState({
    isActive: sessionData.is_active,
    isExpired: sessionData.is_expired,
    isCompleted: sessionData.is_completed,
    hasError: false,
    errorMessage: null
  });
};
```

### Local Storage Recovery
```jsx
// Save session to localStorage for recovery
const saveSessionToStorage = (session) => {
  localStorage.setItem('currentTestSession', JSON.stringify({
    sessionId: session.session_id,
    testId: session.test,
    timestamp: Date.now()
  }));
};

// Recover session from localStorage
const recoverSessionFromStorage = () => {
  const saved = localStorage.getItem('currentTestSession');
  if (saved) {
    try {
      const { sessionId, testId, timestamp } = JSON.parse(saved);
      
      // Check if session is not too old (24 hours)
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return { sessionId, testId };
      }
    } catch (error) {
      // Invalid saved data, clear it
      localStorage.removeItem('currentTestSession');
    }
  }
  return null;
};
```

## User Experience Guidelines

### Clear Error Messages
- Use user-friendly language
- Avoid technical jargon
- Provide actionable next steps

### Graceful Degradation
- Test should remain functional during temporary issues
- Save progress automatically
- Provide clear recovery options

### Progress Preservation
- Never lose user answers during errors
- Auto-save every answer change
- Allow recovery after connection issues

### Timeout Handling
- Show countdown for timeouts
- Provide extension options if needed
- Auto-save before timeout expires

## Monitoring and Logging

### Client-Side Logging
```jsx
const logError = (error, context) => {
  console.error('Test Session Error:', {
    error: error.message,
    status: error.response?.status,
    context: context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
  
  // Send to monitoring service if available
  if (window.errorReporting) {
    window.errorReporting.captureException(error, {
      tags: { context: 'test-session' }
    });
  }
};
```

### Server-Side Monitoring
- Log all session-related errors
- Monitor session expiration rates
- Track completion vs abandonment rates
- Alert on unusual patterns

## Testing Error Scenarios

### Unit Tests
```javascript
// Test session not found
test('handles session not found error', async () => {
  mockAPI.get.mockRejectedValue({ response: { status: 404 } });
  
  await expect(continueTestSession('invalid-id')).rejects.toThrow();
  expect(clearSession).toHaveBeenCalled();
});

// Test session expiration
test('handles session expiration', async () => {
  mockAPI.get.mockRejectedValue({ response: { status: 410 } });
  
  await expect(continueTestSession('expired-id')).rejects.toThrow();
  expect(setError).toHaveBeenCalledWith('Test time has expired');
});
```

### Integration Tests
- Test full error scenarios
- Verify UI state changes
- Test retry mechanisms
- Verify session cleanup

### Manual Testing
- Test with network throttling
- Test with server errors
- Test session recovery flows
- Test timeout scenarios