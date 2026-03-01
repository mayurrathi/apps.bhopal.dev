import React, { useState, useEffect } from 'react';

/**
 * TicketCard.jsx
 * A single playable 3x9 Tambola ticket.
 * Allows the user to tap numbers to cross them out.
 */
export default function TicketCard({ ticket, ticketIndex, marked, toggleNumber }) {

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            {/* Header */}
            <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between text-white border-b border-indigo-700">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Tambola Ticket</span>
                <span className="text-sm font-black bg-white/20 px-2 py-0.5 rounded-md">#{ticketIndex + 1}</span>
            </div>

            {/* Grid */}
            <div className="p-2 sm:p-3 bg-slate-50">
                <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
                    {ticket.map((row, r) =>
                        row.map((cell, c) => {
                            const isBlank = cell === 0;
                            const isMarked = !isBlank && marked[cell];

                            // Styling for different cell states
                            let cellClass = "aspect-square flex items-center justify-center rounded-md font-bold text-sm sm:text-base select-none transition-all ";

                            if (isBlank) {
                                cellClass += "bg-slate-200/50";
                            } else if (isMarked) {
                                cellClass += "bg-slate-800 text-white shadow-inner scale-95 opacity-80 cursor-pointer relative";
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
                                    {isMarked && (
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
        </div>
    );
}
