import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <section className="hero">
        <div className="layout-container">
          <div>
            <div className="hero-grid">
              <div className="hero-text">
                <div className="hero-text-content">
                  <h1 className="hero-title">
                    Bilimingizni
                    <span className="hero-highlight">Sinovdan O'tkazing</span>
                  </h1>
                  <h2 className="hero-subtitle">
                    Ixtisoslashtirilgan maktablar uchun ishlab chiqilgan maxsus
                    test ilovasi. O'qituvchilar, talabalar va ma'murlar uchun
                    yagona, tez va xavfsiz yechim.
                  </h2>
                </div>
                <div className="hero-buttons">
                  <button
                    className="hero-btn-primary"
                    onClick={() => navigate("/login")}
                  >
                    Kirish
                  </button>
                  <button
                    className="hero-btn-secondary"
                    onClick={() => {
                      const featuresSection = document.querySelector('.features');
                      if (featuresSection) {
                        featuresSection.scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }
                    }}
                  >
                    <span>Batafsil o'rganish</span>
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>

              <div className="hero-image">
                <div className="hero-image-container">
                  <div className="hero-image-placeholder">
                    <img src="/banner/ban1.png" alt="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="roles">
        <div className="layout-container">
          <div>
            <div className="roles-header">
              <span className="roles-badge">Platforma Foydalanuvchilari</span>
              <h2 className="roles-title">Kimlar uchun mo'ljallangan?</h2>
              <p className="roles-description">
                Sergeli tumani ixtisoslashtirilgan maktabi uchun maxsus asboblar
                to'plamini taqdim etadi.
              </p>
            </div>

            <div className="roles-grid">
              <div className="role-card">
                <div className="role-image">
                  <div className="role-image-placeholder">
                    <img src="/banner/ras1.png" alt="Talaba" />
                  </div>
                </div>
                <div className="role-content">
                  <div className="role-header">
                    <div className="role-icon role-icon-blue">
                      <span className="material-symbols-outlined">school</span>
                    </div>
                    <h3 className="role-title">O'quvchi</h3>
                  </div>
                  <p className="role-description">
                    Test topshiring, bilimingizni mustahkamlang va natijalarni
                    real vaqtda ko'ring. O'zlashtirish darajangizni kuzatib
                    boring.
                  </p>
                  <button
                    className="role-link"
                    onClick={() => navigate("/login")}
                  >
                    Kirish
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>

              <div className="role-card">
                <div className="role-image">
                  <div className="role-image-placeholder">
                    <img src="/banner/rasmm2.png" alt="O'qituvchi" />
                  </div>
                </div>
                <div className="role-content">
                  <div className="role-header">
                    <div className="role-icon role-icon-green">
                      <span className="material-symbols-outlined">
                        cast_for_education
                      </span>
                    </div>
                    <h3 className="role-title">O'qituvchi</h3>
                  </div>
                  <p className="role-description">
                    Testlar yarating, guruhlarni boshqaring va o'quvchilarning
                    o'zlashtirishini chuqur tahlil qiling. Vaqtingizni tejang.
                  </p>
                  <button
                    className="role-link"
                    onClick={() => navigate("/login")}
                  >
                    Boshlash
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>

              <div className="role-card">
                <div className="role-image">
                  <div className="role-image-placeholder">
                    <img src="/banner/ras3.png" alt="Administrator" />
                  </div>
                </div>
                <div className="role-content">
                  <div className="role-header">
                    <div className="role-icon role-icon-purple">
                      <span className="material-symbols-outlined">
                        admin_panel_settings
                      </span>
                    </div>
                    <h3 className="role-title">Administrator</h3>
                  </div>
                  <p className="role-description">
                    Tizimni to'liq nazorat qiling, foydalanuvchilarni va
                    kontentni boshqaring. Hisobotlar va statistikalarni
                    kuzating.
                  </p>
                  <button
                    className="role-link"
                    onClick={() => navigate("/login")}
                  >
                    Boshqarish
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="features">
        <div className="layout-container">
          <div>
            <div className="features-header">
              <h2 className="features-title">
                Asosiy <span className="features-highlight">Xususiyatlar</span>
              </h2>
              <p className="features-description">
                Bizning platformamiz ta'lim jarayonini osonlashtiradigan barcha
                zamonaviy vositalarni taklif etadi.
              </p>
            </div>

            <div className="features-timeline">
              <div className="timeline-line"></div>

              {/* 1-QATOR: Matn Chapda, Rasm O'ngda */}
              <div className="timeline-item">
                <div className="timeline-block left-block">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <span className="material-symbols-outlined">
                        bar_chart
                      </span>
                    </div>
                    <h3 className="feature-title">Real vaqt tahlili</h3>
                    <p className="feature-description">
                      O'quvchilar natijalarini chuqur tahlil qiling va
                      statistikani dinamik grafiklarda kuzatib boring. Har bir
                      o'quvchining taraqqiyotini batafsil ko'ring.
                    </p>
                  </div>
                </div>
                <div className="timeline-point"></div>
                <div className="timeline-block right-block">
                  <div className="feature-image-wrapper">
                    <img src="/banner/inf1.png" alt="Real vaqt tahlili" />
                  </div>
                </div>
              </div>

              {/* 2-QATOR: Rasm Chapda, Matn O'ngda */}
              <div className="timeline-item">
                <div className="timeline-block left-block">
                  <div className="feature-image-wrapper">
                    <img src="/banner/inf2.png" alt="Xavfsiz test tizimi" />
                  </div>
                </div>
                <div className="timeline-point"></div>
                <div className="timeline-block right-block">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <span className="material-symbols-outlined">
                        shield_lock
                      </span>
                    </div>
                    <h3 className="feature-title">Xavfsiz test tizimi</h3>
                    <p className="feature-description">
                      Imtihon jarayonida halollikni ta'minlaydigan,
                      ko'chirmakashlikni oldini oluvchi ishonchli xavfsizlik
                      choralari. Brauzer blokirovka va ekran monitoring mavjud.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3-QATOR: Matn Chapda, Rasm O'ngda */}
              <div className="timeline-item">
                <div className="timeline-block left-block">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <span className="material-symbols-outlined">
                        library_books
                      </span>
                    </div>
                    <h3 className="feature-title">Katta savollar banki</h3>
                    <p className="feature-description">
                      Turli fanlar bo'yicha minglab tayyor savollar va o'z
                      savollaringizni turli formatlarda import qilish
                      imkoniyati. Cheksiz variantlar mavjud.
                    </p>
                  </div>
                </div>
                <div className="timeline-point"></div>
                <div className="timeline-block right-block">
                  <div className="feature-image-wrapper">
                    <img src="/banner/inf3.png" alt="Katta savollar banki" />
                  </div>
                </div>
              </div>

              {/* 4-QATOR: Rasm Chapda, Matn O'ngda */}
              <div className="timeline-item">
                <div className="timeline-block left-block">
                  <div className="feature-image-wrapper">
                    <img src="/banner/inf4.png" alt="Moslashuvchan dizayn" />
                  </div>
                </div>
                <div className="timeline-point"></div>
                <div className="timeline-block right-block">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <span className="material-symbols-outlined">devices</span>
                    </div>
                    <h3 className="feature-title">Moslashuvchan dizayn</h3>
                    <p className="feature-description">
                      Har qanday qurilmadan: kompyuter, planshet yoki
                      smartfondan tizimga kirish va test ishlash qulayligi.
                      Responsive dizayn va mobil optimizatsiya.
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
