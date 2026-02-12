import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/Docs.css';

const Docs = () => {
    const { t } = useTranslation();

    useEffect(() => {
        AOS.init({ duration: 1000, once: true });
    }, []);

    return (
        <div className="docs-page">
            <h1 className="docs-title" data-aos="fade-right">
                {t('docs.title')}
            </h1>
            <p className="docs-subtitle" data-aos="fade-right" data-aos-delay="100">
                {t('docs.subtitle')}
            </p>

            <div className="docs-grid">
                <div className="docs-card" data-aos="fade-up" data-aos-delay="200">
                    <h3>{t('docs.gettingStarted')}</h3>
                    <p>{t('docs.gettingStartedDesc')}</p>
                </div>
                <div className="docs-card" data-aos="fade-up" data-aos-delay="300">
                    <h3>{t('docs.advanced')}</h3>
                    <p>{t('docs.advancedDesc')}</p>
                </div>
                <div className="docs-card" data-aos="fade-up" data-aos-delay="400">
                    <h3>{t('docs.api')}</h3>
                    <p>{t('docs.apiDesc')}</p>
                </div>
                <div className="docs-card" data-aos="fade-up" data-aos-delay="500">
                    <h3>{t('docs.integrations')}</h3>
                    <p>{t('docs.integrationsDesc')}</p>
                </div>
            </div>
        </div>
    );
};

export default Docs;
