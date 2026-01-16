# 🔌 API.md - Complete API Reference

Comprehensive API documentation for Test-App backend endpoints.

---

## Table of Contents

1. [Base Configuration](#1-base-configuration)
2. [Authentication Endpoints](#2-authentication-endpoints)
3. [User Management](#3-user-management)
4. [Test Management](#4-test-management)
5. [Question Management](#5-question-management)
6. [Test Sessions](#6-test-sessions-anti-cheat)
7. [Premium & Monetization](#7-premium--monetization)
8. [Analytics](#8-analytics)
9. [Contact Messages](#9-contact-messages)
10. [Error Handling](#10-error-handling)

---

## 1. BASE CONFIGURATION

### Base URL
```
Development: http://localhost:8000/api
Production: https://api.test-app.uz/api
```

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

### Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": { },
  "error": null
}
```

---

## 2. AUTHENTICATION ENDPOINTS

### 2.1 User Login

**Endpoint:** `POST /users/login/`

**Description:** Authenticate user and retrieve JWT tokens.

**Request:**
```json
{
  "username": "student@test.uz",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 42,
    "role": "student",
    "display_id": "STU0042",
    "email": "student@test.uz",
    "first_name": "Ali",
    "last_name": "Karimov",
    "profile_photo": "/media/profile_photos/42.jpg",
    "is_premium": true,
    "premium_expiry": "2026-06-15T12:00:00Z",
    "star_balance": 150
  }
}
```

**Error Responses:**
- `400`: Missing credentials
- `401`: Invalid credentials
- `403`: Account banned

---

### 2.2 Token Refresh

**Endpoint:** `POST /token/refresh/`

**Description:** Refresh expired access token using refresh token.

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

### 2.3 User Registration

**Endpoint:** `POST /users/register/`

**Description:** Register new student account.

**Request:**
```json
{
  "email": "newstudent@test.uz",
  "password": "securePassword123",
  "first_name": "Jamshid",
  "last_name": "Tursunov",
  "grade_level": 9,
  "direction": "exact"
}
```

**Response (201 Created):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 73,
    "role": "student",
    "display_id": "STU0073",
    "email": "newstudent@test.uz",
    "first_name": "Jamshid",
    "last_name": "Tursunov",
    "grade_level": 9,
    "direction": "exact",
    "is_premium": false,
    "star_balance": 0
  }
}
```

---

## 3. USER MANAGEMENT

### 3.1 List Users

**Endpoint:** `GET /users/`

**Permissions:** Admin, HeadAdmin

**Query Parameters:**
- `role` (optional): Filter by role (student/teacher/admin/seller)
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 20)

**Example Request:**
```
GET /users/?role=student&page=1&page_size=20
```

**Response (200 OK):**
```json
{
  "count": 237,
  "next": "/users/?role=student&page=2",
  "previous": null,
  "results": [
    {
      "id": 42,
      "display_id": "STU0042",
      "email": "student@test.uz",
      "first_name": "Ali",
      "last_name": "Karimov",
      "role": "student",
      "grade_level": 10,
      "direction": "exact",
      "is_premium": true,
      "star_balance": 150,
      "created_at": "2025-09-01T10:00:00Z"
    }
  ]
}
```

---

### 3.2 Get User Details

**Endpoint:** `GET /users/{id}/`

**Permissions:** Authenticated (own profile) or Admin

**Response (200 OK):**
```json
{
  "id": 42,
  "display_id": "STU0042",
  "email": "student@test.uz",
  "first_name": "Ali",
  "last_name": "Karimov",
  "role": "student",
  "profile_photo": "/media/profile_photos/42.jpg",
  "profile_status": "Learning is my superpower! 🚀",
  "grade_level": 10,
  "direction": "exact",
  "is_premium": true,
  "premium_expiry": "2026-06-15T12:00:00Z",
  "star_balance": 150,
  "is_banned": false,
  "created_at": "2025-09-01T10:00:00Z",
  "updated_at": "2026-01-10T14:30:00Z"
}
```

---

### 3.3 Update User

**Endpoint:** `PUT /users/{id}/` or `PATCH /users/{id}/`

**Permissions:** Authenticated (own profile) or Admin

**Request (PATCH):**
```json
{
  "first_name": "Ali Updated",
  "profile_status": "New status message 📚"
}
```

**Response (200 OK):**
```json
{
  "id": 42,
  "first_name": "Ali Updated",
  "profile_status": "New status message 📚",
  "updated_at": "2026-01-16T18:30:00Z"
}
```

---

### 3.4 Delete User

**Endpoint:** `DELETE /users/{id}/`

**Permissions:** Admin, HeadAdmin

**Response (204 No Content)**

---

### 3.5 Ban User

**Endpoint:** `POST /users/{id}/ban_user/`

**Permissions:** Admin, HeadAdmin

**Request:**
```json
{
  "reason": "Academic dishonesty - cheating on Math test",
  "duration_days": 7
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User banned successfully",
  "unban_code": "A7K9M2X1",
  "ban_expiry": "2026-01-23T18:30:00Z"
}
```

---

### 3.6 Unban User with Code

**Endpoint:** `POST /users/unban_with_code/`

**Permissions:** Public

**Request:**
```json
{
  "email": "student@test.uz",
  "unban_code": "A7K9M2X1"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account unbanned successfully"
}
```

---

## 4. TEST MANAGEMENT

### 4.1 List Tests

**Endpoint:** `GET /tests/`

**Permissions:** Teacher (own tests), Admin (all tests)

**Query Parameters:**
- `subject` (optional): Filter by subject
- `grade` (optional): Filter by target grade
- `is_active` (optional): Filter active/inactive

**Response (200 OK):**
```json
{
  "count": 45,
  "results": [
    {
      "id": 12,
      "title": "Algebra Midterm - Chapter 1-5",
      "description": "Comprehensive test covering linear equations",
      "subject": "Mathematics",
      "teacher": {
        "id": 8,
        "display_id": "TCH0008",
        "name": "Professor Karimova"
      },
      "time_limit": 45,
      "total_questions": 20,
      "pass_threshold": 60,
      "target_grades": [9, 10],
      "academic_track": "exact",
      "is_active": true,
      "created_at": "2026-01-01T10:00:00Z"
    }
  ]
}
```

---

### 4.2 Create Test

**Endpoint:** `POST /tests/`

**Permissions:** Teacher

**Request:**
```json
{
  "title": "Physics - Newton's Laws",
  "description": "Test on forces and motion",
  "subject": "Physics",
  "time_limit": 60,
  "total_questions": 15,
  "pass_threshold": 70,
  "target_grades": [10, 11],
  "academic_track": "exact",
  "randomize_order": true,
  "show_answers": false,
  "max_attempts": 2
}
```

**Response (201 Created):**
```json
{
  "id": 78,
  "title": "Physics - Newton's Laws",
  "teacher": 8,
  "created_at": "2026-01-16T18:30:00Z"
}
```

---

### 4.3 Get Test Details

**Endpoint:** `GET /tests/{id}/`

**Response (200 OK):**
```json
{
  "id": 12,
  "title": "Algebra Midterm - Chapter 1-5",
  "description": "Comprehensive test covering linear equations",
  "subject": "Mathematics",
  "teacher": {
    "id": 8,
    "display_id": "TCH0008",
    "first_name": "Malika",
    "last_name": "Karimova"
  },
  "time_limit": 45,
  "total_questions": 20,
  "pass_threshold": 60,
  "target_grades": [9, 10],
  "is_active": true,
  "questions": [
    {
      "id": 101,
      "question_text": "Solve: 2x + 5 = 13",
      "question_type": "short_answer",
      "correct_answer": "4",
      "points": 10
    }
  ]
}
```

---

### 4.4 Update Test

**Endpoint:** `PATCH /tests/{id}/`

**Permissions:** Teacher (own test) or Admin

**Request:**
```json
{
  "is_active": false
}
```

**Response (200 OK)**

---

### 4.5 Delete Test

**Endpoint:** `DELETE /tests/{id}/`

**Permissions:** Teacher (own test) or Admin

**Response (204 No Content)**

---

## 5. QUESTION MANAGEMENT

### 5.1 List Questions

**Endpoint:** `GET /questions/`

**Query Parameters:**
- `test` (required): Test ID

**Response (200 OK):**
```json
{
  "count": 20,
  "results": [
    {
      "id": 101,
      "test": 12,
      "question_text": "Solve: 2x + 5 = 13",
      "question_type": "short_answer",
      "correct_answer": "4",
      "points": 10,
      "order": 1
    },
    {
      "id": 102,
      "question_text": "What is the capital of Uzbekistan?",
      "question_type": "multiple_choice",
      "options": [
        {"id": "A", "text": "Tashkent", "is_correct": true},
        {"id": "B", "text": "Samarkand", "is_correct": false},
        {"id": "C", "text": "Bukhara", "is_correct": false}
      ],
      "points": 5,
      "order": 2
    }
  ]
}
```

---

### 5.2 Create Question

**Endpoint:** `POST /questions/`

**Permissions:** Teacher

**Request (Multiple Choice):**
```json
{
  "test": 12,
  "question_text": "What is 2 + 2?",
  "question_type": "multiple_choice",
  "options": [
    {"id": "A", "text": "3", "is_correct": false},
    {"id": "B", "text": "4", "is_correct": true},
    {"id": "C", "text": "5", "is_correct": false}
  ],
  "points": 10,
  "order": 3
}
```

**Request (LaTeX Math):**
```json
{
  "test": 12,
  "question_text": "Calculate the integral:",
  "question_type": "short_answer",
  "latex_content": "\\int_{0}^{\\pi} \\sin(x) dx",
  "correct_answer": "2",
  "points": 20,
  "order": 4
}
```

**Response (201 Created):**
```json
{
  "id": 103,
  "test": 12,
  "question_text": "What is 2 + 2?",
  "created_at": "2026-01-16T18:35:00Z"
}
```

---

## 6. TEST SESSIONS (ANTI-CHEAT)

### 6.1 Start Test Session

**Endpoint:** `POST /sessions/start_session/`

**Permissions:** Student

**Request:**
```json
{
  "test_id": 12
}
```

**Response (201 Created):**
```json
{
  "session_id": "a7f5c3d9-8e4b-4c1a-9f2e-5d8c7a6b3e1f",
  "test": {
    "id": 12,
    "title": "Algebra Midterm",
    "time_limit": 45,
    "total_questions": 20
  },
  "start_time": "2026-01-16T18:40:00Z",
  "end_time": "2026-01-16T19:25:00Z",
  "server_time": "2026-01-16T18:40:00Z"
}
```

---

### 6.2 Get Session Details

**Endpoint:** `GET /sessions/get_session/`

**Query Parameters:**
- `session_id` (required): UUID of session

**Response (200 OK):**
```json
{
  "session_id": "a7f5c3d9-8e4b-4c1a-9f2e-5d8c7a6b3e1f",
  "test_id": 12,
  "student_id": 42,
  "start_time": "2026-01-16T18:40:00Z",
  "end_time": "2026-01-16T19:25:00Z",
  "server_time": "2026-01-16T18:50:00Z",
  "time_remaining_seconds": 2100,
  "answers": {
    "101": "4",
    "102": "A"
  },
  "is_completed": false,
  "score": null
}
```

---

### 6.3 Update Session Answers

**Endpoint:** `PUT /sessions/update_answers/`

**Permissions:** Student (own session)

**Request:**
```json
{
  "session_id": "a7f5c3d9-8e4b-4c1a-9f2e-5d8c7a6b3e1f",
  "answers": {
    "103": "B",
    "104": "True"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Answers saved",
  "answers_count": 4
}
```

---

### 6.4 Complete Session

**Endpoint:** `POST /sessions/complete_session/`

**Permissions:** Student (own session)

**Request:**
```json
{
  "session_id": "a7f5c3d9-8e4b-4c1a-9f2e-5d8c7a6b3e1f"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "session_id": "a7f5c3d9-8e4b-4c1a-9f2e-5d8c7a6b3e1f",
  "score": 85,
  "percentage": 85,
  "correct_answers": 17,
  "total_questions": 20,
  "passed": true,
  "completed_at": "2026-01-16T19:10:00Z"
}
```

---

## 7. PREMIUM & MONETIZATION

### 7.1 Get Pricing Plans

**Endpoint:** `GET /pricing/`

**Permissions:** Public

**Response (200 OK):**
```json
{
  "plans": [
    {
      "id": 1,
      "plan_type": "week",
      "name": "1-Week Premium",
      "price": 10000,
      "currency": "UZS",
      "duration_days": 7,
      "features": [
        "Emoji picker access",
        "Custom gradients",
        "Animated profile picture",
        "Priority support"
      ],
      "is_active": true
    },
    {
      "id": 2,
      "plan_type": "month",
      "name": "1-Month Premium",
      "price": 35000,
      "currency": "UZS",
      "duration_days": 30,
      "discount_percentage": 16
    },
    {
      "id": 3,
      "plan_type": "year",
      "name": "1-Year Premium",
      "price": 350000,
      "currency": "UZS",
      "duration_days": 365,
      "discount_percentage": 20
    }
  ]
}
```

---

### 7.2 Grant Premium

**Endpoint:** `PATCH /users/{id}/grant_premium/`

**Permissions:** Admin, Seller

**Request:**
```json
{
  "pricing_id": 2
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user_id": 42,
  "is_premium": true,
  "premium_expiry": "2026-02-16T18:40:00Z",
  "message": "Premium granted successfully"
}
```

---

### 7.3 Get Star Packages

**Endpoint:** `GET /star-packages/`

**Response (200 OK):**
```json
{
  "packages": [
    {
      "id": 1,
      "name": "Starter Pack",
      "star_amount": 100,
      "price": 5000,
      "bonus_stars": 0
    },
    {
      "id": 2,
      "name": "Popular Pack",
      "star_amount": 500,
      "price": 20000,
      "bonus_stars": 50
    },
    {
      "id": 3,
      "name": "Mega Pack",
      "star_amount": 1000,
      "price": 35000,
      "bonus_stars": 200
    }
  ]
}
```

---

### 7.4 Give Stars

**Endpoint:** `POST /users/{id}/give_stars/`

**Permissions:** Admin, Seller

**Request:**
```json
{
  "amount": 100,
  "reason": "Purchase: Starter Pack"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user_id": 42,
  "new_balance": 250,
  "added": 100
}
```

---

## 8. ANALYTICS

### 8.1 Get Platform Statistics

**Endpoint:** `GET /analytics/platform/`

**Permissions:** HeadAdmin

**Response (200 OK):**
```json
{
  "users": {
    "total": 1847,
    "students": 1623,
    "teachers": 187,
    "admins": 25,
    "sellers": 12,
    "active_30days": 1234
  },
  "tests": {
    "total": 456,
    "active": 378,
    "completed_attempts": 12450
  },
  "revenue": {
    "monthly": 12500000,
    "currency": "UZS",
    "premium_active": 237,
    "star_packages_sold": 89
  },
  "engagement": {
    "avg_test_score": 76,
    "completion_rate": 87,
    "retention_rate": 82
  }
}
```

---

### 8.2 Get Test Analytics

**Endpoint:** `GET /analytics/test/{test_id}/`

**Permissions:** Teacher (own test) or Admin

**Response (200 OK):**
```json
{
  "test_id": 12,
  "title": "Algebra Midterm",
  "total_attempts": 87,
  "completed_attempts": 82,
  "avg_score": 76,
  "highest_score": 100,
  "lowest_score": 45,
  "pass_rate": 78,
  "score_distribution": {
    "90-100": 12,
    "80-89": 18,
    "70-79": 25,
    "60-69": 15,
    "0-59": 17
  },
  "question_analysis": [
    {
      "question_id": 101,
      "correct_rate": 85,
      "avg_time_seconds": 45
    }
  ]
}
```

---

## 9. CONTACT MESSAGES

### 9.1 Submit Contact Message

**Endpoint:** `POST /contact-messages/`

**Permissions:** Authenticated

**Request:**
```json
{
  "subject": "Technical Issue",
  "message": "I can't upload my profile picture",
  "category": "technical",
  "priority": "medium"
}
```

**Response (201 Created):**
```json
{
  "id": 45,
  "subject": "Technical Issue",
  "status": "new",
  "created_at": "2026-01-16T18:45:00Z"
}
```

---

### 9.2 Get Contact Messages (Admin)

**Endpoint:** `GET /contact-messages/admin_list/`

**Permissions:** Admin, HeadAdmin

**Query Parameters:**
- `status` (optional): new/in_progress/resolved
- `category` (optional): technical/account/premium
- `priority` (optional): low/medium/high/urgent

**Response (200 OK):**
```json
{
  "count": 23,
  "results": [
    {
      "id": 45,
      "user": {
        "id": 42,
        "display_id": "STU0042",
        "name": "Ali Karimov"
      },
      "subject": "Technical Issue",
      "message": "I can't upload my profile picture",
      "category": "technical",
      "priority": "medium",
      "status": "new",
      "created_at": "2026-01-16T18:45:00Z"
    }
  ]
}
```

---

### 9.3 Update Message Status

**Endpoint:** `PATCH /contact-messages/{id}/update_status/`

**Permissions:** Admin, HeadAdmin

**Request:**
```json
{
  "status": "resolved",
  "admin_notes": "Issue resolved by clearing cache"
}
```

**Response (200 OK)**

---

## 10. ERROR HANDLING

### Standard Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["This field is required"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 204 | No Content | Successful delete |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Email/password incorrect |
| `TOKEN_EXPIRED` | JWT expired, refresh needed |
| `INSUFFICIENT_PERMISSIONS` | Role not allowed |
| `RESOURCE_NOT_FOUND` | Requested resource missing |
| `VALIDATION_ERROR` | Input validation failed |
| `DUPLICATE_ENTRY` | Unique constraint violation |
| `SESSION_EXPIRED` | Test session timed out |
| `ACCOUNT_BANNED` | User is banned |

---

## 11. RATE LIMITING

**Limits:**
- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour
- Admin/HeadAdmin: 5000 requests/hour

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 843
X-RateLimit-Reset: 1642348800
```

---

**For role-specific features, see [ROLES.md](./ROLES.md)**
**For technical architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md)**
