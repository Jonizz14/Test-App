# 🎓 Test-App: The Complete Enterprise Educational Revolution

> **VERSION 2.0: THE BRUTALIST PARADIGM**
> 
> A full-stack, multi-role educational testing and social learning platform engineered for institutional scale. Where **Brutalist Design Philosophy** meets **Industrial-Grade Backend Logic** and **Social Gaming Economics**.

[![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.x-green?logo=django)](https://www.djangoproject.com/)
[![Vite](https://img.shields.io/badge/Vite-7.2.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-6.1.1-blue?logo=ant-design)](https://ant.design/)
[![i18next](https://img.shields.io/badge/i18next-23.x-26A69A?logo=i18next)](https://www.i18next.com/)

---

## 📋 TABLE OF CONTENTS

1. [Project Vision & Philosophy](#1-project-vision--philosophy)
2. [The Multi-Role Ecosystem](#2-the-multi-role-ecosystem)
3. [Core Technical Modules](#3-core-technical-modules)
4. [Design System Architecture](#4-design-system-architecture)
5. [Frontend Components Library](#5-frontend-components-library)
6. [Backend API Architecture](#6-backend-api-architecture)
7. [Database Schema & Models](#7-database-schema--models)
8. [Authentication & Security](#8-authentication--security)
9. [State Management Strategy](#9-state-management-strategy)
10. [Installation & Configuration](#10-installation--configuration)
11. [Development Workflow](#11-development-workflow)
12. [Testing & Quality Assurance](#12-testing--quality-assurance)
13. [Deployment & Production](#13-deployment--production)
14. [Performance Optimization](#14-performance-optimization)
15. [Troubleshooting Guide](#15-troubleshooting-guide)
16. [API Reference](#16-api-reference)
17. [Contributing Guidelines](#17-contributing-guidelines)
18. [Roadmap & Future Features](#18-roadmap--future-features)

---

## 1. PROJECT VISION & PHILOSOPHY

### 1.1 The Genesis
**Test-App** was born from a critical need: modern educational institutions require more than simple multiple-choice questionnaires. They need a complete ecosystem that handles user management, content creation, real-time proctoring, social engagement, and monetization—all while maintaining the highest standards of security and user experience.

### 1.2 The Brutalist Aesthetic Revolution
We deliberately chose **Premium Brutalism** as our design language, rejecting the trend of "soft, rounded, pastel" interfaces:

#### **Why Brutalism?**
- **Functional Honesty**: Every element tells you exactly what it does. No hidden menus, no confusing metaphors.
- **Visual Hierarchy**: Bold 4-8px borders create unmistakable boundaries between content zones.
- **High Contrast**: Pure blacks (#000) against crisp whites (#FFF) with vibrant status colors (Success: #10b981, Error: #ff4d4f, Warning: #faad14).
- **Performance**: Minimal use of gradients and shadows means faster rendering on low-end devices.

#### **Design Tokens**
```css
:root {
  --brutalist-border: 4px solid #000;
  --brutalist-shadow: 10px 10px 0px #000;
  --brutalist-radius-sharp: 0px;
  --brutalist-radius-round: 20px;
  --font-primary: 'Inter', sans-serif;
  --font-display: 'Outfit', sans-serif;
}
```

### 1.3 Engineering Philosophy
- **Server Authority**: All critical operations (timers, scoring, session state) happen on the backend.
- **Optimistic UI**: Immediate visual feedback on the frontend while backend processes complete.
- **Fault Tolerance**: Network drops, browser crashes, and system reboots do not compromise data integrity.
- **Scalability First**: Designed to handle 10,000+ concurrent test sessions without degradation.

---

## 2. THE MULTI-ROLE ECOSYSTEM

Test-App implements a strict 5-tier role hierarchy with completely distinct interfaces and capabilities.

### 2.1 👑 HEAD ADMIN (The Supreme Architect)

The Head Admin is the **God Mode** of the platform, with absolute control over the system's behavior and appearance.

#### **2.1.1 Global UI Configuration Panel**
Located at `/headadmin/settings`, this panel allows real-time modification of:

**Header Features Toggle:**
- ✅ **Search Bar**: Enable/disable the content search functionality
- ✅ **Language Switcher**: Show/hide the multi-language selector (UZ/RU/EN)
- ✅ **Messages Icon**: Toggle the sent messages notification center
- ✅ **Storage Icon**: Enable/disable the digital inventory feature

**Site-Wide Features:**
- ✅ **Text Selection Saving**: Allow students to highlight and save text snippets
- ✅ **Home Save Button**: Display the "Save Info" button on role cards
- ✅ **Flyer Animation**: Enable the 3D flying animation when saving items

**Onboarding Configuration:**
Control which steps appear in the smartphone-style setup:
1. Welcome Screen
2. Device Configuration
3. Profile Setup
4. Feature Tour
5. Privacy & Terms
6. Completion Celebration

**Design System Override:**
- **Border Radius Control**: Switch between sharp (0px) and rounded (20px) corners globally

#### **2.1.2 Admin Management**
- Create, edit, and delete Admin accounts
- Monitor admin activity logs
- Approve admin premium requests
- View admin-specific analytics (tests created, students managed, etc.)

#### **2.1.3 Platform Analytics Dashboard**
- **Total Users**: Breakdown by role (Students, Teachers, Admins, Sellers)
- **Active Sessions**: Real-time count of ongoing tests
- **Revenue Metrics**: Premium subscriptions, star package sales
- **Content Statistics**: Total tests, questions, and completion rates
- **Geographic Distribution**: User distribution across regions

#### **2.1.4 Contact Message Hub**
- View all user-submitted contact forms
- Prioritize by urgency levels
- Assign to specific admins for resolution
- Track response times and satisfaction scores

---

### 2.2 🛡️ ADMIN (The Institutional Manager)

Admins are the operational backbone, handling daily tasks and user lifecycle management.

#### **2.2.1 Comprehensive User Management**

**Teacher Management (`/admin/manage-teachers`):**
- Add teachers with subject specialization
- Auto-generate unique teacher IDs
- Assign classes and schedules
- Track teacher performance (tests created, student engagement)
- Bulk import from CSV/Excel files

**Student Management (`/admin/manage-students`):**
- Register students with auto-generated display IDs
- Assign to class groups (e.g., "9-Grade Exact Sciences")
- Set academic direction (Natural Sciences vs. Exact Sciences)
- Manage premium status and star balances
- View detailed student profiles with test history

**Seller Management (`/admin/manage-sellers`):**
- Onboard sellers with commission structures
- Monitor sales performance
- Approve seller-initiated premium grants
- Revenue sharing analytics

#### **2.2.2 Class Architecture System**

**Class Creation Interface:**
```json
{
  "class_name": "10-01 Mathematical Sciences",
  "grade_level": 10,
  "section": "01",
  "academic_track": "exact",
  "student_capacity": 30,
  "assigned_teachers": [12, 45, 78],
  "schedule": {
    "monday": ["Math", "Physics", "Chemistry"],
    "tuesday": ["Algebra", "Geometry", "CS"]
  }
}
```

**Class Statistics Dashboard:**
- Average test scores per subject
- Attendance tracking
- Top performers and struggling students
- Subject-wise performance heatmaps

#### **2.2.3 Premium Treasury & Monetization**

**Pricing Management:**
- Configure subscription tiers:
  - 1-Week Subscription: 10,000 UZS
  - 1-Month Subscription: 35,000 UZS
  - 1-Year Subscription: 350,000 UZS
- Star package pricing (100 stars, 500 stars, 1000 stars)
- Discount campaigns and promotional codes

**Manual Premium Grants:**
- Direct activation of premium for specific students
- Premium gift codes for rewards programs
- Scholarship-based free premium assignments

**Revenue Analytics:**
- Daily/Weekly/Monthly revenue graphs
- Premium conversion rates
- Seller commission payouts
- Profit margin calculations

#### **2.2.4 Moderation & Security**

**Advanced Ban System:**
- Temporary bans (1 day, 1 week, 1 month)
- Permanent bans with reason logging
- **Unban Code Generation**: Single-use 8-character codes sent via email
- Ban appeal workflow for students

**Security Monitoring:**
- Detect multiple login attempts from different IPs
- Flag suspicious test completion times
- Monitor answer pattern anomalies (potential cheating)

---

### 2.3 👨‍🏫 TEACHER (The Content Architect)

Teachers have professional-grade tools for creating, managing, and analyzing assessments.

#### **2.3.1 The Advanced Test Laboratory**

**Test Creation Wizard (`/teacher/create-test`):**

**Step 1: Basic Information**
- Test Title (supports i18n)
- Subject assignment
- Target grade levels (multi-select: 5, 6, 7... 11)
- Academic track targeting (Natural, Exact, or Both)

**Step 2: Configuration**
- Total questions count
- Time limit (5 to 180 minutes)
- Pass threshold (60%, 70%, 80%)
- Number of attempts allowed (1 to unlimited)
- Randomize question order (yes/no)
- Show correct answers after completion (yes/no)

**Step 3: Question Builder**

**Supported Question Types:**

1. **Multiple Choice:**
```json
{
  "type": "multiple_choice",
  "question_text": "What is the capital of Uzbekistan?",
  "latex_content": null,
  "image_url": null,
  "options": [
    {"id": "A", "text": "Tashkent", "is_correct": true},
    {"id": "B", "text": "Samarkand", "is_correct": false},
    {"id": "C", "text": "Bukhara", "is_correct": false},
    {"id": "D", "text": "Khiva", "is_correct": false}
  ],
  "points": 10
}
```

2. **True/False:**
```json
{
  "type": "true_false",
  "question_text": "The Earth is flat.",
  "correct_answer": "False",
  "points": 5
}
```

3. **Short Answer:**
```json
{
  "type": "short_answer",
  "question_text": "Who wrote 'War and Peace'?",
  "correct_answer": "Leo Tolstoy",
  "case_sensitive": false,
  "points": 15
}
```

4. **Mathematical (LaTeX):**
```json
{
  "type": "math",
  "question_text": "Solve the equation:",
  "latex_content": "\\int_{0}^{\\pi} \\sin(x) dx",
  "correct_answer": "2",
  "points": 20
}
```

**KaTeX Rendering:**
Test-App uses KaTeX for lightning-fast mathematical typesetting. Teachers can use the built-in LaTeX editor with live preview.

**Image Upload System:**
- Question images: Geometry diagrams, biology charts, historical maps
- Option images: For visual multiple-choice questions
- Supported formats: PNG, JPG, WebP, GIF
- Auto-optimization: Images compressed to <500KB

#### **2.3.2 Student Performance Analytics**

**Test Details Dashboard (`/teacher/test-details/:id`):**

**Statistics Overview:**
- Total Attempts
- Average Score
- Highest Score
- Lowest Score
- Completion Rate

**Per-Student Breakdown:**
- Student Name & ID
- Score & Grade
- Time Taken
- Correct/Incorrect Count
- Answer Patterns (for identifying weak areas)

**Question Analysis:**
- Which questions were answered correctly most often
- Which questions stumped the most students
- Average time per question

#### **2.3.3 Direct Student Intervention**

**Lesson Invitation System:**
When a student scores below 60%, the teacher can send a personalized "Lesson Invitation":

**Invitation Form:**
- Lesson Topic
- Date & Time
- Location/Room
- Custom Message
- Reminder Frequency

The invitation appears in the student's notification center with a countdown timer.

---

### 2.4 🎓 STUDENT (The Engaged Learner)

The student interface is designed as an immersive, gamified learning environment.

#### **2.4.1 The Smartphone Setup Experience**

**Onboarding Flow (`/onboarding`):**

A unique multi-step setup that mimics configuring a new smartphone:

**Step 1: Welcome**
- Animated logo entrance
- Platform introduction video
- Language preference selection

**Step 2: Device Configuration**
- Simulated hardware setup screen
- "Scanning" animation with progress bar
- System optimization messages

**Step 3: Profile Creation**
- Upload profile photo (support for GIF animations)
- Enter display name
- Select academic direction (Nature/Exact)
- Set profile status message

**Step 4: Privacy & Permissions**
- Terms of Service agreement
- Privacy policy acknowledgment
- Notification preferences

**Step 5: Feature Tour**
- Interactive walkthrough of key features
- Test-taking tutorial
- Storage/Inventory explanation
- Premium features preview

**Step 6: Completion**
- Confetti animation
- Welcome message from assigned teacher
- First achievement badge unlocked

#### **2.4.2 The Digital Inventory System**

**The Flyer Animation:**
When a student clicks "Save" on any content (test results, teacher notes, highlighted text), a 3D animated icon "flies" from its origin point to the header's Storage icon.

**Technical Implementation:**
```javascript
// Simplified version of the flyer logic
const createFlyer = (sourceElement, targetElement, content) => {
  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  
  const flyer = document.createElement('div');
  flyer.className = 'flyer-icon';
  flyer.style.left = `${sourceRect.left}px`;
  flyer.style.top = `${sourceRect.top}px`;
  
  document.body.appendChild(flyer);
  
  requestAnimationFrame(() => {
    flyer.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    flyer.style.left = `${targetRect.left}px`;
    flyer.style.top = `${targetRect.top}px`;
    flyer.style.transform = 'scale(0) rotate(720deg)';
    flyer.style.opacity = '0';
  });
  
  setTimeout(() => flyer.remove(), 800);
};
```

**Storage Contents:**
- Saved test results with timestamps
- Teacher-sent lesson materials
- Highlighted text snippets
- Important announcements

#### **2.4.3 The Social Premium Economy**

**Star Collection System:**
Students earn stars through:
- Test completion (+10 stars)
- High scores 90%+ (+50 bonus stars)
- Daily login streaks (+5 stars/day)
- Referrals (+100 stars per successful referral)

**Gift Shop:**
Students can spend stars on:
- **Profile Backgrounds**: Gradient packs (100 stars)
- **Emoji Collections**: Unlock categories (50 stars each)
- **Custom Badges**: Achievement displays (200 stars)
- **Profile Frames**: Animated borders (150 stars)

**Emoji Picker:**
1000+ emojis across 6 categories:
- 😀 Faces & Emotions (250 emojis)
- 🐾 Animals & Nature (200 emojis)
- 🍕 Food & Drink (150 emojis)
- ⚽ Activities & Sports (150 emojis)
- 🎨 Objects & Symbols (150 emojis)
- 🌍 Travel & Places (100 emojis)

**Premium Profile Features:**
- Animated GIF profile pictures
- Custom gradient backgrounds (with live preview)
- Profile status messages with emoji support
- Visibility controls (hide premium features from non-premium)

#### **2.4.4 The Anti-Cheat Testing Environment**

**Server-Side Session Management:**

**When a student starts a test:**
1. Backend creates a unique `session_id`
2. Timer starts on the server (not client)
3. Session state stored in database with:
   - Start timestamp
   - End timestamp (start + time_limit)
   - Current answers
   - Remaining time

**Network Resilience:**
- Answers saved on every question change
- If connection drops, answers cached in localStorage
- On reconnect, cached answers sync to server
- Timer continues server-side even if browser closes

**Auto-Submission:**
- Backend runs a cron job every 30 seconds
- Checks for expired sessions
- Automatically marks as submitted
- Calculates final score
- Sends notification to student

**Prevention Mechanisms:**
- Tab switching detection (logged, not blocked)
- Copy/paste disabled in test area
- Right-click context menu disabled
- DevTools detection with warnings

---

### 2.5 💼 SELLER (The Growth Agent)

Sellers drive the platform's monetization through direct sales.

#### **2.5.1 Sales Dashboard**

**Key Metrics:**
- Today's Sales: 15 subscriptions (450,000 UZS)
- Monthly Revenue: 12,500,000 UZS
- Conversion Rate: 23%
- Top Package: 1-Month Premium (65% of sales)

**Customer Management:**
- View all student contacts
- Track premium status
- Send renewal reminders
- Offer package upgrades

#### **2.5.2 Commission Structure**

**Revenue Sharing:**
- 1-Week: 15% commission (1,500 UZS/sale)
- 1-Month: 20% commission (7,000 UZS/sale)
- 1-Year: 25% commission (87,500 UZS/sale)

**Leaderboard:**
Monthly seller rankings with bonuses for top 3 performers.

---

## 3. CORE TECHNICAL MODULES

### 3.1 ServerTestContext (The Proctoring Brain)

**Purpose:** Ensure test integrity with server-authoritative timing and session management.

**Architecture:**

**Frontend Context (`ServerTestContext.jsx`):**
```javascript
const ServerTestContext = createContext();

export const ServerTestProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  const startSession = async (testId) => {
    const response = await apiService.startSession(testId);
    setActiveSession(response.session_id);
    syncTimer(response.session_id);
  };
  
  const syncTimer = async (sessionId) => {
    const response = await apiService.getSession(sessionId);
    const serverTime = new Date(response.server_time);
    const endTime = new Date(response.end_time);
    const remaining = Math.max(0, endTime - serverTime);
    setTimeRemaining(remaining);
  };
  
  return (
    <ServerTestContext.Provider value={{ startSession, timeRemaining }}>
      {children}
    </ServerTestContext.Provider>
  );
};
```

**Backend API (`api/views.py`):**
```python
@api_view(['POST'])
def start_session(request):
    test_id = request.data.get('test_id')
    test = Test.objects.get(id=test_id)
    
    session = TestSession.objects.create(
        student=request.user,
        test=test,
        start_time=timezone.now(),
        end_time=timezone.now() + timedelta(minutes=test.time_limit)
    )
    
    return Response({
        'session_id': session.id,
        'server_time': timezone.now().isoformat(),
        'end_time': session.end_time.isoformat()
    })
```

### 3.2 SettingsContext (The UI Configurator)

**Purpose:** Manage global UI feature flags set by Head Admin.

**Default Settings Schema:**
```javascript
const defaultSettings = {
  header: {
    messages: true,
    storage: true,
    search: true,
    language: true
  },
  welcome: {
    steps: [true, true, true, true, true, true]
  },
  features: {
    textSelection: true,
    homeSaveButton: true,
    flyerAnimation: true
  }
};
```

**Deep Merge Logic:**
```javascript
const loadSettings = () => {
  const saved = localStorage.getItem('appSettings');
  if (!saved) return defaultSettings;
  
  const parsed = JSON.parse(saved);
  return {
    header: { ...defaultSettings.header, ...parsed.header },
    welcome: { ...defaultSettings.welcome, ...parsed.welcome },
    features: { ...defaultSettings.features, ...parsed.features }
  };
};
```

### 3.3 Enhanced API Service (The Network Layer)

**Features:**
- Automatic JWT refresh
- Request deduplication
- Response caching
- Error interception
- Loading state management

**Implementation Highlights:**
```javascript
class EnhancedApiService {
  constructor() {
    this.requestCache = new Map();
    this.baseURL = import.meta.env.VITE_API_BASE_URL;
  }
  
  async request(endpoint, options = {}) {
    const requestKey = this.generateRequestKey(endpoint, options);
    
    // Prevent duplicate requests
    if (this.isRequestInProgress(requestKey)) {
      return this.requestCache.get(requestKey);
    }
    
    const requestPromise = this.performRequest(endpoint, options);
    this.setRequestInProgress(requestKey, requestPromise);
    
    try {
      const response = await requestPromise;
      return response;
    } finally {
      this.removeRequestFromCache(requestKey);
    }
  }
  
  async performRequest(endpoint, options) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: this.getAuthHeaders()
    });
    
    if (response.status === 401) {
      await this.refreshToken();
      return fetch(`${this.baseURL}${endpoint}`, options);
    }
    
    return response;
  }
}
```

---

## 4. DESIGN SYSTEM ARCHITECTURE

### 4.1 Typography Scale

**Font Families:**
- **Primary (Body)**: 'Inter', system-ui, sans-serif
- **Display (Headings)**: 'Outfit', 'Inter', sans-serif

**Type Scale:**
```css
/* Headings */
h1 { font-size: 3rem; font-weight: 900; }    /* 48px */
h2 { font-size: 2.25rem; font-weight: 800; } /* 36px */
h3 { font-size: 1.875rem; font-weight: 700; }/* 30px */
h4 { font-size: 1.5rem; font-weight: 700; }  /* 24px */

/* Body */
.body-large { font-size: 1.125rem; }  /* 18px */
.body { font-size: 1rem; }            /* 16px */
.body-small { font-size: 0.875rem; }  /* 14px */
.caption { font-size: 0.75rem; }      /* 12px */
```

### 4.2 Color System

**Neutrals:**
```css
--black: #000000;
--white: #FFFFFF;
--gray-100: #F7F7F7;
--gray-200: #E5E5E5;
--gray-300: #D4D4D4;
--gray-700: #404040;
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

### 4.3 Spacing System

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
```

### 4.4 Component Patterns

**Brutalist Card:**
```css
.brutalist-card {
  background: var(--white);
  border: 4px solid var(--black);
  border-radius: var(--brutalist-radius-sharp);
  box-shadow: 10px 10px 0px var(--black);
  padding: var(--space-6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.brutalist-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 12px 12px 0px var(--black);
}
```

**Premium Switch:**
```css
.brutalist-switch {
  border: 3px solid #000;
  border-radius: 100px;
  height: 32px;
  min-width: 60px;
  background: #ff4d4f; /* OFF state */
}

.brutalist-switch.checked {
  background: #000; /* ON state */
}

.brutalist-switch .handle {
  width: 24px;
  height: 24px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 100px;
}
```

---

## 5. FRONTEND COMPONENTS LIBRARY

### 5.1 Core Layout Components

**Header (`components/Header.jsx`):**
- Dynamic Island design that morphs based on active feature
- Expands to reveal Search, Messages, or Storage
- Smooth cubic-bezier transitions
- Supports conditional rendering based on SettingsContext

**Footer (`components/Footer.jsx`):**
- Sticky footer with social links
- Copyright information
- Quick navigation links

**Layout (`components/Layout.jsx`):**
- Wraps all pages with Header/Footer
- Manages global loading states
- Handles authentication redirects

### 5.2 Interactive Widgets

**EmojiPicker (`components/EmojiPicker.jsx`):**
- 1000+ emojis organized by category tabs
- Search functionality
- Selection limit enforcement
- Floating animation effect
- Copy-to-clipboard integration

**GradientPicker (`components/GradientPicker.jsx`):**
- Live gradient preview
- 20+ preset gradients
- Custom color picker (2-color stops)
- CSS export functionality

**LaTeXPreview (`components/LaTeXPreview.jsx`):**
- Real-time KaTeX rendering
- Error handling with fallback display
- Copy LaTeX source button

**MathSymbols (`components/MathSymbols.jsx`):**
- Quick-insert buttons for common symbols
- Greek letters, operators, functions
- Custom symbol library

### 5.3 Modals & Dialogs

**PremiumModal (`components/PremiumModal.jsx`):**
- Pricing plans comparison table
- Purchase flow integration
- Feature comparison chart
- Testimonials section

**UnbanModal (`components/UnbanModal.jsx`):**
- Unban code input
- Validation with backend
- Success/error messaging

**SendLessonModal (`components/SendLessonModal.jsx`):**
- Lesson topic input
- Date/time picker
- Location/room specification
- Custom message field

### 5.4 Data Display Components

**StudentCompletionStats (`components/StudentCompletionStats.jsx`):**
- Circular progress indicators
- Subject-wise breakdown
- Color-coded performance levels

**CustomLoader (`components/CustomLoader.jsx`):**
- Branded loading animations
- Skeleton screens for content placeholders

---

## 6. BACKEND API ARCHITECTURE

### 6.1 Django Project Structure

```
backend/
├── api/
│   ├── models.py          # Database models
│   ├── serializers.py     # DRF serializers
│   ├── views.py           # API endpoints
│   ├── urls.py            # URL routing
│   ├── admin.py           # Django admin config
│   └── management/
│       └── commands/      # Custom management commands
├── testplatform/
│   ├── settings.py        # Project settings
│   ├── urls.py            # Root URL config
│   ├── wsgi.py            # WSGI config
│   └── asgi.py            # ASGI config
└── media/                 # User uploads
    ├── profile_photos/
    ├── question_images/
    └── gifts/
```

### 6.2 Database Models

**User Model (Extended AbstractUser):**
```python
class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
        ('headadmin', 'Head Admin'),
        ('seller', 'Seller'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    display_id = models.CharField(max_length=10, unique=True)
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True)
    profile_status = models.CharField(max_length=100, blank=True)
    direction = models.CharField(max_length=20, null=True)  # nature/exact
    is_premium = models.BooleanField(default=False)
    premium_expiry = models.DateTimeField(null=True)
    star_balance = models.IntegerField(default=0)
    is_banned = models.BooleanField(default=False)
    ban_reason = models.TextField(blank=True)
```

**Test Model:**
```python
class Test(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    subject = models.CharField(max_length=100)
    time_limit = models.IntegerField()  # minutes
    total_questions = models.IntegerField()
    target_grades = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Question Model:**
```python
class Question(models.Model):
    QUESTION_TYPES = (
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
    )
    
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    options = models.JSONField(default=list)
    correct_answer = models.CharField(max_length=500)
    points = models.IntegerField(default=10)
    image = models.ImageField(upload_to='question_images/', null=True)
```

**TestSession Model:**
```python
class TestSession(models.Model):
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    answers = models.JSONField(default=dict)
    is_completed = models.BooleanField(default=False)
    score = models.FloatField(null=True)
```

---

## 7. DATABASE SCHEMA & MODELS

### 7.1 Complete Model Relationships

```
User (Extended AbstractUser)
├── Tests (as teacher) → One-to-Many
├── TestAttempts (as student) → One-to-Many
├── TestSessions (as student) → One-to-Many
├── SentMessages (as sender) → One-to-Many
├── ReceivedMessages (as recipient) → One-to-Many
└── PremiumSubscriptions → One-to-Many

Test
├── Questions → One-to-Many
├── TestAttempts → One-to-Many
└── TestSessions → One-to-Many

Class
├── Students → Many-to-Many (through ClassEnrollment)
└── Teachers → Many-to-Many (through ClassAssignment)
```

### 7.2 Pricing Models

**PricingPlan:**
```python
class PricingPlan(models.Model):
    PLAN_TYPES = (
        ('week', '1-Week'),
        ('month', '1-Month'),
        ('year', '1-Year'),
    )
    
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.IntegerField()
    features = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
```

**StarPackage:**
```python
class StarPackage(models.Model):
    name = models.CharField(max_length=100)
    star_amount = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    bonus_stars = models.IntegerField(default=0)
```

---

## 8. AUTHENTICATION & SECURITY

### 8.1 JWT Authentication Flow

**Login Process:**
1. User submits credentials to `/api/users/login/`
2. Backend validates credentials
3. If valid, generate JWT access + refresh tokens
4. Return tokens + user data to frontend
5. Frontend stores tokens in localStorage
6. Include access token in all subsequent requests

**Token Refresh:**
```javascript
// Automatic refresh in apiService
if (response.status === 401) {
  const refreshToken = localStorage.getItem('refreshToken');
  const refreshResponse = await fetch('/api/token/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken })
  });
  
  if (refreshResponse.ok) {
    const { access } = await refreshResponse.json();
    localStorage.setItem('accessToken', access);
    // Retry original request
  }
}
```

### 8.2 Role-Based Access Control (RBAC)

**Permission Hierarchy:**
```
HeadAdmin > Admin > Teacher > Student/Seller
```

**Route Protection:**
```javascript
// ProtectedRoute component
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" />;
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

### 8.3 Security Best Practices

**Input Validation:**
- All user inputs sanitized on backend
- HTML escaping to prevent XSS
- SQL injection prevention via ORM

**File Upload Security:**
- File type validation (whitelist: jpg, png, gif, webp)
- File size limits (max 5MB for images)
- Virus scanning integration ready

**Rate Limiting:**
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

---

## 9. STATE MANAGEMENT STRATEGY

### 9.1 React Context Providers

**AuthContext:**
- Manages user authentication state
- Provides login/logout functions
- Handles token storage

**SettingsContext:**
- Manages global UI settings
- Syncs with localStorage
- Provides update functions for Head Admin

**SavedItemsContext:**
- Manages student's digital inventory
- Handles item addition/removal
- Syncs saved items to backend

**SentMessagesContext:**
- Tracks teacher-sent messages
- Notification badge counts
- Message read/unread status

### 9.2 Local State Management

**Component-Level State:**
- Form inputs (useState)
- Modal visibility (useState)
- Pagination (useState)

**Derived State:**
- Computed statistics from raw data
- Filtered/sorted lists
- Conditional rendering flags

---

## 10. INSTALLATION & CONFIGURATION

### 10.1 System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 10GB
- OS: macOS, Windows, Linux

**Recommended:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 20GB SSD
- OS: Ubuntu 22.04 LTS

### 10.2 Backend Setup (Django)

**Step 1: Clone Repository**
```bash
git clone https://github.com/your-repo/Test-App.git
cd Test-App
```

**Step 2: Create Virtual Environment**
```bash
cd backend
python3 -m venv venv

# Activate
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

**Step 3: Install Dependencies**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Step 4: Environment Configuration**
Create `.env` file in `backend/`:
```env
SECRET_KEY=your-super-secret-key-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**Step 5: Database Migration**
```bash
python manage.py makemigrations
python manage.py migrate
```

**Step 6: Create Superuser**
```bash
python manage.py createsuperuser
# Follow prompts to create admin account
```

**Step 7: Collect Static Files**
```bash
python manage.py collectstatic --noinput
```

**Step 8: Run Development Server**
```bash
python manage.py runserver 8000
```

### 10.3 Frontend Setup (React + Vite)

**Step 1: Navigate to Project Root**
```bash
cd Test-App
```

**Step 2: Install Node Dependencies**
```bash
npm install
```

**Step 3: Environment Configuration**
Create `.env` file in project root:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_API_KEY=your-google-api-key-if-using
```

**Step 4: Start Development Server**
```bash
npm run dev
```

Access at: `http://localhost:5173`

---

## 11. DEVELOPMENT WORKFLOW

### 11.1 Branch Strategy

**Main Branches:**
- `main`: Production-ready code
- `develop`: Integration branch for features
- `staging`: Pre-production testing

**Feature Branches:**
```bash
git checkout -b feature/premium-system
git checkout -b fix/timer-bug
git checkout -b docs/api-update
```

### 11.2 Code Quality Tools

**ESLint Configuration:**
```javascript
// eslint.config.js
export default {
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'react/prop-types': 'off'
  }
};
```

**Prettier Configuration:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### 11.3 Commit Message Convention

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(premium): add emoji picker to profile customization"
git commit -m "fix(timer): resolve server-side timer drift issue"
git commit -m "docs(api): update authentication endpoint documentation"
```

---

## 12. TESTING & QUALITY ASSURANCE

### 12.1 Testing Strategy

**Unit Tests:**
- Component rendering tests
- Utility function tests
- API service tests

**Integration Tests:**
- User authentication flow
- Test creation and submission
- Premium purchase flow

**End-to-End Tests:**
- Complete user journeys
- Multi-role interactions
- Payment processing

### 12.2 Test Coverage Goals

- **Frontend**: 80% coverage
- **Backend**: 90% coverage
- **Critical Paths**: 100% coverage

---

## 13. DEPLOYMENT & PRODUCTION

### 13.1 Production Build

**Frontend:**
```bash
npm run build
# Output: dist/ folder
```

**Backend:**
```bash
# Update settings for production
DEBUG=False
ALLOWED_HOSTS=yourdomain.com

# Collect static files
python manage.py collectstatic

# Run with gunicorn
gunicorn testplatform.wsgi:application --bind 0.0.0.0:8000
```

### 13.2 Deployment Platforms

**Vercel (Frontend):**
1. Connect GitHub repository
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variables
4. Deploy

**Render/Railway (Backend):**
1. Connect repository
2. Set start command: `gunicorn testplatform.wsgi`
3. Configure PostgreSQL database
4. Add environment variables
5. Deploy

---

## 14. PERFORMANCE OPTIMIZATION

### 14.1 Frontend Optimizations

- Code splitting with React.lazy()
- Image optimization (WebP format)
- Debounced search inputs
- Virtualized long lists
- Service worker caching

### 14.2 Backend Optimizations

- Database indexing on frequently queried fields
- Query optimization with select_related/prefetch_related
- Redis caching for session data
- CDN for static assets

---

## 15. TROUBLESHOOTING GUIDE

### 15.1 Common Issues

**Issue: CORS errors**
**Solution:** Update CORS_ALLOWED_ORIGINS in backend settings

**Issue: Token expired**
**Solution:** Implement automatic token refresh in frontend

**Issue: Database migration conflicts**
**Solution:** Reset migrations and rebuild

---

## 16. API REFERENCE

### 16.1 Authentication Endpoints

**POST /api/users/login/**
```json
Request:
{
  "username": "student@test.com",
  "password": "password123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "role": "student",
    "display_id": "STU001"
  }
}
```

### 16.2 Test Management Endpoints

**GET /api/tests/**
Returns paginated list of tests

**POST /api/tests/**
Create new test (Teacher only)

**GET /api/tests/{id}/**
Get test details

---

## 17. CONTRIBUTING GUIDELINES

### 17.1 How to Contribute

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review process
6. Merge to develop

### 17.2 Code Style Guide

- Use functional components with hooks
- Follow ESLint rules
- Write meaningful variable names
- Add JSDoc comments for complex functions

---

## 18. ROADMAP & FUTURE FEATURES

### Phase 1 (Q2 2026)
- [ ] AI-powered question generation
- [ ] Real-time collaborative testing
- [ ] Mobile app (React Native)

### Phase 2 (Q3 2026)
- [ ] Video lesson integration
- [ ] Live proctoring with webcam
- [ ] Advanced analytics with ML insights

### Phase 3 (Q4 2026)
- [ ] Blockchain certificates
- [ ] Global leaderboards
- [ ] Marketplace for test templates

---

## 📄 LICENSE

This project is proprietary software developed for educational institutions in Uzbekistan.

© 2026 Test-App Educational Platform. All Rights Reserved.

---

**Built with ❤️ for the future of education in Uzbekistan**
