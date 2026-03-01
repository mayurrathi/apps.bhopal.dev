import React, { useState } from 'react';
import { Trophy, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { savePrizes } from './prizesData.js';

/**
 * ActivePrizes — The in-game prize tracker panel.
 * Shows only enabled prizes. Host can mark them as claimed.
 */
export default function ActivePrizes({ prizes, onPrizesChange }) {
    const [expanded, setExpanded] = useState(null);

    const activePrizes = prizes.filter((p) => p.enabled);
    const claimedCount = activePrizes.filter((p) => p.claimed).length;

    const toggleClaim = (id) => {
        const updated = prizes.map((p) => p.id === id ? { ...p, claimed: !p.claimed } : p);
        onPrizesChange(updated);
        savePrizes(updated);
    };

    const updateWinnerName = (id, winnerName) => {
        const updated = prizes.map((p) => p.id === id ? { ...p, winnerName } : p);
        onPrizesChange(updated);
        savePrizes(updated);
    };

    const resetClaims = () => {
        const updated = prizes.map((p) => ({ ...p, claimed: false, winnerName: '' }));
        onPrizesChange(updated);
        savePrizes(updated);
    };

    if (activePrizes.length === 0) {
        return (
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/40 text-center">
                <Trophy size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400 font-medium">No prizes enabled.</p>
                <p className="text-xs text-slate-400 mt-1">Go to the Prizes tab to set them up.</p>
            </div>
        );
    }

    return (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-indigo-900 text-white">
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-yellow-400" />
                    <span className="font-bold text-sm">Prize Board</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-indigo-300">
                        {claimedCount}/{activePrizes.length} claimed
                    </span>
                    {claimedCount > 0 && (
                        <button onClick={resetClaims}
                            className="text-[10px] bg-indigo-700 hover:bg-indigo-600 text-indigo-200 px-2 py-0.5 rounded-md transition-colors">
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-indigo-100">
                <div className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${activePrizes.length > 0 ? (claimedCount / activePrizes.length) * 100 : 0}%` }} />
            </div>

            {/* Prize List */}
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {activePrizes.map((prize) => (
                    <div key={prize.id} className={`transition-colors ${prize.claimed ? 'bg-green-50' : 'bg-white/60'}`}>

                        {/* Prize Row */}
                        <div className="flex items-center gap-2 px-3 py-2.5">
                            <span className="text-xl shrink-0">{prize.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm ${prize.claimed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {prize.customName || prize.name}
                                </p>
                                <p className="text-xs text-slate-400 truncate">{prize.description}</p>
                            </div>

                            {/* Expand */}
                            <button onClick={() => setExpanded(expanded === prize.id ? null : prize.id)}
                                className="p-1 text-slate-300 hover:text-slate-500 transition-colors shrink-0">
                                {expanded === prize.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {/* Claim Toggle */}
                            <button onClick={() => toggleClaim(prize.id)}
                                className={`p-1 shrink-0 rounded-full transition-all ${prize.claimed
                                    ? 'text-green-500 bg-green-100'
                                    : 'text-slate-300 hover:text-indigo-400 hover:bg-indigo-50'
                                    }`}
                                title={prize.claimed ? 'Mark as unclaimed' : 'Mark as claimed'}>
                                {prize.claimed ? <CheckCircle size={20} /> : <Circle size={20} />}
                            </button>
                        </div>

                        {/* Winner Name Input */}
                        {prize.claimed && (
                            <div className="px-4 pb-3 animate-fade-in-up">
                                <input
                                    type="text"
                                    placeholder="🏆 Enter Winner Name..."
                                    value={prize.winnerName || ''}
                                    onChange={(e) => updateWinnerName(prize.id, e.target.value)}
                                    className="w-full text-sm bg-green-100/50 border border-green-200 text-green-800 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-green-400/50 placeholder:text-green-600/50 font-medium"
                                />
                            </div>
                        )}

                        {/* Expanded Rules */}
                        {expanded === prize.id && (
                            <div className="px-4 pb-3 animate-fade-in-up">
                                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-lg p-2.5">
                                    {prize.rules}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer — All claimed! */}
            {claimedCount === activePrizes.length && activePrizes.length > 0 && (
                <div className="px-4 py-3 bg-green-50 border-t border-green-100 text-center animate-fade-in-up">
                    <p className="text-sm font-bold text-green-700">🎉 All prizes claimed! Game over!</p>
                </div>
            )}
        </div>
    );
}
