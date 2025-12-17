import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero">
        <div className="layout-container">
          <div>
            <div className="hero-grid">
              {/* Hero Text */}
              <div className="hero-text">
                <div className="hero-text-content">
                  <h1 className="hero-title">
                    Bilimingizni
                    <span className="hero-highlight">Sinovdan O'tkazing</span>
                  </h1>
                  <h2 className="hero-subtitle">
                    O'qituvchilar, talabalar va ma'murlar uchun yagona yechim.
                    Tez, qulay va xavfsiz ta'lim tizimi orqali kelajakni quring.
                  </h2>
                </div>
                <div className="hero-buttons">
                  <button className="hero-btn-primary" onClick={() => navigate('/login')}>Bepul boshlash</button>
                  <button className="hero-btn-secondary" onClick={() => navigate('/login')}>
                    <span>Batafsil o'rganish</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
                <div className="hero-features">
                  <div className="hero-feature">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>14 kun bepul sinov</span>
                  </div>
                  <div className="hero-feature">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Karta talab qilinmaydi</span>
                  </div>
                </div>
              </div>
              
              {/* Hero Image */}
              <div className="hero-image">
                <div className="hero-image-container">
                  <div className="hero-image-placeholder"><img src="https://media.istockphoto.com/id/1311041208/vector/a-woman-tutor-with-a-schoolgirl-studying-at-home-they-do-their-homework-vector-education.jpg?s=612x612&w=0&k=20&c=EZJPZ79RRMBnmWjTcLdUgcQy0kmB1_kcIe2tprsUS9c=" alt="" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Roles Section */}
      <section className="roles">
        <div className="layout-container">
          <div>
            <div className="roles-header">
              <span className="roles-badge">Platforma Foydalanuvchilari</span>
              <h2 className="roles-title">Kimlar uchun mo'ljallangan?</h2>
              <p className="roles-description">
                SmartTest barcha ta'lim ishtirokchilari uchun maxsus asboblar to'plamini taqdim etadi.
              </p>
            </div>
            
            <div className="roles-grid">
              {/* Student Card */}
              <div className="role-card">
                <div className="role-image">
                  <div className="role-image-placeholder"><img src="https://media.istockphoto.com/id/1178763127/vector/man-with-laptop-sitting-on-the-chair-freelance-or-studying-concept-cute-illustration-in-flat.jpg?s=612x612&w=0&k=20&c=gzk5c0q1DkndI2IFHIBCHIapEiFHm6JuG0-6C3xL-3I=" alt="" /></div>
                </div>
                <div className="role-content">
                  <div className="role-header">
                    <div className="role-icon role-icon-blue">
                      <span className="material-symbols-outlined">school</span>
                    </div>
                    <h3 className="role-title">Talaba</h3>
                  </div>
                  <p className="role-description">
                    Test topshiring, bilimingizni mustahkamlang va natijalarni real vaqtda ko'ring. O'zlashtirish darajangizni kuzatib boring.
                  </p>
                  <button className="role-link" onClick={() => navigate('/login')}>
                    Kirish
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
              
              {/* Teacher Card */}
              <div className="role-card">
                <div className="role-image">
                  <div className="role-image-placeholder"><img src="https://img.freepik.com/premium-vector/woman-with-laptop-girl-with-computer-home-office-work-study-concept-flat-cartoon-isolated-vector-stock-illustration-eps-10_419256-241.jpg" alt="" /></div>
                </div>
                <div className="role-content">
                  <div className="role-header">
                    <div className="role-icon role-icon-green">
                      <span className="material-symbols-outlined">cast_for_education</span>
                    </div>
                    <h3 className="role-title">O'qituvchi</h3>
                  </div>
                  <p className="role-description">
                    Testlar yarating, guruhlarni boshqaring va o'quvchilarning o'zlashtirishini chuqur tahlil qiling. Vaqtingizni tejang.
                  </p>
                  <button className="role-link" onClick={() => navigate('/login')}>
                    Boshlash
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
              
              {/* Administrator Card */}
              <div className="role-card">
                <div className="role-image">
                  <div className="role-image-placeholder"><img src="https://img.freepik.com/premium-vector/man-working-laptop-computer-from-home-with-cup-coffee-home-office-concept-woman-working-from-home-student-freelancer-vector-illustration-flat-style-remote-work-freelance-concept_419010-517.jpg?semt=ais_hybrid&w=740&q=80" alt="" /></div>
                </div>
                <div className="role-content">
                  <div className="role-header">
                    <div className="role-icon role-icon-purple">
                      <span className="material-symbols-outlined">admin_panel_settings</span>
                    </div>
                    <h3 className="role-title">Administrator</h3>
                  </div>
                  <p className="role-description">
                    Tizimni to'liq nazorat qiling, foydalanuvchilarni va kontentni boshqaring. Hisobotlar va statistikalarni kuzating.
                  </p>
                  <button className="role-link" onClick={() => navigate('/login')}>
                    Boshqarish
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="features">
        <div className="layout-container">
          <div>
            <div className="features-layout">
              {/* Features Text */}
              <div className="features-text">
                <h2 className="features-title">
                  Asosiy <br /><span className="features-highlight">Xususiyatlar</span>
                </h2>
                <p className="features-description">
                  Bizning platformamiz ta'lim jarayonini osonlashtiradigan barcha zamonaviy vositalarni taklif etadi. Sizning muvaffaqiyatingiz uchun yaratilgan.
                </p>
                <button className="features-btn" onClick={() => navigate('/login')}>Barcha imkoniyatlar</button>
              </div>
              
              {/* Features Grid */}
              <div className="features-grid">
                {/* Feature 1 */}
                <div className="feature-item">
                  <div className="feature-icon">
                    <span className="material-symbols-outlined">bar_chart</span>
                  </div>
                  <div className="feature-content">
                    <h3 className="feature-title">Real vaqt tahlili</h3>
                    <p className="feature-description">
                      O'quvchilar natijalarini chuqur tahlil qiling va statistikani dinamik grafiklarda kuzatib boring.
                    </p>
                  </div>
                </div>
                
                {/* Feature 2 */}
                <div className="feature-item">
                  <div className="feature-icon">
                    <span className="material-symbols-outlined">shield_lock</span>
                  </div>
                  <div className="feature-content">
                    <h3 className="feature-title">Xavfsiz test tizimi</h3>
                    <p className="feature-description">
                      Imtihon jarayonida halollikni ta'minlaydigan, ko'chirmakashlikni oldini oluvchi ishonchli xavfsizlik choralari.
                    </p>
                  </div>
                </div>
                
                {/* Feature 3 */}
                <div className="feature-item">
                  <div className="feature-icon">
                    <span className="material-symbols-outlined">library_books</span>
                  </div>
                  <div className="feature-content">
                    <h3 className="feature-title">Katta savollar banki</h3>
                    <p className="feature-description">
                      Turli fanlar bo'yicha minglab tayyor savollar va o'z savollaringizni turli formatlarda import qilish imkoniyati.
                    </p>
                  </div>
                </div>
                
                {/* Feature 4 */}
                <div className="feature-item">
                  <div className="feature-icon">
                    <span className="material-symbols-outlined">devices</span>
                  </div>
                  <div className="feature-content">
                    <h3 className="feature-title">Moslashuvchan dizayn</h3>
                    <p className="feature-description">
                      Har qanday qurilmadan: kompyuter, planshet yoki smartfondan tizimga kirish va test ishlash qulayligi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
