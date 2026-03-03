import React, { useState, useEffect, useRef } from 'react';
import { Ticket, Trash2, Plus, Minus, CheckCircle2, Bot, FileDown, Share2, Printer, Gamepad2, Info } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { generateTicket } from './ticketGenerator.js';
import TicketCard from './TicketCard.jsx';
import { logEvent, EVENT } from './gameLog.js';

const LOCAL_KEY = 'tambola_my_tickets';
const LOCAL_MARKS_KEY = 'tambola_my_marks';
const AUTO_DAUB_KEY = 'tambola_auto_daub';
const CALLED_KEY = 'tambola_called_numbers';

/* ────────────────────── PDF Renderer ──────────────────────
   Draws all tickets into a real multi-page PDF using jsPDF.
   Returns the jsPDF doc instance. */
function renderTicketsToPDF(tickets) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PAGE_W = 210;
    const MARGIN = 15;
    const TICKET_W = PAGE_W - MARGIN * 2;
    const COLS = 9;
    const ROWS = 3;
    const CELL_W = TICKET_W / COLS;
    const CELL_H = 12;
    const HEADER_H = 8;
    const TICKET_H = HEADER_H + ROWS * CELL_H;
    const GAP = 10;
    const TICKETS_PER_PAGE = Math.floor((297 - MARGIN * 2 + GAP) / (TICKET_H + GAP));

    tickets.forEach((ticket, idx) => {
        const posOnPage = idx % TICKETS_PER_PAGE;
        if (idx > 0 && posOnPage === 0) doc.addPage();

        const x0 = MARGIN;
        const y0 = MARGIN + posOnPage * (TICKET_H + GAP);

        doc.setFillColor(79, 70, 229);
        doc.rect(x0, y0, TICKET_W, HEADER_H, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('TAMBOLA TICKET', x0 + 3, y0 + 5.5);
        doc.text(`#${idx + 1}`, x0 + TICKET_W - 3, y0 + 5.5, { align: 'right' });

        const gridY = y0 + HEADER_H;
        ticket.forEach((row, r) => {
            row.forEach((cell, c) => {
                const cx = x0 + c * CELL_W;
                const cy = gridY + r * CELL_H;
                if (cell === 0) {
                    doc.setFillColor(241, 245, 249);
                } else {
                    doc.setFillColor(255, 255, 255);
                }
                doc.rect(cx, cy, CELL_W, CELL_H, 'F');
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.2);
                doc.rect(cx, cy, CELL_W, CELL_H, 'S');
                if (cell !== 0) {
                    doc.setTextColor(30, 41, 59);
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text(String(cell), cx + CELL_W / 2, cy + CELL_H / 2 + 1.5, { align: 'center' });
                }
            });
        });
        doc.setDrawColor(100, 116, 139);
        doc.setLineWidth(0.4);
        doc.rect(x0, y0, TICKET_W, TICKET_H, 'S');
    });

    const lastPage = doc.internal.getNumberOfPages();
    doc.setPage(lastPage);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Tambola Master \u00B7 apps.bhopal.dev/tambola', PAGE_W / 2, 290, { align: 'center' });

    return doc;
}

/* ── Helper: download a PDF blob ── */
function downloadPDF(doc, count) {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `tambola-tickets-${count}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
}

/* ── Helper: share a PDF blob ── */
async function sharePDF(doc, count) {
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `tambola-tickets-${count}.pdf`, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            title: 'Tambola Master Tickets',
            text: `Here are ${count} Tambola tickets! Play now at apps.bhopal.dev/tambola`,
            files: [file],
        });
    } else if (navigator.share) {
        await navigator.share({
            title: 'Tambola Master Tickets',
            text: `I just generated ${count} Tambola tickets! Play now at apps.bhopal.dev/tambola`,
            url: 'https://apps.bhopal.dev/tambola/',
        });
    } else {
        downloadPDF(doc, count);
    }
}

// ═══════════════════════════════════════════════════════════════
//  PRINT & SHARE MODULE
// ═══════════════════════════════════════════════════════════════
function PrintModule() {
    const [printAmount, setPrintAmount] = useState(10);
    const [exporting, setExporting] = useState(false);

    const handleExport = () => {
        setExporting(true);
        try {
            const tickets = [];
            for (let i = 0; i < printAmount; i++) tickets.push(generateTicket());
            const doc = renderTicketsToPDF(tickets);
            downloadPDF(doc, printAmount);
            logEvent(EVENT.TICKET_GENERATED, { count: printAmount, type: 'print-export' });
        } catch (e) {
            console.error('Export failed:', e);
        }
        setExporting(false);
    };

    const handleSharePrint = async () => {
        setExporting(true);
        try {
            const tickets = [];
            for (let i = 0; i < printAmount; i++) tickets.push(generateTicket());
            const doc = renderTicketsToPDF(tickets);
            await sharePDF(doc, printAmount);
            logEvent(EVENT.TICKET_GENERATED, { count: printAmount, type: 'print-share' });
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('Share failed:', e);
            }
        }
        setExporting(false);
    };

    return (
        <div className="max-w-md mx-auto p-4 sm:p-6 flex flex-col items-center text-center animate-fade-in-up">
            {/* Hero */}
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <Printer size={40} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-1">Print & Share Tickets</h2>
            <p className="text-slate-500 mb-6 max-w-[320px] text-sm leading-relaxed">
                Generate bulk tickets to print or share as PDF with players who don't have a smartphone.
            </p>

            {/* Generator Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <label className="text-xs font-bold text-slate-400 justify-center uppercase tracking-wider mb-4 flex">
                    Number of Tickets
                </label>

                <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                        onClick={() => setPrintAmount(Math.max(1, printAmount - 1))}
                        className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors border border-slate-200 active:scale-95"
                    >
                        <Minus size={20} />
                    </button>

                    <input
                        type="number"
                        min={1}
                        max={100}
                        value={printAmount}
                        onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v)) setPrintAmount(Math.max(1, Math.min(100, v)));
                            else if (e.target.value === '') setPrintAmount(1);
                        }}
                        className="w-20 text-center text-4xl font-black text-slate-800 tabular-nums bg-slate-50 border border-slate-200 rounded-xl py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />

                    <button
                        onClick={() => setPrintAmount(Math.min(100, printAmount + 1))}
                        className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors border border-slate-200 active:scale-95"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Slider */}
                <input
                    type="range"
                    min={1}
                    max={100}
                    value={printAmount}
                    onChange={(e) => setPrintAmount(Number(e.target.value))}
                    className="w-full accent-emerald-600 mb-6"
                />
                <div className="flex justify-between text-[10px] text-slate-400 -mt-5 mb-6 px-1">
                    <span>1</span>
                    <span>50</span>
                    <span>100</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 active:scale-95 transition-all text-base flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        <FileDown size={20} />
                        {exporting ? 'Generating…' : 'Export PDF'}
                    </button>
                    <button
                        onClick={handleSharePrint}
                        disabled={exporting}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 active:scale-95 transition-all text-base flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        <Share2 size={20} />
                        {exporting ? 'Sharing…' : 'Share'}
                    </button>
                </div>
            </div>

            {/* Info note */}
            <div className="mt-5 flex items-start gap-2 text-left bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 w-full">
                <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                    Each ticket is <strong>unique</strong> with 15 numbers across 3 rows of 9 columns — ready to print on paper.
                    PDF is sized for A4 with ~5 tickets per page.
                </p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//  PLAY MODULE (existing interactive ticket logic)
// ═══════════════════════════════════════════════════════════════
function PlayModule() {
    const [tickets, setTickets] = useState([]);
    const [marked, setMarked] = useState({});
    const [amount, setAmount] = useState(1);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [autoDaub, setAutoDaub] = useState(() => {
        try { return JSON.parse(localStorage.getItem(AUTO_DAUB_KEY)) || false; } catch { return false; }
    });
    const [calledNumbers, setCalledNumbers] = useState([]);

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

    useEffect(() => {
        const poll = () => {
            try {
                const stored = localStorage.getItem(CALLED_KEY);
                if (stored) setCalledNumbers(JSON.parse(stored));
            } catch (e) { /* silently ignore */ }
        };
        poll();
        const interval = setInterval(poll, 1000);
        return () => clearInterval(interval);
    }, []);

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
            <div className="max-w-md mx-auto p-4 sm:p-6 pt-8 flex flex-col items-center text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-5 shadow-inner">
                    <Ticket size={40} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-1">Play Now</h2>
                <p className="text-slate-500 mb-6 max-w-[300px] text-sm leading-relaxed">
                    Generate tickets to play along in your hosted game. Tap numbers to mark them as they're called.
                </p>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                    <label className="text-xs font-bold text-slate-400 justify-center uppercase tracking-wider mb-4 flex">
                        Number of Tickets
                    </label>

                    <div className="flex items-center justify-center gap-4 mb-8">
                        <button
                            onClick={() => setAmount(Math.max(1, amount - 1))}
                            className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors border border-slate-200 active:scale-95"
                        >
                            <Minus size={20} />
                        </button>

                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={amount}
                            onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v)) setAmount(Math.max(1, Math.min(10, v)));
                                else if (e.target.value === '') setAmount(1);
                            }}
                            className="w-20 text-center text-4xl font-black text-slate-800 tabular-nums bg-slate-50 border border-slate-200 rounded-xl py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

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
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 pb-24">
            {/* Header / Action Bar */}
            <div className="flex items-center justify-between mb-4 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 sticky top-[72px] z-40 bg-white/90 backdrop-blur-md">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Tickets</span>
                    <span className="text-lg font-black text-indigo-700">{tickets.length} Playing</span>
                </div>

                <div className="flex items-center gap-2">
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

// ═══════════════════════════════════════════════════════════════
//  MAIN TAB WRAPPER — Sub-tab toggle
// ═══════════════════════════════════════════════════════════════
export default function TicketsTab() {
    const [ticketMode, setTicketMode] = useState('play');

    return (
        <div className="flex flex-col h-full">
            {/* ── Sub-Tab Toggle ── */}
            <div className="max-w-md mx-auto w-full px-4 pt-4">
                <div className="flex bg-slate-100/80 p-1 rounded-xl">
                    <button
                        onClick={() => setTicketMode('play')}
                        className={`flex-1 py-2.5 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${ticketMode === 'play'
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                    >
                        <Gamepad2 size={16} /> Play
                    </button>
                    <button
                        onClick={() => setTicketMode('print')}
                        className={`flex-1 py-2.5 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${ticketMode === 'print'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                    >
                        <Printer size={16} /> Print & Share
                    </button>
                </div>
            </div>

            {/* ── Active Sub-Module ── */}
            {ticketMode === 'play' ? <PlayModule /> : <PrintModule />}
        </div>
    );
}
