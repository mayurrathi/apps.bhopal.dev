import React, { useState, useEffect, useMemo } from 'react';
import { detectClaims, validateClaim } from './claimDetector.js';
import { logEvent, EVENT } from './gameLog.js';

/**
 * TicketCard.jsx
 * A single playable 3x9 Tambola ticket.
 * Supports manual daub, auto-daub, claim detection, and bogey highlighting.
 */
export default function TicketCard({ ticket, ticketIndex, marked, toggleNumber, calledNumbers = [], autoDaub = false }) {

    const [bogeyNumbers, setBogeyNumbers] = useState([]);
    const [bogeyMessage, setBogeyMessage] = useState('');
    const [claimToast, setClaimToast] = useState('');

    // Auto-daub: mark called numbers automatically
    useEffect(() => {
        if (!autoDaub || !calledNumbers.length) return;
        const allNums = ticket.flat().filter(n => n !== 0);
        calledNumbers.forEach(num => {
            if (allNums.includes(num) && !marked[num]) {
                toggleNumber(num);
            }
        });
    }, [calledNumbers, autoDaub]);

    // Detect achieved patterns
    const achievedPatterns = useMemo(() => {
        if (!calledNumbers.length) return [];
        return detectClaims(ticket, marked, calledNumbers);
    }, [ticket, marked, calledNumbers]);

    // Handle claim attempt
    const handleClaim = (patternId, patternName) => {
        const result = validateClaim(ticket, patternId, calledNumbers);
        logEvent(EVENT.CLAIM_ATTEMPT, { patternId, patternName, ticketIndex });
        if (result.valid) {
            setClaimToast(`🎉 ${patternName} Claimed!`);
            setBogeyNumbers([]);
            setBogeyMessage('');
            logEvent(EVENT.CLAIM_VALID, { patternId, patternName, ticketIndex });
            setTimeout(() => setClaimToast(''), 3000);
        } else {
            setBogeyNumbers(result.missingNumbers);
            setBogeyMessage(`❌ Bogey! ${result.missingNumbers.length} number${result.missingNumbers.length > 1 ? 's' : ''} missing`);
            setClaimToast('');
            logEvent(EVENT.CLAIM_BOGEY, { patternId, patternName, ticketIndex, missing: result.missingNumbers });
            setTimeout(() => {
                setBogeyNumbers([]);
                setBogeyMessage('');
            }, 3500);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            {/* Header */}
            <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between text-white border-b border-indigo-700">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Tambola Ticket</span>
                <span className="text-sm font-black bg-white/20 px-2 py-0.5 rounded-md">#{ticketIndex + 1}</span>
            </div>

            {/* Claim Toast */}
            {claimToast && (
                <div className="px-3 py-2 bg-green-500 text-white text-center text-sm font-bold animate-pulse">
                    {claimToast}
                </div>
            )}

            {/* Bogey Toast */}
            {bogeyMessage && (
                <div className="px-3 py-2 bg-red-500 text-white text-center text-sm font-bold animate-pulse">
                    {bogeyMessage}
                </div>
            )}

            {/* Grid */}
            <div className="p-2 sm:p-3 bg-slate-50">
                <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
                    {ticket.map((row, r) =>
                        row.map((cell, c) => {
                            const isBlank = cell === 0;
                            const isMarked = !isBlank && marked[cell];
                            const isBogey = !isBlank && bogeyNumbers.includes(cell);
                            const isAutoDaubed = !isBlank && autoDaub && calledNumbers.includes(cell) && marked[cell];

                            let cellClass = "aspect-square flex items-center justify-center rounded-md font-bold text-sm sm:text-base select-none transition-all ";

                            if (isBlank) {
                                cellClass += "bg-slate-200/50";
                            } else if (isBogey) {
                                cellClass += "bg-red-500 text-white shadow-lg animate-pulse ring-2 ring-red-300 cursor-pointer";
                            } else if (isMarked) {
                                cellClass += `bg-slate-800 text-white shadow-inner scale-95 opacity-80 cursor-pointer relative ${isAutoDaubed ? 'ring-1 ring-blue-400' : ''}`;
                            } else {
                                cellClass += "bg-white text-indigo-900 border border-slate-200 shadow-sm hover:border-indigo-400 hover:text-indigo-600 cursor-pointer active:scale-95";
                            }

                            return (
                                <div
                                    key={`${r}-${c}`}
                                    className={cellClass}
                                    onClick={() => !isBlank && toggleNumber(cell)}
                                >
                                    {!isBlank && cell}
                                    {isMarked && !isBogey && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-full h-1 bg-red-500 rotate-45 rounded-full shadow-sm" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Achieved Patterns / Claim Buttons */}
            {achievedPatterns.length > 0 && (
                <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-t border-amber-200">
                    <div className="flex flex-wrap gap-1.5">
                        {achievedPatterns.map(p => (
                            <button
                                key={p.patternId}
                                onClick={() => handleClaim(p.patternId, p.name)}
                                className="text-xs font-bold px-2.5 py-1 bg-amber-500 text-white rounded-full hover:bg-amber-600 active:scale-95 transition-all shadow-sm animate-bounce"
                                style={{ animationDuration: '2s' }}
                            >
                                {p.emoji} {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
