import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNews } from '../context/NewsContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Header from '../components/Header';
import '../styles/NewsPage.css';

const NewsDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { news, loading } = useNews();
    const { t, i18n } = useTranslation();
    const [currentNews, setCurrentNews] = useState(null);

    useEffect(() => {
        if (news.length > 0) {
            const found = news.find(item => item.id.toString() === id.toString());
            if (found) {
                setCurrentNews(found);
                window.scrollTo(0, 0); // Reset scroll position
            }
        }
    }, [id, news]);

    if (loading) return <div className="loading-state">Loading...</div>;
    if (!currentNews && !loading) return <div className="not-found">News not found</div>;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', options);
    };

    const recommendedNews = news.filter(item => item.id.toString() !== id.toString()).slice(0, 10);

    return (
        <Layout>
            <div className="news-detail-page-container">
                <div className="detail-page-header">
                    <button className="back-btn" onClick={() => navigate('/updates')}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        {i18n.language === 'uz' ? 'Orqaga' : 'Назад'}
                    </button>
                </div>
                <div className="news-detail-content-wrapper">
                    {/* Main Content Area (75%) */}
                    <main className="news-main-detail">
                        <div className="detail-media-container">
                            {currentNews.media_file && (
                                currentNews.media_type === 'video' ? (
                                    <video src={currentNews.media_file} controls autoPlay className="main-media" />
                                ) : (
                                    <img src={currentNews.media_file} alt={currentNews.title} className="main-media" />
                                )
                            )}
                        </div>

                        <div className="detail-info">
                            <div className="detail-header-meta">
                                <span className="material-symbols-outlined">calendar_today</span>
                                {formatDate(currentNews.created_at)}
                            </div>

                            <h1 className="detail-title">
                                {(i18n.language === 'uz' ? currentNews.title_uz :
                                    i18n.language === 'ru' ? currentNews.title_ru :
                                        currentNews.title_en) || currentNews.title}
                            </h1>

                            <div className="detail-text-content">
                                {(i18n.language === 'uz' ? currentNews.description_uz :
                                    i18n.language === 'ru' ? currentNews.description_ru :
                                        currentNews.description_en) || currentNews.description}
                            </div>
                        </div>
                    </main>

                    {/* Recommended Area (25%) */}
                    <aside className="news-recommendations">
                        <h3 className="rec-title">{i18n.language === 'uz' ? "Sizga qiziq bo'lishi mumkin" : "Вам может быть интересно"}</h3>
                        <div className="rec-list">
                            {recommendedNews.map(item => (
                                <div key={item.id} className="rec-item" onClick={() => navigate(`/updates/${item.id}`)}>
                                    <div className="rec-thumb">
                                        {item.media_file && (
                                            item.media_type === 'video' ? (
                                                <div className="video-thumb">
                                                    <span className="material-symbols-outlined">play_circle</span>
                                                </div>
                                            ) : (
                                                <img src={item.media_file} alt="" />
                                            )
                                        )}
                                    </div>
                                    <div className="rec-info">
                                        <h4 className="rec-item-title">
                                            {(i18n.language === 'uz' ? item.title_uz :
                                                i18n.language === 'ru' ? item.title_ru :
                                                    item.title_en) || item.title}
                                        </h4>
                                        <span className="rec-date">{formatDate(item.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};

export default NewsDetailPage;
