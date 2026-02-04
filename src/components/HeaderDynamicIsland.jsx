import React, { useState, useEffect } from 'react';
import './HeaderDynamicIsland.css';

const HeaderDynamicIsland = ({ isDashboard, isMobile }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [view, setView] = useState('time'); // 'time' or 'weather'
    const [time, setTime] = useState(new Date());
    const [weather, setWeather] = useState({
        temp: 22,
        city: 'Tashkent',
        condition: 'Sunny',
        icon: 'sunny'
    });

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000 * 60);
        return () => clearInterval(timer);
    }, []);

    // Use current local time from the system (based on metadata)
    const formatTime = (date) => {
        return date.toLocaleTimeString('uz-UZ', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('uz-UZ', {
            day: 'numeric',
            month: 'long',
            weekday: 'short'
        });
    };

    const toggleExpand = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const toggleView = (e) => {
        e.stopPropagation();
        if (isExpanded) return; // Don't toggle view if expanded, just enjoy the view
        setView(view === 'time' ? 'weather' : 'time');
    };

    // Click outside logic
    useEffect(() => {
        if (!isExpanded) return;

        const handleClickOutside = () => setIsExpanded(false);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isExpanded]);

    if (isMobile) return null; // Better UX for mobile would be different, let's keep it simple as requested

    return (
        <div
            className={`dynamic-island-container ${isExpanded ? 'expanded' : 'collapsed'}`}
            onClick={toggleExpand}
        >
            <div className="dynamic-island-content">
                {!isExpanded ? (
                    <div className="island-collapsed-view" onClick={toggleView}>
                        {view === 'time' ? (
                            <div className="island-item animate__animated animate__fadeIn">
                                <span className="material-symbols-outlined island-mini-icon">schedule</span>
                                <span className="island-text">{formatTime(time)}</span>
                            </div>
                        ) : (
                            <div className="island-item animate__animated animate__fadeIn">
                                <span className="material-symbols-outlined island-mini-icon">{weather.icon}</span>
                                <span className="island-text">{weather.temp}°C</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="island-expanded-view animate__animated animate__zoomIn">
                        <div className="expanded-row header-row">
                            <div className="expanded-time-section">
                                <span className="expanded-time">{formatTime(time)}</span>
                                <span className="expanded-date">{formatDate(time)}</span>
                            </div>
                            <div className="expanded-weather-section">
                                <span className="material-symbols-outlined weather-main-icon">{weather.icon}</span>
                                <div className="weather-details">
                                    <span className="weather-temp">{weather.temp}°C</span>
                                    <span className="weather-city">{weather.city}</span>
                                </div>
                            </div>
                        </div>
                        <div className="expanded-footer">
                            <span className="weather-desc">{weather.condition}</span>
                            <div className="island-status-dot"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeaderDynamicIsland;
