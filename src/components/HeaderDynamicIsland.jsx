import React, { useState, useEffect } from 'react';
import './HeaderDynamicIsland.css';

const HeaderDynamicIsland = ({ isDashboard, isMobile, onToggle, forceExpanded, enableTime = true, enableWeather = true }) => {
    const [mode, setMode] = useState(enableTime ? 'time' : 'weather'); // 'time' or 'weather'
    const [prevMode, setPrevMode] = useState('time');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [time, setTime] = useState(new Date());
    const [isExpandedRender, setIsExpandedRender] = useState(forceExpanded);

    const [weather, setWeather] = useState({
        temp: '--',
        city: 'Yuklanmoqda...',
        address: 'Manzil aniqlanmoqda...',
        condition: 'Ob-havo...',
        icon: 'cloud'
    });

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!enableWeather) return;

        const fetchWeather = async (lat, lon) => {
            try {
                // Fetch weather from Open-Meteo (Free, no key required)
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                const weatherData = await weatherRes.json();
                
                // Fetch Address from Nominatim (OpenStreetMap)
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                const geoData = await geoRes.json();

                const city = geoData.address.city || geoData.address.town || geoData.address.village || 'Noma\'lum';
                const district = geoData.address.suburb || geoData.address.neighbourhood || '';
                
                const conditionMap = {
                    0: 'Ochiq osmon',
                    1: 'Asosan ochiq', 2: 'Qisman bulutli', 3: 'Bulutli',
                    45: 'Tuman', 48: 'Qirovli tuman',
                    51: 'Yengil shabada', 53: 'O\'rtacha shabada', 55: 'Kuchli shabada',
                    61: 'Yengil yomg\'ir', 63: 'O\'rtacha yomg\'ir', 65: 'Kuchli yomg\'ir',
                    71: 'Yengil qor', 73: 'O\'rtacha qor', 75: 'Kuchli qor',
                    95: 'Momaqaldiroq'
                };

                const weatherCode = weatherData.current_weather.weathercode;
                let icon = 'sunny';
                if (weatherCode >= 1 && weatherCode <= 3) icon = 'cloud_queue';
                if (weatherCode >= 45) icon = 'foggy';
                if (weatherCode >= 51 && weatherCode <= 67) icon = 'rainy';
                if (weatherCode >= 71 && weatherCode <= 86) icon = 'ac_unit';
                if (weatherCode >= 95) icon = 'thunderstorm';

                setWeather({
                    temp: Math.round(weatherData.current_weather.temperature),
                    city: city,
                    address: district ? `${district}, ${city}` : city,
                    condition: conditionMap[weatherCode] || 'Ma\'lumot yo\'q',
                    icon: icon
                });
            } catch (error) {
                console.error("Weather fetch error:", error);
                setWeather(prev => ({ ...prev, city: 'Xatolik', address: 'Ma\'lumot olib bo\'lmadi' }));
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setWeather(prev => ({ ...prev, city: 'Toshkent', address: 'Joylashuv rad etildi', temp: 22 }));
                }
            );
        }
    }, [enableWeather]);

    useEffect(() => {
        if (mode === 'time' && !enableTime && enableWeather) {
            setMode('weather');
        } else if (mode === 'weather' && !enableWeather && enableTime) {
            setMode('time');
        }
    }, [enableTime, enableWeather, mode]);

    useEffect(() => {
        if (forceExpanded) {
            setIsExpandedRender(true);
            return;
        }

        const t = setTimeout(() => setIsExpandedRender(false), 120);
        return () => clearTimeout(t);
    }, [forceExpanded]);

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
        if (!(enableTime && enableWeather)) return;

        setPrevMode(mode);
        setIsTransitioning(true);
        setMode(prev => prev === 'time' ? 'weather' : 'time');

        setTimeout(() => {
            setIsTransitioning(false);
        }, 400);
    };

    if (isMobile || (!enableTime && !enableWeather)) return null;

    return (
        <div
            className={`dynamic-island-container ${forceExpanded ? 'expanded' : 'collapsed'} ${!forceExpanded && isExpandedRender ? 'closing' : ''}`}
            onClick={() => onToggle(!forceExpanded)}
        >
            <div className="dynamic-island-content">
                {!forceExpanded && !isExpandedRender ? (
                    <div className="island-pill-view">
                        {enableTime && enableWeather && (
                            <div className="island-mode-toggle" onClick={handleModeToggle}>
                                <span className="material-symbols-outlined mini-icon">
                                    {mode === 'time' ? 'schedule' : weather.icon}
                                </span>
                            </div>
                        )}
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

                        {enableTime && enableWeather && (
                            <div className="expanded-mode-nav" onClick={handleModeToggle}>
                                <span className="material-symbols-outlined">
                                    {mode === 'time' ? 'cloud' : 'schedule'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeaderDynamicIsland;

