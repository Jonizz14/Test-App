# Full-Stack Test Platform - Django REST Framework + React

## Overview

A comprehensive test platform with Django REST Framework backend and React frontend, featuring role-based authentication, test creation, submission, and analytics.

## 1. Backend Architecture (Django REST Framework)

### 1.1 Django Models

#### User Model (Custom User)
```python
class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    bio = models.TextField(blank=True)
    subjects = models.JSONField(default=list, blank=True)  # For teachers
    grade_level = models.CharField(max_length=20, blank=True)  # For students
    total_tests_taken = models.PositiveIntegerField(default=0)  # For students
    average_score = models.FloatField(default=0.0)  # For students
    total_tests_created = models.PositiveIntegerField(default=0)  # For teachers
    average_student_score = models.FloatField(default=0.0)  # For teachers
```

#### Test Model
```python
class Test(models.Model):
    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    time_limit = models.PositiveIntegerField(default=60)  # minutes
    total_questions = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
```

#### Question Model
```python
class Question(models.Model):
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('text_input', 'Text Input'),
        ('multiple_select', 'Multiple Select'),
    ]

    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    options = models.JSONField(default=list, blank=True)  # For multiple choice
    correct_answers = models.JSONField(default=list)  # List of correct answers
    explanation = models.TextField(blank=True)
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
```

#### TestSubmission Model
```python
class TestSubmission(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='submissions')
    answers = models.JSONField()  # {question_id: answer(s)}
    score = models.FloatField()  # Percentage
    total_points = models.PositiveIntegerField()
    earned_points = models.PositiveIntegerField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    time_taken = models.PositiveIntegerField()  # seconds

    class Meta:
        unique_together = ['student', 'test']  # One submission per student per test
        ordering = ['-submitted_at']
```

### 1.2 Django REST Framework API Endpoints

#### Authentication Endpoints
```
POST /api/auth/register/
- Register new user (student/teacher)
- Body: {username, email, password, role, bio?, subjects?, grade_level?}

POST /api/auth/login/
- JWT token authentication
- Body: {username/email, password}
- Returns: {access, refresh, user: {id, username, role, ...}}

POST /api/auth/refresh/
- Refresh JWT token
- Body: {refresh}
```

#### Test Management Endpoints
```
GET /api/tests/
- List all active tests (students see all, teachers see their own)
- Query params: subject, teacher_id, search

POST /api/tests/
- Create new test (teachers only)
- Body: {title, subject, description, time_limit, questions: [...]}

GET /api/tests/{id}/
- Get test details with questions

PUT /api/tests/{id}/
- Update test (teacher who created it only)

DELETE /api/tests/{id}/
- Delete test (teacher who created it only)

GET /api/tests/{id}/submissions/
- Get all submissions for a test (teacher/admin only)
```

#### Test Taking Endpoints
```
GET /api/tests/{id}/take/
- Get test for taking (students only)
- Returns test with questions but without correct answers

POST /api/tests/{id}/submit/
- Submit test answers
- Body: {answers: {question_id: answer(s)}, time_taken}
- Returns: {score, feedback: {question_id: {correct, explanation, ...}}}
```

#### Statistics Endpoints
```
GET /api/stats/student/
- Student statistics
- Returns: {total_tests, average_score, subject_performance, recent_scores}

GET /api/stats/teacher/
- Teacher statistics
- Returns: {total_tests, total_submissions, average_student_score, test_performance}

GET /api/stats/admin/
- Admin statistics
- Returns: {total_users, total_tests, total_submissions, user_stats, test_stats}
```

#### User Management Endpoints (Admin Only)
```
GET /api/users/
- List all users with roles

GET /api/users/{id}/
- Get user details

PUT /api/users/{id}/
- Update user (admin only)

DELETE /api/users/{id}/
- Delete user (admin only)
```

### 1.3 Authentication & Permissions

#### JWT Authentication
- Access tokens: 15 minutes
- Refresh tokens: 7 days
- Blacklist on logout

#### Permission Classes
```python
class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'student'

class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'teacher'

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class IsTeacherOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['teacher', 'admin']

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user == obj.teacher or request.user.role == 'admin'
```

### 1.4 Serializers

#### User Serializers
```python
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'bio', 'subjects', 'grade_level']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'bio', 'subjects', 'grade_level',
                 'total_tests_taken', 'average_score', 'total_tests_created', 'average_student_score']
        read_only_fields = ['id', 'total_tests_taken', 'average_score', 'total_tests_created', 'average_student_score']
```

#### Test Serializers
```python
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'options', 'points', 'order']

class TestCreateSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Test
        fields = ['title', 'subject', 'description', 'time_limit', 'questions']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        test = Test.objects.create(teacher=self.context['request'].user, **validated_data)

        for question_data in questions_data:
            Question.objects.create(test=test, **question_data)

        test.total_questions = len(questions_data)
        test.save()
        return test

class TestListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)

    class Meta:
        model = Test
        fields = ['id', 'title', 'subject', 'description', 'teacher_name', 'created_at', 'is_active', 'total_questions']
```

#### Submission Serializers
```python
class TestSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    test_title = serializers.CharField(source='test.title', read_only=True)

    class Meta:
        model = TestSubmission
        fields = ['id', 'student_name', 'test_title', 'score', 'submitted_at', 'time_taken']

class TestSubmitSerializer(serializers.Serializer):
    answers = serializers.DictField()
    time_taken = serializers.IntegerField(min_value=0)

    def validate_answers(self, value):
        # Validate that all required questions are answered
        test = self.context['test']
        required_questions = set(test.questions.values_list('id', flat=True))
        provided_answers = set(int(k) for k in value.keys())

        if not required_questions.issubset(provided_answers):
            raise serializers.ValidationError("All questions must be answered")

        return value
```

## 2. Frontend Architecture (React)

### 2.1 Project Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ErrorMessage.jsx
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── AuthLayout.jsx
│   ├── student/
│   │   ├── TestList.jsx
│   │   ├── TestTaking.jsx
│   │   ├── TestResults.jsx
│   │   ├── StudentStats.jsx
│   │   └── TeacherList.jsx
│   ├── teacher/
│   │   ├── TestCreator.jsx
│   │   ├── TestEditor.jsx
│   │   ├── TeacherStats.jsx
│   │   └── TestSubmissions.jsx
│   └── admin/
│       ├── UserManagement.jsx
│       ├── TestManagement.jsx
│       └── AdminStats.jsx
├── contexts/
│   ├── AuthContext.jsx
│   └── ApiContext.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useApi.js
│   └── useWebSocket.js
├── services/
│   ├── api.js
│   ├── auth.js
│   └── websocket.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   └── validators.js
├── pages/
│   ├── AuthPage.jsx
│   ├── StudentDashboard.jsx
│   ├── TeacherDashboard.jsx
│   ├── AdminDashboard.jsx
│   └── NotFoundPage.jsx
├── App.jsx
└── main.jsx
```

### 2.2 State Management

#### AuthContext
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    const { access, refresh, user } = response.data;

    setToken(access);
    setUser(user);
    localStorage.setItem('token', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  // Auto-login on app start
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isStudent: user?.role === 'student',
    isTeacher: user?.role === 'teacher',
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### API Context
```javascript
const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  const { token, logout } = useAuth();

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  });

  // Request interceptor for auth token
  api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  return (
    <ApiContext.Provider value={{ api }}>
      {children}
    </ApiContext.Provider>
  );
};
```

### 2.3 Key Components

#### TestCreator Component
```javascript
const TestCreator = () => {
  const [testData, setTestData] = useState({
    title: '',
    subject: '',
    description: '',
    time_limit: 60,
    questions: []
  });

  const addQuestion = () => {
    setTestData({
      ...testData,
      questions: [...testData.questions, {
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answers: [],
        explanation: '',
        points: 1
      }]
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...testData.questions];
    updatedQuestions[index][field] = value;
    setTestData({ ...testData, questions: updatedQuestions });
  };

  const submitTest = async () => {
    try {
      await api.post('/tests/', testData);
      // Redirect to test list
      navigate('/teacher/tests');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create test');
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>Create New Test</Typography>

      <TextField
        label="Test Title"
        value={testData.title}
        onChange={(e) => setTestData({ ...testData, title: e.target.value })}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Subject"
        value={testData.subject}
        onChange={(e) => setTestData({ ...testData, subject: e.target.value })}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Description"
        value={testData.description}
        onChange={(e) => setTestData({ ...testData, description: e.target.value })}
        fullWidth
        multiline
        rows={3}
        margin="normal"
      />

      <TextField
        label="Time Limit (minutes)"
        type="number"
        value={testData.time_limit}
        onChange={(e) => setTestData({ ...testData, time_limit: parseInt(e.target.value) })}
        margin="normal"
      />

      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
        Questions
      </Typography>

      {testData.questions.map((question, index) => (
        <QuestionEditor
          key={index}
          question={question}
          onChange={(field, value) => updateQuestion(index, field, value)}
          onDelete={() => removeQuestion(index)}
        />
      ))}

      <Button onClick={addQuestion} variant="outlined" sx={{ mt: 2 }}>
        Add Question
      </Button>

      <Box sx={{ mt: 3 }}>
        <Button onClick={submitTest} variant="contained" size="large">
          Create Test
        </Button>
      </Box>
    </div>
  );
};
```

#### TestTaking Component
```javascript
const TestTaking = () => {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTest();
  }, [id]);

  const loadTest = async () => {
    try {
      const response = await api.get(`/tests/${id}/take/`);
      setTest(response.data);
      setTimeLeft(response.data.time_limit * 60); // Convert to seconds
      setLoading(false);
    } catch (error) {
      setError('Failed to load test');
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !loading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && test) {
      submitTest();
    }
  }, [timeLeft, loading, test]);

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const submitTest = async () => {
    try {
      const response = await api.post(`/tests/${id}/submit/`, {
        answers,
        time_taken: test.time_limit * 60 - timeLeft
      });

      navigate('/student/results', {
        state: { test, submission: response.data }
      });
    } catch (error) {
      setError('Failed to submit test');
    }
  };

  if (loading) return <LoadingSpinner />;

  const question = test.questions[currentQuestion];

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">{test.title}</Typography>
        <Typography variant="h6" color="error">
          Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={(currentQuestion + 1) / test.questions.length * 100}
        sx={{ mb: 3 }}
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Question {currentQuestion + 1} of {test.questions.length}
          </Typography>
          <Typography variant="body1" paragraph>
            {question.question_text}
          </Typography>

          {question.question_type === 'multiple_choice' && (
            <FormControl component="fieldset">
              <RadioGroup
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
              >
                {question.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {question.question_type === 'text_input' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Enter your answer"
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between">
        <Button
          onClick={() => setCurrentQuestion(currentQuestion - 1)}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        {currentQuestion === test.questions.length - 1 ? (
          <Button onClick={submitTest} variant="contained" color="primary">
            Submit Test
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            variant="contained"
          >
            Next
          </Button>
        )}
      </Box>
    </div>
  );
};
```

### 2.4 Chart.js Integration

#### Student Statistics Component
```javascript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StudentStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/stats/student/');
      setStats(response.data);
    } catch (error) {
      setError('Failed to load statistics');
    }
  };

  if (!stats) return <LoadingSpinner />;

  const progressData = {
    labels: stats.recent_scores.map(s => s.date),
    datasets: [{
      label: 'Score Progress',
      data: stats.recent_scores.map(s => s.score),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.1,
    }],
  };

  const subjectData = {
    labels: Object.keys(stats.subject_performance),
    datasets: [{
      label: 'Average Score by Subject',
      data: Object.values(stats.subject_performance),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }],
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Score Progress</Typography>
          <Line data={progressData} />
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Performance by Subject</Typography>
          <Bar data={subjectData} />
        </Paper>
      </Grid>
    </Grid>
  );
};
```

## 3. Real-Time Updates

### 3.1 Django Channels (WebSocket)
```python
# routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/stats/$', consumers.StatsConsumer.as_asgi()),
    re_path(r'ws/tests/$', consumers.TestConsumer.as_asgi()),
]
```

### 3.2 React WebSocket Hook
```javascript
import { useEffect, useRef } from 'react';

export const useWebSocket = (url, onMessage) => {
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, onMessage]);

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { sendMessage };
};
```

## 4. Deployment & Production

### 4.1 Django Production Settings
```python
# settings.py
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com']

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
]

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'testplatform',
        'USER': 'dbuser',
        'PASSWORD': 'dbpass',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### 4.2 React Production Build
```bash
npm run build
# Serve static files from Django
```

### 4.3 Nginx Configuration
```
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;  # React dev server
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;  # Django server
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 5. Security Considerations

### 5.1 Input Validation
- All API inputs validated using Django serializers
- Frontend form validation
- SQL injection prevention with ORM
- XSS prevention with React's built-in escaping

### 5.2 Authentication Security
- JWT tokens with short expiration
- Refresh token rotation
- Password hashing with Django's auth system
- Rate limiting on auth endpoints

### 5.3 Data Protection
- HTTPS required in production
- Sensitive data encrypted
- CORS properly configured
- CSRF protection enabled

## 6. Testing Strategy

### 6.1 Backend Tests
```python
# tests.py
class TestAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass', role='student')

    def test_test_creation(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/tests/', {
            'title': 'Test Test',
            'subject': 'Math',
            'questions': [...]
        })
        self.assertEqual(response.status_code, 201)
```

### 6.2 Frontend Tests
```javascript
// TestComponent.test.js
import { render, screen } from '@testing-library/react';
import TestComponent from './TestComponent';

test('renders test component', () => {
  render(<TestComponent />);
  expect(screen.getByText('Test Component')).toBeInTheDocument();
});
```

## 7. Performance Optimization

### 7.1 Database Optimization
- Select related queries for foreign keys
- Database indexing on frequently queried fields
- Pagination for large result sets

### 7.2 API Optimization
- Response caching
- Database query optimization
- API rate limiting

### 7.3 Frontend Optimization
- Code splitting with React.lazy
- Image optimization
- Bundle analysis and tree shaking

This specification provides a complete blueprint for building a production-ready, full-stack test platform with Django REST Framework and React.