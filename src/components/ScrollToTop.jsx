import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Scrolls the window or specific container to top when the route changes.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // 1. Scroll the main window (for global pages)
        window.scrollTo(0, 0);

        // 2. Scroll the dashboard content container (for dashboard pages)
        // We try to find the element by ID 'dashboard-content-container'
        // This ID must be added to the scrollable container in:
        // - AdminDashboard.jsx
        // - TeacherDashboard.jsx
        // - StudentDashboard.jsx
        // - HeadAdminDashboard.jsx
        // - SellerDashboard.jsx
        const dashboardContainer = document.getElementById('dashboard-content-container');
        if (dashboardContainer) {
            dashboardContainer.scrollTo(0, 0);
        }

    }, [pathname]);

    return null;
};

export default ScrollToTop;
