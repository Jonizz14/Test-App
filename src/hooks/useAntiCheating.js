import { useState, useEffect, useCallback } from 'react';
import apiService from '../data/apiService';
import { useAuth } from '../context/AuthContext';

// Note: Browser extensions cannot be blocked from web pages as they run in privileged contexts.
// OS-level screenshot shortcuts (Cmd+Shift+4, Cmd+Shift+5) cannot be prevented from web pages.
// This hook focuses on detectable user actions and keyboard shortcuts that can be intercepted.
const useAntiCheating = (isActive = true, sessionId = null, initialWarningCount = 0, initialUnbanPromptShown = false) => {
  const { banCurrentUser, logout } = useAuth();
  const [warningMessage, setWarningMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [warningCount, setWarningCount] = useState(initialWarningCount);
  const [showUnbanPrompt, setShowUnbanPrompt] = useState(initialUnbanPromptShown);

  // Sync state with initial values when they change (e.g., after session recovery)
  useEffect(() => {
    setWarningCount(initialWarningCount);
  }, [initialWarningCount]);

  useEffect(() => {
    setShowUnbanPrompt(initialUnbanPromptShown);
  }, [initialUnbanPromptShown]);
  const [unbanCode, setUnbanCode] = useState('');
  const [unbanError, setUnbanError] = useState('');
  const [unbanAttempts, setUnbanAttempts] = useState(0);

  const triggerWarning = useCallback(async (message, warningType = 'unknown') => {
    const newCount = warningCount + 1;
    setWarningCount(newCount);

    // Log warning to API if sessionId is provided
    if (sessionId) {
      try {
        await apiService.logWarning({
          session_id: sessionId,
          warning_type: warningType,
          warning_message: message
        });
      } catch (error) {
        console.error('Failed to log warning:', error);
      }
    }

    // Show warning modal for all warnings
    setWarningMessage(message);
    setShowWarning(true);

    // If this is the 3rd warning, ban the user immediately
    if (newCount >= 3) {
      try {
        await banCurrentUser('Test qoidalariga rioya qilmaganligi uchun bloklandi');
        // Log out immediately and redirect to login page
        logout();
        window.location.href = '/login';
      } catch (error) {
        console.error('Failed to ban user:', error);
      }
    }
  }, [warningCount, sessionId, banCurrentUser, logout]);

  const closeWarning = useCallback(() => {
    setShowWarning(false);
    setWarningMessage('');
  }, []);

  const handleUnbanSubmit = useCallback(async (code) => {
    if (!code.trim()) {
      setUnbanError('Iltimos, kodni kiriting');
      return false;
    }

    try {
      // Try to unban with the code
      await apiService.unbanWithCode(code.trim());
      setShowUnbanPrompt(false);
      setUnbanCode('');
      setUnbanError('');
      setWarningCount(0); // Reset warning count
      setUnbanAttempts(0); // Reset attempts
      return true;
    } catch (error) {
      const newAttempts = unbanAttempts + 1;
      setUnbanAttempts(newAttempts);

      if (newAttempts >= 3) {
        // Ban the user after 3 failed attempts and log them out
        try {
          await banCurrentUser('Test qoidalariga rioya qilmaganligi uchun bloklandi');
          setUnbanError("3 marta noto'g'ri kod kiritildi. Profilingiz bloklandi.");
          // Log out and redirect to login page after 2 seconds
          setTimeout(() => {
            logout();
            window.location.href = '/login';
          }, 2000);
        } catch (error) {
          console.error('Failed to ban user:', error);
          setUnbanError("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
        }
        return false;
      } else {
        setUnbanError(`Noto'g'ri kod. ${3 - newAttempts} ta imkoniyat qoldi.`);
        return false;
      }
    }
  }, [unbanAttempts, banCurrentUser, logout]);

  const closeUnbanPrompt = useCallback(() => {
    // If they close without entering code, they get banned
    setShowUnbanPrompt(false);
    // Trigger ban (this will be handled by the backend when 3 warnings are logged)
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerWarning('Diqqat! Siz test oynasidan chiqdingiz. Bu test qoidalariga zid!', 'tab_switch');
      }
    };

    const handleKeyDown = (event) => {
      // F12 key
      if (event.key === 'F12') {
        event.preventDefault();
        triggerWarning('Diqqat! F12 tugmasini bosish taqiqlanadi. Bu test qoidalariga zid!', 'f12_devtools');
        return;
      }

      // PrintScreen key (keyCode 44)
      if (event.key === 'PrintScreen' || event.keyCode === 44) {
        event.preventDefault();
        triggerWarning('Diqqat! Screenshot olish taqiqlanadi. Bu test qoidalariga zid!', 'printscreen');
        return;
      }

      // Alt+Tab combination (Alt key down)
      if (event.altKey && event.key === 'Tab') {
        event.preventDefault();
        triggerWarning('Diqqat! Alt+Tab kombinatsiyasi taqiqlanadi. Bu test qoidalariga zid!', 'alt_tab');
        return;
      }

      // Cmd+Tab on Mac (Meta key is Cmd)
      if (event.metaKey && event.key === 'Tab') {
        event.preventDefault();
        triggerWarning('Diqqat! Cmd+Tab kombinatsiyasi taqiqlanadi. Bu test qoidalariga zid!', 'cmd_tab');
        return;
      }

      // Cmd+Shift+C (Inspect Element)
      if (event.metaKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        triggerWarning('Diqqat! Cmd+Shift+C kombinatsiyasi taqiqlanadi. Bu test qoidalariga zid!', 'inspect_element');
        return;
      }

    };

    const handleContextMenu = (event) => {
      event.preventDefault();
      triggerWarning("Diqqat! Sichqonchaning o'ng tugmasi taqiqlanadi. Bu test qoidalariga zid!", 'right_click');
    };

    const handleCopy = (event) => {
      triggerWarning('Diqqat! Nusxalash taqiqlanadi. Bu test qoidalariga zid!', 'copy');
    };

    const handlePaste = (event) => {
      event.preventDefault();
      triggerWarning('Diqqat! Qo\'yish taqiqlanadi. Bu test qoidalariga zid!', 'paste');
    };

    const handleCut = (event) => {
      event.preventDefault();
      triggerWarning('Diqqat! Kesish taqiqlanadi. Bu test qoidalariga zid!', 'cut');
    };

    const handleResize = () => {
      // Detect potential dev tools opening via window resize
      // This is a basic detection and may have false positives
      triggerWarning('Diqqat! Oyna o\'lchami o\'zgartirildi. Bu test qoidalariga zid!', 'window_resize');
    };


    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, triggerWarning]);

  return {
    showWarning,
    warningMessage,
    closeWarning,
    showUnbanPrompt,
    unbanCode,
    setUnbanCode,
    unbanError,
    handleUnbanSubmit,
    closeUnbanPrompt,
    warningCount,
  };
};

export default useAntiCheating;