import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/TheArchitect.css';

const TheArchitect = () => {
    const { t } = useTranslation();

    useEffect(() => {
        AOS.init({ duration: 1000, once: true });
    }, []);

    return (
        <div className="architect-page">
            <h1 className="architect-hero" data-aos="fade-down">
                {t('architect.title').split(' ')[0]}<br />
                {t('architect.title').split(' ')[1] || ''}
            </h1>

            <div className="architect-content">
                <div className="architect-bio" data-aos="fade-right" data-aos-delay="200">
                    <h2 className="architect-name">{t('architect.name')}</h2>
                    <p className="architect-desc">
                        {t('architect.desc')}
                    </p>
                    <div className="architect-links">
                        <a href="https://github.com/Jonizz14" target="_blank" rel="noopener noreferrer" className="architect-btn primary">
                            {t('architect.github')}
                        </a>
                        <a href="/contact" className="architect-btn secondary">
                            {t('architect.contact')}
                        </a>
                    </div>
                </div>

                <div className="architect-philosophy" data-aos="fade-left" data-aos-delay="400">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2rem', opacity: 0.6 }}>
                        {t('architect.philosophy')}
                    </h3>
                    <p className="philosophy-text">
                        {t('architect.quote')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TheArchitect;
