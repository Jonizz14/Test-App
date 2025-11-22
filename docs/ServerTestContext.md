# Server Test Context Implementation

This document describes the server-side test timing implementation that ensures the test timer continues even when the user leaves or refreshes the page.

## Overview

The server test context provides a robust way to manage test sessions with server-calculated timing. This prevents cheating and ensures that test time cannot be manipulated by the client.

## Key Features

### 1. Server-Side Session Management
- Test sessions are created and managed on the server
- Each session has a unique `session_id` for identification
- Sessions track start time, expiration time, and answers
- Server calculates remaining time based on actual elapsed time

### 2. Persistent Timer
- Timer continues even when page is closed or refreshed
- Server calculates time remaining based on `expires_at` timestamp
- Client only displays server-calculated time
- Automatic session expiration when time runs out

### 3. Session States
- **Active**: Session is running and has time remaining
- **Expired**: Time has run out but session not yet auto-submitted
- **Completed**: Test was successfully submitted
- **Error**: Session encountered an error state

## API Endpoints

### Start Test Session
```http
POST /api/sessions/start_session/
Content-Type: application/json
Authorization: Bearer <token>

{
  "test_id": 123
}
```

**Response:**
```json
{
  "id": 456,
  "session_id": "uuid-string-here",
  "test": 123,
  "test_title": "Math Test",
  "student": 789,
  "student_name": "student123",
  "started_at": "2025-11-22T10:55:00.000Z",
  "expires_at": "2025-11-22T11:05:00.000Z",
  "time_remaining": 600,
  "is_active": true,
  "answers": {}
}
```

### Get Test Session
```http
GET /api/sessions/get_session/?session_id=uuid-string-here
Authorization: Bearer <token>
```

### Update Session Answers
```http
PUT /api/sessions/update_answers/
Content-Type: application/json
Authorization: Bearer <token>

{
  "session_id": "uuid-string-here",
  "answers": {
    "123": "A",
    "124": "B",
    "125": "C"
  }
}
```

### Complete Test Session
```http
POST /api/sessions/complete_session/
Content-Type: application/json
Authorization: Bearer <token>

{
  "session_id": "uuid-string-here"
}
```

**Response:**
```json
{
  "success": true,
  "score": 85.5,
  "attempt_id": 789,
  "message": "Test completed successfully"
}
```

### Auto-expire Sessions
```http
POST /api/sessions/auto_expire_sessions/
Authorization: Bearer <admin_token>
```

## Frontend Usage

### Using ServerTestContext

```jsx
import { ServerTestProvider, useServerTest } from '../context/ServerTestContext';

function TestComponent() {
  const {
    currentSession,
    timeRemaining,
    sessionStarted,
    startTestSession,
    continueTestSession,
    updateAnswers,
    submitTest,
    formatTime,
  } = useServerTest();

  const handleStartTest = async (testId) => {
    try {
      const session = await startTestSession(testId);
      console.log('Test session started:', session.session_id);
    } catch (error) {
      console.error('Failed to start test:', error);
    }
  };

  const handleContinueTest = async (sessionId) => {
    try {
      const session = await continueTestSession(sessionId);
      console.log('Continuing test session:', session.session_id);
    } catch (error) {
      console.error('Failed to continue test:', error);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    // Update local state
    setAnswers({ ...answers, [questionId]: answer });
    
    // Save to server (optional, for persistence)
    updateAnswers({ [questionId]: answer });
  };

  const handleSubmit = async () => {
    try {
      const result = await submitTest();
      console.log('Test submitted:', result);
    } catch (error) {
      console.error('Failed to submit test:', error);
    }
  };

  return (
    <div>
      {sessionStarted && (
        <div>
          <p>Time Remaining: {formatTime(timeRemaining)}</p>
          <p>Session ID: {currentSession.session_id}</p>
        </div>
      )}
    </div>
  );
}

// App wrapper
function App() {
  return (
    <ServerTestProvider>
      <TestComponent />
    </ServerTestProvider>
  );
}
```

### Session Persistence

Test sessions are automatically persisted in localStorage for the user's convenience:

```jsx
// Automatic session restoration on component mount
useEffect(() => {
  const savedSessionId = localStorage.getItem('currentTestSession');
  if (savedSessionId) {
    continueTestSession(savedSessionId);
  }
}, []);
```

## Error Handling

### Session Expiration
- When time runs out, session is automatically marked as expired
- Test is auto-submitted with current answers
- User sees a message that time has expired

### Network Issues
- Failed API calls don't interrupt the test timer
- Answers are saved locally and can be resubmitted
- Session state is maintained on the server

### Session Recovery
- On page load, check for existing active sessions
- If found, continue from where user left off
- If session expired, show appropriate message

## Security Considerations

### Server-Side Validation
- All session operations require authentication
- Sessions are tied to specific student and test
- Server validates session ownership

### Time Integrity
- Time calculation is done entirely on server
- Client cannot manipulate time remaining
- Sessions expire based on server timestamp

### Answer Security
- Answers are stored server-side during session
- Final scoring is calculated on server
- Prevents answer manipulation

## Implementation Notes

### Database Schema
- `TestSession` model tracks all session data
- Indexed on `student`, `test`, and `session_id` for performance
- JSON field stores answers for flexibility

### Performance Considerations
- Sessions expire automatically (no cleanup needed)
- Efficient queries using indexes
- Minimal data transfer (only session state)

### Scalability
- Stateless session design
- Can be easily distributed across multiple servers
- No session data stored in memory

## Migration from Client-Side Timer

To migrate existing tests to use server-side timing:

1. Add `ServerTestProvider` to app root
2. Replace local timer state with server context
3. Update test start/continue logic
4. Add session persistence
5. Test session recovery after page refresh

## Testing

### Manual Testing
1. Start a test
2. Close browser tab
3. Reopen and continue test
4. Verify timer shows correct remaining time
5. Let time expire and verify auto-submission

### Automated Testing
- Test session creation and retrieval
- Test time calculation accuracy
- Test session expiration handling
- Test concurrent sessions prevention