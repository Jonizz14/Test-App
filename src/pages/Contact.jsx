import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import apiService from "../data/apiService";
import { useAuth } from "../context/AuthContext";
import { showSuccess, showError } from "../utils/antdNotification";
import { useSentMessages } from "../context/SentMessagesContext";
import "../styles/Contact.css";

const Contact = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addMessage } = useSentMessages();

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
          detail: { title: "Xabar yuborildi", icon: 'send', isFullMessage: true } 
        }));
      }, 1300);
      
      showSuccess(response.message || 'Xabaringiz muvaffaqiyatli yuborildi!');
      
      // Reset form
      e.target.reset();
      
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Xabar yuborishda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
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
      showSuccess('Xabar muvaffaqiyatli yangilandi');
      setEditingMessage(null);
      fetchMyMessages();
    } catch (error) {
      showError('Xabarni tahrirlashda xatolik yuz berdi');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await apiService.deleteContactMessage(messageId);
      showSuccess('Xabar muvaffaqiyatli o\'chirildi');
      setDeleteConfirm(null);
      fetchMyMessages();
    } catch (error) {
      showError('Xabarni o\'chirishda xatolik yuz berdi');
    }
  };

  const getSubjectText = (subject) => {
    switch (subject) {
      case 'technical': return 'Texnik yordam';
      case 'billing': return 'To\'lov masalalari';
      case 'feature': return 'Yangi funksiya taklifi';
      case 'partnership': return 'Hamkorlik';
      case 'other': return 'Boshqa';
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

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2
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
            <h1>BOG'LANING</h1>
            <p className="description">Savollaringiz bormi? Biz bilan bog'laning.</p>
          </div>
        </section>

        {/* Contact Form Section - Light Section */}
        <section className="contact-modern-form-section">
          <div className="section-container">
            <div className="split-layout">
              <div className="split-content">
                <h2>XABAR YUBORING</h2>
                <form className="minimal-form" onSubmit={handleSubmit}>
                  <div className="input-row">
                    <input type="text" name="name" placeholder="ISMINGIZ" required />
                    <input type="email" name="email" placeholder="EMAIL" required />
                  </div>
                  <input type="tel" name="phone" placeholder="TELEFON" />
                  <select name="subject" required>
                    <option value="">MAVZUNI TANLANG</option>
                    <option value="technical">Texnik yordam</option>
                    <option value="billing">To'lov masalalari</option>
                    <option value="feature">Yangi funksiya taklifi</option>
                    <option value="other">Boshqa</option>
                  </select>
                  <textarea name="message" placeholder="XABARINGIZNI YOZING..." rows="4" required></textarea>
                  <button type="submit" className="btn-modern-submit" disabled={isSubmitting}>
                    {isSubmitting ? 'YUBORILMOQDA...' : 'YUBORISH'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Contact info grid - Dark Section */}
        <section className="contact-modern-info">
          <div className="section-container">
            <h2>BIZNING MANZIL</h2>
            <div className="stats-grid-large">
              <div className="stat-box" onClick={() => window.open('tel:+998901234567')}>
                <span className="stat-label">TELEFON</span>
                <span className="stat-number">+998 90 123 45 67</span>
              </div>
              <div className="stat-box" onClick={() => window.open('mailto:info@examify.uz')}>
                <span className="stat-label">EMAIL</span>
                <span className="stat-number">info@examify.uz</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">MANZIL</span>
                <span className="stat-number">SERGELI, TOSHKENT</span>
              </div>
            </div>
          </div>
        </section>

        {/* My Messages Section (if logged in) - Custom Reveal */}
        {currentUser && (
          <section className="contact-modern-messages">
             <div className="section-container">
                <h2>MENING XABARLARIM</h2>
                {myMessages.length === 0 ? (
                  <p>Hozircha xabarlar mavjud emas.</p>
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