import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

const AD_CLIENT = 'ca-pub-1891237722651167';
const AD_SLOT = '2330837487';

/**
 * WebAdBanner — Renders a responsive Google AdSense display ad.
 * Only renders on web/PWA (skips on native where AdMob handles ads).
 */
export default function WebAdBanner({ className = '' }) {
    const adRef = useRef(null);
    const pushed = useRef(false);

    useEffect(() => {
        // Don't show AdSense on native platforms (AdMob handles those)
        if (Capacitor.isNativePlatform()) return;

        // Prevent double-push on React strict mode / re-renders
        if (pushed.current) return;

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            pushed.current = true;
        } catch (e) {
            console.warn('[AdSense] Push failed:', e);
        }
    }, []);

    // Don't render on native platforms
    if (Capacitor.isNativePlatform()) return null;

    return (
        <div className={`w-full flex justify-center bg-transparent ${className}`} style={{ minHeight: '50px' }}>
            <ins className="adsbygoogle"
                ref={adRef}
                style={{ display: 'block', width: '100%', minHeight: '50px' }}
                data-ad-client={AD_CLIENT}
                data-ad-slot={AD_SLOT}
                data-ad-format="auto"
                data-full-width-responsive="true" />
        </div>
    );
}
