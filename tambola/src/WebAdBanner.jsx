import React, { useEffect, useRef, useState } from 'react';

const AD_CLIENT = 'ca-pub-1891237722651167';
const AD_SLOT = '2330837487';

/**
 * WebAdBanner — Renders a responsive Google AdSense display ad.
 * On native platforms (Capacitor), this component renders nothing
 * since AdMob handles ads natively. On web/PWA, it loads AdSense.
 */
export default function WebAdBanner({ className = '' }) {
    const adRef = useRef(null);
    const [adKey, setAdKey] = useState(Date.now()); // Force fresh <ins> on remount

    // Check if running inside a native Capacitor shell
    const isNative = typeof window !== 'undefined' &&
        window.Capacitor &&
        window.Capacitor.isNativePlatform &&
        window.Capacitor.isNativePlatform();

    useEffect(() => {
        if (isNative) return;

        // Reset pushed flag on remount
        let isCancelled = false;

        // Poll for adsbygoogle readiness
        const checkAndPushAd = () => {
            if (isCancelled) return;

            if (window.adsbygoogle && window.adsbygoogle.loaded === true) {
                try {
                    // Only push if this specific <ins> hasn't been filled
                    if (adRef.current && !adRef.current.getAttribute('data-ad-status')) {
                        window.adsbygoogle.push({});
                    }
                } catch (e) {
                    console.warn('[AdSense] Push failed:', e);
                }
            } else {
                // Try again in 200ms
                setTimeout(checkAndPushAd, 200);
            }
        };

        // Start polling
        checkAndPushAd();

        return () => {
            isCancelled = true;
        };
    }, [isNative, adKey]);

    // Don't render on native platforms
    if (isNative) return null;

    return (
        <div className={`w-full flex justify-center isolate ${className}`} style={{ minHeight: '90px' }}>
            <ins
                key={adKey}
                className="adsbygoogle"
                ref={adRef}
                style={{ display: 'block', width: '100%', minHeight: '90px', textAlign: 'center' }}
                data-ad-client={AD_CLIENT}
                data-ad-slot={AD_SLOT}
                data-ad-format="auto"
                data-full-width-responsive="true"
            />
        </div>
    );
}
