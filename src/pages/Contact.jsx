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
  const [myMessages, setMyMessages] = useState([]);
  const [showMyMessages, setShowMyMessages] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  // Fetch user's messages if logged in
  useEffect(() => {
    if (currentUser && currentUser.email) {
      fetchMyMessages();
    }
  }, [currentUser]);

  const fetchMyMessages = async () => {
    try {
      const response = await apiService.getMyContactMessages();
      setMyMessages(response);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleEditMessage = async (messageId, updatedData) => {
    try {
      await apiService.editContactMessage(messageId, updatedData);
      setEditingMessage(null);
      fetchMyMessages();
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await apiService.deleteContactMessage(messageId);
      setDeleteConfirm(null);
      fetchMyMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const getSubjectText = (subject) => {
    switch (subject) {
      case 'technical': return t('contact.subjects.technical');
      case 'billing': return t('contact.subjects.billing');
      case 'feature': return t('contact.subjects.feature');
      case 'partnership': return t('contact.subjects.partnership');
      case 'other': return t('contact.subjects.other');
      default: return subject;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Yangi';
      case 'read': return 'O\'qilgan';
      case 'replied': return 'Javob berilgan';
      case 'closed': return 'Yopilgan';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Animation Logic - Trigger on scroll
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
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
                  <select name="subject" required>
                    <option value="">{t('contact.selectSubject')}</option>
                    <option value="technical">{t('contact.subjects.technical')}</option>
                    <option value="billing">{t('contact.subjects.billing')}</option>
                    <option value="feature">{t('contact.subjects.feature')}</option>
                    <option value="other">{t('contact.subjects.other')}</option>
                  </select>
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

        {/* My Messages Section (if logged in) - Custom Reveal */}
        {currentUser && (
          <section className="contact-modern-messages">
             <div className="section-container">
                <h2>{t('contact.myMessages')}</h2>
                {myMessages.length === 0 ? (
                  <p>{t('contact.noHistory')}</p>
                ) : (
                  <div className="modern-message-list">
                    {myMessages.slice(0, 3).map(msg => (
                      <div key={msg.id} className="modern-message-card">
                        <div className="card-header">
                           <span className={`status-dot ${msg.status}`}></span>
                           <h3>{getSubjectText(msg.subject)}</h3>
                        </div>
                        <p>{msg.message}</p>
                        <span className="date">{formatDate(msg.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default Contact;