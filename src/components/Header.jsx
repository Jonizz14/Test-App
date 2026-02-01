import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tooltip } from 'antd';
import '../styles/Header.css';
import 'animate.css';
import { useSavedItems } from '../context/SavedItemsContext';
import { useSentMessages } from '../context/SentMessagesContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useServerTest } from '../context/ServerTestContext';
import { showWarning } from '../utils/antdNotification';


const Header = ({ demoMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = React.useRef(null);
  const { savedItems, removeItem, clearItems, toggleSidebar } = useSavedItems();
  const { sentMessages, removeMessage, clearMessages } = useSentMessages();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { settings } = useSettings();
  const { sessionStarted, timeRemaining, formatTime } = useServerTest();

  const { t, i18n } = useTranslation();
  const [showSaved, setShowSaved] = React.useState(false);
  const [showMessages, setShowMessages] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showLanguages, setShowLanguages] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Search Data
  // Enhanced Search Data with "Content" simulation
  // Enhanced Search Data with "Content" simulation for all pages
  const getSearchData = (t) => [
    // Pages
    {
      id: 'home',
      title: t('nav.search.results.home.title'),
      path: '/',
      icon: 'home',
      category: t('nav.home') || 'Page',
      description: t('nav.search.results.home.desc'),
      content: t('nav.search.results.home.content')
    },
    {
      id: 'contact',
      title: t('nav.search.results.contact.title'),
      path: '/contact',
      icon: 'contact_support',
      category: t('nav.contact') || 'Page',
      description: t('nav.search.results.contact.desc'),
      content: t('nav.search.results.contact.content')
    },
    {
      id: 'login',
      title: t('nav.search.results.login.title'),
      path: '/login',
      icon: 'login',
      category: t('nav.login') || 'Auth',
      description: t('nav.search.results.login.desc'),
      content: t('nav.search.results.login.content')
    },
    {
      id: 'welcome',
      title: t('nav.search.results.welcome.title'),
      path: '/welcome',
      icon: 'waving_hand',
      category: 'Intro',
      description: t('nav.search.results.welcome.desc'),
      content: t('nav.search.results.welcome.content')
    },

    // Admin Pages
    {
      id: 'dashboard-admin',
      title: t('nav.search.results.adminDashboard.title'),
      path: '/admin',
      icon: 'dashboard',
      category: t('nav.dashboard') || 'Admin',
      description: t('nav.search.results.adminDashboard.desc'),
      content: t('nav.search.results.adminDashboard.content')
    },
    {
      id: 'admin-teachers',
      title: t('nav.search.results.adminTeachers.title'),
      path: '/admin/teachers',
      icon: 'school',
      category: t('nav.teachers') || 'Admin',
      description: t('nav.search.results.adminTeachers.desc'),
      content: t('nav.search.results.adminTeachers.content')
    },
    {
      id: 'admin-students',
      title: t('nav.search.results.adminStudents.title'),
      path: '/admin/students',
      icon: 'face',
      category: t('nav.students') || 'Admin',
      description: t('nav.search.results.adminStudents.desc'),
      content: t('nav.search.results.adminStudents.content')
    },

    // Teacher Pages
    {
      id: 'teacher-classes',
      title: t('nav.search.results.teacherClasses.title'),
      path: '/teacher/classes',
      icon: 'groups',
      category: t('nav.classes') || 'Teacher',
      description: t('nav.search.results.teacherClasses.desc'),
      content: t('nav.search.results.teacherClasses.content')
    },
    {
      id: 'teacher-tests',
      title: t('nav.search.results.teacherTests.title'),
      path: '/teacher/tests',
      icon: 'quiz',
      category: t('nav.tests') || 'Teacher',
      description: t('nav.search.results.teacherTests.desc'),
      content: t('nav.search.results.teacherTests.content')
    },

    // Student Pages
    {
      id: 'student-tests',
      title: t('nav.search.results.studentTests.title'),
      path: '/student/tests',
      icon: 'assignment',
      category: t('nav.tests') || 'Student',
      description: t('nav.search.results.studentTests.desc'),
      content: t('nav.search.results.studentTests.content')
    },
    {
      id: 'student-results',
      title: t('nav.search.results.studentResults.title'),
      path: '/student/results',
      icon: 'bar_chart',
      category: t('nav.results') || 'Student',
      description: t('nav.search.results.studentResults.desc'),
      content: t('nav.search.results.studentResults.content')
    },

    // User & System
    {
      id: 'profile',
      title: t('nav.search.results.profile.title'),
      path: '/profile',
      icon: 'person',
      category: t('nav.profile') || 'User',
      description: t('nav.search.results.profile.desc'),
      content: t('nav.search.results.profile.content')
    },
    {
      id: 'ai-help',
      title: t('nav.search.results.aiHelp.title'),
      path: '#',
      icon: 'smart_toy',
      category: 'AI',
      description: t('nav.search.results.aiHelp.desc'),
      content: t('nav.search.results.aiHelp.content')
    }
  ];

  const searchData = React.useMemo(() => getSearchData(t), [t]);

  const filteredSearchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();

    return searchData.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const descMatch = item.description.toLowerCase().includes(query);
      const contentMatch = item.content.toLowerCase().includes(query);
      return titleMatch || descMatch || contentMatch;
    });
  }, [searchQuery, searchData]);

  // Helper to highlight matching text
  const HighlightedText = ({ text, highlight }) => {
    if (!highlight.trim() || !text) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="search-highlight">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Helper to render content snippet with match
  const renderSearchSnippet = (content, query) => {
    if (!content || !query || query.length < 2) return null;

    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) return null;

    const start = Math.max(0, index - 35);
    const end = Math.min(content.length, index + query.length + 35);
    let snippet = content.slice(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return (
      <p className="search-content-snippet">
        <HighlightedText text={snippet} highlight={query} />
      </p>
    );
  };


  const [activeNotifications, setActiveNotifications] = React.useState([]);
  const [headerHeight, setHeaderHeight] = React.useState(64);

  // Dashboard state
  const isDashboard = ['/admin', '/headadmin', '/teacher', '/student', '/seller'].some(path =>
    location.pathname.startsWith(path)
  );
  const [isDashboardExpanded, setIsDashboardExpanded] = React.useState(false);

  const isSellerOrHeadAdmin = location.pathname.startsWith('/seller') || location.pathname.startsWith('/headadmin') || (location.pathname.startsWith('/student') && currentUser?.role === 'student');

  // Calculate Dynamic Header Height for Smooth Transitions
  React.useEffect(() => {
    let newHeight = 64; // Base height

    const isExpanded =
      (showSaved && savedItems.length > 0) ||
      (showMessages && sentMessages.length > 0) ||
      (showNotifications) ||
      (showLanguages && (!isDashboard || isSellerOrHeadAdmin)) ||
      (showSearch && (!isDashboard || isSellerOrHeadAdmin));

    if (isExpanded) {
      if (showLanguages && (!isDashboard || isSellerOrHeadAdmin)) newHeight = 140;
      else if (showSearch && (!isDashboard || isSellerOrHeadAdmin)) newHeight = 380;
      else newHeight = 380; // Default for expanded storage/messages
    }

    // Add height for notifications
    const visibleNotificationsCount = activeNotifications.filter(n => n.isVisible).length;
    if (visibleNotificationsCount > 0) {
      newHeight += (visibleNotificationsCount * 64);
    }

    setHeaderHeight(newHeight);
  }, [activeNotifications, showSaved, showMessages, showNotifications, showLanguages, showSearch, isDashboard, isSellerOrHeadAdmin, savedItems.length, sentMessages.length]);

  // Handle Body Scroll Lock when header is expanded or mobile menu is open
  React.useEffect(() => {
    const isExpanded =
      (showSaved && savedItems.length > 0) ||
      (showMessages && sentMessages.length > 0) ||
      (showNotifications) ||
      (showLanguages && (!isDashboard || isSellerOrHeadAdmin)) ||
      (showSearch && (!isDashboard || isSellerOrHeadAdmin)) ||
      (activeDropdown === 'mobile-menu');

    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showSaved, showMessages, showNotifications, showLanguages, showSearch, isDashboard, isSellerOrHeadAdmin, savedItems.length, sentMessages.length, activeDropdown]);

  // Listen for custom 'itemSaved' event
  const handleNotification = React.useCallback((data) => {
    const id = Date.now() + Math.random();
    const newNotification = { ...data, id, isVisible: false };

    setActiveNotifications(prev => [...prev, newNotification]);

    setTimeout(() => {
      setActiveNotifications(prev => prev.map(n => n.id === id ? { ...n, isVisible: true } : n));
    }, 10);

    setTimeout(() => {
      setActiveNotifications(prev => prev.map(n => n.id === id ? { ...n, isVisible: false } : n));
      setTimeout(() => {
        setActiveNotifications(prev => prev.filter(n => n.id !== id));
      }, 700);
    }, 3000);
  }, []);

  React.useEffect(() => {
    const handleItemSaved = (e) => handleNotification(e.detail);
    const handleSaveError = (e) => handleNotification({ ...e.detail, isError: true });

    window.addEventListener('itemSaved', handleItemSaved);
    window.addEventListener('saveError', handleSaveError);
    return () => {
      window.removeEventListener('itemSaved', handleItemSaved);
      window.removeEventListener('saveError', handleSaveError);
    };
  }, [handleNotification]);

  // Enforce onboarding for new users
  React.useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    const isPublicPath = ['/welcome', '/test', '/health'].some(path =>
      location.pathname.startsWith(path)
    );

    // Special check for demoMode (onboarding page) to avoid infinite loop
    if (!hasSeen && !demoMode && !isPublicPath) {
      navigate('/welcome');
    }
  }, [demoMode, location.pathname, navigate]);

  // Close dropdowns on click outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowSaved(false);
        setShowMessages(false);
        setShowLanguages(false);
        setShowSearch(false);
      }
    };


    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  // Auto-close empty lists
  React.useEffect(() => {
    if (savedItems.length === 0) setShowSaved(false);
  }, [savedItems.length]);

  React.useEffect(() => {
    if (sentMessages.length === 0) setShowMessages(false);
  }, [sentMessages.length]);

  // Dynamic links based on route
  const getNavLinks = () => {
    if (location.pathname.startsWith('/headadmin')) {
      const headadminLinks = [
        { label: 'Umumiy', path: '/headadmin' },
        { label: 'Adminlar', path: '/headadmin/admins' },
        { label: 'Yangilanishlar', path: '/headadmin/updates' },
        { label: 'Xabarlar', path: '/headadmin/messages' },
        { label: 'Sozlamalar', path: '/headadmin/settings' },
      ];
      return headadminLinks;
    }
    if (location.pathname.startsWith('/admin')) {
      return [
        { label: t('nav.dashboard'), path: '/admin' },
        { label: t('nav.teachers'), path: '/admin/teachers' },
        { label: t('nav.students'), path: '/admin/students' },
        {
          label: t('nav.statistics'),
          children: [
            { label: t('nav.total'), path: '/admin/statistics' },
            { label: t('nav.classes'), path: '/admin/classes' },
            { label: t('nav.students'), path: '/admin/students-page' },
            { label: t('nav.tests'), path: '/admin/tests-page' }
          ]
        },
        {
          label: t('nav.ratings'),
          children: [
            { label: t('nav.classes'), path: '/admin/class-stats' },
            { label: t('nav.students'), path: '/admin/student-ratings' },
            { label: t('nav.tests'), path: '/admin/test-stats' }
          ]
        }
      ];
    }
    if (location.pathname.startsWith('/teacher')) {
      return [
        { label: t('nav.cabinet'), path: '/teacher' },
        { label: t('nav.classes'), path: '/teacher/classes' },
        { label: t('nav.tests'), path: '/teacher/tests' }
      ];
    }
    if (location.pathname.startsWith('/seller')) {
      return [
        { label: 'Umumiy', path: '/seller' },
        { label: "O'quvchilar", path: '/seller/students' },
        { label: 'Narxlar', path: '/seller/prices' }
      ];
    }
    if (location.pathname.startsWith('/student')) {
      return [
        { label: 'Asosiy', path: '/student' },
        {
          label: 'Hamjamiyat',
          children: [
            { label: 'O\'qituvchilar', path: '/student/search' },
            { label: 'Sinfdoshlar', path: '/student/classmates' }
          ]
        },
        {
          label: 'O\'quv jarayoni',
          children: [
            { label: 'Test topshirish', path: '/student/take-test' },
            { label: 'Natijalarim', path: '/student/results' },
            { label: 'Darslar', path: '/student/lessons' }
          ]
        },
        {
          label: 'Statistika',
          children: [
            { label: 'Mening statistikam', path: '/student/statistics' },
            { label: 'Sinf statistikasi', path: '/student/my-class-statistics' }
          ]
        },
        {
          label: 'Reytinglar',
          children: [
            { label: 'O\'quvchilar reytingi', path: '/student/students-rating' },
            { label: 'Sinflar reytingi', path: '/student/classes-rating' }
          ]
        }
      ];
    }
    // Default Home Links
    return [
      { label: t('nav.home'), path: '/', isAction: true },
      { label: t('nav.news') || 'Yangilanishlar', path: '/updates' },
      { label: t('nav.schoolSite'), href: 'https://sergelitim.uz', isExternal: true },
      { label: t('nav.contact'), path: '/contact', isAction: true }
    ];
  };

  const navLinks = getNavLinks();

  const handleLinkClick = (link) => {
    if (currentUser?.role === 'student' && sessionStarted && link.path !== '/student/take-test') {
      handleNotification({
        title: "Test topshirish jarayonida boshqa sahifaga o'ta olmaysiz!",
        isError: true,
        icon: 'warning',
        isFullMessage: true
      });
      return;
    }

    if (link.isExternal) {
      if (!demoMode) window.open(link.href, '_blank', 'noopener,noreferrer');
    } else if (link.path) {
      if (!demoMode) navigate(link.path);
    }
  };


  const getHeaderClass = () => {
    let classes = ['header'];
    if (i18n.language) classes.push(`lang-${i18n.language.split('-')[0]}`);

    const hasExpandedContent =
      (showSaved && savedItems.length > 0) ||
      (showMessages && sentMessages.length > 0) ||
      (showNotifications) ||
      (showLanguages && (!isDashboard || isSellerOrHeadAdmin)) ||
      (showSearch && (!isDashboard || isSellerOrHeadAdmin));

    if (activeNotifications.length > 0 && !hasExpandedContent) classes.push('expanding-down');
    if (showSaved && savedItems.length > 0) classes.push('storage-expanded');
    if (showMessages && sentMessages.length > 0) classes.push('messages-expanded');
    if (showNotifications) classes.push('messages-expanded'); // Reuse expanded style
    if (showLanguages && (!isDashboard || isSellerOrHeadAdmin)) classes.push('lang-expanded');
    if (showSearch && (!isDashboard || isSellerOrHeadAdmin)) classes.push('search-expanded');


    if (demoMode) classes.push('demo-mode');

    return classes.join(' ');
  };

  const handleHeaderClick = (e) => {
    if (isDashboard && !isDashboardExpanded) {
      setIsDashboardExpanded(true);
    }
  };

  const handleCollapse = (e) => {
    e.stopPropagation();
    setShowSaved(false);
    setShowMessages(false);
    setShowNotifications(false);
    setShowLanguages(false);
    setShowSearch(false);

  };

  const toggleSaved = () => {
    if (savedItems.length > 0) {
      setShowSaved(!showSaved);
      setShowMessages(false);
      setShowNotifications(false);
      setShowLanguages(false);
      setShowSearch(false);

    }
  };

  const toggleMessages = () => {
    if (sentMessages.length > 0) {
      setShowMessages(!showMessages);
      setShowSaved(false);
      setShowNotifications(false);
      setShowLanguages(false);
      setShowSearch(false);

    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowSaved(false);
    setShowMessages(false);
    setShowLanguages(false);
    setShowSearch(false);

  };

  const toggleLanguages = () => {
    setShowLanguages(!showLanguages);
    setShowSaved(false);
    setShowMessages(false);
    setShowNotifications(false);
    setShowSearch(false);

  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    setShowSaved(false);
    setShowMessages(false);
    setShowNotifications(false);
    setShowLanguages(false);
    if (!showSearch) {
      setTimeout(() => document.getElementById('global-search-input')?.focus(), 100);

    }
  };

  const handleProfileClick = () => {
    if (currentUser) {
      const roles = {
        head_admin: '/headadmin',
        admin: '/admin',
        teacher: '/teacher',
        student: '/student',
        seller: '/seller'
      };
      navigate(roles[currentUser.role] || '/');
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      <header
        className={getHeaderClass()}
        ref={headerRef}
        style={{ height: `${headerHeight}px` }}
      >
        {/* Collapse Button Removed per request */}

        <div className="layout-container">
          <div className="layout-content-container">
            <nav className="nav-desktop">
              <div className="logo-section" onClick={(e) => { if (demoMode) e.preventDefault(); else navigate('/'); }} style={{ cursor: demoMode ? 'default' : 'pointer' }}>
                <h2 className="logo-text">Examify Prep</h2>
              </div>
              <div className="nav-links">
                {navLinks.map((link, index) => (
                  <div
                    key={index}
                    className={`nav-item ${link.children ? 'has-dropdown' : ''} ${isMobile ? 'hidden-desktop-nav' : ''}`} // Hide in CSS if needed, or filter here
                    style={{ display: isMobile ? 'none' : 'flex' }}
                    onMouseEnter={() => !isMobile && link.children && setActiveDropdown(index)}
                    onMouseLeave={() => !isMobile && link.children && setActiveDropdown(null)}
                  >
                    <a
                      className={`nav-link ${link.children ? 'dropdown-trigger' : ''}`}
                      onClick={(e) => {
                        if (link.children) e.preventDefault();
                        else if (demoMode) e.preventDefault();
                        else handleLinkClick(link);
                      }}
                      style={{ cursor: demoMode ? 'default' : 'pointer' }}
                    >
                      {link.label}
                      {link.children && <span className="material-symbols-outlined dropdown-icon">expand_more</span>}
                    </a>

                    {/* Dropdown Menu */}
                    {link.children && (
                      <div className={`nav-dropdown-menu ${activeDropdown === index ? 'visible' : ''}`}>
                        {link.children.map((child, childIndex) => (
                          <div
                            key={childIndex}
                            className="dropdown-item"
                            onClick={() => {
                              handleLinkClick(child);
                              setActiveDropdown(null);
                            }}
                          >
                            {child.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="nav-buttons">
                {isDashboard ? (
                  <>
                    {currentUser?.role === 'student' && sessionStarted && (
                      <div className="test-timer-header animate__animated animate__fadeInRight" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#4f46e5',
                        color: '#fff',
                        padding: '6px 16px',
                        borderRadius: '12px',
                        marginRight: '16px',
                        fontWeight: '900',
                        fontSize: '1rem',
                        border: '2px solid #000',
                        boxShadow: '4px 4px 0px #000',
                        cursor: 'default'
                      }}>
                        <span className="material-symbols-outlined" style={{ animation: 'pulse 1s infinite' }}>timer</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '1px' }}>
                          {formatTime ? formatTime(timeRemaining) : '00:00'}
                        </span>
                      </div>
                    )}
                    <button className="btn-secondary" onClick={logout} style={{ background: '#ff4757', color: 'white' }}>{t('nav.logout')}</button>

                    {/* Seller, HeadAdmin & Student Icons */}
                    {isSellerOrHeadAdmin && !isMobile && (
                      <>
                        <div
                          className={`storage-icon-container message-icon ${sentMessages.length > 0 ? 'is-visible' : ''} ${showMessages ? 'active' : ''}`}
                          onClick={toggleMessages}
                          id="header-message-icon"
                          title={t('nav.sentMessages')}
                        >
                          <span className="material-symbols-outlined">forum</span>
                          <span className="item-count msg-count">{sentMessages.length}</span>
                        </div>
                        <div
                          className={`storage-icon-container has-items ${savedItems.length > 0 ? 'is-visible' : ''} ${showSaved ? 'active' : ''}`}
                          onClick={toggleSaved}
                          id="header-storage-bin"
                          title={t('nav.savedData')}
                        >
                          <span className="material-symbols-outlined">notes</span>
                          <span className="item-count">{savedItems.length}</span>
                        </div>
                        <div
                          className={`storage-icon-container search-icon ${showSearch ? 'active' : ''}`}
                          onClick={toggleSearch}
                          id="header-search-icon"
                          title="Qidirish"
                          style={{ width: '44px', opacity: 1, transform: 'scale(1)', overflow: 'visible' }}
                        >
                          <span className="material-symbols-outlined">search</span>
                        </div>
                      </>
                    )}

                    {currentUser?.role === 'student' && (
                      <div
                        className="storage-icon-container is-visible"
                        onClick={() => navigate('/student/profile')}
                        title={t('nav.profile')}
                        style={{ marginLeft: '8px', cursor: 'pointer' }}
                      >
                        <span className="material-symbols-outlined">person</span>
                      </div>
                    )}

                    {/* Dashboard Notification Icon */}
                    <div
                      className={`storage-icon-container message-icon is-visible ${showNotifications ? 'active' : ''}`}
                      onClick={toggleNotifications}
                      style={{ width: '44px', opacity: 1, transform: 'scale(1)', overflow: 'visible', marginLeft: '8px' }}
                    >
                      <span className="material-symbols-outlined">notifications</span>
                      <span className="item-count msg-count">0</span>
                    </div>
                  </>
                ) : (
                  <>
                    {(isAuthenticated || demoMode) ? (
                      !isMobile ? (
                        <button className="btn-secondary" onClick={(e) => { if (demoMode) e.preventDefault(); else handleProfileClick(); }} style={{ cursor: demoMode ? 'default' : 'pointer' }}>{t('nav.profile')}</button>
                      ) : (
                        <div
                          className="storage-icon-container is-visible"
                          onClick={(e) => { if (demoMode) e.preventDefault(); else handleProfileClick(); }}
                          id="header-profile-icon"
                          title={t('nav.profile')}
                          style={{ cursor: demoMode ? 'default' : 'pointer', marginLeft: '0.4rem' }}
                        >
                          <span className="material-symbols-outlined">person</span>
                        </div>
                      )
                    ) : (
                      !isMobile ? (
                        <button className="btn-secondary" onClick={() => !demoMode && navigate('/login')} style={{ cursor: demoMode ? 'default' : 'pointer' }}>{t('nav.login')}</button>
                      ) : (
                        <div
                          className="storage-icon-container is-visible"
                          onClick={() => !demoMode && navigate('/login')}
                          title={t('nav.login')}
                          style={{ cursor: demoMode ? 'default' : 'pointer', marginLeft: '0.4rem' }}
                        >
                          <span className="material-symbols-outlined">login</span>
                        </div>
                      )
                    )}



                    {/* Content Search Icon */}
                    {settings.header.search && (
                      <div
                        className={`storage-icon-container search-icon ${showSearch ? 'active' : ''}`}
                        onClick={toggleSearch}
                        id="header-search-icon"
                        title="Qidirish"
                        style={{ width: '44px', opacity: 1, transform: 'scale(1)', overflow: 'visible', marginRight: 0 }}
                      >
                        <span className="material-symbols-outlined">search</span>
                      </div>
                    )}

                    {/* Language Switcher */}
                    {settings.header.language && (
                      <div
                        className={`storage-icon-container lang-icon ${showLanguages ? 'active' : ''}`}
                        onClick={toggleLanguages}
                        id="header-lang-icon"
                        title={t('nav.changeLanguage')}
                      >
                        <span className="material-symbols-outlined">language</span>
                        <span className="current-lang-code">{i18n.language ? i18n.language.split('-')[0].toUpperCase() : 'UZ'}</span>
                      </div>
                    )}

                    {/* Messages Icon */}
                    {settings.header.messages && !isMobile && (
                      <div
                        className={`storage-icon-container message-icon ${sentMessages.length > 0 ? 'is-visible' : ''} ${showMessages ? 'active' : ''}`}
                        onClick={toggleMessages}
                        id="header-message-icon"
                        title={t('nav.sentMessages')}
                      >
                        <span className="material-symbols-outlined">forum</span>
                        <span className="item-count msg-count">{sentMessages.length}</span>
                      </div>
                    )}

                    {/* Storage Icon */}
                    {settings.header.storage && !isMobile && (
                      <div
                        className={`storage-icon-container has-items ${savedItems.length > 0 ? 'is-visible' : ''} ${showSaved ? 'active' : ''}`}
                        onClick={toggleSaved}
                        id="header-storage-bin"
                        title={t('nav.savedData')}
                      >
                        <span className="material-symbols-outlined">notes</span>
                        <span className="item-count">{savedItems.length}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Mobile Menu Button - Shown only on Mobile */}
                {isMobile && (
                  <div
                    className="nav-item has-dropdown mobile-menu-container"
                    onClick={() => setActiveDropdown(activeDropdown === 'mobile-menu' ? null : 'mobile-menu')}
                    style={{ marginLeft: '0.4rem' }}
                  >
                    <div className="storage-icon-container is-visible" style={{ width: '36px', height: '36px', margin: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>menu</span>
                    </div>

                    <div
                      className={`nav-dropdown-menu ${activeDropdown === 'mobile-menu' ? 'visible' : ''}`}
                      style={{
                        minWidth: '200px',
                        right: '0',
                        left: 'auto',
                        transform: 'translateY(10px)',
                        padding: '8px'
                      }}
                    >
                      {navLinks.map((link, index) => (
                        <div key={index}>
                          <div
                            className="dropdown-item"
                            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                            onClick={(e) => {
                              if (link.children) {
                                e.stopPropagation();
                                return;
                              }
                              if (!demoMode) handleLinkClick(link);
                              setActiveDropdown(null);
                            }}
                          >
                            {link.label}
                          </div>
                          {link.children && link.children.map((child, cIdx) => (
                            <div
                              key={`c-${cIdx}`}
                              className="dropdown-item"
                              style={{ padding: '6px 12px 6px 24px', opacity: 0.7, fontSize: '0.75rem' }}
                              onClick={() => {
                                handleLinkClick(child);
                                setActiveDropdown(null);
                              }}
                            >
                              {child.label}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>


          </div>
        </div>

        {/* Integrated Storage Area (Dashboard Notifications) */}
        <div className={`header-storage-area ${showNotifications && isDashboard ? 'visible' : ''}`}>
          <div className="storage-content-wrapper">
            <div className="storage-header">
              <h3>{t('nav.notifications')}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>

                <button className="clear-minimal-btn" onClick={() => setShowNotifications(false)}>{t('nav.close')}</button>
              </div>
            </div>
            <div className="saved-items-grid" data-lenis-prevent>
              <div className="saved-item-row">
                <div className="item-main">
                  <span className="material-symbols-outlined">info</span>
                  <div className="item-text">
                    <h4>{t('nav.systemMessages')}</h4>
                    <p>{t('nav.noNewMessages')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integrated Storage Area (Normal Mode) */}
        <div className={`header-storage-area ${showSaved && savedItems.length > 0 && (!isDashboard || isSellerOrHeadAdmin) ? 'visible' : ''}`}>
          <div className="storage-content-wrapper">
            <div className="storage-header">
              <h3>{t('nav.savedData')}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.5rem', cursor: 'pointer' }}
                  onClick={() => {
                    toggleSidebar(true);
                    handleCollapse(new Event('click'));
                  }}
                >view_sidebar</span>

                <button className="clear-minimal-btn" onClick={() => {
                  clearItems();
                  setShowSaved(false);

                }}>{t('nav.clearAll')}</button>
              </div>
            </div>

            <div className="saved-items-grid" data-lenis-prevent>
              {savedItems.map(item => (
                <div key={item.id} className="saved-item-row">
                  <div className="item-main">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <div className="item-text">
                      <h4>{item.title}</h4>
                      <p>{item.description || 'System data'}</p>
                    </div>
                  </div>
                  <button className="item-remove-btn" onClick={() => removeItem(item.id)}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Integrated Messages Area (Normal Mode) */}
        <div className={`header-storage-area header-messages-area ${showMessages && sentMessages.length > 0 && (!isDashboard || isSellerOrHeadAdmin) ? 'visible' : ''}`}>
          <div className="storage-content-wrapper">
            <div className="storage-header">
              <h3>{t('nav.sentMessages')}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>

                <button className="clear-minimal-btn" onClick={() => {
                  clearMessages();
                  setShowMessages(false);

                }}>{t('nav.clear')}</button>
              </div>
            </div>

            <div className="saved-items-grid" data-lenis-prevent>
              {sentMessages.map(msg => (
                <div key={msg.id} className="saved-item-row msg-row">
                  <div className="item-main">
                    <span className="material-symbols-outlined">mail</span>
                    <div className="item-text">
                      <h4>{msg.subject || t('nav.noSubject')}</h4>
                      <p className="msg-preview">{msg.message}</p>
                      <span className="msg-date">{new Date(msg.date).toLocaleDateString('uz-UZ')}</span>
                    </div>
                  </div>
                  <button className="item-remove-btn" onClick={() => removeMessage(msg.id)}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Language Selection Area */}
        <div className={`header-storage-area header-lang-area ${showLanguages && !isDashboard ? 'visible' : ''}`}>
          <div className="storage-content-wrapper" style={{ justifyContent: 'center' }}>
            <div className="lang-options">
              <button
                className={`lang-option ${i18n.language?.startsWith('uz') ? 'active' : ''}`}
                onClick={() => {
                  i18n.changeLanguage('uz');
                }}
              >
                <span>🇺🇿</span> O'zbekcha
              </button>
              <button
                className={`lang-option ${i18n.language?.startsWith('ru') ? 'active' : ''}`}
                onClick={() => {
                  i18n.changeLanguage('ru');
                }}
              >
                <span>🇷🇺</span> Русский
              </button>
              <button
                className={`lang-option ${i18n.language?.startsWith('en') ? 'active' : ''}`}
                onClick={() => {
                  i18n.changeLanguage('en');
                }}
              >
                <span>🇺🇸</span> English
              </button>
            </div>
          </div>
        </div>

        {/* Integrated Search Area */}
        <div className={`header-storage-area header-search-area ${showSearch && (!isDashboard || isSellerOrHeadAdmin) ? 'visible' : ''}`}>
          <div className="storage-content-wrapper">
            <div className="search-input-container">
              <span className="material-symbols-outlined search-input-icon">search</span>
              <input
                id="global-search-input"
                type="text"
                className="global-search-input"
                placeholder={t('nav.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>

            <div className="saved-items-grid search-results-grid" data-lenis-prevent>
              {searchQuery.trim() === '' ? (
                <div className="no-results" style={{ padding: '2rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>manage_search</span>
                  <p>{t('nav.search.typeToSearch')}</p>
                </div>
              ) : filteredSearchResults.length > 0 ? (
                filteredSearchResults.map((result, index) => (
                  <div
                    key={result.id} // Use stable ID for better animation
                    className="saved-item-row search-result-row"
                    style={{ animationDelay: `${index * 0.05}s` }} // Inline delay for dynamic list
                    onClick={() => {
                      navigate(result.path);
                      setShowSearch(false);
                    }}
                  >
                    <div className="item-main">
                      <span className="material-symbols-outlined">{result.icon}</span>
                      <div className="item-text">
                        <h4>
                          <HighlightedText text={result.title} highlight={searchQuery} />
                          <span className="search-category-tag">{result.category}</span>
                        </h4>
                        <p>
                          <HighlightedText text={result.description} highlight={searchQuery} />
                        </p>
                        {/* Show content snippet if query matches content */}
                        {renderSearchSnippet(result.content, searchQuery)}
                      </div>
                    </div>
                    <span className="material-symbols-outlined arrow-icon">arrow_forward</span>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>{t('nav.search.noResults')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notification Area(s) */}
        <div className="notifications-stack">
          {activeNotifications.map(notification => (
            <div key={notification.id} className={`header-notification-area ${notification.isVisible ? 'visible' : ''} ${notification.isError ? 'is-error' : ''}`}>
              <div className="notification-content">
                <span className="material-symbols-outlined">{notification.icon}</span>
                {notification.isError || notification.isFullMessage ? (
                  <span className="save-title">{notification.message || notification.title}</span>
                ) : (
                  <>
                    <span className="save-title">{notification.title}</span>
                    <span className="save-text"> {t('nav.saved')}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>



      </header>
    </>
  );
};

export default Header;