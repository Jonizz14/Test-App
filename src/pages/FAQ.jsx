import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/FAQ.css';

const FAQ = () => {
    const { t } = useTranslation();

    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
            offset: 50
        });
    }, []);

    const faqs = [
        { q: t('faq.q1'), a: t('faq.a1') },
        { q: t('faq.q2'), a: t('faq.a2') },
        { q: t('faq.q3'), a: t('faq.a3') },
        { q: t('faq.q4'), a: t('faq.a4') }
    ];

    return (
        <div className="faq-page">
            <h1 className="faq-title" data-aos="fade-up">
                {t('faq.title')}
            </h1>

            <div className="faq-list">
                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        className="faq-item"
                        data-aos="fade-up"
                        data-aos-delay={index * 100}
                    >
                        <div className="faq-content-container">
                            <h3 className="faq-question">{faq.q}</h3>
                            <p className="faq-answer">{faq.a}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQ;
