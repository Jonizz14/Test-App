import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSavedItems } from '../context/SavedItemsContext';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';

const TextSelectionHandler = () => {
  const { settings } = useSettings();
  const [position, setPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showButton, setShowButton] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [saveTitle, setSaveTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('format_quote');

  const location = useLocation();
  const { saveItem, savedItems } = useSavedItems();
  const { t } = useTranslation();
  const buttonRef = useRef(null);
  const modalRef = useRef(null);

  const icons = [
    { name: 'format_quote', label: 'Quote' },
    { name: 'school', label: 'Student' },
    { name: 'cast_for_education', label: 'Teacher' },
    { name: 'admin_panel_settings', label: 'Admin' },
    { name: 'description', label: 'Note' },
    { name: 'star', label: 'Important' },
    { name: 'lightbulb', label: 'Idea' },
    { name: 'bookmark', label: 'Saved' }
  ];

  // Disable on dashboard pages
  const isDashboard = ['/admin', '/headadmin', '/teacher', '/student', '/seller'].some(path =>
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    if (isDashboard || !settings?.features?.textSelection) return;

    const handleSelection = (e) => {
      // Don't trigger if clicking inside existing elements
      if (buttonRef.current?.contains(e.target) || modalRef.current?.contains(e.target)) return;

      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text && text.length > 0 && !showSaveModal) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setPosition({
          x: rect.left,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height
        });
        setSelectedText(text);
        setShowButton(true);
      } else if (!showSaveModal) {
        setShowButton(false);
      }
    };

    const handleMouseDown = (e) => {
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      if (modalRef.current && modalRef.current.contains(e.target)) return;

      if (!showSaveModal) {
        setShowButton(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isDashboard, showSaveModal, settings?.features?.textSelection]);

  const handleInitialClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowButton(false);
    setShowSaveModal(true);
    setSaveTitle('Title oylab toping...');
  };

  const handleFinalSave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedText) return;

    // Check if already saved
    if (savedItems.find(item => item.content === selectedText)) {
      window.dispatchEvent(new CustomEvent('saveError', {
        detail: { message: t('home.alreadySaved'), icon: 'warning' }
      }));
      setShowSaveModal(false);
      return;
    }

    const itemToSave = {
      id: Date.now(),
      type: 'text',
      title: saveTitle || 'Mavzusiz',
      description: selectedText.substring(0, 100) + (selectedText.length > 100 ? '...' : ''),
      content: selectedText,
      icon: selectedIcon
    };

    // Flyer animation logic
    if (settings?.features?.flyerAnimation) {
      const rect = modalRef.current.getBoundingClientRect();
      const flyer = document.createElement('div');
      flyer.className = 'flyer-icon';
      flyer.innerHTML = `<span class="material-symbols-outlined">${selectedIcon}</span>`;
      flyer.style.left = `${rect.left + rect.width / 2 - 25}px`;
      flyer.style.top = `${rect.top + rect.height / 2 - 25}px`;
      document.body.appendChild(flyer);

      setTimeout(() => {
        const target = document.getElementById('header-storage-bin');
        const targetRect = target?.getBoundingClientRect();

        if (targetRect) {
          flyer.style.left = `${targetRect.left + (targetRect.width / 2) - 25}px`;
          flyer.style.top = `${targetRect.top + (targetRect.height / 2) - 25}px`;
          flyer.style.transform = 'scale(0.5) rotate(360deg)';
          flyer.style.opacity = '0.5';
        }
      }, 50);

      setTimeout(() => {
        flyer.style.opacity = '0';
        flyer.style.transform = 'scale(0) rotate(720deg)';
        flyer.style.filter = 'blur(10px) brightness(1.5)';
      }, 700);

      setTimeout(() => {
        if (document.body.contains(flyer)) {
          document.body.removeChild(flyer);
        }
        window.dispatchEvent(new CustomEvent('itemSaved', {
          detail: { title: saveTitle || t('nav.saved'), icon: selectedIcon }
        }));
      }, 1200);
    } else {
      window.dispatchEvent(new CustomEvent('itemSaved', {
        detail: { title: saveTitle || t('nav.saved'), icon: selectedIcon }
      }));
    }

    saveItem(itemToSave);
    setShowSaveModal(false);
    window.getSelection().removeAllRanges();
  };

  if (isDashboard) return null;

  return (
    <>
      {(showButton || showSaveModal) && (
        <div
          ref={buttonRef}
          className={`selection-frame ${showSaveModal ? 'expanded' : ''}`}
          style={{
            position: 'absolute',
            left: `${position.x - 8}px`,
            top: `${position.y - 8}px`,
            width: showSaveModal ? '320px' : `${position.width + 16}px`,
            height: showSaveModal ? 'auto' : `${position.height + 16}px`,
            zIndex: 10000,
            animation: showButton && !showSaveModal ? 'frameIn 0.4s cubic-bezier(0.19, 1, 0.22, 1)' : 'none',
            transformOrigin: 'center center'
          }}
        >
          {!showSaveModal ? (
            <div className="frame-content">
              <div className="frame-overlay"></div>
              <button
                onClick={handleInitialClick}
                className="frame-save-badge"
              >
                <span className="material-symbols-outlined">add_circle</span>
                {t('home.save')}
              </button>
            </div>
          ) : (
            <div
              ref={modalRef}
              className="selection-save-inline"
              onClick={e => e.stopPropagation()}
            >
              <div className="inline-header">
                <h3>Saqlash</h3>
                <button className="close-mini-btn" onClick={() => { setShowSaveModal(false); setShowButton(false); }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="inline-body">
                <input
                  type="text"
                  className="inline-title-input"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Mavzu..."
                  autoFocus
                  onFocus={(e) => e.target.select()}
                />

                <div className="icon-selector-grid">
                  {icons.map(icon => (
                    <button
                      key={icon.name}
                      className={`icon-option-btn ${selectedIcon === icon.name ? 'active' : ''}`}
                      onClick={() => setSelectedIcon(icon.name)}
                      title={icon.label}
                    >
                      <span className="material-symbols-outlined">{icon.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="inline-footer">
                <button className="confirm-save-btn" onClick={handleFinalSave}>
                  <span className="material-symbols-outlined">save</span>
                  Saqlash
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .selection-frame {
          transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
          border-radius: 0;
          pointer-events: none;
        }

        .selection-frame.expanded {
          pointer-events: all;
          background: #fff;
          transform: translateY(-20px);
        }

        .frame-content {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .frame-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 3px solid #000;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(2px);
          box-shadow: 0 0 30px rgba(0,0,0,0.15);
          border-radius: 0;
          animation: pulseBorder 2s infinite ease-in-out;
        }

        .frame-save-badge {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          background: #000;
          color: #fff;
          border: 3px solid #fff;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 950;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          pointer-events: all;
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .frame-save-badge:hover {
          transform: translateX(-50%) translateY(-2px) scale(1.05);
          background: #222;
        }

        .selection-save-inline {
          background: #fff;
          border: 3px solid #000;
          padding: 1.5rem;
          box-shadow: 15px 15px 0px #000;
          color: #000;
          border-radius: 0;
        }

        .inline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.2rem;
          border-bottom: 3px solid #000;
          padding-bottom: 0.6rem;
        }

        .inline-header h3 {
          margin: 0;
          text-transform: uppercase;
          font-weight: 950;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
        }

        .close-mini-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #000;
          padding: 0;
          display: flex;
        }

        .inline-title-input {
          width: 100%;
          border: 3px solid #000;
          padding: 0.8rem;
          border-radius: 12px;
          font-family: inherit;
          font-weight: 700;
          font-size: 0.95rem;
          outline: none;
          margin-bottom: 1.2rem;
        }

        .icon-selector-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.6rem;
          margin-bottom: 1.5rem;
        }

        .icon-option-btn {
          height: 42px;
          border: 3px solid #000;
          background: #fff;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .icon-option-btn:hover {
          background: #f5f5f5;
          transform: translateY(-2px);
        }

        .icon-option-btn.active {
          background: #000;
          color: #fff;
          transform: translate(-3px, -3px);
          box-shadow: 4px 4px 0 #3b82f6;
        }

        .confirm-save-btn {
          width: 100%;
          background: #000;
          color: #fff;
          border: none;
          padding: 1rem;
          border-radius: 15px;
          font-weight: 950;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .confirm-save-btn:hover {
          transform: translate(-4px, -4px);
          box-shadow: 6px 6px 0 rgba(0,0,0,0.1);
        }

        @keyframes frameIn {
          0% { 
            opacity: 0; 
            transform: scale(0.5); 
            filter: blur(10px);
          }
          100% { 
            opacity: 1; 
            transform: scale(1);
            filter: blur(0);
          }
        }

        @keyframes pulseBorder {
          0% { border-color: rgba(0,0,0,0.4); box-shadow: 0 0 0px rgba(0,0,0,0); }
          50% { border-color: rgba(0,0,0,1); box-shadow: 0 0 15px rgba(0,0,0,0.15); }
          100% { border-color: rgba(0,0,0,0.4); box-shadow: 0 0 0px rgba(0,0,0,0); }
        }
      `}} />
    </>
  );
};

export default TextSelectionHandler;
