import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import apiService from "../data/apiService";
import { useAuth } from "../context/AuthContext";
import { showSuccess, showError } from "../utils/antdNotification";
import { useSentMessages } from "../context/SentMessagesContext";
import "../styles/Contact.css";
import { useTranslation } from "react-i18next";

const Contact = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addMessage } = useSentMessages();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const messageData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    try {
      setIsSubmitting(true);
      const response = await apiService.submitContactMessage(messageData);

      // Get button rect for animation start
      const rect = e.target.querySelector('button').getBoundingClientRect();

      // Create flying element
      const flyer = document.createElement('div');
      flyer.className = 'flyer-icon';
      flyer.innerHTML = `<span class="material-symbols-outlined">send</span>`;
      flyer.style.left = `${rect.left + rect.width / 2 - 25}px`;
      flyer.style.top = `${rect.top + rect.height / 2 - 25}px`;
      document.body.appendChild(flyer);

      // Save locally as well
      addMessage({
        id: Date.now(),
        ...messageData,
        date: new Date().toISOString()
      });

      // Animation sequence
      setTimeout(() => {
        const target = document.getElementById('header-message-icon');
        const targetRect = target?.getBoundingClientRect();

        if (targetRect) {
          flyer.style.left = `${targetRect.left + (targetRect.width / 2) - 25}px`;
          flyer.style.top = `${targetRect.top + (targetRect.height / 2) - 25}px`;
          flyer.style.transform = 'scale(0.88) rotate(0deg)';
        }
      }, 100);

      setTimeout(() => {
        flyer.style.opacity = '0';
        flyer.style.transform = 'scale(0) rotate(180deg)';
        flyer.style.filter = 'blur(10px) brightness(1.5)';
      }, 850);

      setTimeout(() => {
        if (document.body.contains(flyer)) {
          document.body.removeChild(flyer);
        }

        // Trigger header notification
        window.dispatchEvent(new CustomEvent('itemSaved', {
          detail: { title: t('contact.successSent'), icon: 'send', isFullMessage: true }
        }));
      }, 1300);

      // Reset form
      e.target.reset();

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation Logic - Trigger on scroll
  useEffect(() => {
    const observerOptions = {
      threshold: 0.3,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('section');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <Layout>
      <div className="modern-contact-page">
        {/* Contact Hero - Dark Section */}
        <section className="contact-modern-hero">
          <div className="section-container">
            <h1>{t('contact.heroTitle')}</h1>
            <p className="description">{t('contact.heroDesc')}</p>
          </div>
        </section>

        {/* Contact Form Section - Light Section */}
        <section className="contact-modern-form-section">
          <div className="section-container">
            <div className="split-layout">
              <div className="split-content">
                <h2>{t('contact.formTitle')}</h2>
                <form className="minimal-form" onSubmit={handleSubmit}>
                  <div className="input-row">
                    <input type="text" name="name" placeholder={t('contact.namePlaceholder')} required />
                    <input type="email" name="email" placeholder={t('contact.emailPlaceholder')} required />
                  </div>
                  <input type="tel" name="phone" placeholder={t('contact.phonePlaceholder')} />
                  <div className={`custom-select-wrapper ${dropdownOpen ? 'open' : ''}`}>
                    <div className="custom-select-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                      <span>{subject ? t(`contact.subjects.${subject}`) : t('contact.selectSubject')}</span>
                      <span className="material-symbols-outlined custom-arrow">expand_more</span>
                    </div>
                    <ul className="custom-options">
                      {['technical', 'billing', 'feature', 'other'].map(opt => (
                        <li
                          key={opt}
                          className={`custom-option ${subject === opt ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubject(opt);
                            setDropdownOpen(false);
                          }}
                        >
                          {t(`contact.subjects.${opt}`)}
                        </li>
                      ))}
                    </ul>
                    <input
                      type="text"
                      name="subject"
                      value={subject}
                      required
                      style={{ opacity: 0, width: 1, height: 1, position: 'absolute', bottom: 0, left: 0, zIndex: -1 }}
                      onChange={() => { }}
                    />
                  </div>
                  <textarea name="message" placeholder={t('contact.messagePlaceholder')} rows="4" required></textarea>
                  <button type="submit" className="btn-modern-submit" disabled={isSubmitting}>
                    {isSubmitting ? t('contact.sending') : t('contact.send')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Contact info grid - Dark Section */}
        <section className="contact-modern-info">
          <div className="section-container">
            <h2>{t('contact.ourAddress')}</h2>
            <div className="stats-grid-large">
              <div className="stat-box" onClick={() => window.open('tel:+998901234567')}>
                <span className="stat-label">{t('contact.phone')}</span>
                <span className="stat-number">+998 90 123 45 67</span>
              </div>
              <div className="stat-box" onClick={() => window.open('mailto:info@examify.uz')}>
                <span className="stat-label">{t('contact.email')}</span>
                <span className="stat-number">info@examify.uz</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">{t('contact.address')}</span>
                <span className="stat-number">{t('contact.addressText')}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Contact;