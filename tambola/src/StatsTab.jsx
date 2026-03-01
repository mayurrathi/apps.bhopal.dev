import React, { useState } from 'react';
import { BarChart3, Trophy, Target, Hash, Share2, Gamepad2 } from 'lucide-react';
import { getProfile } from './playerProfile.js';
import { getLogStats } from './gameLog.js';
import ShareCard from './ShareCard.jsx';

/**
 * StatsTab.jsx
 * Visual game statistics dashboard powered by localStorage data.
 */
export default function StatsTab() {
    const profile = getProfile();
    const stats = getLogStats();
    const [showShare, setShowShare] = useState(false);

    const winRate = stats.totalClaims + stats.totalBogeys > 0
        ? Math.round((stats.totalClaims / (stats.totalClaims + stats.totalBogeys)) * 100)
        : 0;

    const statCards = [
        { icon: Gamepad2, label: 'Games Played', value: stats.totalGames, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
        { icon: Trophy, label: 'Claims Won', value: stats.totalClaims, color: 'from-amber-500 to-yellow-500', bg: 'bg-amber-50', text: 'text-amber-600' },
        { icon: Target, label: 'Bogeys', value: stats.totalBogeys, color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50', text: 'text-rose-600' },
        { icon: Hash, label: 'Numbers Called', value: stats.totalNumbers, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    ];

    return (
        <div className="max-w-md mx-auto p-4 sm:p-6 pb-24 animate-fade-in-up">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-center text-white shadow-xl mb-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:30px_30px]" />
                </div>
                <div className="relative z-10">
                    <div className="text-6xl mb-3">{profile.avatar}</div>
                    <h2 className="text-2xl font-black">{profile.nickname}</h2>
                    <p className="text-indigo-200 text-xs mt-1 font-medium">
                        Playing since {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Win Rate Ring */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 flex items-center gap-6">
                <div className="relative w-20 h-20 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="#e2e8f0" strokeWidth="3"
                        />
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="#4f46e5" strokeWidth="3"
                            strokeDasharray={`${winRate}, 100`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-black text-indigo-700">{winRate}%</span>
                    </div>
                </div>
                <div>
                    <p className="text-lg font-black text-slate-800">Claim Rate</p>
                    <p className="text-xs text-slate-500">
                        {stats.totalClaims} successful out of {stats.totalClaims + stats.totalBogeys} attempts
                    </p>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-16 h-16 ${card.bg} rounded-bl-[40px] flex items-end justify-start p-2`}>
                            <card.icon size={18} className={card.text} />
                        </div>
                        <p className="text-3xl font-black text-slate-800 mb-1">{card.value}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Share Button */}
            <button
                onClick={() => setShowShare(true)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:shadow-xl active:scale-95 transition-all text-lg"
            >
                <Share2 size={22} /> Share My Stats
            </button>

            {showShare && <ShareCard onClose={() => setShowShare(false)} />}
        </div>
    );
}
