# 🏗️ ARCHITECTURE.md - Technical Architecture & Design System

Complete technical documentation for Test-App's architecture, design system, and component library.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Database Schema](#4-database-schema)
5. [Design System](#5-design-system)
6. [Component Library](#6-component-library)
7. [State Management](#7-state-management)
8. [Security Architecture](#8-security-architecture)
9. [Performance Optimization](#9-performance-optimization)

---

## 1. SYSTEM ARCHITECTURE

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT TIER                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  React 19 SPA (Vite Build)                  │   │
│  │  - Brutalist UI Components                   │   │
│  │  - Context API State Management             │   │
│  │  - i18next Localization                     │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS/REST
┌──────────────────▼──────────────────────────────────┐
│                  API GATEWAY                         │
│  ┌─────────────────────────────────────────────┐   │
│  │  Django REST Framework                       │   │
│  │  - JWT Authentication                        │   │
│  │  - Role-Based Access Control                │   │
│  │  - Request Validation                        │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                  DATA TIER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ PostgreSQL  │  │   Redis     │  │   S3/Local  │ │
│  │  Database   │  │   Cache     │  │   Storage   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

#### **Frontend**
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.2
- **UI Libraries**: 
  - Ant Design 6.1.1 (Enterprise components)
  - TailwindCSS 4.1.18 (Utility-first CSS)
  - Material Icons (Icon system)
- **State Management**: React Context API
- **Routing**: React Router 7.9.6
- **Localization**: i18next 23.x
- **HTTP Client**: Axios 1.13.2
- **Math Rendering**: KaTeX 0.16.26
- **Charts**: Chart.js 4.5.1 + react-chartjs-2
- **Animations**: Animate.css + AOS

#### **Backend**
- **Framework**: Django 5.x
- **API**: Django REST Framework 3.x
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL / SQLite
- **File Storage**: Pillow (Image processing)
- **Task Queue**: Celery (for cron jobs)
- **Cache**: Redis

---

## 2. FRONTEND ARCHITECTURE

### 2.1 Project Structure

```
src/
├── assets/               # Static assets
├── components/           # Reusable UI components
│   ├── ActiveTestBanner.jsx
│   ├── CustomLoader.jsx
│   ├── EmojiPicker.jsx
│   ├── Header.jsx
│   ├── Layout.jsx
│   ├── NotificationCenter.jsx
│   └── ...
├── context/              # Global state providers
│   ├── AuthContext.jsx
│   ├── SettingsContext.jsx
│   └── ...
├── data/                 # API services
│   ├── apiService.js
│   └── ...
├── hooks/                # Custom React hooks
│   └── ...
├── pages/                # Route components
│   ├── admin/            # Admin dashboard pages
│   ├── headadmin/        # Head Admin pages
│   ├── seller/           # Seller dashboard
│   ├── student/          # Student dashboard
│   │   ├── MyTests.jsx
│   │   ├── StudentProfileView.jsx
│   │   └── ...
│   ├── teacher/          # Teacher dashboard
│   │   ├── MyClass.jsx
│   │   ├── MyTests.jsx
│   │   ├── StudentProfileDetails.jsx
│   │   ├── TeacherRating.jsx
│   │   └── ...
│   ├── Contact.jsx
│   ├── Home.jsx
│   ├── LoginPage.jsx
│   ├── Onboarding.jsx
│   ├── TeacherDashboard.jsx
│   └── RegisterPage.jsx
├── styles/               # CSS modules
├── utils/                # Utility functions
├── App.jsx               # Root component
├── main.jsx              # Entry point
└── index.css             # Global styles
```

### 2.2 Routing Architecture

**Protected Route System:**
```javascript
// Route protection wrapper
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Usage example
<Route path="/admin/*" element={
  <ProtectedRoute allowedRoles={['admin', 'headadmin']}>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

**Route Structure:**
```javascript
/                         # Public home page
/login                    # Authentication
/register                 # Registration
/onboarding               # First-time setup

/student/*                # Student dashboard (protected)
  /dashboard              # Main dashboard
  /tests                  # Available tests
  /test/:id               # Test taking interface
  /results                # Test history
  /profile                # Profile settings

/teacher/*                # Teacher dashboard (protected)
  /dashboard              # Overview
  /create-test            # Test creation
  /my-tests               # Test management
  /test-details/:id       # Analytics
  /students               # Student list

/admin/*                  # Admin dashboard (protected)
  /dashboard              # Overview
  /manage-students        # Student CRUD
  /manage-teachers        # Teacher CRUD
  /classes                # Class management
  /premium                # Premium treasury

/headadmin/*              # Head Admin (protected)
  /dashboard              # Platform overview
  /settings               # Global UI settings
  /manage-admins          # Admin management
  /analytics              # Platform analytics
  /contact-messages       # Support hub

/seller/*                 # Seller dashboard (protected)
  /dashboard              # Sales overview
  /customers              # Customer management
  /sales                  # Transaction history
```

### 2.3 Core Technical Modules

#### **A. ServerTestContext (Anti-Cheat System)**

**Purpose:** Ensure test integrity with server-authoritative timing.

**Implementation:**
```javascript
// Frontend: ServerTestContext.jsx
const ServerTestContext = createContext();

export const ServerTestProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  // Start new test session
  const startSession = async (testId) => {
    try {
      const response = await apiService.startSession(testId);
      setActiveSession(response.session_id);
      
      // Start timer sync loop
      syncTimer(response.session_id);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };
  
  // Sync timer with server
  const syncTimer = async (sessionId) => {
    const response = await apiService.getSession(sessionId);
    const serverTime = new Date(response.server_time);
    const endTime = new Date(response.end_time);
    const remaining = Math.max(0, endTime - serverTime);
    
    setTimeRemaining(remaining);
    
    // Re-sync every 10 seconds
    if (remaining > 0) {
      setTimeout(() => syncTimer(sessionId), 10000);
    }
  };
  
  // Save answer to server
  const saveAnswer = async (questionId, answer) => {
    if (!activeSession) return;
    
    await apiService.updateSessionAnswers(activeSession, {
      [questionId]: answer
    });
  };
  
  return (
    <ServerTestContext.Provider value={{
      activeSession,
      timeRemaining,
      startSession,
      saveAnswer
    }}>
      {children}
    </ServerTestContext.Provider>
  );
};
```

**Backend: api/views.py**
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_session(request):
    test_id = request.data.get('test_id')
    
    try:
        test = Test.objects.get(id=test_id)
    except Test.DoesNotExist:
        return Response({'error': 'Test not found'}, status=404)
    
    # Create session
    session = TestSession.objects.create(
        session_id=uuid.uuid4(),
        student=request.user,
        test=test,
        start_time=timezone.now(),
        end_time=timezone.now() + timedelta(minutes=test.time_limit),
        answers={}
    )
    
    return Response({
        'session_id': str(session.session_id),
        'server_time': timezone.now().isoformat(),
        'end_time': session.end_time.isoformat(),
        'time_limit': test.time_limit
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session(request):
    session_id = request.query_params.get('session_id')
    
    try:
        session = TestSession.objects.get(
            session_id=session_id,
            student=request.user
        )
    except TestSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)
    
    # Check if expired
    if timezone.now() > session.end_time and not session.is_completed:
        # Auto-complete
        session.is_completed = True
        session.score = calculate_score(session)
        session.save()
    
    return Response({
        'session_id': str(session.session_id),
        'server_time': timezone.now().isoformat(),
        'end_time': session.end_time.isoformat(),
        'answers': session.answers,
        'is_completed': session.is_completed,
        'score': session.score
    })
```

#### **B. SettingsContext (UI Configuration)**

**Purpose:** Manage global UI feature flags set by Head Admin.

**Schema:**
```javascript
const defaultSettings = {
  header: {
    messages: true,      // Show Messages icon
    storage: true,       // Show Storage icon
    search: true,        // Show Search bar
    language: true       // Show Language switcher
  },
  welcome: {
    steps: [
      true,  // Step 1: Welcome
      true,  // Step 2: Device config
      true,  // Step 3: Profile setup
      true,  // Step 4: Feature tour
      true,  // Step 5: Privacy
      true   // Step 6: Completion
    ]
  },
  features: {
    textSelection: true,    // Enable text selection saving
    homeSaveButton: true,   // Show save button on home cards
    flyerAnimation: true    // Enable 3D flyer animation
  }
};
```

**Implementation:**
```javascript
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    if (!saved) return defaultSettings;
    
    try {
      const parsed = JSON.parse(saved);
      // Deep merge with defaults
      return {
        header: { ...defaultSettings.header, ...parsed.header },
        welcome: { ...defaultSettings.welcome, ...parsed.welcome },
        features: { ...defaultSettings.features, ...parsed.features }
      };
    } catch (e) {
      return defaultSettings;
    }
  });
  
  // Update functions
  const updateHeaderSetting = (key, value) => {
    const newSettings = {
      ...settings,
      header: { ...settings.header, [key]: value }
    };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };
  
  const updateFeatureSetting = (key, value) => {
    const newSettings = {
      ...settings,
      features: { ...settings.features, [key]: value }
    };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };
  
  return (
    <SettingsContext.Provider value={{
      settings,
      updateHeaderSetting,
      updateFeatureSetting
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
```

#### **C. Enhanced API Service**

**Features:**
- Automatic JWT refresh
- Request deduplication
- Response caching
- Error handling
- Loading state management

**Implementation:**
```javascript
class EnhancedApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL;
    this.token = localStorage.getItem('accessToken');
    this.requestCache = new Map();
  }
  
  setToken(token) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }
  
  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }
  
  // Prevent duplicate requests
  generateRequestKey(endpoint, options) {
    return `${options.method || 'GET'}-${endpoint}`;
  }
  
  async request(endpoint, options = {}) {
    const requestKey = this.generateRequestKey(endpoint, options);
    
    // Check if request already in progress
    if (this.requestCache.has(requestKey)) {
      return this.requestCache.get(requestKey);
    }
    
    const requestPromise = this.performRequest(endpoint, options);
    this.requestCache.set(requestKey, requestPromise);
    
    try {
      const response = await requestPromise;
      return response;
    } finally {
      this.requestCache.delete(requestKey);
    }
  }
  
  async performRequest(endpoint, options) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: this.getAuthHeaders()
    };
    
    const response = await fetch(url, config);
    
    // Handle token expiration
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry with new token
        return fetch(url, {
          ...config,
          headers: this.getAuthHeaders()
        });
      } else {
        // Logout and redirect
        this.logout();
        window.location.href = '/login';
      }
    }
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    return response;
  }
  
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    
    try {
      const response = await fetch(`${this.baseURL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });
      
      if (response.ok) {
        const { access } = await response.json();
        this.setToken(access);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return false;
  }
  
  logout() {
    this.token = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }
}

export default new EnhancedApiService();
```

---

## 3. BACKEND ARCHITECTURE

### 3.1 Django Project Structure

```
backend/
├── api/
│   ├── models.py          # Database models
│   ├── serializers.py     # DRF serializers
│   ├── views.py           # API endpoints
│   ├── urls.py            # URL routing
│   ├── admin.py           # Django admin
│   ├── permissions.py     # Custom permissions
│   └── management/
│       └── commands/      # Custom commands
├── testplatform/
│   ├── settings.py        # Project settings
│   ├── urls.py            # Root URL config
│   └── wsgi.py            # WSGI config
├── media/                 # Uploaded files
│   ├── profile_photos/
│   ├── question_images/
│   └── gifts/
├── manage.py
└── requirements.txt
```

### 3.2 Database Models

#### **User Model (Extended AbstractUser)**
```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
        ('headadmin', 'Head Admin'),
        ('seller', 'Seller'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    display_id = models.CharField(max_length=10, unique=True, blank=True)
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    profile_status = models.CharField(max_length=100, blank=True)
    direction = models.CharField(max_length=20, null=True, blank=True)  # nature/exact
    grade_level = models.IntegerField(null=True, blank=True)
    
    # Premium
    is_premium = models.BooleanField(default=False)
    premium_expiry = models.DateTimeField(null=True, blank=True)
    star_balance = models.IntegerField(default=0)
    
    # Moderation
    is_banned = models.BooleanField(default=False)
    ban_reason = models.TextField(blank=True)
    ban_expiry = models.DateTimeField(null=True, blank=True)
    unban_code = models.CharField(max_length=8, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.display_id:
            self.display_id = self.generate_display_id()
        super().save(*args, **kwargs)
    
    def generate_display_id(self):
        prefix = {
            'student': 'STU',
            'teacher': 'TCH',
            'admin': 'ADM',
            'headadmin': 'HDA',
            'seller': 'SEL'
        }.get(self.role, 'USR')
        
        last_user = User.objects.filter(role=self.role).order_by('-id').first()
        number = (last_user.id + 1) if last_user else 1
        return f"{prefix}{number:04d}"
```

#### **Test Model**
```python
class Test(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tests')
    title = models.CharField(max_length=200)
    description = models.TextField()
    subject = models.CharField(max_length=100)
    time_limit = models.IntegerField()  # minutes
    total_questions = models.IntegerField()
    pass_threshold = models.IntegerField(default=60)  # percentage
    target_grades = models.JSONField(default=list)
    academic_track = models.CharField(max_length=20, blank=True)  # nature/exact/both
    
    is_active = models.BooleanField(default=True)
    randomize_order = models.BooleanField(default=True)
    show_answers = models.BooleanField(default=False)
    max_attempts = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
```

#### **Question Model**
```python
class Question(models.Model):
    QUESTION_TYPES = (
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
    )
    
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    options = models.JSONField(default=list)  # For multiple choice
    correct_answer = models.CharField(max_length=500)
    points = models.IntegerField(default=10)
    
    # Rich content
    latex_content = models.TextField(blank=True)
    image = models.ImageField(upload_to='question_images/', null=True, blank=True)
    
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
```

#### **TestSession Model (Anti-Cheat)**
```python
import uuid

class TestSession(models.Model):
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    answers = models.JSONField(default=dict)
    is_completed = models.BooleanField(default=False)
    score = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student', 'test', 'session_id']
```

---

## 4. DATABASE SCHEMA

### 4.1 Entity Relationship Diagram

```
User
├─── Tests (as teacher) [One-to-Many]
├─── TestSessions (as student) [One-to-Many]
├─── SentMessages [One-to-Many]
└─── PremiumSubscriptions [One-to-Many]

Test
├─── Questions [One-to-Many]
├─── TestSessions [One-to-Many]
└─── Teacher [Many-to-One → User]

TestSession
├─── Student [Many-to-One → User]
└─── Test [Many-to-One → Test]

Class
├─── Students [Many-to-Many → User]
└─── Teachers [Many-to-Many → User]
```

---

## 5. DESIGN SYSTEM

### 5.1 Typography

**Font Stack:**
```css
:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Outfit', 'Inter', sans-serif;
}
```

**Type Scale:**
```css
h1 { font-size: 3rem; font-weight: 900; line-height: 1.2; }      /* 48px */
h2 { font-size: 2.25rem; font-weight: 800; line-height: 1.3; }   /* 36px */
h3 { font-size: 1.875rem; font-weight: 700; line-height: 1.4; }  /* 30px */
h4 { font-size: 1.5rem; font-weight: 700; line-height: 1.5; }    /* 24px */
body { font-size: 1rem; font-weight: 400; line-height: 1.6; }    /* 16px */
small { font-size: 0.875rem; }                                    /* 14px */
```

### 5.2 Color Palette

**Neutrals:**
```css
--black: #000000;
--white: #FFFFFF;
--gray-50: #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #E5E5E5;
--gray-300: #D4D4D4;
--gray-400: #A3A3A3;
--gray-500: #737373;
--gray-600: #525252;
--gray-700: #404040;
--gray-800: #262626;
--gray-900: #171717;
```

**Semantic Colors:**
```css
--success: #10b981;
--success-light: #d1fae5;
--warning: #faad14;
--warning-light: #fffbeb;
--error: #ff4d4f;
--error-light: #fee2e2;
--info: #3b82f6;
--info-light: #dbeafe;
```

### 5.3 Spacing System

**8px Base Unit:**
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### 5.4 Brutalist Components

**Card:**
```css
.brutalist-card {
  background: var(--white);
  border: 4px solid var(--black);
  border-radius: 0;
  box-shadow: 10px 10px 0px var(--black);
  padding: var(--space-6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.brutalist-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 12px 12px 0px var(--black);
}
```

**Button:**
```css
.brutalist-button {
  background: var(--black);
  color: var(--white);
  border: 3px solid var(--black);
  border-radius: 0;
  padding: var(--space-3) var(--space-6);
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.brutalist-button:hover {
  background: var(--white);
  color: var(--black);
}
```

**Switch:**
```css
.brutalist-switch {
  border: 3px solid #000;
  border-radius: 100px;
  height: 32px;
  min-width: 60px;
  background: #ff4d4f; /* OFF */
  transition: background 0.3s ease;
}

.brutalist-switch.checked {
  background: #000; /* ON */
}

.brutalist-switch .handle {
  width: 24px;
  height: 24px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 100px;
  transition: transform 0.3s ease;
}
```

---

## 6. COMPONENT LIBRARY

### 6.1 Layout Components

**Header** (`components/Header.jsx`)
- Dynamic Island design
- Expands to 380px for Search/Messages/Storage
- Morphs with smooth cubic-bezier transitions

**Footer** (`components/Footer.jsx`)
- Sticky footer with social links
- Quick navigation
- Copyright info

**Layout** (`components/Layout.jsx`)
- Wrapper for all pages
- Header + Content + Footer
- Route-based conditional rendering

### 6.2 Interactive Widgets

**EmojiPicker** (`components/EmojiPicker.jsx`)
- 1000+ emojis across 6 categories
- Search functionality
- Floating animation on select
- Max selection limits

**GradientPicker** (`components/GradientPicker.jsx`)
- 20+ preset gradients
- Custom dual-color picker
- Live preview canvas
- CSS export

**LaTeXPreview** (`components/LaTeXPreview.jsx`)
- KaTeX rendering
- Error handling
- Copy source button

---

## 7. STATE MANAGEMENT

### 7.1 Context Providers

**AuthContext:**
- User authentication state
- Login/logout functions
- Token management

**SettingsContext:**
- Global UI settings
- Feature flags
- Design system overrides

**SavedItemsContext:**
- Student's digital inventory
- Item CRUD operations
- Sync with backend

**ServerTestContext:**
- Test session management
- Server-side timer sync
- Answer persistence

---

## 8. SECURITY ARCHITECTURE

### 8.1 Authentication Flow

```
1. User submits credentials
2. Backend validates
3. Generate JWT access + refresh tokens
4. Return tokens + user data
5. Frontend stores in localStorage
6. Include access token in all requests
7. Auto-refresh on 401
```

### 8.2 Role-Based Access Control

```python
# Custom permission class
class IsHeadAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'headadmin'

# Usage in views
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsHeadAdmin])
def get_platform_stats(request):
    # Only Head Admins can access
    pass
```

---

## 9. PERFORMANCE OPTIMIZATION

### 9.1 Frontend

- **Code Splitting**: React.lazy() for route-based splitting
- **Image Optimization**: WebP format, lazy loading
- **Debounced Inputs**: Search and form inputs
- **Virtualized Lists**: Long student/test lists
- **Service Worker**: PWA caching strategy

### 9.2 Backend

- **Database Indexing**: On frequently queried fields
- **Query Optimization**: select_related / prefetch_related
- **Redis Caching**: Session data
- **CDN**: Static assets
- **Pagination**: Large data sets

---

**For role-specific features, see [ROLES.md](./ROLES.md)**
**For API documentation, see [API.md](./API.md)**
