import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSavedItems } from '../context/SavedItemsContext';
import { useTranslation } from 'react-i18next';

const TextSelectionHandler = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showButton, setShowButton] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const location = useLocation();
  const { saveItem, savedItems } = useSavedItems();
  const { t } = useTranslation();
  const buttonRef = useRef(null);

  // Disable on dashboard pages
  const isDashboard = ['/admin', '/headadmin', '/teacher', '/student', '/seller'].some(path =>
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    if (isDashboard) return;

    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text && text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position button above the selection
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY - 40
        });
        setSelectedText(text);
        setShowButton(true);
      } else {
        // Delay hiding to allow clicking the button
        setTimeout(() => {
           if (!buttonRef.current?.contains(document.activeElement)) {
             setShowButton(false);
           }
        }, 100);
      }
    };

    const handleMouseDown = (e) => {
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      setShowButton(false);
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isDashboard]);

  const handleSaveText = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedText) return;

    // Check if already saved
    if (savedItems.find(item => item.content === selectedText)) {
      window.dispatchEvent(new CustomEvent('saveError', { 
        detail: { message: t('home.alreadySaved'), icon: 'warning' } 
      }));
      setShowButton(false);
      return;
    }

    const itemToSave = {
      id: Date.now(),
      type: 'text',
      title: t('nav.saved'), // Or something more descriptive
      description: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''),
      content: selectedText,
      icon: 'format_quote'
    };

    // Flyer animation logic
    const rect = buttonRef.current.getBoundingClientRect();
    const flyer = document.createElement('div');
    flyer.className = 'flyer-icon';
    flyer.innerHTML = `<span class="material-symbols-outlined">format_quote</span>`;
    flyer.style.left = `${rect.left + rect.width / 2 - 25}px`;
    flyer.style.top = `${rect.top + rect.height / 2 - 25}px`;
    document.body.appendChild(flyer);

    // Save item
    saveItem(itemToSave);

    // Animate to bin
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

    // Cleanup
    setTimeout(() => {
      flyer.style.opacity = '0';
      flyer.style.transform = 'scale(0) rotate(720deg)';
      flyer.style.filter = 'blur(10px)';
    }, 700);

    setTimeout(() => {
      if (document.body.contains(flyer)) {
        document.body.removeChild(flyer);
      }
      window.dispatchEvent(new CustomEvent('itemSaved', { 
        detail: { title: t('nav.saved'), icon: 'format_quote' } 
      }));
    }, 1200);

    setShowButton(false);
    window.getSelection().removeAllRanges();
  };

  if (!showButton || isDashboard) return null;

  return (
    <div 
      ref={buttonRef}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)',
        zIndex: 1000,
        animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <button
        onClick={handleSaveText}
        style={{
          background: '#000',
          color: '#fff',
          border: '2px solid #fff',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: '800',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span>
        {t('home.save')}
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes popIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.8); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
};

export default TextSelectionHandler;
