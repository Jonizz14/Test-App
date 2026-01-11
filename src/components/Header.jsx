import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Header.css';
import { useSavedItems } from '../context/SavedItemsContext';
import { useSentMessages } from '../context/SentMessagesContext';
import { useAuth } from '../context/AuthContext';

const Header = ({ demoMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = React.useRef(null);
  const { savedItems, removeItem, clearItems } = useSavedItems();
  const { sentMessages, removeMessage, clearMessages } = useSentMessages();
  const { currentUser, isAuthenticated, logout } = useAuth();
  
  const [showSaved, setShowSaved] = React.useState(false);
  const [showMessages, setShowMessages] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  
  const [notification, setNotification] = React.useState(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(true);
  
  // Dashboard state
  const isDashboard = ['/admin', '/headadmin', '/teacher', '/student', '/seller'].some(path => 
    location.pathname.startsWith(path)
  );
  const [isDashboardExpanded, setIsDashboardExpanded] = React.useState(false);

  // Listen for custom 'itemSaved' event
  React.useEffect(() => {
    const handleItemSaved = (e) => {
      setNotification(e.detail);
      setTimeout(() => setIsVisible(true), 10);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setNotification(null), 700);
      }, 3000);
    };

    const handleSaveError = (e) => {
      setNotification({ ...e.detail, isError: true });
      setTimeout(() => setIsVisible(true), 10);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setNotification(null), 700);
      }, 3000);
    };

    window.addEventListener('itemSaved', handleItemSaved);
    window.addEventListener('saveError', handleSaveError);
    return () => {
      window.removeEventListener('itemSaved', handleItemSaved);
      window.removeEventListener('saveError', handleSaveError);
    };
  }, []);

  // Close dropdowns on click outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowSaved(false);
        setShowMessages(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Entering animation timing
  React.useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => setIsEntering(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isEntering]);

  // Auto-close empty lists
  React.useEffect(() => {
    if (savedItems.length === 0) setShowSaved(false);
  }, [savedItems.length]);

  React.useEffect(() => {
    if (sentMessages.length === 0) setShowMessages(false);
  }, [sentMessages.length]);

  // Dynamic links based on route
  const getNavLinks = () => {
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/headadmin')) {
      const dashboardPath = currentUser?.role === 'head_admin' ? '/headadmin' : '/admin';
      return [
        { label: 'Boshqaruv', path: dashboardPath },
        { label: "O'qituvchilar", path: '/admin/teachers' },
        { label: "O'quvchilar", path: '/admin/students' },
        { 
          label: 'Statistika', 
          children: [
            { label: 'Jami', path: '/admin/statistics' },
            { label: 'Sinflar', path: '/admin/classes' },
            { label: "O'quvchilar", path: '/admin/students-page' },
            { label: 'Testlar', path: '/admin/tests-page' }
          ]
        },
        { 
          label: 'Reytinglar', 
          children: [
            { label: 'Sinflar', path: '/admin/class-stats' },
            { label: "O'quvchilar", path: '/admin/student-ratings' },
            { label: 'Testlar', path: '/admin/test-stats' }
          ]
        }
      ];
    }
    if (location.pathname.startsWith('/teacher')) {
      return [
        { label: 'Kabinet', path: '/teacher' },
        { label: 'Sinflar', path: '/teacher/classes' },
        { label: 'Testlar', path: '/teacher/tests' }
      ];
    }
    if (location.pathname.startsWith('/student')) {
      return [
        { label: 'Kabinet', path: '/student' },
        { label: 'Testlar', path: '/student/tests' },
        { label: 'Natijalar', path: '/student/results' }
      ];
    }
    // Default Home Links
    return [
      { label: 'Bosh sahifa', path: '/', isAction: true },
      { label: 'Maktabimiz sayti', href: 'https://sergelitim.uz', isExternal: true },
      { label: "Bog'lanish", path: '/contact', isAction: true }
    ];
  };

  const navLinks = getNavLinks();

  const handleLinkClick = (link) => {
    if (link.isExternal) {
      if (!demoMode) window.open(link.href, '_blank', 'noopener,noreferrer');
    } else if (link.path) {
      if (!demoMode) navigate(link.path);
    }
  };

  const [activeDropdown, setActiveDropdown] = React.useState(null);

  const getHeaderClass = () => {
    let classes = ['header'];
    if (isEntering) classes.push('entering');
    if (notification && isVisible) classes.push('expanding-down');
    if (showSaved && savedItems.length > 0) classes.push('storage-expanded');
    if (showMessages && sentMessages.length > 0) classes.push('messages-expanded');
    if (showNotifications) classes.push('messages-expanded'); // Reuse expanded style
    
    // Only apply dashboard-mode (collapsed) if it IS a dashboard AND NOT expanded
    if (isDashboard && !isDashboardExpanded) {
      classes.push('dashboard-mode');
    }
    return classes.join(' ');
  };

  const handleHeaderClick = (e) => {
    if (isDashboard && !isDashboardExpanded) {
      setIsDashboardExpanded(true);
    }
  };

  const handleCollapse = (e) => {
    e.stopPropagation();
    setIsDashboardExpanded(false);
    setShowSaved(false);
    setShowMessages(false);
    setShowNotifications(false);
  };

  const toggleSaved = () => {
    if (savedItems.length > 0) {
      setShowSaved(!showSaved);
      setShowMessages(false);
      setShowNotifications(false);
    }
  };

  const toggleMessages = () => {
    if (sentMessages.length > 0) {
      setShowMessages(!showMessages);
      setShowSaved(false);
      setShowNotifications(false);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowSaved(false);
    setShowMessages(false);
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
      {/* Dashboard Handle (Trigger) */}
      {isDashboard && !isDashboardExpanded && (
        <div className="dashboard-handle" onClick={handleHeaderClick}>
          <div className="handle-bar"></div>
        </div>
      )}

      <header className={getHeaderClass()} ref={headerRef}>
        {/* Collapse Button for Dashboard Mode */}
        {isDashboard && isDashboardExpanded && (
          <div className="collapse-arrow-btn" onClick={handleCollapse} title="Yopish">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>keyboard_arrow_up</span>
          </div>
        )}

        <div className="layout-container">
          <div className="layout-content-container">
            <div className="logo-section" onClick={(e) => { if (demoMode) e.preventDefault(); else navigate('/'); }} style={{ cursor: demoMode ? 'default' : 'pointer' }}>
              <h2 className="logo-text">Examify Prep</h2>
            </div>
            
            <nav className="nav-desktop">
              <div className="nav-links">
                {navLinks.map((link, index) => (
                  <div 
                    key={index} 
                    className={`nav-item ${link.children ? 'has-dropdown' : ''}`}
                    onMouseEnter={() => link.children && setActiveDropdown(index)}
                    onMouseLeave={() => link.children && setActiveDropdown(null)}
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
                              if (!demoMode) navigate(child.path);
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
                    <button className="btn-secondary" onClick={logout} style={{ background: '#ff4757', color: 'white' }}>Chiqish</button>
                    
                    {/* Dashboard Notification Icon */}
                    <div 
                      className={`storage-icon-container message-icon ${showNotifications ? 'active' : ''}`}
                      onClick={toggleNotifications}
                      style={{ width: '44px', opacity: 1, transform: 'scale(1)', overflow: 'visible' }}
                    >
                      <span className="material-symbols-outlined">notifications</span>
                      <span className="item-count msg-count">0</span>
                    </div>
                  </>
                ) : (
                  <>
                    {(isAuthenticated || demoMode) ? (
                      <button className="btn-secondary" onClick={(e) => { if (demoMode) e.preventDefault(); else handleProfileClick(); }} style={{ cursor: demoMode ? 'default' : 'pointer' }}>Profil</button>
                    ) : (
                      <button className="btn-secondary" onClick={() => !demoMode && navigate('/login')} style={{ cursor: demoMode ? 'default' : 'pointer' }}>Kirish</button>
                    )}
      
                    {/* Messages Icon */}
                    <div 
                      className={`storage-icon-container message-icon ${sentMessages.length > 0 ? 'is-visible' : ''} ${showMessages ? 'active' : ''}`}
                      onClick={toggleMessages}
                      id="header-message-icon"
                      title="Yuborilgan xabarlar"
                    >
                      <span className="material-symbols-outlined">forum</span>
                      <span className="item-count msg-count">{sentMessages.length}</span>
                    </div>
      
                    {/* Storage Icon */}
                    <div 
                      className={`storage-icon-container has-items ${savedItems.length > 0 ? 'is-visible' : ''} ${showSaved ? 'active' : ''}`}
                      onClick={toggleSaved}
                      id="header-storage-bin"
                      title="Saqlanganlar"
                    >
                      <span className="material-symbols-outlined">inventory_2</span>
                      <span className="item-count">{savedItems.length}</span>
                    </div>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>

        {/* Integrated Storage Area (Dashboard Notifications) */}
        <div className={`header-storage-area ${showNotifications && isDashboard ? 'visible' : ''}`}>
          <div className="storage-content-wrapper">
            <div className="storage-header">
              <h3>Bildirishnomalar</h3>
              <button className="clear-minimal-btn" onClick={() => setShowNotifications(false)}>Yopish</button>
            </div>
            <div className="saved-items-grid">
               <div className="saved-item-row">
                  <div className="item-main">
                    <span className="material-symbols-outlined">info</span>
                    <div className="item-text">
                      <h4>Tizim xabarlari</h4>
                      <p>Hozircha yangi xabarlar yo'q</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Integrated Storage Area (Normal Mode) */}
        <div className={`header-storage-area ${showSaved && savedItems.length > 0 && !isDashboard ? 'visible' : ''}`}>
          <div className="storage-content-wrapper">
            <div className="storage-header">
              <h3>Saqlangan Ma'lumotlar</h3>
              <button className="clear-minimal-btn" onClick={() => {
                clearItems();
                setShowSaved(false);
              }}>Barchasini o'chirish</button>
            </div>
            
            <div className="saved-items-grid">
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
        <div className={`header-storage-area header-messages-area ${showMessages && sentMessages.length > 0 && !isDashboard ? 'visible' : ''}`}>
          <div className="storage-content-wrapper">
            <div className="storage-header">
              <h3>Yuborilgan Xabarlar</h3>
              <button className="clear-minimal-btn" onClick={() => {
                clearMessages();
                setShowMessages(false);
              }}>Tozalash</button>
            </div>
            
            <div className="saved-items-grid">
              {sentMessages.map(msg => (
                <div key={msg.id} className="saved-item-row msg-row">
                  <div className="item-main">
                    <span className="material-symbols-outlined">mail</span>
                    <div className="item-text">
                      <h4>{msg.subject || 'Mavzusiz xabar'}</h4>
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

        {/* Notification Area */}
        {notification && (
          <div className={`header-notification-area ${isVisible ? 'visible' : ''} ${notification.isError ? 'is-error' : ''}`}>
            <div className="notification-content">
              <span className="material-symbols-outlined">{notification.icon}</span>
              {notification.isError || notification.isFullMessage ? (
                <span className="save-title">{notification.message || notification.title}</span>
              ) : (
                <>
                  <span className="save-title">{notification.title}</span>
                  <span className="save-text"> saqlandi</span>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;