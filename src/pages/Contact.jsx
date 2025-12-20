import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import apiService from "../data/apiService";
import { useAuth } from "../context/AuthContext";
import "../styles/Contact.css";

const Contact = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
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
      
      setToastMessage(response.message || 'Xabaringiz muvaffaqiyatli yuborildi!');
      setToastType('success');
      setShowToast(true);
      
      // Reset form
      e.target.reset();
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setToastMessage('Xabar yuborishda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
    
    // Hide toast after 5 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
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
      setToastMessage('Xabar muvaffaqiyatli yangilandi');
      setToastType('success');
      setShowToast(true);
      setEditingMessage(null);
      fetchMyMessages();
    } catch (error) {
      setToastMessage('Xabarni tahrirlashda xatolik yuz berdi');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await apiService.deleteContactMessage(messageId);
      setToastMessage('Xabar muvaffaqiyatli o\'chirildi');
      setToastType('success');
      setShowToast(true);
      setDeleteConfirm(null);
      fetchMyMessages();
    } catch (error) {
      setToastMessage('Xabarni o\'chirishda xatolik yuz berdi');
      setToastType('error');
      setShowToast(true);
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

                <button type="submit" className="contact-form-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Yuborilmoqda...' : 'Xabar Yuborish'}
                  <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_empty' : 'send'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* My Messages Section - Only show if user is logged in */}
      {currentUser && (
        <section className="my-messages-section">
          <div className="layout-container">
            <div className="my-messages-header">
              <h2 className="my-messages-title">
                Mening <span className="my-messages-highlight">Xabarlarim</span>
              </h2>
              <p className="my-messages-description">
                Yuborgan xabarlaringiz holatini ko'ring va admin javoblarini o'qiring.
              </p>
              <button 
                className="my-messages-toggle"
                onClick={() => setShowMyMessages(!showMyMessages)}
              >
                {showMyMessages ? 'Yopish' : `Ko'rish (${myMessages.length} ta xabar)`}
                <span className="material-symbols-outlined">
                  {showMyMessages ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>

            {showMyMessages && (
              <div className="my-messages-container">
                {myMessages.length === 0 ? (
                  <div className="my-messages-empty">
                    <p>Hozircha hech qanday xabar yubormagansiz.</p>
                  </div>
                ) : (
                  <div className="my-messages-list">
                    {myMessages.map((message) => (
                      <div key={message.id} className={`message-card ${message.status}`}>
                        <div className="message-header">
                          <div className="message-info">
                            <h4>{message.name}</h4>
                            <p className="message-subject">{getSubjectText(message.subject)}</p>
                          </div>
                          <div className="message-status">
                            <span className={`status-badge ${message.status}`}>
                              {getStatusText(message.status)}
                            </span>
                            {message.status === 'replied' && (
                              <span className="replied-indicator">
                                <span className="material-symbols-outlined">mark_email_read</span>
                                Javob berildi
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="message-content">
                          <p>{message.message}</p>
                          <div className="message-meta">
                            <span className="message-date">{formatDate(message.created_at)}</span>
                          </div>
                        </div>

                        {message.admin_reply && (
                          <div className="admin-reply">
                            <h5>Admin javobi:</h5>
                            <p>{message.admin_reply}</p>
                            {message.replied_by_name && (
                              <div className="reply-meta">
                                <span>{message.replied_by_name}</span>
                                {message.replied_at && (
                                  <span> - {formatDate(message.replied_at)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="message-actions">
                          {message.status !== 'replied' && (
                            <>
                              <button
                                className="message-action-btn edit-btn"
                                onClick={() => setEditingMessage(message)}
                              >
                                <span className="material-symbols-outlined">edit</span>
                                Tahrirlash
                              </button>
                              <button
                                className="message-action-btn delete-btn"
                                onClick={() => setDeleteConfirm(message.id)}
                              >
                                <span className="material-symbols-outlined">delete</span>
                                O'chirish
                              </button>
                            </>
                          )}
                        </div>

                        {/* Edit Message Dialog */}
                        {editingMessage?.id === message.id && (
                          <div className="edit-message-dialog">
                            <h4>Xabarni tahrirlash</h4>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.target);
                              handleEditMessage(message.id, {
                                name: formData.get('name'),
                                phone: formData.get('phone'),
                                subject: formData.get('subject'),
                                message: formData.get('message')
                              });
                            }}>
                              <div className="edit-form-row">
                                <input
                                  type="text"
                                  name="name"
                                  defaultValue={message.name}
                                  placeholder="Ismingiz"
                                  required
                                />
                                <input
                                  type="tel"
                                  name="phone"
                                  defaultValue={message.phone}
                                  placeholder="Telefon raqami"
                                />
                              </div>
                              <select name="subject" defaultValue={message.subject} required>
                                <option value="technical">Texnik yordam</option>
                                <option value="billing">To'lov masalalari</option>
                                <option value="feature">Yangi funksiya taklifi</option>
                                <option value="partnership">Hamkorlik</option>
                                <option value="other">Boshqa</option>
                              </select>
                              <textarea
                                name="message"
                                defaultValue={message.message}
                                placeholder="Xabaringiz"
                                rows="4"
                                required
                              />
                              <div className="edit-form-actions">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessage(null)}
                                  className="cancel-btn"
                                >
                                  Bekor qilish
                                </button>
                                <button type="submit" className="save-btn">
                                  Saqlash
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

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
            <span className={`material-symbols-outlined toast-icon ${toastType === 'error' ? 'toast-icon-error' : ''}`}>
              {toastType === 'error' ? 'error' : 'check_circle'}
            </span>
            <div className="toast-text">
              <strong>{toastType === 'error' ? 'Xatolik!' : 'Muvaffaqiyat!'}</strong>
              <p>{toastMessage}</p>
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-dialog">
            <h4>Xabarni o'chirish</h4>
            <p>Ushbu xabarni o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.</p>
            <div className="delete-confirmation-actions">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="cancel-btn"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleDeleteMessage(deleteConfirm)}
                className="confirm-delete-btn"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Contact;