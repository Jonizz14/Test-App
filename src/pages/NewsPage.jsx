import React, { useEffect, useState } from 'react';
import { useNews } from '../context/NewsContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import '../styles/NewsPage.css';

const NewsPage = () => {
  const { news } = useNews();
  const { t, i18n } = useTranslation();

  // Local state for pagination and lightbox
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const itemsPerPage = 3;

  // Combine news from context (mock data removed)
  const allNews = [...news];

  // Pagination logic
  const totalPages = Math.ceil(allNews.length / itemsPerPage);
  const currentNews = allNews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Helper to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('uz-UZ', options);
  };

  // Animation Logic
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px'
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

    const elementsToAnimate = document.querySelectorAll('.news-hero-section, .todo-item');
    elementsToAnimate.forEach(el => observer.observe(el));

    // Force check for items already in view
    setTimeout(() => {
      elementsToAnimate.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0) {
          el.classList.add('in-view');
        }
      });
    }, 100);

    return () => observer.disconnect();
  }, [currentNews]);

  return (
    <Layout>
      <div className="news-page-container">
        {/* Hero Section */}
        <section className="news-hero-section">
          <div className="news-hero-content">
            <h1>YANGILANISHLAR</h1>
            <p className="description">Platformamizdagi so'nggi o'zgarishlar va yangiliklar</p>
          </div>
        </section>

        {/* News List Section */}
        <section className="news-list-section">
          <div className="news-section-container">
            <div className="news-todo-list">
              {allNews.length === 0 ? (
                <div className="news-empty-state">
                  <span className="material-symbols-outlined icon">newspaper</span>
                  <h3>Hozircha yangiliklar yo'q</h3>
                </div>
              ) : (
                currentNews.map((item, index) => (
                  <article key={item.id} className="news-card todo-item">
                    <div className="news-card-left">
                      <div className="todo-check">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
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
                    </div>

                    {/* Media on the Right */}
                    {item.media_file && (
                      <div className="news-media-container" onClick={() => setSelectedImage(item.media_file)}>
                        {item.media_type === 'video' ? (
                          <div className="video-placeholder">
                            <span className="material-symbols-outlined">play_circle</span>
                            <video src={item.media_file} />
                          </div>
                        ) : (
                          <img src={item.media_file} alt={item.title} />
                        )}
                        <div className="zoom-overlay">
                          <span className="material-symbols-outlined">zoom_in</span>
                        </div>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="news-pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="pagination-btn"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="pagination-btn"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Image Modal (Lightbox) */}
        {selectedImage && (
          <div className="image-lightbox" onClick={() => setSelectedImage(null)}>
            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
              <img src={selectedImage} alt="Enlarged" />
              <button className="close-lightbox" onClick={() => setSelectedImage(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NewsPage;
