import React, { useEffect } from 'react';
import { useNews } from '../context/NewsContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Header from '../components/Header';
import '../styles/NewsPage.css';

const NewsPage = () => {
  const { news } = useNews();
  const { t, i18n } = useTranslation();

  // Helper to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('uz-UZ', options);
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
      <div className="news-page-container">
        {/* Hero Section */}
        <section className="news-hero-section">
          <div className="news-hero-content">
            <h1>YANGILANISHLAR</h1>
            <p className="description">Platformamizdagi so'nggi o'zgarishlarc</p>
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

                      <h3 className="news-title">
                        {(i18n.language === 'uz' ? item.title_uz :
                          i18n.language === 'ru' ? item.title_ru :
                            item.title_en) || item.title}
                      </h3>
                      <p className="news-description">
                        {(i18n.language === 'uz' ? item.description_uz :
                          i18n.language === 'ru' ? item.description_ru :
                            item.description_en) || item.description}
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
