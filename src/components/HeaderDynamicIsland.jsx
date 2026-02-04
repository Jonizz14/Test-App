import React, { useState, useEffect } from 'react';
import './HeaderDynamicIsland.css';

const HeaderDynamicIsland = ({ isDashboard, isMobile, onToggle, forceExpanded }) => {
    const [mode, setMode] = useState('time'); // 'time' or 'weather'
    const [prevMode, setPrevMode] = useState('time');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [time, setTime] = useState(new Date());

    const [weather] = useState({
        temp: 22,
        city: 'Tashkent',
        address: 'Sergeli tumani, 5-daha',
        condition: 'Bulutli havo',
        icon: 'cloud'
    });

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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

    const handleModeToggle = (e) => {
        // Stop propagation so it doesn't trigger the expansion toggle if we only want mode change
        e.stopPropagation();
        if (isTransitioning) return;

        setPrevMode(mode);
        setIsTransitioning(true);
        setMode(prev => prev === 'time' ? 'weather' : 'time');

        setTimeout(() => {
            setIsTransitioning(false);
        }, 400);
    };

    if (isMobile) return null;

    return (
        <div
            className={`dynamic-island-container ${forceExpanded ? 'expanded' : 'collapsed'}`}
            onClick={() => onToggle(!forceExpanded)}
        >
            <div className="dynamic-island-content">
                {!forceExpanded ? (
                    <div className="island-pill-view">
                        <div className="island-mode-toggle" onClick={handleModeToggle}>
                            <span className="material-symbols-outlined mini-icon">
                                {mode === 'time' ? 'schedule' : weather.icon}
                            </span>
                        </div>
                        <div className="island-data-wrapper">
                            <div className="preview-text-container">
                                {isTransitioning && (
                                    <span className="preview-text slide-up-exit">
                                        {prevMode === 'time' ? formatTime(time) : `${weather.temp}°C`}
                                    </span>
                                )}
                                <span className={`preview-text ${isTransitioning ? 'slide-up-enter' : ''}`}>
                                    {mode === 'time' ? formatTime(time) : `${weather.temp}°C`}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="island-expanded-view">
                        <div className="expanded-content-wrapper">
                            <div className="mode-layout-container">
                                {isTransitioning && (
                                    <div className="slide-up-exit" style={{ position: 'absolute', width: '100%' }}>
                                        {prevMode === 'time' ? (
                                            <div className="expanded-time-layout">
                                                <div className="time-main">
                                                    <span className="big-time">{formatTime(time)}</span>
                                                    <span className="seconds-dot"></span>
                                                </div>
                                                <div className="date-secondary">{formatDate(time)}</div>
                                            </div>
                                        ) : (
                                            <div className="expanded-weather-layout">
                                                <div className="weather-top">
                                                    <span className="big-temp">{weather.temp}°C</span>
                                                    <span className="material-symbols-outlined expanded-weather-icon">{weather.icon}</span>
                                                </div>
                                                <div className="weather-location">
                                                    <span className="location-city">{weather.city}</span>
                                                    <span className="location-address">{weather.address}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className={isTransitioning ? 'slide-up-enter' : ''}>
                                    {mode === 'time' ? (
                                        <div className="expanded-time-layout">
                                            <div className="time-main">
                                                <span className="big-time">{formatTime(time)}</span>
                                                <span className="seconds-dot"></span>
                                            </div>
                                            <div className="date-secondary">{formatDate(time)}</div>
                                        </div>
                                    ) : (
                                        <div className="expanded-weather-layout">
                                            <div className="weather-top">
                                                <span className="big-temp">{weather.temp}°C</span>
                                                <span className="material-symbols-outlined expanded-weather-icon">{weather.icon}</span>
                                            </div>
                                            <div className="weather-location">
                                                <span className="location-city">{weather.city}</span>
                                                <span className="location-address" title={weather.address}>{weather.address}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="expanded-mode-nav" onClick={handleModeToggle}>
                            <span className="material-symbols-outlined">
                                {mode === 'time' ? 'cloud' : 'schedule'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeaderDynamicIsland;
