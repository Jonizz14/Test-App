let isAntiCheatEnabled = false;

export const setAntiCheatStatus = (status) => {
    isAntiCheatEnabled = status;
};

// 1. Disable common DevTools shortcuts and right-click
export const disableDevToolsShortcuts = (event) => {
    if (!isAntiCheatEnabled) return;
    // F12
    if (event.keyCode === 123) {
        event.preventDefault();
        return false;
    }
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (event.ctrlKey && event.shiftKey && (event.keyCode === 73 || event.keyCode === 74 || event.keyCode === 67)) {
        event.preventDefault();
        return false;
    }
    // Ctrl+U (View Source)
    if (event.ctrlKey && event.keyCode === 85) {
        event.preventDefault();
        return false;
    }
};

export const disableContextMenu = (event) => {
    if (!isAntiCheatEnabled) return;
    event.preventDefault();
    return false;
};

// 2. Clear console periodically and lockdown
export const setupConsoleProtection = () => {
    // Add a huge warning in the console
    const warningStyle = [
        'color: red',
        'font-size: 40px',
        'font-weight: bold',
        'text-shadow: 2px 2px 0 black',
        'padding: 10px'
    ].join(';');

    const subWarningStyle = 'font-size: 16px; color: black; font-weight: bold;';

    const printWarning = () => {
        if (!isAntiCheatEnabled) return;
        console.clear();
        console.log('%cDIQQAT! BU YERDA ISHLASH TAQIQLANGAN!', warningStyle);
        console.log('%cBu yerda qilingan har bir harakat tizim tomonidan qayd etiladi va hisobingiz bloklanishiga sabab bo\'lishi mumkin.', subWarningStyle);
    };

    // Initial warning - only if enabled
    if (isAntiCheatEnabled) {
        printWarning();
    }

    // Debugger deterrent - freezes execution if devtools is open
    setInterval(() => {
        if (!isAntiCheatEnabled) return;
        const start = performance.now();
        debugger;
        if (performance.now() - start > 100) {
            printWarning();
            console.log('%cDEVTOOLS ANIQLANDI! ILTIMOS, UNI YOPING VA SAHIFANI YANGILANG.', 'color: red; font-size: 20px; font-weight: bold;');
        }
    }, 2000);

    // Disable logging for students (optional but effective)
    const isStudent = localStorage.getItem('currentUser') && JSON.parse(localStorage.getItem('currentUser')).role === 'student';
    if (isStudent && import.meta.env.PROD && isAntiCheatEnabled) {
        // Only disable in production to avoid breaking development
        const noop = () => { };
        // Keep error and warn for actual issues
        console.log = noop;
        console.info = noop;
        console.debug = noop;
    }
};

// 3. Prevention of copy/past/cut
export const disableCopyPaste = (event) => {
    if (!isAntiCheatEnabled) return;
    event.preventDefault();
    return false;
};
