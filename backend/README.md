# Test Platform Backend API

Django REST Framework backend for the Test Platform application.

## Features

- **User Management**: Student, Teacher, Admin, and Seller roles
- **Test Management**: Create, manage, and take tests
- **Premium Features**: Time-based and performance-based premium subscriptions
- **Gift System**: Star-based reward system with gifts
- **Statistics & Analytics**: Comprehensive admin dashboard statistics
- **Anti-Cheating**: Warning system and session monitoring
- **Excel Import/Export**: Bulk operations for users and data
- **Swagger Documentation**: Interactive API documentation

## Setup

### Prerequisites

- Python 3.8+
- Django 5.2+
- PostgreSQL or SQLite

### Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run development server:**
   ```bash
   python manage.py runserver
   ```

## API Documentation

### Django REST Framework Browsable API

Access the interactive API documentation at:
- **API Root**: `http://localhost:8000/api/` (Public welcome page with endpoint links)
- **Browsable API**: Click any endpoint URL to see the interactive documentation
- **JSON Response**: All endpoints return JSON data

### Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles

- **Student**: Can take tests, purchase gifts, earn stars
- **Teacher**: Can create tests, manage students, earn commissions
- **Admin**: Full system access, user management, statistics
- **Seller**: Can manage premium subscriptions and pricing

## API Endpoints

### Authentication
- `POST /api/users/login/` - User login
- `POST /api/users/register/` - User registration
- `POST /api/token/refresh/` - Refresh JWT token

### Users
- `GET /api/users/` - List users (admin only)
- `GET /api/users/{id}/` - Get user details
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user
- `POST /api/users/{id}/ban_user/` - Ban user
- `POST /api/users/{id}/unban_user/` - Unban user
- `PATCH /api/users/{id}/toggle_premium/` - Toggle premium status
- `PATCH /api/users/{id}/grant_premium/` - Grant premium
- `PATCH /api/users/{id}/revoke_premium/` - Revoke premium

### Tests
- `GET /api/tests/` - List tests
- `GET /api/tests/public_list/` - Public test list (no auth required)
- `POST /api/tests/` - Create test
- `GET /api/tests/{id}/` - Get test details
- `PUT /api/tests/{id}/` - Update test
- `DELETE /api/tests/{id}/` - Delete test

### Test Attempts
- `GET /api/attempts/` - List attempts
- `POST /api/attempts/` - Create attempt
- `GET /api/attempts/{id}/` - Get attempt details

### Test Sessions
- `POST /api/sessions/start_session/` - Start test session
- `GET /api/sessions/get_session/` - Get active session
- `PUT /api/sessions/update_answers/` - Update session answers
- `POST /api/sessions/complete_session/` - Complete session
- `POST /api/sessions/auto_expire_sessions/` - Auto-expire sessions

### Questions
- `GET /api/questions/` - List questions
- `GET /api/questions/public_list/` - Public question list
- `POST /api/questions/` - Create question
- `PUT /api/questions/{id}/` - Update question
- `DELETE /api/questions/{id}/` - Delete question

### Gifts & Rewards
- `GET /api/gifts/` - List gifts
- `POST /api/gifts/` - Create gift
- `PUT /api/gifts/{id}/` - Update gift
- `DELETE /api/gifts/{id}/` - Delete gift
- `GET /api/student-gifts/` - List student gifts
- `POST /api/student-gifts/purchase_gift/` - Purchase gift
- `POST /api/student-gifts/{id}/place_gift/` - Place gift on profile

### Pricing & Premium
- `GET /api/pricing/` - List pricing plans
- `POST /api/pricing/` - Create pricing plan
- `GET /api/star-packages/` - List star packages

### Statistics (Admin Only)
- `GET /api/statistics/overview/` - Platform overview stats
- `GET /api/statistics/class_statistics/` - Class statistics
- `GET /api/statistics/teacher_performance/` - Teacher performance
- `GET /api/statistics/revenue_stats/` - Revenue statistics
- `GET /api/statistics/system_health/` - System health metrics

### Anti-Cheating
- `GET /api/warnings/` - List warnings
- `POST /api/sessions/{id}/log_warning/` - Log warning

## Data Models

### User
- `id`: Primary key
- `username`: Unique username
- `email`: Email address
- `name`: Full name
- `role`: student/teacher/admin/seller
- `class_group`: Student class (for students)
- `direction`: natural/exact (for students)
- `subjects`: Array of subjects (for teachers)
- `is_curator`: Boolean (for teachers)
- `curator_class`: Class curator manages (for teachers)
- `is_premium`: Premium status
- `premium_type`: time_based/performance_based
- `stars`: Star balance (for students)
- `seller_earnings`: Earnings (for teachers/sellers)

### Test
- `id`: Primary key
- `title`: Test title
- `description`: Test description
- `subject`: Subject
- `difficulty`: easy/medium/hard
- `time_limit`: Time limit in minutes
- `target_grades`: Target grade levels
- `teacher`: Test creator
- `is_active`: Active status
- `questions`: Related questions

### TestAttempt
- `id`: Primary key
- `student`: Student who took the test
- `test`: Test taken
- `score`: Score percentage
- `answers`: Student answers
- `time_taken`: Time taken in minutes
- `completed_at`: Completion timestamp

## Development

### Running Tests
```bash
python manage.py test
```

### Code Formatting
```bash
# Install black and isort
pip install black isort

# Format code
black .
isort .
```

### Database Management
```bash
# Create migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

## Deployment

### Environment Variables
Create a `.env` file in the backend directory:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Production Settings
- Set `DEBUG=False`
- Use PostgreSQL database
- Configure static files serving
- Set up proper CORS settings
- Use environment variables for secrets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.