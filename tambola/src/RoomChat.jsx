/**
 * RoomChat.jsx
 * Live chat panel with UGC compliance: profanity filtering + Report User button.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Flag, AlertTriangle } from 'lucide-react';
import { sendMessage } from './roomService.js';
import { sanitizeText, containsProfanity, validateDisplayName } from './profanityFilter.js';

export default function RoomChat({ roomCode, currentUser, messages }) {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [reportedUsers, setReportedUsers] = useState(new Set());
    const [reportToast, setReportToast] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || sending) return;

        // Sanitize text before sending (replace profanity with asterisks)
        const cleanText = sanitizeText(text);

        setSending(true);
        try {
            await sendMessage(
                roomCode,
                currentUser.uid,
                currentUser.name,
                currentUser.emoji,
                cleanText
            );
            setText('');
        } catch (err) {
            console.warn('Chat send error:', err);
        } finally {
            setSending(false);
        }
    };

    const handleReport = (msg) => {
        if (msg.uid === currentUser.uid) return;
        setReportedUsers(prev => new Set(prev).add(msg.uid));
        setReportToast(`Reported ${msg.name}. Thank you for keeping the chat safe.`);
        setTimeout(() => setReportToast(''), 3000);
        // In production, this would write to a /reports collection in Firestore
        console.log('User reported:', { reporter: currentUser.uid, reported: msg.uid, roomCode, msgText: msg.text });
    };

    // Filter messages from reported users
    const visibleMessages = messages.filter(m => !reportedUsers.has(m.uid));

    return (
        <div className="flex flex-col bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 overflow-hidden h-full min-h-[300px] max-h-[400px]">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-900 text-white shrink-0">
                <MessageCircle size={15} className="text-indigo-300" />
                <span className="text-xs font-bold uppercase tracking-wider">Live Chat</span>
                <span className="ml-auto text-xs text-indigo-400">{visibleMessages.length} messages</span>
            </div>

            {/* Report toast */}
            {reportToast && (
                <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs px-3 py-2 shrink-0">
                    <AlertTriangle size={12} />
                    {reportToast}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
                {visibleMessages.length === 0 && (
                    <div className="text-center text-slate-400 text-xs italic pt-4">
                        Chat is empty — say hello! 👋
                    </div>
                )}
                {visibleMessages.map((msg) => {
                    const isMe = msg.uid === currentUser.uid;
                    return (
                        <div key={msg.id} className={`group flex gap-1.5 items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                                <span className="text-base shrink-0 leading-none">{msg.emoji}</span>
                            )}
                            <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                                {!isMe && (
                                    <div className="flex items-center gap-1.5 ml-1">
                                        <span className="text-[10px] font-semibold text-slate-500">{msg.name}</span>
                                        {/* Report button — only visible on hover for other users */}
                                        <button
                                            onClick={() => handleReport(msg)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-slate-400 hover:text-red-500"
                                            title={`Report ${msg.name}`}
                                        >
                                            <Flag size={10} />
                                        </button>
                                    </div>
                                )}
                                <div className={`px-3 py-1.5 rounded-2xl text-sm leading-snug ${isMe
                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                    : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex gap-2 px-3 py-2.5 border-t border-slate-100 shrink-0">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message…"
                    maxLength={200}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-all shrink-0"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
