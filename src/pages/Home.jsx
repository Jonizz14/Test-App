import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import apiService from "../data/apiService";
import "../styles/Home.css";
import { useSavedItems } from "../context/SavedItemsContext";

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  const videoRef = React.useRef(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeen) {
      navigate('/welcome');
    }
  }, [navigate]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2
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

    const sections = document.querySelectorAll('section');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.getPublicStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };
    fetchStats();
  }, []);

  const scrollToSection = (className) => {
    const element = document.querySelector(className);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { savedItems, saveItem } = useSavedItems();

  const handleSaveInfo = (e, role) => {
    e.stopPropagation();

    // Check if duplicate before running any animation or logic
    if (savedItems.find(i => i.id === role.id)) {
      window.dispatchEvent(new CustomEvent('saveError', { 
        detail: { message: "Bu informatsiya allaqachon saqlangan", icon: 'warning' } 
      }));
      return;
    }
    
    // Get start position
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Create flying element immediately
    const flyer = document.createElement('div');
    flyer.className = 'flyer-icon';
    flyer.innerHTML = `<span class="material-symbols-outlined">${role.icon}</span>`;
    flyer.style.left = `${rect.left + rect.width / 2 - 25}px`;
    flyer.style.top = `${rect.top + rect.height / 2 - 25}px`;
    document.body.appendChild(flyer);

    // 1. Save immediately so the storage icon appears in Header and starts its animation
    saveItem(role);

    // 2. Wait a moment for the header layout to calculate the NEW position of the bin
    setTimeout(() => {
      const target = document.getElementById('header-storage-bin');
      const targetRect = target?.getBoundingClientRect();

      if (targetRect) {
        // Target the bin accurately as it appears
        // Aligning center: (target center) - (flyer half-width)
        // targetRect.width is 44, targetRect.left is absolute. 
        // flyer is 50px wide. target center is left + 22. 
        // flyer should be at left + 22 - 25 = left - 3.
        flyer.style.left = `${targetRect.left + (targetRect.width / 2) - 25}px`;
        flyer.style.top = `${targetRect.top + (targetRect.height / 2) - 25}px`;
        
        // Scale 0.88 because bin is 44px and flyer is 50px (44/50 = 0.88)
        flyer.style.transform = 'scale(0.88) rotate(0deg)';
      }
    }, 100);

    // Beautiful Disappearance: Implode into the bin
    setTimeout(() => {
      flyer.style.opacity = '0';
      flyer.style.transform = 'scale(0) rotate(180deg)';
      flyer.style.filter = 'blur(10px) brightness(1.5)';
    }, 850);

    // Cleanup and trigger notification
    setTimeout(() => {
      if (document.body.contains(flyer)) {
        document.body.removeChild(flyer);
      }
      
      // Dispatch custom event for Header notification
      window.dispatchEvent(new CustomEvent('itemSaved', { detail: role }));
    }, 1300); // Slightly longer to finish the implosion
  };

  const rolesData = [
    {
      id: 'student',
      icon: 'school',
      title: "O'QUVCHI",
      description: "Bilimingizni sinovdan o'tkazing va natijalarni kuzatib boring.",
      details: [
        "Interaktiv testlar va darsliklar",
        "Shaxsiy muvaffaqiyat statistikasi",
        "O'z ustingizda ishlash uchun xatolar tahlili",
        "Haftalik reyting va sovrinli olimpiadalar"
      ]
    },
    {
      id: 'teacher',
      icon: 'cast_for_education',
      title: "O'QITUVCHI",
      description: "Testlar tuzing va o'quvchilarni statistikasini kuzatib boring.",
      details: [
        "Avtomatik tekshirish va baholash tizimi",
        "Guruhlar va o'quvchilar progress boshqaruvi",
        "Tayyor metodik manbalar kutubxonasi",
        "Individual ta'lim traektoriyasini shakllantirish"
      ]
    },
    {
      id: 'admin',
      icon: 'admin_panel_settings',
      title: "ADMINISTRATOR",
      description: "Tizimni to'liq nazorat qiling va jarayonlarni boshqaring.",
      details: [
        "To'liq foydalanuvchilar va rollar nazorati",
        "Tizim xavfsizligi va ma'lumotlar himoyasi",
        "Keng qamrovli analitika va hisobotlar",
        "Maktab/Markaz faoliyatini raqamlashtirish"
      ]
    }
  ];

  return (
    <Layout>
      {/* Hero Section - Full Screen Video */}
      <section className="hero-section">
        <div className="video-background">
          <video ref={videoRef} autoPlay loop muted playsInline>
            <source src="/Export-Typeface-Animator (2).mp4" type="video/mp4" />
          </video>
          <div className="overlay"></div>
        </div>
        
        <div className="hero-content">
          <h1>EXAMIFY PREP</h1>
          <p>Kelajagingizni shu yerdan boshlang. Ixtisoslashtirilgan ta'lim uchun zamonaviy yechim.</p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={() => navigate('/login')}>
              Boshlash
            </button>
            <button className="btn-hero-outline" onClick={() => scrollToSection('.users-section')}>
              Ko'proq ma'lumot
            </button>
          </div>
        </div>
      </section>

      {/* Users Section - Full Screen */}
      <section className="users-section">
        <div className="section-container">
          <div className="section-header">
            <h2>KIMLAR UCHUN?</h2>
            <p>O'qituvchilar, O'quvchilar va Ma'murlar uchun yagona platforma</p>
          </div>
          
          <div className="roles-showcase">
            {rolesData.map(role => (
              <div key={role.id} className="role-item">
                <div className="role-content">
                  <div className="role-icon">
                    <span className="material-symbols-outlined">{role.icon}</span>
                  </div>
                  <h3>{role.title}</h3>
                  <p>{role.description}</p>
                  <div className="role-details">
                    <ul>
                      {role.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                  <button className="save-info-btn" onClick={(e) => handleSaveInfo(e, role)}>
                    <span className="material-symbols-outlined">content_copy</span>
                    <span>Saqlash</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Modern Cards */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2>ZAMONAVIY TEXNOLOGIYALAR</h2>
            <p>Platformamiz eng so'nggi va xavfsiz texnologiyalar asosida yaratilgan</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-content">
                <div className="feature-icon">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <h3>Real Vaqt Tahlili</h3>
                <p>Natijalarni onlayn kuzatish va tahlil qilish imkoniyati. Har bir test jarayonini jonli kuzatib boring.</p>
                <div className="feature-visual">
                  <img src="/banner/inf1.png" alt="Analysis" className="feature-img" />
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-content">
                <div className="feature-icon">
                  <span className="material-symbols-outlined">security</span>
                </div>
                <h3>Xavfsiz Tizim</h3>
                <p>Himoyalangan test jarayonlari va shaxsiy ma'lumotlar. Biz sizning xavfsizligingizni birinchi o'ringa qo'yamiz.</p>
                <div className="feature-visual">
                  <img src="/banner/inf2.png" alt="Security" className="feature-img" />
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-content">
                <div className="feature-icon">
                  <span className="material-symbols-outlined">devices</span>
                </div>
                <h3>Moslashuvchanlik</h3>
                <p>Har qanday qurilmada — telefondan tortib kompyutergacha — qulay interfeys va tezkor ishlash.</p>
                <div className="feature-visual">
                   <img src="/banner/inf3.png" alt="Flexibility" className="feature-img" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section - Full Screen */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-header">
             <h2>RAQAMLARDA BIZ</h2>
          </div>
          
          <div className="stats-grid-large">
            <div className="stat-box">
              <span className="stat-number">{stats?.tests_count || 1500}+</span>
              <span className="stat-label">Yaratilgan Testlar</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats?.students_count || 800}+</span>
              <span className="stat-label">Faol O'quvchilar</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats?.teachers_count || 50}+</span>
              <span className="stat-label">Malakali Ustozlar</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats?.attempts_count || 12000}+</span>
              <span className="stat-label">Topshirilgan Testlar</span>
            </div>
          </div>
        </div>
      </section>


    </Layout>
  );
};

export default Home;
