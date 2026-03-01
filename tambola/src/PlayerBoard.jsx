/**
 * PlayerBoard.jsx
 * Read-only live number board for players who have joined a room.
 * Receives game state via real-time Firebase subscription.
 */
import React from 'react';
import { Trophy, Users, LogOut } from 'lucide-react';

export default function PlayerBoard({ roomData, players, currentNumber, calledNumbers, onLeave, t50Mode }) {
    const MAX = t50Mode ? 50 : 90;
    const allNumbers = Array.from({ length: MAX }, (_, i) => i + 1);

    const getCellClass = (num) => {
        const isCurrent = currentNumber === num;
        const isCalled = calledNumbers.includes(num);
        if (isCurrent) return 'bg-pink-500 text-white shadow-lg scale-110 ring-4 ring-pink-300 z-10 font-bold border-transparent';
        if (isCalled) return 'bg-indigo-600 text-white font-medium border-transparent opacity-90';
        return 'bg-white text-slate-400 border-slate-200';
    };

    const hostName = roomData?.meta?.hostName || 'Host';

    return (
        <div className="flex flex-col gap-4">

            {/* Live Game Header */}
            <div className="flex items-center justify-between bg-indigo-900 text-white rounded-2xl px-4 py-3">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Live Game</span>
                    </div>
                    <p className="text-sm font-semibold">Hosted by {hostName}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-xs text-indigo-400">Called</div>
                        <div className="text-xl font-black tabular-nums">{calledNumbers.length}<span className="text-indigo-400 text-sm">/{MAX}</span></div>
                    </div>
                    <button onClick={onLeave}
                        className="p-2 rounded-xl bg-red-900/30 text-red-400 hover:bg-red-800/50 transition-colors"
                        title="Leave room">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Current Number Hero */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-6 text-center flex flex-col items-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Number</p>
                <div className={`text-8xl font-black tabular-nums leading-none transition-all duration-300 ${currentNumber ? 'opacity-100 scale-100' : 'opacity-30 scale-95 blur-sm'}`}>
                    <span className="bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-pink-500">
                        {currentNumber || '—'}
                    </span>
                </div>
            </div>

            {/* Live Number Board */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Number Board</p>
                <div className="grid grid-cols-10 gap-1.5">
                    {allNumbers.map((num) => (
                        <div key={num}
                            className={`aspect-square rounded-lg flex items-center justify-center text-xs sm:text-sm transition-all duration-300 border ${getCellClass(num)}`}>
                            {num}
                        </div>
                    ))}
                </div>
                {/* Progress bar */}
                <div className="mt-3 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${(calledNumbers.length / MAX) * 100}%` }} />
                </div>
            </div>

            {/* Players in room */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 p-4">
                <div className="flex items-center gap-2 mb-3 text-slate-500">
                    <Users size={15} />
                    <span className="text-xs font-bold uppercase tracking-wider">{players.length} Players</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {players.map((p) => (
                        <div key={p.uid} className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm">
                            <span>{p.emoji}</span>
                            <span className="text-slate-700">{p.name}</span>
                            {p.isHost && <span className="text-[10px] text-indigo-500 font-bold">HOST</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
