import React, { useEffect } from 'react';
import { useNews } from '../context/NewsContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Header from '../components/Header';
import '../styles/NewsPage.css'; 

const NewsPage = () => {
  const { news } = useNews();
  const { t } = useTranslation();

  // Helper to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('uz-UZ', options);
  };

  // Animation Logic - Once per session
  useEffect(() => {
    const sections = document.querySelectorAll('section');
    const hasViewed = sessionStorage.getItem('news_intro_shown');

    if (hasViewed) {
      // If already viewed in this session, show immediately without animation
      sections.forEach(section => {
        section.classList.add('in-view');
        section.style.transition = 'none';
        section.style.opacity = '1';
        section.style.transform = 'none';
        section.style.filter = 'none';
      });
    } else {
      const observerOptions = {
        threshold: 0.1
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      sections.forEach(section => observer.observe(section));
      
      // Mark as viewed
      sessionStorage.setItem('news_intro_shown', 'true');

      return () => observer.disconnect();
    }
  }, []);

  return (
    <Layout>
      <div className="news-page-container">
        {/* Hero Section */}
        <section className="news-hero-section">
          <div className="news-hero-content">
            <h1>YANGILANISHLAR</h1>
            <p className="description">Platformamizdagi so'nggi o'zgarishlar va yangi imkoniyatlar</p>
          </div>
        </section>

        {/* News Grid Section */}
        <section className="news-list-section">
          <div className="news-section-container">
            
            <div className="news-grid">
              {news.length === 0 ? (
                 <div className="news-empty-state">
                    <span className="material-symbols-outlined icon">newspaper</span>
                    <h3>Hozircha yangiliklar yo'q</h3>
                    <p>Tez orada yangi ma'lumotlar qo'shiladi.</p>
                 </div>
              ) : (
                news.map((item) => (
                  <article key={item.id} className="news-card">
                      {/* Media Container */}
                      {item.media_file && (
                        <div className="news-media-container">
                          {item.media_type === 'video' ? (
                            <video src={item.media_file} controls />
                          ) : (
                            <img src={item.media_file} alt={item.title} />
                          )}
                        </div>
                      )}

                      <div className="news-content-body">
                        <div className="news-date">
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>calendar_today</span>
                          {formatDate(item.created_at)}
                        </div>

                        <h3 className="news-title">{item.title}</h3>
                        <p className="news-description">
                          {item.description}
                        </p>
                      </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default NewsPage;
