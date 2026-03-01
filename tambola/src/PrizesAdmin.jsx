import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ToggleLeft, ToggleRight, RotateCcw, CheckCircle2, Settings } from 'lucide-react';
import { PRIZE_CATEGORIES, DEFAULT_PRIZES, savePrizes } from './prizesData.js';

/**
 * PrizesAdmin — The host's settings panel.
 * Allows enabling/disabling prizes and viewing full rules.
 */
export default function PrizesAdmin({ prizes, onPrizesChange }) {
    const [expanded, setExpanded] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');

    const toggleExpand = (id) => setExpanded(expanded === id ? null : id);

    const togglePrize = (id) => {
        const updated = prizes.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p);
        onPrizesChange(updated);
        savePrizes(updated);
    };

    const enableAll = () => {
        const updated = prizes.map((p) => ({ ...p, enabled: true }));
        onPrizesChange(updated);
        savePrizes(updated);
    };

    const resetToDefaults = () => {
        const updated = prizes.map((p) => ({ ...p, enabled: p.defaultEnabled, claimed: false }));
        onPrizesChange(updated);
        savePrizes(updated);
    };

    const enabledCount = prizes.filter((p) => p.enabled).length;

    const categories = [
        { key: 'all', label: 'All Prizes' },
        ...Object.entries(PRIZE_CATEGORIES).map(([key, label]) => ({ key, label })),
    ];

    const filtered = activeCategory === 'all'
        ? prizes
        : prizes.filter((p) => p.category === activeCategory);

    return (
        <div className="flex flex-col gap-4">

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Settings size={18} className="text-indigo-600" />
                            <h2 className="font-bold text-slate-800 text-lg">Prize Settings</h2>
                        </div>
                        <p className="text-sm text-slate-500">
                            Enable the prizes for your game. Players will see the active list during play.
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-2xl font-black text-indigo-600">{enabledCount}</div>
                        <div className="text-xs text-slate-400 font-medium">/ {prizes.length} active</div>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 mt-4">
                    <button onClick={enableAll}
                        className="flex-1 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100">
                        Enable All
                    </button>
                    <button onClick={resetToDefaults}
                        className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 flex items-center justify-center gap-1">
                        <RotateCcw size={12} /> Reset Defaults
                    </button>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map(({ key, label }) => (
                    <button key={key} onClick={() => setActiveCategory(key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${activeCategory === key
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'
                            }`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Prize List */}
            <div className="flex flex-col gap-2">
                {filtered.map((prize) => (
                    <div key={prize.id}
                        className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${prize.enabled ? 'border-indigo-200 shadow-sm shadow-indigo-50' : 'border-slate-200'
                            }`}>

                        {/* Prize row */}
                        <div className="flex items-center gap-3 p-3">
                            {/* Icon + Name */}
                            <span className="text-2xl w-8 text-center shrink-0">{prize.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm ${prize.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {prize.customName || prize.name}
                                </p>
                                <p className="text-xs text-slate-400 truncate">{prize.description}</p>
                            </div>

                            {/* Expand rules button */}
                            <button onClick={() => toggleExpand(prize.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                                title="View rules">
                                {expanded === prize.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {/* Toggle switch */}
                            <button onClick={() => togglePrize(prize.id)}
                                className={`shrink-0 transition-colors ${prize.enabled ? 'text-indigo-600' : 'text-slate-300'}`}
                                title={prize.enabled ? 'Disable prize' : 'Enable prize'}>
                                {prize.enabled
                                    ? <ToggleRight size={28} />
                                    : <ToggleLeft size={28} />}
                            </button>
                        </div>

                        {/* Expanded Rules */}
                        {expanded === prize.id && (
                            <div className="px-4 pb-4 animate-fade-in-up border-t border-slate-100 pt-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Rules</p>
                                        <p className="text-sm text-slate-600 leading-relaxed">{prize.rules}</p>
                                    </div>
                                </div>
                                <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                    {PRIZE_CATEGORIES[prize.category]}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
