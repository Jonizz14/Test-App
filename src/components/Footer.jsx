import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Footer.css';

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="footer">
            <div className="footer-stars"></div>
            <div className="footer-content">
                <div className="footer-logo-container">
                    <h1 className="footer-gamma-logo">EXAMIFY</h1>
                </div>

                <hr className="footer-divider" />

                <div className="footer-sections">
                    <div className="footer-column">
                        <h3>{t('nav.home')}</h3>
                        <ul>
                            <li><Link to="/">{t('nav.home')}</Link></li>
                            <li><Link to="/updates">{t('nav.news')}</Link></li>
                            <li><Link to="/contact">{t('nav.contact')}</Link></li>
                            <li><Link to="/welcome">{t('onboarding.steps.welcome.label')}</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>{t('footer.info') || t('nav.total')}</h3>
                        <ul>
                            <li><Link to="/docs">{t('docs.title')}</Link></li>
                            <li><Link to="/faq">{t('faq.title')}</Link></li>
                            <li><Link to="/creator">{t('architect.title')}</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>{t('nav.dashboard')}</h3>
                        <ul>
                            <li><Link to="/student">{t('nav.cabinet')}</Link></li>
                            <li><Link to="/teacher">{t('nav.cabinet')}</Link></li>
                            <li><Link to="/admin">{t('nav.dashboard')}</Link></li>
                            <li><Link to="/login">{t('nav.login')}</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>{t('footer.social') || "External"}</h3>
                        <ul>
                            <li><a href="https://sergelitim.uz" target="_blank" rel="noopener noreferrer">{t('nav.schoolSite')}</a></li>
                            <li><a href="https://github.com/Jonizz14" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="footer-copyright">© {new Date().getFullYear()} Examify Prep. {t('footer.rights') || "All rights reserved."}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
