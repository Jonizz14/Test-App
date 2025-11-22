# 🎓 SmartTest Platform

> **Zamonaviy va aqlli test platformasi** - Modern multi-role educational testing system

[![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Django](https://img.shields.io/badge/Django-5.x-green?logo=django)](https://www.djangoproject.com/)
[![Material-UI](https://img.shields.io/badge/Material--UI-7.3.5-blue?logo=material-ui)](https://mui.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<div align="center">

![SmartTest Platform](https://via.placeholder.com/800x400/2563eb/ffffff?text=SmartTest+Platform)

**Professional testing solution for educational institutions**

[🚀 Live Demo](#-demo) • [📋 Features](#-features) • [🛠️ Tech Stack](#-tech-stack) • [⚡ Quick Start](#-quick-start)

</div>

---

## 🌟 About The Project

**SmartTest Platform** is a comprehensive, modern web application designed for educational institutions to conduct online examinations and assessments. Built with a focus on user experience, security, and scalability, it supports multiple user roles and provides rich analytics for educators and administrators.

### 🎯 Key Highlights

- **🏛️ Multi-Role System**: Separate dashboards for Admins, Teachers, and Students
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🎨 Modern UI**: Clean, professional interface built with Material-UI
- **📊 Real-time Analytics**: Comprehensive statistics and progress tracking
- **🔒 Secure Authentication**: Role-based access control with JWT tokens
- **📈 Scalable Architecture**: Full-stack solution with Django REST API

---

## ✨ Features

### 👑 **Admin Features**
- 🔧 **System Management**: Complete platform oversight and configuration
- 👥 **User Management**: Add, edit, and manage all users (teachers & students)
- 📋 **Test Oversight**: Monitor and control all tests across the platform
- 📊 **Analytics Dashboard**: Comprehensive statistics and reporting
- 🎯 **Performance Monitoring**: Track platform usage and user engagement

### 👨‍🏫 **Teacher Features**
- ➕ **Test Creation**: Build custom tests with multiple question types
- 📤 **Test Distribution**: Send tests to specific students or groups
- 👀 **Real-time Monitoring**: Watch students taking tests live
- 📈 **Results Analysis**: Detailed performance analytics and insights
- 📝 **Student Management**: Track individual student progress
- 📊 **Statistics Dashboard**: Visual data about test performance

### 🎓 **Student Features**
- 🔍 **Test Discovery**: Browse and search available tests
- 📝 **Take Tests**: Intuitive testing interface with real-time feedback
- 📊 **View Results**: Detailed performance analysis and scoring
- 📈 **Progress Tracking**: Personal learning analytics and history
- 🏆 **Achievement System**: Track accomplishments and improvements
- 📱 **Mobile Friendly**: Seamless experience on all devices

### 🛠️ **Technical Features**
- 🚀 **Fast Performance**: Vite-powered React frontend for lightning-fast loading
- 🔐 **Secure API**: Django REST Framework with JWT authentication
- 📱 **Responsive Design**: Mobile-first approach with Material-UI
- 🎨 **Modern UI/UX**: Clean, intuitive interface with smooth animations
- 📊 **Data Visualization**: Charts and graphs powered by Chart.js
- 🌐 **RESTful API**: Well-documented, scalable backend architecture

---

## 🛠️ Tech Stack

### **Frontend**
- ⚛️ **React 19.2.0** - Modern JavaScript library for building user interfaces
- ⚡ **Vite 7.2.2** - Next-generation frontend tooling for fast development
- 🎨 **Material-UI 7.3.5** - React components implementing Google's Material Design
- 📊 **Chart.js 4.5.1** - Flexible JavaScript charting library
- 🛣️ **React Router 7.9.6** - Declarative routing for React applications
- 🔄 **Axios 1.13.2** - Promise-based HTTP client for API requests

### **Backend**
- 🐍 **Django 5.x** - High-level Python web framework
- 🌐 **Django REST Framework** - Powerful and flexible toolkit for building Web APIs
- 🗃️ **SQLite** - Lightweight, serverless database (development)
- 🔐 **JWT Authentication** - Secure token-based authentication
- 📡 **CORS** - Cross-Origin Resource Sharing configuration

### **Development Tools**
- 🔧 **ESLint 9.39.1** - Pluggable JavaScript linter
- 📦 **npm** - Package manager and dependency management
- 🐳 **Docker Ready** - Containerization support (planned)

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://www.python.org/)
- **Git** - [Download here](https://git-scm.com/)

### Installation

1. **📥 Clone the repository**
   ```bash
   git clone https://github.com/your-username/test-platform.git
   cd test-platform
   ```

2. **🔧 Setup Backend (Django)**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Run database migrations
   python manage.py migrate
   
   # Create superuser (optional)
   python manage.py createsuperuser
   
   # Start Django development server
   python manage.py runserver
   ```

3. **⚛️ Setup Frontend (React)**
   ```bash
   # Open new terminal and navigate to project root
   cd test-platform
   
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
   ```

4. **🌐 Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **Admin Panel**: http://localhost:8000/admin

---

## 📋 Usage Examples

### Getting Started

1. **🔑 Login as Admin**
   - Email: `admin@example.com`
   - Password: `admin123`

2. **👨‍🏫 Create Teacher Account**
   - Use the admin dashboard to add teachers
   - Teachers can then create tests and manage students

3. **👤 Add Students**
   - Register students through the registration page
   - Or use admin panel to bulk import students

4. **📝 Create and Assign Tests**
   - Teachers create tests with multiple question types
   - Assign to specific students or groups
   - Monitor real-time progress

5. **📊 View Analytics**
   - Comprehensive dashboards for all user types
   - Export data for further analysis

### API Endpoints

```
🔐 Authentication
POST /api/users/login/     - User login
POST /api/users/logout/    - User logout
POST /api/token/refresh/   - Refresh JWT token

👥 User Management
GET    /api/users/         - List all users
POST   /api/users/         - Create new user
GET    /api/users/{id}/    - Get user details
PUT    /api/users/{id}/    - Update user
DELETE /api/users/{id}/    - Delete user

📋 Test Management
GET    /api/tests/         - List all tests
POST   /api/tests/         - Create new test
GET    /api/tests/{id}/    - Get test details
PUT    /api/tests/{id}/    - Update test
DELETE /api/tests/{id}/    - Delete test

📝 Question Management
GET    /api/questions/     - List all questions
POST   /api/questions/     - Create new question
GET    /api/questions/{id}/- Get question details

🎯 Test Attempts
GET    /api/attempts/      - List all attempts
POST   /api/attempts/      - Start new test attempt
PUT    /api/attempts/{id}/ - Update attempt
GET    /api/attempts/?student={id} - Get student's attempts
```

---

## 📁 Project Structure

```
test-platform/
├── 📁 backend/                 # Django backend
│   ├── 📁 api/                 # Django app for API
│   │   ├── 📄 models.py        # Database models
│   │   ├── 📄 views.py         # API views
│   │   ├── 📄 serializers.py   # DRF serializers
│   │   ├── 📄 urls.py          # URL routing
│   │   └── 📄 admin.py         # Admin interface
│   ├── 📁 testplatform/        # Django project settings
│   │   ├── 📄 settings.py      # Project settings
│   │   ├── 📄 urls.py          # Main URL configuration
│   │   └── 📄 wsgi.py          # WSGI configuration
│   └── 📄 manage.py            # Django management script
├── 📁 src/                     # React frontend
│   ├── 📁 components/          # Reusable UI components
│   ├── 📁 pages/               # Page components
│   │   ├── 📁 admin/           # Admin dashboard pages
│   │   ├── 📁 teacher/         # Teacher dashboard pages
│   │   └── 📁 student/         # Student dashboard pages
│   ├── 📁 context/             # React context providers
│   ├── 📁 data/                # API service and data
│   └── 📁 styles/              # CSS and styling files
├── 📄 package.json             # Frontend dependencies
├── 📄 requirements.txt         # Backend dependencies
├── 📄 vite.config.js           # Vite configuration
└── 📄 README.md               # This file
```

---

## 🎨 Screenshots

### Login Page
![Login Page](https://via.placeholder.com/600x400/f8fafc/2563eb?text=Login+Page)

### Admin Dashboard
![Admin Dashboard](https://via.placeholder.com/600x400/2563eb/ffffff?text=Admin+Dashboard)

### Teacher Interface
![Teacher Interface](https://via.placeholder.com/600x400/059669/ffffff?text=Teacher+Interface)

### Student Testing
![Student Testing](https://via.placeholder.com/600x400/d97706/ffffff?text=Student+Testing)

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DATABASE_URL=sqlite:///db.sqlite3

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
```

### Frontend Configuration

Update `src/data/apiService.js` for API endpoint configuration:

```javascript
const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

## 📊 Performance

- **⚡ Fast Loading**: Vite-powered development with HMR
- **📱 Mobile Optimized**: Responsive design for all devices
- **🔄 Real-time Updates**: WebSocket support for live updates
- **📈 Scalable**: Handles thousands of concurrent users
- **🗄️ Efficient**: Optimized database queries and caching

---

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
npm run test
```

### Test Coverage

- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user workflow testing

---

## 🚀 Deployment

### Production Build

```bash
# Build frontend
npm run build

# Collect static files (Django)
cd backend
python manage.py collectstatic
```

### Deployment Options

- **🌐 Vercel** - Frontend deployment with zero-config
- **🐳 Docker** - Containerized deployment
- **☁️ Heroku** - Full-stack deployment
- **🖥️ VPS** - Traditional server deployment

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **🍴 Fork the repository**
2. **🌱 Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **💾 Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **📤 Push to the branch** (`git push origin feature/AmazingFeature`)
5. **🔀 Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Material-UI Team** - For the amazing component library
- **Django Community** - For the robust web framework
- **React Team** - For the powerful UI library
- **Vite Team** - For the blazing fast build tool

---

## 📞 Support

Need help or have questions? 

- 📧 **Email**: support@smarttest-platform.com
- 💬 **Discord**: [Join our community](https://discord.gg/smarttest)
- 📖 **Documentation**: [docs.smarttest-platform.com](https://docs.smarttest-platform.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/test-platform/issues)

---

<div align="center">

**[⬆ Back to Top](#-smarttest-platform)**

Made with ❤️ by the SmartTest Team

</div>
