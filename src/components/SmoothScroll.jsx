import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';

const SmoothScroll = ({ children }) => {
    const lenisRef = useRef(null);

    useEffect(() => {
        // Initialize Lenis
        const lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1.1,
            lerp: 0.08, // Added lerp for that "elastic" feel
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        // Track scroll for progress bar
        const progressBar = document.getElementById('global-scroll-progress');
        lenis.on('scroll', ({ progress }) => {
            if (progressBar) {
                progressBar.style.transform = `scaleX(${progress})`;
            }
        });

        // Animation loop
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Cleanup
        return () => {
            lenis.destroy();
        };
    }, []);

    return (
        <>
            <div id="global-scroll-progress" className="scroll-progress-bar"></div>
            {children}
        </>
    );
};

export default SmoothScroll;
