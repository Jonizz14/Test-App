import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../context/NewsContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import '../styles/NewsPage.css';
import AuroraHero from '../components/Aurora/AuroraHero';

const NewsPage = () => {
  const { news } = useNews();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Local state for pagination and lightbox
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const itemsPerPage = 6;

  // Combine news from context
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

  // Animation Logic - Trigger on scroll
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elementsToObserve = document.querySelectorAll('section, .todo-item, .news-hero-section');
    elementsToObserve.forEach(el => observer.observe(el));

    setTimeout(() => {
      elementsToObserve.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0) {
          el.classList.add('in-view');
        }
      });
    }, 100);

    return () => observer.disconnect();
  }, [currentNews]);

  // Fullpage scroll snap logic
  useEffect(() => {
    const getSnapTargets = () => {
      const hero = document.querySelector('.news-hero-section');
      const containers = document.querySelectorAll('.sticky-section-container');
      const targets = [];
      if (hero) targets.push(hero);
      containers.forEach(c => targets.push(c));
      return targets;
    };

    let currentIndex = 0;
    let isScrolling = false;
    let accumulatedDelta = 0;
    let deltaTimeout;
    const SCROLL_THRESHOLD = 30;
    const COOLDOWN = 1000;

    const updateCurrentIndex = () => {
      const targets = getSnapTargets();
      const scrollY = window.scrollY;
      for (let i = targets.length - 1; i >= 0; i--) {
        if (scrollY >= targets[i].offsetTop - window.innerHeight / 2) {
          currentIndex = i;
          break;
        }
      }
    };
    setTimeout(updateCurrentIndex, 100);

    const snapTo = (index) => {
      const targets = getSnapTargets();
      if (index < 0 || index >= targets.length) return;
      isScrolling = true;
      currentIndex = index;
      targets[index].scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        isScrolling = false;
        accumulatedDelta = 0;
      }, COOLDOWN);
    };

    const handleWheel = (e) => {
      if (isScrolling) {
        e.preventDefault();
        return;
      }
      accumulatedDelta += e.deltaY;
      clearTimeout(deltaTimeout);
      deltaTimeout = setTimeout(() => { accumulatedDelta = 0; }, 150);

      if (Math.abs(accumulatedDelta) > SCROLL_THRESHOLD) {
        const targets = getSnapTargets();
        const maxIndex = targets.length - 1;
        if (!isScrolling) updateCurrentIndex();

        if (accumulatedDelta > 0) {
          if (currentIndex < maxIndex) {
            e.preventDefault();
            snapTo(currentIndex + 1);
          }
        } else {
          if (currentIndex > 0) {
            e.preventDefault();
            snapTo(currentIndex - 1);
          }
        }
        accumulatedDelta = 0;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <Layout>
      <div className="news-page-container">
        <AuroraHero className="news-hero-section">
          <div className="news-hero-content">
            <h1>{t('news.updates')}</h1>
            <p className="description">{t('news.heroSubtitle')}</p>
          </div>
        </AuroraHero>

        <div className="home-sticky-wrapper">
          <div className="sticky-section-container">
            <section className="news-list-section dark-section">
              <div className="news-section-container">
                <div className="news-grid-layout">
                  {allNews.length === 0 ? (
                    <div className="news-empty-state">
                      <span className="material-symbols-outlined icon">newspaper</span>
                      <h3>{t('news.noNews')}</h3>
                    </div>
                  ) : (
                    currentNews.map((item, index) => (
                      <article key={item.id} className="news-card todo-item mini-card">
                        <div className="news-card-left">
                          <div className="todo-check">
                            <span className="material-symbols-outlined">check_circle</span>
                          </div>
                          <div className="news-content-body">
                            <div className="news-date">
                              {formatDate(item.created_at)}
                            </div>
                            <h3 className="news-title">
                              {(i18n.language === 'uz' ? item.title_uz :
                                i18n.language === 'ru' ? item.title_ru :
                                  item.title_en) || item.title}
                            </h3>
                            <button className="read-more-btn" onClick={() => navigate(`/updates/${item.id}`)}>
                              {t('news.readMore')}
                              <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                          </div>
                        </div>

                        {item.media_file && (
                          <div className="news-media-container mini-thumb">
                            {item.media_type === 'video' ? (
                              <div className="video-placeholder">
                                <span className="material-symbols-outlined">play_circle</span>
                              </div>
                            ) : (
                              <img src={item.media_file} alt={item.title} />
                            )}
                          </div>
                        )}
                      </article>
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="news-pagination">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="pagination-btn">
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i + 1} className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>
                        {i + 1}
                      </button>
                    ))}
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="pagination-btn">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

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
