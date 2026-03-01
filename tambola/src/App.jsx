import React, { useState, useEffect } from 'react';
import { Grid3X3, Trophy, Users, Wallet, WifiOff, Ticket, PlaySquare, ArrowRight, ChevronDown } from 'lucide-react';
import TambolaApp from './TambolaApp.jsx';
import WalletTab from './WalletTab.jsx';
import TicketsTab from './TicketsTab.jsx';
import WebAdBanner from './WebAdBanner.jsx';
import { loadPrizes } from './prizesData.js';
import { checkFirebaseAvailability } from './firebaseStatus.js';

export default function App() {
  const [roleAssigned, setRoleAssigned] = useState(false);
  const [activeTab, setActiveTab] = useState('game');
  const [prizes, setPrizes] = useState(() => loadPrizes());
  const [firebaseReady, setFirebaseReady] = useState(null); // null=checking, true/false

  // Try to detect user language, default to en, switch to hi if Hindi detected
  const browserLang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language.toLowerCase() : 'en';
  const initialLang = browserLang.startsWith('hi') ? 'hi' : 'en';
  const [appLang, setAppLang] = useState(initialLang);

  // Multiplayer room state — shared between App and TambolaApp (for host sync)
  const [activeRoomCode, setActiveRoomCode] = useState(null);

  // Check Firebase on mount
  useEffect(() => {
    checkFirebaseAvailability().then(async (ready) => {
      setFirebaseReady(ready);

      // Auto-process invite link if present (Skill 03: Frictionless Referral)
      if (ready) {
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('invite');
        // If an invite is present, immediately assume Player role and route to multi
        if (inviteCode) {
          setRoleAssigned(true);
          setActiveTab('multi');
          try {
            const { getFunctions, httpsCallable } = await import('firebase/functions');
            const { getApps } = await import('firebase/app');
            setTimeout(async () => {
              const functions = getFunctions(getApps()[0]);
              const processReferral = httpsCallable(functions, 'processReferral');
              try {
                await processReferral({ referralCode: inviteCode });
                console.log('Successfully processed auto-referral link!');
              } catch (e) {
                console.log('Referral already claimed or invalid');
              }
            }, 2000);
          } catch (e) {
            console.error('Error auto-processing invite:', e);
          }
        }
      }
    });
  }, []);

  // Dynamic tabs: hide Multiplayer & Wallet when Firebase is unavailable
  const tabs = [
    { id: 'game', label: 'Host Board', icon: Grid3X3 },
    ...(firebaseReady ? [{ id: 'multi', label: 'Multiplayer', icon: Users }] : []),
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    // Hide Wallet in offline mode as requested
    ...(firebaseReady ? [{ id: 'wallet', label: 'Wallet', icon: Wallet }] : []),
  ];

  // Lazy-load MultiplayerTab only when Firebase is available
  const MultiplayerTab = firebaseReady
    ? React.lazy(() => import('./MultiplayerTab.jsx'))
    : null;

  // INITIAL ROLE SELECTION SCREEN
  if (!roleAssigned) {
    const isHindi = appLang === 'hi';
    const text = {
      title: "Tambola Master",
      subtitle: isHindi ? "आज आप कैसे खेलना चाहेंगे?" : "How would you like to play today?",
      hostTitle: isHindi ? "होस्ट बनें" : "Host a Game",
      hostSub: isHindi ? "नंबर बोलें और बोर्ड प्रबंधित करें" : "Call numbers & manage the board",
      multiTitle: isHindi ? "ऑनलाइन खेलें" : "Join a Room",
      multiSub: isHindi ? "दोस्तों के साथ ऑनलाइन टिकट खेलें" : "Play tickets with friends online",
      multiOffline: isHindi ? "ऑफ़लाइन मोड में उपलब्ध नहीं" : "Unavailable in offline mode",
      playerTitle: isHindi ? "प्लेयर टिकट" : "Player Tickets",
      playerSub: isHindi ? "अपने टिकटों के साथ ऑफ़लाइन खेलें" : "Play offline with your own tickets",
      footer: "© 2025 Tambola Master Studios"
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-indigo-200">
        {/* Background blobs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden max-w-[100vw]">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply blur-[80px] opacity-40 animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply blur-[80px] opacity-40 animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white flex flex-col items-center text-center animate-fade-in-up">
          {/* Language Toggle */}
          <div className="absolute top-4 right-4">
            <div className="relative">
              <select
                value={appLang}
                onChange={(e) => setAppLang(e.target.value)}
                className="appearance-none bg-indigo-50/80 text-indigo-700 font-bold text-xs pl-2 pr-6 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-indigo-100 transition-colors border border-indigo-100"
              >
                <option value="en">🇬🇧 EN</option>
                <option value="hi">🇮🇳 HI</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
            </div>
          </div>

          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center mb-6 transform -rotate-6 mt-2">
            <Grid3X3 className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-black text-slate-800 mb-2">{text.title}</h1>
          <p className="text-slate-500 font-medium mb-8">{text.subtitle}</p>

          <div className="w-full flex flex-col gap-4">
            <button
              onClick={() => { setActiveTab('game'); setRoleAssigned(true); }}
              className="group relative w-full flex items-center p-4 bg-white border-2 border-indigo-100 rounded-2xl hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-100 transition-all text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-indigo-50/50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
              <div className="relative z-10 bg-indigo-100 text-indigo-600 p-3 rounded-xl mr-4">
                <Grid3X3 size={24} />
              </div>
              <div className="relative z-10 flex-1">
                <h3 className="text-lg font-bold text-slate-800">{text.hostTitle}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{text.hostSub}</p>
              </div>
              <ArrowRight className="relative z-10 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </button>

            {firebaseReady !== false && (
              <button
                onClick={() => { setActiveTab('multi'); setRoleAssigned(true); }}
                className="group relative w-full flex items-center p-4 bg-white border-2 border-purple-100 rounded-2xl hover:border-purple-600 hover:shadow-lg hover:shadow-purple-100 transition-all text-left overflow-hidden"
              >
                <div className="absolute inset-0 bg-purple-50/50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                <div className="relative z-10 bg-purple-100 text-purple-600 p-3 rounded-xl mr-4">
                  <Users size={24} />
                </div>
                <div className="relative z-10 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800">{text.multiTitle}</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{text.multiSub}</p>
                </div>
                <ArrowRight className="relative z-10 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </button>
            )}

            <button
              onClick={() => { setActiveTab('tickets'); setRoleAssigned(true); }}
              className="group relative w-full flex items-center p-4 bg-white border-2 border-emerald-100 rounded-2xl hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-100 transition-all text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-emerald-50/50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
              <div className="relative z-10 bg-emerald-100 text-emerald-600 p-3 rounded-xl mr-4">
                <Ticket size={24} />
              </div>
              <div className="relative z-10 flex-1">
                <h3 className="text-lg font-bold text-slate-800">{text.playerTitle}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{text.playerSub}</p>
              </div>
              <ArrowRight className="relative z-10 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </button>

            {firebaseReady === false && (
              <button
                disabled
                className="group relative w-full flex items-center p-4 bg-white border-2 border-purple-100 rounded-2xl text-left overflow-hidden opacity-60 cursor-not-allowed"
              >
                <div className="relative z-10 bg-purple-100 text-purple-600 p-3 rounded-xl mr-4">
                  <Users size={24} />
                </div>
                <div className="relative z-10 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800">{text.multiTitle}</h3>
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Offline</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{text.multiOffline}</p>
                </div>
                <ArrowRight className="relative z-10 text-purple-400" />
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400 font-medium">{text.footer}</p>
      </div>
    );
  }

  // MAIN APP VIEW
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Tab Bar */}
      <div className="sticky top-0 z-50 flex bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm shrink-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[11px] sm:text-sm font-bold transition-all border-b-[3px] ${activeTab === id
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
          >
            <Icon size={16} className={activeTab === id ? 'text-indigo-600' : 'text-slate-400'} />
            <span className="hidden sm:inline">{label}</span>
            {id === 'multi' && activeRoomCode && (
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" />
            )}
          </button>
        ))}
      </div>

      {/* Offline notice */}
      {firebaseReady === false && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs py-2 px-4 shrink-0 font-medium">
          <WifiOff size={14} />
          Offline mode active — Multiplayer and Online Wallet disabled.
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 flex flex-col">
        {/* Game tab — always mounted so autoplay/timer keeps working across tab switches */}
        <div className={`${activeTab === 'game' ? 'flex-1 flex flex-col' : 'hidden'}`}>
          <TambolaApp
            prizes={prizes}
            onPrizesChange={setPrizes}
            activeRoomCode={activeRoomCode}
          />
        </div>

        {activeTab === 'multi' && firebaseReady && MultiplayerTab && (
          <React.Suspense fallback={<div className="flex-1 flex items-center justify-center font-bold text-slate-400">Loading Multiplayer Engine…</div>}>
            <MultiplayerTab
              prizes={prizes}
              activeRoomCode={activeRoomCode}
              onRoomCodeChange={setActiveRoomCode}
            />
          </React.Suspense>
        )}

        {activeTab === 'tickets' && (
          <TicketsTab />
        )}

        {activeTab === 'wallet' && firebaseReady && (
          <WalletTab offlineMode={false} />
        )}
      </div>

      {/* AdSense Banner — Bottom sticky */}
      <WebAdBanner className="mt-auto px-2 pb-2 shrink-0 max-h-24 bg-slate-50" />
    </div>
  );
}
