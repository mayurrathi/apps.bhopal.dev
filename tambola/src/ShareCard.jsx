import React, { useRef, useState } from 'react';
import { Share2, Download, X } from 'lucide-react';
import { getProfile } from './playerProfile.js';
import { getLogStats } from './gameLog.js';

/**
 * ShareCard.jsx
 * Generates a 1080×1920 canvas image with game stats for sharing.
 * Uses html2canvas-like manual canvas drawing for zero dependencies.
 */
export default function ShareCard({ onClose }) {
    const canvasRef = useRef(null);
    const [sharing, setSharing] = useState(false);
    const profile = getProfile();
    const stats = getLogStats();

    const drawCard = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = 1080, h = 1920;
        canvas.width = w;
        canvas.height = h;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#312e81');
        grad.addColorStop(0.5, '#4338ca');
        grad.addColorStop(1, '#6366f1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Decorative circles
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(200, 300, 400, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(900, 1500, 350, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // App name
        ctx.fillStyle = '#c7d2fe';
        ctx.font = 'bold 48px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TAMBOLA MASTER', w / 2, 200);

        // Divider
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(200, 260);
        ctx.lineTo(880, 260);
        ctx.stroke();

        // Avatar
        ctx.font = '180px system-ui';
        ctx.fillText(profile.avatar, w / 2, 480);

        // Nickname
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 72px system-ui, sans-serif';
        ctx.fillText(profile.nickname, w / 2, 600);

        // "My Stats" header
        ctx.fillStyle = '#a5b4fc';
        ctx.font = 'bold 36px system-ui, sans-serif';
        ctx.fillText('— MY STATS —', w / 2, 720);

        // Stats boxes
        const statItems = [
            { label: 'Games Played', value: stats.totalGames.toString(), emoji: '🎮' },
            { label: 'Claims Won', value: stats.totalClaims.toString(), emoji: '🏆' },
            { label: 'Bogeys', value: stats.totalBogeys.toString(), emoji: '❌' },
            { label: 'Numbers Called', value: stats.totalNumbers.toString(), emoji: '🔢' },
        ];

        statItems.forEach((item, i) => {
            const y = 820 + i * 180;

            // Box background
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            const boxX = 140, boxW = 800, boxH = 140, radius = 24;
            ctx.beginPath();
            ctx.moveTo(boxX + radius, y);
            ctx.lineTo(boxX + boxW - radius, y);
            ctx.quadraticCurveTo(boxX + boxW, y, boxX + boxW, y + radius);
            ctx.lineTo(boxX + boxW, y + boxH - radius);
            ctx.quadraticCurveTo(boxX + boxW, y + boxH, boxX + boxW - radius, y + boxH);
            ctx.lineTo(boxX + radius, y + boxH);
            ctx.quadraticCurveTo(boxX, y + boxH, boxX, y + boxH - radius);
            ctx.lineTo(boxX, y + radius);
            ctx.quadraticCurveTo(boxX, y, boxX + radius, y);
            ctx.fill();

            // Emoji
            ctx.font = '64px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(item.emoji, 180, y + 90);

            // Label
            ctx.fillStyle = '#c7d2fe';
            ctx.font = '32px system-ui, sans-serif';
            ctx.fillText(item.label, 280, y + 55);

            // Value
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 56px system-ui, sans-serif';
            ctx.fillText(item.value, 280, y + 115);

            ctx.textAlign = 'center';
        });

        // Footer
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '32px system-ui, sans-serif';
        ctx.fillText('apps.bhopal.dev/tambola', w / 2, 1760);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 40px system-ui, sans-serif';
        ctx.fillText('Play Free — No Sign-up Required!', w / 2, 1830);
    };

    // Draw on mount
    React.useEffect(() => { drawCard(); }, []);

    const handleShare = async () => {
        setSharing(true);
        try {
            const canvas = canvasRef.current;
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'tambola-stats.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My Tambola Stats',
                    text: 'Check out my Tambola Master stats! Play free at apps.bhopal.dev/tambola',
                    files: [file],
                });
            } else {
                // Fallback: download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tambola-stats.png';
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.warn('[Share] Failed:', e);
        }
        setSharing(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                {/* Preview */}
                <div className="bg-indigo-900 p-4 flex items-center justify-between">
                    <span className="text-white font-bold text-sm">Share Your Stats</span>
                    <button onClick={onClose} className="text-white/60 hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-4 flex justify-center bg-slate-100">
                    <canvas
                        ref={canvasRef}
                        className="w-full max-w-[270px] rounded-xl shadow-lg"
                        style={{ aspectRatio: '9/16' }}
                    />
                </div>

                <div className="p-4 flex gap-3">
                    <button
                        onClick={handleShare}
                        disabled={sharing}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Share2 size={18} /> {sharing ? 'Sharing...' : 'Share'}
                    </button>
                </div>
            </div>
        </div>
    );
}
