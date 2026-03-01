import React, { useEffect, useRef } from 'react';

const AD_CLIENT = 'ca-pub-1891237722651167';
const AD_SLOT = '2330837487';

/**
 * WebAdBanner — Renders a responsive Google AdSense display ad.
 * On native platforms (Capacitor), this component renders nothing
 * since AdMob handles ads natively. On web/PWA, it loads AdSense.
 */
export default function WebAdBanner({ className = '' }) {
    const adRef = useRef(null);
    const pushed = useRef(false);

    // Check if running inside a native Capacitor shell
    const isNative = typeof window !== 'undefined' &&
        window.Capacitor &&
        window.Capacitor.isNativePlatform &&
        window.Capacitor.isNativePlatform();

    useEffect(() => {
        if (isNative) return;
        if (pushed.current) return;

        // Wait for the AdSense script to initialize
        const timer = setTimeout(() => {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                pushed.current = true;
            } catch (e) {
                console.warn('[AdSense] Push failed:', e);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [isNative]);

    // Don't render on native platforms
    if (isNative) return null;

    return (
        <div className={`w-full flex justify-center ${className}`} style={{ minHeight: '90px' }}>
            <ins className="adsbygoogle"
                ref={adRef}
                style={{ display: 'block', width: '100%', minHeight: '90px', textAlign: 'center' }}
                data-ad-client={AD_CLIENT}
                data-ad-slot={AD_SLOT}
                data-ad-format="auto"
                data-full-width-responsive="true" />
        </div>
    );
}
