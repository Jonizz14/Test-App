# 🎓 Test-App: Enterprise Educational Ecosystem

> **The Ultimate Multi-Role Learning & Testing Platform** - Where **Brutalist Design** meets high-performance engineering.

[![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.x-green?logo=django)](https://www.djangoproject.com/)
[![Vite](https://img.shields.io/badge/Vite-7.2.2-646CFF?logo=vite)](https://vitejs.dev/)

---

## 📖 Documentation

This project includes comprehensive documentation split into specialized guides:

- **[📋 ROLES.md](./docs/ROLES.md)** - Complete guide to all 5 user roles and their features
- **[🏗️ ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical architecture, design system, and components
- **[🔌 API.md](./docs/API.md)** - Complete API reference and integration guide

---

## 🌟 Quick Overview

**Test-App** is a comprehensive educational testing and social learning platform designed for institutional scale. It features:

- **5 Distinct Roles**: HeadAdmin, Admin, Teacher, Student, Seller
- **Premium Brutalist Design**: Bold, functional, striking UI/UX
- **Anti-Cheat System**: Server-side proctoring with persistent timers
- **Social Economy**: Stars, Gifts, and Premium customization
- **Real-time Analytics**: Comprehensive dashboards for all roles
- **Multi-language**: Full support for Uzbek, Russian, and English

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL or SQLite

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/your-repo/Test-App.git
cd Test-App
```

**2. Backend Setup:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

**3. Frontend Setup:**
```bash
# In project root
npm install
npm run dev
```

**4. Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

---

## 🎨 Design Philosophy

Test-App embraces **Premium Brutalism**:
- **Bold Borders**: 4-8px solid black borders on all interactive elements
- **High Contrast**: Pure blacks (#000) against whites (#FFF)
- **Dynamic Island Header**: Morphing header that expands for Search, Messages, Storage
- **3D Flyer Animations**: Items "fly" into the digital inventory

---

## 🛡️ Key Features

### For Head Admins
- Global UI feature toggles (Header icons, Animations, Onboarding steps)
- Design system controls (Border radius override)
- Admin management and platform analytics

### For Admins
- User lifecycle management (Teachers, Students, Sellers)
- Class architecture and grouping
- Premium treasury and monetization oversight

### For Teachers
- Advanced test creation with LaTeX and image support
- Real-time student analytics
- Direct intervention tools (Lesson Invitations)

### For Students
- Smartphone-style onboarding experience
- Digital Inventory with 3D Flyer animations
- Social economy (Stars, Gifts, Premium profiles)
- Secure testing environment

### For Sellers
- Premium subscription sales
- Star package distribution
- Revenue analytics dashboard

---

## 📚 Tech Stack

### Frontend
- React 19.2.0 + Vite 7.2.2
- Ant Design 6.1.1 + TailwindCSS
- i18next (Multi-language support)
- Chart.js (Data visualization)
- KaTeX (Mathematical expressions)

### Backend
- Django 5.x + Django REST Framework
- JWT Authentication
- SQLite/PostgreSQL
- Pillow (Image processing)

---

## 🗺️ Project Structure

```
Test-App/
├── backend/              # Django REST API
│   ├── api/             # Core API logic
│   ├── testplatform/    # Project settings
│   └── media/           # User uploads
├── src/                 # React frontend
│   ├── components/      # Reusable UI components
│   ├── context/         # Global state management
│   ├── pages/           # Role-specific dashboards
│   └── styles/          # Brutalist design system
├── docs/                # Documentation
│   ├── ROLES.md        # Role feature guide
│   ├── ARCHITECTURE.md # Technical architecture
│   └── API.md          # API reference
└── README.md           # This file
```

---

## 🔧 Environment Configuration

**Backend `.env`:**
```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🧪 Development

```bash
# Run tests
npm run test              # Frontend tests
python manage.py test     # Backend tests

# Code quality
npm run lint              # ESLint
npm run format            # Prettier

# Build for production
npm run build
```

---

## 📈 Roadmap

### Phase 1 (Q2 2026)
- [ ] AI-powered question generation
- [ ] Real-time collaborative testing
- [ ] Mobile app (React Native)

### Phase 2 (Q3 2026)
- [ ] Video lesson integration
- [ ] Live proctoring with webcam
- [ ] Advanced analytics with ML

### Phase 3 (Q4 2026)
- [ ] Blockchain certificates
- [ ] Global leaderboards
- [ ] Marketplace for test templates

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md).

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software developed for educational institutions in Uzbekistan.

© 2026 Test-App Educational Platform. All Rights Reserved.

---

## 📞 Contact & Support

For questions, issues, or feature requests:
- **Issues**: [GitHub Issues](https://github.com/your-repo/Test-App/issues)
- **Email**: support@test-app.uz
- **Documentation**: [docs/](./docs/)

---

**Built with ❤️ for the future of education in Uzbekistan**
