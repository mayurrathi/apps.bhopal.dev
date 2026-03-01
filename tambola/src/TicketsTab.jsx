import React, { useState, useEffect } from 'react';
import { Ticket, Trash2, Plus, Minus, CheckCircle2, Bot, BookOpen } from 'lucide-react';
import { generateTicket, generateTicketSet } from './ticketGenerator.js';
import TicketCard from './TicketCard.jsx';
import { logEvent, EVENT } from './gameLog.js';

const LOCAL_KEY = 'tambola_my_tickets';
const LOCAL_MARKS_KEY = 'tambola_my_marks';
const AUTO_DAUB_KEY = 'tambola_auto_daub';
const CALLED_KEY = 'tambola_called_numbers';

export default function TicketsTab() {
    const [tickets, setTickets] = useState([]);
    const [marked, setMarked] = useState({});
    const [amount, setAmount] = useState(1);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [autoDaub, setAutoDaub] = useState(() => {
        try { return JSON.parse(localStorage.getItem(AUTO_DAUB_KEY)) || false; } catch { return false; }
    });
    const [calledNumbers, setCalledNumbers] = useState([]);

    // Load from local storage on mount
    useEffect(() => {
        try {
            const savedTickets = localStorage.getItem(LOCAL_KEY);
            if (savedTickets) setTickets(JSON.parse(savedTickets));
            const savedMarks = localStorage.getItem(LOCAL_MARKS_KEY);
            if (savedMarks) setMarked(JSON.parse(savedMarks));
        } catch (e) {
            console.error("Failed to load tickets", e);
        }
    }, []);

    // Poll calledNumbers from localStorage (host writes them)
    useEffect(() => {
        const poll = () => {
            try {
                const stored = localStorage.getItem(CALLED_KEY);
                if (stored) setCalledNumbers(JSON.parse(stored));
            } catch (e) { /* silently ignore */ }
        };
        poll();
        const interval = setInterval(poll, 1000); // check every second
        return () => clearInterval(interval);
    }, []);

    // Save to local storage when state changes
    useEffect(() => {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(tickets));
    }, [tickets]);

    useEffect(() => {
        localStorage.setItem(LOCAL_MARKS_KEY, JSON.stringify(marked));
    }, [marked]);

    useEffect(() => {
        localStorage.setItem(AUTO_DAUB_KEY, JSON.stringify(autoDaub));
    }, [autoDaub]);

    const handleGenerate = () => {
        const newTickets = [];
        for (let i = 0; i < amount; i++) {
            newTickets.push(generateTicket());
        }
        setTickets(newTickets);
        setMarked({});
        logEvent(EVENT.TICKET_GENERATED, { count: amount, type: 'individual' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleGenerateBook = () => {
        const bookTickets = generateTicketSet();
        setTickets(bookTickets);
        setMarked({});
        logEvent(EVENT.TICKET_GENERATED, { count: 6, type: 'book' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmCancelAll = () => {
        setTickets([]);
        setMarked({});
        setShowCancelConfirm(false);
    };

    const toggleNumber = (num) => {
        if (!num) return;
        setMarked(prev => ({ ...prev, [num]: !prev[num] }));
    };

    if (tickets.length === 0) {
        return (
            <div className="max-w-md mx-auto p-6 pt-12 flex flex-col items-center text-center animate-fade-in-up">
                <div className="w-24 h-24 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Ticket size={48} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Get Your Tickets</h2>
                <p className="text-slate-500 mb-8 max-w-[280px]">
                    Generate up to 10 tickets at once to play along in your hosted game.
                </p>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                    <label className="text-xs font-bold text-slate-400 justify-center uppercase tracking-wider mb-4 flex">
                        Number of Tickets
                    </label>

                    <div className="flex items-center justify-center gap-6 mb-8">
                        <button
                            onClick={() => setAmount(Math.max(1, amount - 1))}
                            className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors border border-slate-200 active:scale-95"
                        >
                            <Minus size={20} />
                        </button>

                        <div className="text-5xl font-black text-slate-800 tabular-nums w-16 text-center">
                            {amount}
                        </div>

                        <button
                            onClick={() => setAmount(Math.min(10, amount + 1))}
                            className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors border border-slate-200 active:scale-95"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <button
                        onClick={handleGenerate}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
                    >
                        <Ticket size={24} /> Generate {amount} {amount === 1 ? 'Ticket' : 'Tickets'}
                    </button>

                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-xs font-bold text-slate-400 uppercase">or</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    <button
                        onClick={handleGenerateBook}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 active:scale-95 transition-all text-base flex items-center justify-center gap-2"
                    >
                        <BookOpen size={22} /> Generate Full Book (6 Tickets)
                    </button>
                    <p className="text-xs text-slate-400 text-center mt-2">
                        Every number 1-90 appears exactly once across the book
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
            {/* Header / Action Bar */}
            <div className="flex items-center justify-between mb-4 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 sticky top-[72px] z-40 bg-white/90 backdrop-blur-md">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Tickets</span>
                    <span className="text-lg font-black text-indigo-700">{tickets.length} Playing</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Auto-Daub Toggle */}
                    <button
                        onClick={() => setAutoDaub(!autoDaub)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${autoDaub
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        title="Auto-Daub: automatically marks called numbers on your tickets"
                    >
                        <Bot size={16} />
                        <span className="hidden sm:inline">Auto</span>
                    </button>

                    {/* Cancel All */}
                    <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5"
                    >
                        <Trash2 size={16} /> <span className="hidden sm:inline">Cancel All</span>
                    </button>
                </div>
            </div>

            {/* Auto-Daub indicator */}
            {autoDaub && (
                <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-medium flex items-center gap-2">
                    <Bot size={14} /> Auto-Daub is ON — called numbers are marked automatically
                    {calledNumbers.length > 0 && <span className="ml-auto text-blue-500">{calledNumbers.length} called</span>}
                </div>
            )}

            {/* Tickets List */}
            <div className="space-y-6">
                {tickets.map((ticket, i) => (
                    <TicketCard
                        key={i}
                        ticket={ticket}
                        ticketIndex={i}
                        marked={marked}
                        toggleNumber={toggleNumber}
                        calledNumbers={calledNumbers}
                        autoDaub={autoDaub}
                    />
                ))}
            </div>

            <div className="mt-8 text-center text-slate-400 text-xs flex items-center justify-center gap-1.5 font-medium">
                <CheckCircle2 size={14} className="text-indigo-400" />
                {autoDaub ? 'Auto-daub is marking numbers for you' : 'Tap a number to cross it out'}
            </div>

            {/* Custom Modal for Cancel All */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-white/50 text-center">
                        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Cancel All Tickets?</h3>
                        <p className="text-slate-600 mb-6">This will delete all {tickets.length} active tickets and clear your marked numbers. This cannot be undone.</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 flex-1 transition-colors"
                            >Keep Playing</button>
                            <button
                                onClick={confirmCancelAll}
                                className="px-4 py-2 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200 flex-1 transition-all"
                            >Yes, Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
