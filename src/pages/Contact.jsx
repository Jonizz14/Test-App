import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/Contact.css";

const Contact = () => {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form submission logic would go here
    // For now, just show the toast notification
    setShowToast(true);
    
    // Hide toast after 5 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  return (
    <Layout>
      <section className="contact-hero">
        <div className="layout-container">
          <div>
            <div className="contact-hero-content">
              <div className="contact-hero-text">
                <h1 className="contact-hero-title">
                  Biz bilan
                  <span className="contact-hero-highlight">Bog'laning</span>
                </h1>
                <p className="contact-hero-subtitle">
                  Savollaringiz bormi? Yordam kerakmi? Bizning professional jamoamiz
                  sizga yordam berish uchun tayyor. Biz bilan bog'laning va biz sizning
                  ehtiyojlaringizga eng yaxshi yechim taklif qilamiz.
                </p>
              </div>
              <div className="contact-hero-image">
                <div className="contact-hero-image-container">
                  <div className="contact-hero-image-placeholder">
                    <img src="/banner/banner1.png" alt="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-methods">
        <div className="layout-container">
          <div>
            <div className="contact-methods-header">
              <span className="contact-methods-badge">Bog'lanish usullari</span>
              <h2 className="contact-methods-title">Qanday bog'lanish mumkin?</h2>
              <p className="contact-methods-description">
                Sizga qulay bo'lgan usul orqali biz bilan bog'laning. Biz 24/7 xizmat ko'rsatamiz.
              </p>
            </div>

            <div className="contact-methods-grid">
              <div className="contact-method-card">
                <div className="contact-method-icon contact-method-icon-blue">
                  <span className="material-symbols-outlined">phone</span>
                </div>
                <h3 className="contact-method-title">Telefon qilish</h3>
                <p className="contact-method-description">
                  Darhol bog'lanish uchun bizning telefon raqamlarimizga qiling.
                  Texnik yordam va savol-javoblar uchun.
                </p>
                <div className="contact-method-info">
                  <strong>+998 90 123 45 67</strong>
                  <strong>+998 95 987 65 43</strong>
                </div>
                <button className="contact-method-btn">Qo'ng'iroq qilish</button>
              </div>

              <div className="contact-method-card">
                <div className="contact-method-icon contact-method-icon-green">
                  <span className="material-symbols-outlined">email</span>
                </div>
                <h3 className="contact-method-title">Elektron pochta</h3>
                <p className="contact-method-description">
                  Batafsil savollar va takliflar uchun bizga email yuboring.
                  24 soat ichida javob beramiz.
                </p>
                <div className="contact-method-info">
                  <strong>info@examify.uz</strong>
                  <strong>support@examify.uz</strong>
                </div>
                <button className="contact-method-btn">Email yuborish</button>
              </div>

              <div className="contact-method-card">
                <div className="contact-method-icon contact-method-icon-purple">
                  <span className="material-symbols-outlined">chat</span>
                </div>
                <h3 className="contact-method-title">AI Live Chat</h3>
                <p className="contact-method-description">
                  Tez yordam uchun bizning veb-saytimizdagi AI chat tizimidan foydalaning.
                  Sun'iy intellekt yordamida real vaqtda avtomatik javoblar va yordam oling.
                </p>
                <div className="contact-method-info">
                  <strong>24/7 AI Chat</strong>
                  <strong>Avtomatik javoblar</strong>
                </div>
                <button className="contact-method-btn">AI Chatni boshlash</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-form-section">
        <div className="layout-container">
          <div>
            <div className="contact-form-header">
              <h2 className="contact-form-title">
                Xabar <span className="contact-form-highlight">Yuborish</span>
              </h2>
              <p className="contact-form-description">
                Quyidagi formani to'ldiring va biz sizga tez orada javob beramiz.
              </p>
            </div>

            <div className="contact-form-container">
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label htmlFor="name" className="contact-form-label">Ismingiz</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      className="contact-form-input" 
                      placeholder="Ismingizni kiriting"
                      required 
                    />
                  </div>
                  <div className="contact-form-group">
                    <label htmlFor="email" className="contact-form-label">Elektron pochta</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      className="contact-form-input" 
                      placeholder="email@example.com"
                      required 
                    />
                  </div>
                </div>

                <div className="contact-form-group">
                  <label htmlFor="phone" className="contact-form-label">Telefon raqami</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    className="contact-form-input" 
                    placeholder="+998 XX XXX XX XX"
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="subject" className="contact-form-label">Mavzu</label>
                  <select id="subject" name="subject" className="contact-form-select" required>
                    <option value="">Mavzuni tanlang</option>
                    <option value="technical">Texnik yordam</option>
                    <option value="billing">To'lov masalalari</option>
                    <option value="feature">Yangi funksiya taklifi</option>
                    <option value="partnership">Hamkorlik</option>
                    <option value="other">Boshqa</option>
                  </select>
                </div>

                <div className="contact-form-group">
                  <label htmlFor="message" className="contact-form-label">Xabar</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    className="contact-form-textarea" 
                    placeholder="Xabaringizni yozing..."
                    rows="5"
                    required
                  ></textarea>
                </div>

                <button type="submit" className="contact-form-submit">
                  Xabar Yuborish
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-location">
        <div className="layout-container">
          <div>
            <div className="contact-location-header">
              <h2 className="contact-location-title">
                Bizning <span className="contact-location-highlight">Manzil</span>
              </h2>
              <p className="contact-location-description">
                Ofisimizga tashrif buyurishingiz mumkin.
              </p>
            </div>

            <div className="contact-location-content">
              <div className="contact-location-info">
                <div className="contact-location-item">
                  <div className="contact-location-icon">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <div className="contact-location-details">
                    <h4>Manzil</h4>
                    <p>Sergeli ixtisoslashtirilgan maktab, Sergeli tumani, Toshkent shahri</p>
                  </div>
                </div>

                <div className="contact-location-item">
                  <div className="contact-location-icon">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div className="contact-location-details">
                    <h4>Ish vaqti</h4>
                    <p>Dushanba - Juma: 8:00 - 17:00<br />Shanba: 8:00 - 13:00</p>
                  </div>
                </div>

                <div className="contact-location-item">
                  <div className="contact-location-icon">
                    <span className="material-symbols-outlined">directions</span>
                  </div>
                  <div className="contact-location-details">
                    <h4>Qanday borish</h4>
                    <p>Sergeli metrosi yaqinida joylashgan maktab</p>
                  </div>
                </div>
              </div>

              <div className="contact-location-map">
                <div className="contact-location-map-placeholder">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.9!2d69.2215177!3d41.2104577!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae61c403191f6d%3A0xc8199e959d144b2e!2sSergeli%20ixtisoslashtirilgan%20maktab!5e0!3m2!1sen!2sus!4v1734687847000!5m2!1sen!2sus" 
                    width="100%" 
                    height="300" 
                    style={{border:0}} 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Sergeli ixtisoslashtirilgan maktab"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <span className="material-symbols-outlined toast-icon">check_circle</span>
            <div className="toast-text">
              <strong>Xabar yuborildi!</strong>
              <p>Biz sizga tez orada javob beramiz.</p>
            </div>
            <button 
              className="toast-close"
              onClick={() => setShowToast(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Contact;