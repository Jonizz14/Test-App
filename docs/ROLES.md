# 👥 ROLES.md - Complete Role Feature Guide

This document provides exhaustive documentation for all 5 user roles in the Test-App platform.

---

## Table of Contents

1. [👑 Head Admin](#-head-admin-the-sovereign-architect)
2. [🛡️ Admin](#️-admin-the-institutional-guardian)
3. [👨‍🏫 Teacher](#-teacher-the-content-mentor)
4. [🎓 Student](#-student-the-engaged-learner)
5. [💼 Seller](#-seller-the-growth-agent)

---

## 👑 Head Admin (The Sovereign Architect)

The Head Admin has supreme control over the platform's behavior, appearance, and global settings.

### Core Responsibilities
- Platform-wide configuration and feature toggling
- Administrative hierarchy management
- Global analytics and monitoring
- System health oversight

---

### 1.1 Global UI Configuration Panel

**Location:** `/headadmin/settings`

The Settings Panel allows real-time modification of platform features without code deployment.

#### **A. Header Features Toggle**

Control which icons appear in the global header:

| Feature | Description | Impact |
|---------|-------------|--------|
| **Search Bar** | Content search functionality | Enables/disables site-wide search |
| **Language Switcher** | Multi-language selector (UZ/RU/EN) | Shows/hides language dropdown |
| **Messages Icon** | Sent messages notification center | Toggles message inbox visibility |
| **Storage Icon** | Digital inventory feature | Enables/disables saved items system |

**Implementation:**
```javascript
// Controlled via SettingsContext
const settings = {
  header: {
    search: true,
    language: true,
    messages: true,
    storage: true
  }
};
```

#### **B. Site-Wide Features**

| Feature | Description | Performance Impact |
|---------|-------------|-------------------|
| **Text Selection Saving** | Students can highlight and save text | Low |
| **Home Save Button** | "Save Info" button on role cards | Minimal |
| **Flyer Animation** | 3D flying animation when saving items | Medium (can disable for low-end devices) |

#### **C. Onboarding Configuration**

Control the 6-step smartphone-style student setup:

1. **Welcome Screen**: Initial greeting and platform introduction
2. **Device Configuration**: Simulated hardware setup experience
3. **Profile Setup**: Photo upload, name, and direction selection
4. **Feature Tour**: Interactive walkthrough of key features
5. **Privacy & Terms**: Agreement and notification preferences
6. **Completion**: Celebration screen with first achievement

**Use Case:** Disable steps 2 and 4 for faster onboarding in registration drives.

#### **D. Design System Override**

**Border Radius Control:**
- **Sharp Mode** (0px): Pure Brutalist aesthetic
- **Rounded Mode** (20px): Modern premium feel

Affects all buttons, cards, modals, and interactive elements globally.

---

### 1.2 Admin Management

#### **Create Admin Accounts**
- Email and password setup
- Subject specialization assignment
- Department/school affiliation
- Premium status control

#### **Monitor Admin Activity**
- Tests created by each admin
- Students enrolled
- Teachers managed
- Active sessions count

#### **Admin Premium Approval**
Head Admin can grant premium to subordinate Admins for enhanced tools.

---

### 1.3 Platform Analytics Dashboard

**Key Metrics:**

**Users:**
- Total registered users (breakdown by role)
- Active users (last 30 days)
- New registrations (daily/weekly)
- Geographic distribution

**Content:**
- Total tests created
- Total questions in database
- Average questions per test
- Most popular subjects

**Engagement:**
- Active test sessions (real-time)
- Test completion rate
- Average test score (platform-wide)
- Student retention rate

**Revenue:**
- Premium subscriptions (active)
- Monthly recurring revenue
- Star package sales
- Seller commissions paid

**Visual Representations:**
- Line charts for growth trends
- Pie charts for role distribution
- Heatmaps for geographic activity
- Bar charts for subject popularity

---

### 1.4 Contact Message Hub

**Features:**
- View all user-submitted support requests
- Filter by status (New, In Progress, Resolved)
- Priority levels (Low, Medium, High, Urgent)
- Assign to specific admins
- Response time tracking
- Satisfaction surveys post-resolution

**Message Categories:**
- Technical Issues
- Account Problems
- Premium Inquiries
- Feature Requests
- Bug Reports

---

## 🛡️ Admin (The Institutional Guardian)

Admins handle day-to-day operations and user lifecycle management.

### Core Responsibilities
- User onboarding (Teachers, Students, Sellers)
- Class architecture and management
- Premium treasury oversight
- Moderation and security

---

### 2.1 Teacher Management

**Location:** `/admin/manage-teachers`

#### **Add Teacher Workflow**

**Step 1: Basic Information**
- Full name (First + Last)
- Email address (used for login)
- Phone number
- Department/Subject specialization

**Step 2: System Configuration**
- Auto-generated Teacher ID (e.g., `TCH001`)
- Assign classes
- Set test creation permissions
- Premium status

**Step 3: Onboarding Email**
- Automatic email with login credentials
- Platform introduction guide
- Link to teacher documentation

#### **Teacher Statistics**
- Tests created
- Average student score on their tests
- Active students enrolled
- Total test attempts

#### **Bulk Import**
Upload CSV file with columns:
```csv
first_name,last_name,email,subject,phone
John,Doe,john@school.uz,Mathematics,+998901234567
```

---

### 2.2 Student Management

**Location:** `/admin/manage-students`

#### **Add Student Workflow**

**Step 1: Personal Information**
- Full name
- Email (optional for younger students)
- Date of birth
- Parent/Guardian contact

**Step 2: Academic Configuration**
- Grade level (5-11)
- Academic direction:
  - **Natural Sciences**: Biology, Chemistry, Geography
  - **Exact Sciences**: Mathematics, Physics, Computer Science
- Class group assignment (e.g., "9-01 Mathematical Sciences")

**Step 3: System Setup**
- Auto-generated Display ID (e.g., `STU0042`)
- Initial star balance (default: 0)
- Premium status (default: false)

#### **Student Profile Management**
- View complete test history
- Edit profile information
- Manage premium status
- Grant/revoke stars
- Ban/unban account

#### **Bulk Operations**
- Import from Excel/CSV
- Export student list
- Bulk premium grants
- Class reassignments

---

### 2.3 Class Architecture System

**Location:** `/admin/classes`

#### **Create Class**

**Class Configuration:**
```json
{
  "class_name": "10-01 Mathematical Sciences",
  "grade_level": 10,
  "section": "01",
  "academic_track": "exact",
  "student_capacity": 30,
  "assigned_teachers": [12, 45, 78],
  "schedule": {
    "monday": ["Algebra", "Geometry", "Physics"],
    "tuesday": ["Chemistry", "CS", "English"]
  }
}
```

#### **Class Dashboard**
- Enrolled students list
- Average performance per subject
- Attendance tracking
- Teacher assignments
- Upcoming tests

#### **Performance Analytics**
- Subject-wise score heatmap
- Top 10 performers
- Students needing intervention
- Completion rate trends

---

### 2.4 Premium Treasury

**Location:** `/admin/premium`

#### **Pricing Management**

**Configure Subscription Tiers:**

| Plan | Duration | Price (UZS) | Features |
|------|----------|-------------|----------|
| **1-Week** | 7 days | 10,000 | Basic premium |
| **1-Month** | 30 days | 35,000 | All features |
| **1-Year** | 365 days | 350,000 | All + bonus stars |

**Star Packages:**
- 100 Stars: 5,000 UZS
- 500 Stars: 20,000 UZS (10% bonus)
- 1000 Stars: 35,000 UZS (20% bonus)

#### **Manual Premium Grants**
- Select student
- Choose duration
- Add custom note
- Send notification

#### **Revenue Dashboard**
- Daily/Weekly/Monthly revenue graphs
- Premium conversion rate
- Star package sales breakdown
- Seller commission tracking
- Profit margin analysis

---

### 2.5 Moderation & Security

#### **Ban System**

**Ban Types:**
- **Temporary**: 1 day, 1 week, 1 month
- **Permanent**: Requires Head Admin approval for unban

**Ban Workflow:**
1. Select student
2. Choose ban type and duration
3. Enter detailed reason
4. Generate unban code (for temporary bans)
5. Send email notification

**Unban Code System:**
- 8-character alphanumeric code
- Single-use only
- Expires after ban period
- Sent to registered email

**Ban Reasons:**
- Academic dishonesty
- Multiple account violations
- Harassment
- Payment fraud
- Other (custom reason)

#### **Security Monitoring**
- Login attempts from unusual IPs
- Test completion time anomalies
- Answer pattern analysis (cheating detection)
- Multiple device logins

---

## 👨‍🏫 Teacher (The Content Mentor)

Teachers create, manage, and analyze educational assessments.

### Core Responsibilities
- Test creation and management
- Student performance monitoring
- Direct student intervention
- Content quality maintenance

---

### 3.1 Advanced Test Laboratory

**Location:** `/teacher/create-test`

#### **Test Creation Wizard**

**Phase 1: Basic Information**
- Test title (supports i18n for UZ/RU/EN)
- Subject selection (from teacher's specializations)
- Description/Instructions
- Target grade levels (multi-select: 5, 6, 7... 11)
- Academic track (Natural, Exact, or Both)

**Phase 2: Configuration**

| Setting | Options | Default |
|---------|---------|---------|
| **Total Questions** | 5-100 | 20 |
| **Time Limit** | 5-180 minutes | 45 |
| **Pass Threshold** | 50-90% | 60% |
| **Attempts Allowed** | 1-Unlimited | 1 |
| **Randomize Order** | Yes/No | Yes |
| **Show Answers** | Yes/No | No |

**Phase 3: Question Builder**

#### **Question Type 1: Multiple Choice**

**Example:**
```json
{
  "id": "q1",
  "type": "multiple_choice",
  "question_text": "What is the capital of Uzbekistan?",
  "points": 10,
  "options": [
    {"id": "A", "text": "Tashkent", "is_correct": true},
    {"id": "B", "text": "Samarkand", "is_correct": false},
    {"id": "C", "text": "Bukhara", "is_correct": false},
    {"id": "D", "text": "Khiva", "is_correct": false}
  ]
}
```

**Features:**
- 2-6 options
- Single or multiple correct answers
- Image support for question and options
- LaTeX support for math

#### **Question Type 2: True/False**

**Example:**
```json
{
  "id": "q2",
  "type": "true_false",
  "question_text": "The sun rises in the west.",
  "correct_answer": "False",
  "points": 5
}
```

#### **Question Type 3: Short Answer**

**Example:**
```json
{
  "id": "q3",
  "type": "short_answer",
  "question_text": "Who wrote 'Romeo and Juliet'?",
  "correct_answer": "William Shakespeare",
  "case_sensitive": false,
  "accept_variations": ["Shakespeare", "W. Shakespeare"],
  "points": 15
}
```

#### **Question Type 4: Mathematical (LaTeX)**

**Example:**
```json
{
  "id": "q4",
  "type": "math",
  "question_text": "Calculate the integral:",
  "latex_content": "\\int_{0}^{\\pi} \\sin(x) dx",
  "correct_answer": "2",
  "tolerance": 0.01,
  "points": 20
}
```

**LaTeX Editor Features:**
- Live preview with KaTeX rendering
- Symbol picker for common operators
- Greek letter buttons
- Fraction/matrix templates
- Error detection and highlighting

---

### 3.2 Student Analytics

**Location:** `/teacher/test-details/:testId`

#### **Test Overview**

**Statistics Cards:**
- Total Attempts
- Average Score (with trend indicator)
- Highest Score (with student name)
- Lowest Score (with student name)
- Completion Rate

**Performance Distribution:**
- Score histogram (0-100% in 10% buckets)
- Time taken distribution
- Pass/fail ratio

#### **Per-Student Breakdown**

**Table Columns:**
- Student Name & ID
- Score & Letter Grade
- Time Taken (vs. average)
- Correct/Incorrect Count
- Attempt Date
- Actions (View Details, Send Lesson)

**Detailed View:**
- Question-by-question analysis
- Selected vs. correct answers
- Time spent per question
- Weak areas identification

#### **Question Analysis**

**For Each Question:**
- Correct answer rate (%)
- Most common wrong answer
- Average time spent
- Difficulty rating (auto-calculated)

**Use Case:** Identify questions that are too hard/easy and revise accordingly.

---

### 3.3 Lesson Invitation System

**When:** Triggered when student scores < 60%

**Invitation Form:**
- Lesson topic (e.g., "Quadratic Equations Review")
- Date (calendar picker)
- Time (24-hour format)
- Location/Room (e.g., "Room 305, Main Building")
- Custom message to student
- Reminder frequency (None, 1 day before, 1 hour before)

**Student View:**
- Notification appears in header
- Countdown timer to lesson
- Accept/Decline options
- Add to personal calendar

**Teacher Tracking:**
- Sent invitations list
- Acceptance rate
- Student attendance marking
- Follow-up test performance

### 3.4 Dashboard & Class Management

**Menu Structure:**
- **Analysis & Ratings**: Consolidated view for all statistical data
  - *Teacher Statistics*: Personal performance metrics
  - *Class Statistics*: Aggregate class performance
  - *Classes Rating*: "Top 3" class ranking
  - *Teacher Rating*: "Top 3" teacher ranking
- **My Class**: Dedicated student roster with direct profile access.

**Feature: Strict Class Filtering**
- **Logic**: Students are filtered strictly based on the teacher's `assigned_class` or `curator_class` from the API.
- **Privacy**: Teachers cannot see students from unassigned classes.

**Feature: Student Profile Details**
- **Location**: `/teacher/student-profile/:id`
- **Design**: Enhanced interface matching the dashboard aesthetic, featuring metric cards and premium status indicators.
- **Metrics**: 
  - Total tests taken
  - Average score
  - Highest score

---

## 🎓 Student (The Engaged Learner)

Students experience a gamified, social learning environment.

### Core Responsibilities
- Complete assigned tests
- Engage with learning materials
- Customize premium profile
- Participate in social economy

---

### 4.1 Smartphone-Style Onboarding

**Location:** `/onboarding` (auto-redirects on first visit)

#### **Step 1: Welcome**
- Animated logo entrance (bounce + fade-in)
- Platform introduction video (30 seconds)
- Language preference selection
- Theme preference (Light/Dark/Auto)

#### **Step 2: Device Configuration**
- "Scanning hardware" simulation
- Progress bar with status messages:
  - "Initializing student profile..."
  - "Configuring test environment..."
  - "Optimizing learning settings..."
- Smooth transitions between states

#### **Step 3: Profile Creation**

**Upload Profile Photo:**
- Drag-and-drop or click to upload
- Supported formats: JPG, PNG, GIF (animated GIFs for premium)
- Auto-crop to 400x400px
- Preview before upload

**Enter Details:**
- Display name (shown to teachers/classmates)
- Academic direction (Nature/Exact)
- Bio/status message (max 100 characters)
- Emoji selector for status

#### **Step 4: Privacy & Permissions**
- Terms of Service (scrollable, must reach bottom)
- Privacy Policy agreement
- Notification preferences:
  - Email notifications (test results, messages)
  - Push notifications (lesson reminders)
  - SMS notifications (premium only)

#### **Step 5: Feature Tour**

**Interactive Walkthrough:**
1. **Testing Interface**: Click through sample question
2. **Digital Inventory**: Practice saving an item
3. **Premium Features**: Preview emoji picker and gradients
4. **Navigation**: Tour of header icons

#### **Step 6: Completion**
- Confetti animation (canvas-based)
- Welcome message from assigned teacher
- First achievement badge: "Onboarding Champion" (+10 stars)
- Redirect to student dashboard

---

### 4.2 Digital Inventory System

#### **The Flyer Animation**

**Triggering Save:**
When student clicks "Save" on:
- Test results
- Teacher-sent notes
- Highlighted text
- Important announcements

**Animation Sequence:**
1. Create flying div with copied content
2. Calculate trajectory from source to header Storage icon
3. Apply 3D transform:
   ```css
   transform: 
     translate3d(deltaX, deltaY, -100px)
     rotate(720deg)
     scale(0);
   ```
4. Simultaneously fade opacity to 0
5. Duration: 800ms with cubic-bezier easing
6. On completion, remove div and increment Storage counter

**Technical Implementation:**
```javascript
const createFlyer = (sourceElement, content) => {
  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = document.querySelector('#header-storage-bin').getBoundingClientRect();
  
  const flyer = document.createElement('div');
  flyer.className = 'flyer-icon';
  flyer.innerHTML = '<span class="material-symbols-outlined">inventory_2</span>';
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
  
  setTimeout(() => {
    flyer.remove();
    // Dispatch event to update Storage count
    window.dispatchEvent(new CustomEvent('itemSaved', { detail: content }));
  }, 800);
};
```

#### **Storage Contents View**

**Header Expansion:**
- Click Storage icon
- Header smoothly expands from 64px to 380px
- Storage area slides down with fade-in

**Item Display:**
- List view with timestamps
- Category icons (Test, Note, Text, Announcement)
- Preview text (first 50 characters)
- Quick actions: View Full, Delete

**Features:**
- Search within saved items
- Filter by type
- Sort by date/relevance
- Export to PDF

---

### 4.3 Social Premium Economy

#### **Star Collection**

**Earning Stars:**
- Test completion: +10 stars
- Score 90%+: +50 bonus stars
- Daily login streak: +5 stars/day (max 100/day)
- Referral bonus: +100 stars per successful referral
- Achievement unlocks: 10-200 stars each

**Achievements:**
- "First Test": Complete first test
- "Perfect Score": 100% on any test
- "Speed Demon": Complete test in < 50% of time limit
- "Marathon Runner": Complete 10 tests in a week
- "Top of Class": Highest score in class
- "Consistent Scholar": 30-day login streak

#### **Gift Shop**

**Purchasable Items:**

| Item | Cost | Description |
|------|------|-------------|
| **Gradient Pack** | 100 stars | 5 custom profile backgrounds |
| **Emoji Category** | 50 stars | Unlock emoji collection |
| **Custom Badge** | 200 stars | Display achievement |
| **Profile Frame** | 150 stars | Animated border |
| **Status Glow** | 75 stars | Glowing name effect |

**Trading System:**
- Send gifts to other students
- Request specific gifts
- Gift history tracking

#### **Emoji Picker**

**1000+ Emojis Across 6 Categories:**

1. **😀 Faces & Emotions** (250 emojis)
   - Happy, sad, angry, surprised, etc.
2. **🐾 Animals & Nature** (200 emojis)
   - Mammals, birds, plants, weather
3. **🍕 Food & Drink** (150 emojis)
   - Meals, snacks, beverages
4. **⚽ Activities & Sports** (150 emojis)
   - Sports, hobbies, games
5. **🎨 Objects & Symbols** (150 emojis)
   - Tools, tech, symbols
6. **🌍 Travel & Places** (100 emojis)
   - Buildings, landmarks, vehicles

**Features:**
- Category tabs with icon indicators
- Search functionality (type to filter)
- Recently used section
- Favorite emojis (heart to save)
- Selection limit: 10 emojis for status
- Floating animation when selected

**Premium Unlock:**
- Free users: 50 emojis
- Premium users: All 1000+ emojis

#### **Profile Customization**

**For Premium Members:**

1. **Animated Profile Picture**
   - Support for GIF uploads
   - Max file size: 2MB
   - Auto-optimization

2. **Custom Gradient Backgrounds**
   - 20+ preset gradients
   - Custom dual-color picker
   - Live preview
   - CSS export

3. **Profile Status**
   - 100-character limit
   - Emoji support (up to 10)
   - Auto-saves on change
   - Visibility toggle

4. **Premium Badge**
   - Golden "Premium" indicator
   - Custom premium frame
   - Visibility controls

---

### 4.4 Secure Testing Environment

#### **Anti-Cheat Mechanisms**

**Server-Side Session Management:**

**When Test Starts:**
1. Backend creates unique `session_id` (UUID)
2. Records `start_time` (server timezone)
3. Calculates `end_time` = start_time + test time_limit
4. Initializes empty `answers` object

**During Test:**
- Every answer change syncs to server
- Client sends answer updates via PATCH request
- Server timestamps each update
- Timer calculated server-side (immune to client manipulation)

**Network Resilience:**
- If connection drops:
  - Answers cached in localStorage
  - Timer continues on server
  - On reconnect, sync cached answers
  - Retrieve updated time remaining

**Auto-Submission:**
- Cron job checks for expired sessions every 30 seconds
- When current_time ≥ end_time:
  - Mark session as completed
  - Calculate final score
  - Lock session (no further edits)
  - Send notification to student

**Frontend Prevention:**
- Tab switching logged (not blocked)
- Copy/paste disabled in question areas
- Right-click context menu disabled
- DevTools detection with warnings
- Full-screen mode encouraged

---

## 💼 Seller (The Growth Agent)

Sellers drive platform monetization through direct sales.

### Core Responsibilities
- Premium subscription sales
- Star package distribution
- Customer relationship management
- Revenue analytics

---

### 5.1 Sales Dashboard

**Location:** `/seller/dashboard`

#### **Today's Metrics**
- Premium subscriptions sold: 15
- Revenue generated: 450,000 UZS
- Star packages sold: 8
- New customers acquired: 12

#### **Monthly Overview**
- Total revenue: 12,500,000 UZS
- Active customers: 237
- Conversion rate: 23%
- Average sale value: 35,000 UZS

#### **Performance Charts**
- Daily revenue line chart
- Package distribution pie chart
- Conversion funnel visualization
- Customer acquisition trend

---

### 5.2 Customer Management

**Location:** `/seller/customers`

#### **Customer List**

**Table Columns:**
- Student Name & ID
- Premium Status (Active/Expired/Never)
- Last Purchase Date
- Total Spent
- Star Balance
- Actions (Renew, Upgrade, Contact)

#### **Customer Profile**
- Purchase history
- Test performance (to suggest upgrades)
- Communication log
- Renewal reminders

---

### 5.3 Sales Tools

#### **Premium Activation**

**Quick Sale Form:**
1. Enter student ID or email
2. Select package (1-week, 1-month, 1-year)
3. Choose payment method
4. Apply discount code (if any)
5. Confirm and activate

**Payment Methods:**
- Cash (offline)
- Click (Uzbekistan payment gateway)
- Payme
- Bank transfer
- Credit to account

#### **Star Package Sale**

**Available Packages:**
- 100 Stars: 5,000 UZS
- 500 Stars: 20,000 UZS
- 1000 Stars: 35,000 UZS

**Instant Delivery:**
Stars added to student account immediately upon payment confirmation.

---

### 5.4 Commission Structure

**Revenue Sharing:**

| Package | Price (UZS) | Commission | Earnings |
|---------|-------------|------------|----------|
| **1-Week Premium** | 10,000 | 15% | 1,500 |
| **1-Month Premium** | 35,000 | 20% | 7,000 |
| **1-Year Premium** | 350,000 | 25% | 87,500 |
| **100 Stars** | 5,000 | 10% | 500 |
| **500 Stars** | 20,000 | 12% | 2,400 |
| **1000 Stars** | 35,000 | 15% | 5,250 |

**Leaderboard:**
Monthly ranking of sellers by:
- Total revenue generated
- Number of sales
- Conversion rate
- Customer satisfaction

**Bonuses:**
- Top 3 sellers: 10% bonus on all earnings
- 100+ sales in a month: 5,000 UZS flat bonus
- 95%+ customer satisfaction: 3% additional commission

---

### 5.5 Analytics & Reports

**Monthly Report (Auto-generated):**
- Total sales count
- Revenue breakdown by package
- Commission earned
- New vs. repeat customers
- Top-performing days
- Conversion funnel analysis

**Export Options:**
- PDF summary
- Excel detailed report
- CSV for accounting systems

---

## 🔗 Cross-Role Interactions

### Teacher → Student
- Create and assign tests
- Send lesson invitations
- Provide feedback on attempts
- Award bonus stars

### Admin → Teacher
- Approve test creation
- Assign classes
- Grant resources
- Monitor activity

### Admin → Student
- Manage enrollment
- Grant/revoke premium
- Handle support requests
- Process refunds

### Seller → Student
- Sell premium subscriptions
- Distribute star packages
- Provide upgrade consultations
- Handle renewals

### Head Admin → All Roles
- Configure global settings
- Override permissions
- Access all analytics
- Resolve conflicts

---

**For technical details, see [ARCHITECTURE.md](./ARCHITECTURE.md)**
**For API documentation, see [API.md](./API.md)**
