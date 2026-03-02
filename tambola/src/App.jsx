import React, { useState, useEffect } from 'react';
import { Grid3X3, Trophy, Users, Wallet, WifiOff, Ticket, PlaySquare, ArrowRight, ChevronDown, User, BarChart3, Info } from 'lucide-react';
import TambolaApp from './TambolaApp.jsx';
import WalletTab from './WalletTab.jsx';
import TicketsTab from './TicketsTab.jsx';
import StatsTab from './StatsTab.jsx';
import AboutTab from './AboutTab.jsx';
import WebAdBanner from './WebAdBanner.jsx';
import { loadPrizes } from './prizesData.js';
import { checkFirebaseAvailability } from './firebaseStatus.js';
import { getProfile, updateNickname } from './playerProfile.js';

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

  // Guest profile — zero friction
  const [profile, setProfile] = useState(() => getProfile());
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Skill 03 — Deeplink: auto-fill room code from ?join=CODE URL param
  const [deeplinkRoomCode, setDeeplinkRoomCode] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('join') || ''; } catch { return ''; }
  });

  // Skill 12 — Onboarding modal (shows once via localStorage gate)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('tambola_onboarded'); } catch { return false; }
  });

  // Skill 16 — Daily bonus toast
  const [showDailyBonusToast, setShowDailyBonusToast] = useState(false);

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

      // Skill 16 — Daily bonus toast: check local wallet date
      if (ready) {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const stored = localStorage.getItem('tambola_wallet');
          if (stored) {
            // Encrypted, can't read directly — check a separate simple date key
            const lastClaim = localStorage.getItem('tambola_daily_claimed');
            if (lastClaim !== today) {
              setTimeout(() => setShowDailyBonusToast(true), 2000);
            }
          } else {
            // New user — show after 3s
            setTimeout(() => setShowDailyBonusToast(true), 3000);
          }
        } catch { /* ignore */ }
      }
    });
  }, []);

  const dismissDailyBonus = () => {
    try { localStorage.setItem('tambola_daily_claimed', new Date().toISOString().slice(0, 10)); } catch { /* ignore */ }
    setShowDailyBonusToast(false);
  };

  const dismissOnboarding = () => {
    try { localStorage.setItem('tambola_onboarded', '1'); } catch { /* ignore */ }
    setShowOnboarding(false);
  };

  // Dynamic tabs: hide Multiplayer & Wallet when Firebase is unavailable
  const tabs = [
    { id: 'game', label: 'Host Board', icon: Grid3X3 },
    ...(firebaseReady ? [{ id: 'multi', label: 'Multiplayer', icon: Users }] : []),
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    ...(firebaseReady ? [{ id: 'wallet', label: 'Wallet', icon: Wallet }] : []),
    { id: 'about', label: 'About', icon: Info },
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
      brandTag: isHindi ? "तम्बोला / हाउसी नंबर कॉलर" : "Tambola / Housie Number Caller",
      subtitle: isHindi ? "आज आप कैसे खेलना चाहेंगे?" : "How would you like to play today?",
      namePlaceholder: isHindi ? "अपना नाम लिखें..." : "Enter your name...",
      nameHint: isHindi ? "👆 अपना नाम बदलने के लिए टैप करें" : "👆 Tap to set your name",
      hostTitle: isHindi ? "होस्ट बनें" : "Host a Game",
      hostSub: isHindi ? "नंबर बोलें और बोर्ड प्रबंधित करें" : "Call numbers & manage the board",
      multiTitle: isHindi ? "ऑनलाइन खेलें" : "Join a Room",
      multiSub: isHindi ? "दोस्तों के साथ ऑनलाइन टिकट खेलें" : "Play tickets with friends online",
      multiOffline: isHindi ? "ऑफ़लाइन मोड" : "Offline Mode",
      playerTitle: isHindi ? "प्लेयर टिकट" : "Player Tickets",
      playerSub: isHindi ? "अपने टिकट जनरेट करें और खेलें" : "Generate and play with digital tickets",
      footer: "© 2025 Tambola Master Studios"
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-indigo-200">
        {/* Language Toggle — Full language name buttons (Fixed at top right to prevent overlap) */}
        <div className="fixed top-4 right-4 flex gap-1 z-50">
          <button
            onClick={() => setAppLang('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${appLang === 'en'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white/80 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 backdrop-blur-sm'
              }`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => setAppLang('hi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${appLang === 'hi'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white/80 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 backdrop-blur-sm'
              }`}
          >
            🇮🇳 हिन्दी (Hindi)
          </button>
        </div>

        {/* Background blobs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden max-w-[100vw]">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply blur-[80px] opacity-40 animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply blur-[80px] opacity-40 animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white flex flex-col items-center text-center animate-fade-in-up mt-8">

          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center mb-6 transform -rotate-6 mt-2">
            <Grid3X3 className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-black text-slate-800 mb-1">{text.title}</h1>
          <p className="text-xs font-semibold text-indigo-500/70 mb-3 tracking-wide">{text.brandTag}</p>

          {/* Guest Profile — inline, non-blocking */}
          <div className="flex flex-col items-center gap-1 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{profile.avatar}</span>
              {editingName ? (
                <form onSubmit={(e) => { e.preventDefault(); const p = updateNickname(tempName); setProfile(p); setEditingName(false); }} className="flex gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder={text.namePlaceholder}
                    autoFocus
                    className="text-sm font-bold text-slate-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 ring-indigo-400/50 w-40"
                    maxLength={20}
                  />
                  <button type="submit" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">✓</button>
                  <button type="button" onClick={() => setEditingName(false)} className="text-xs text-slate-400">✕</button>
                </form>
              ) : (
                <button onClick={() => { setTempName(''); setEditingName(true); }} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors border border-dashed border-indigo-300 px-3 py-1.5 rounded-lg bg-indigo-50/50">
                  {profile.nickname} ✏️
                </button>
              )}
            </div>
            {!editingName && (
              <p className="text-[10px] text-slate-400 font-medium animate-pulse">{text.nameHint}</p>
            )}
          </div>

          <p className="text-slate-500 font-medium mb-6 -mt-1 text-sm">{text.subtitle}</p>

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

        <div className="mt-6 text-center pb-4 z-20 relative">
          <p className="text-xs font-semibold text-slate-500 mb-1">
            Developed with ❤️ by <a href="https://mayur.bhopal.dev" className="text-indigo-600 hover:text-indigo-800 transition-colors font-bold underline">mayur.bhopal.dev</a>
          </p>
        </div>
      </div>
    );
  }

  // MAIN APP VIEW
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Skill 12: First-Launch Onboarding Modal ─────────────── */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Grid3X3 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-1">Welcome to Tambola Master!</h2>
            <p className="text-slate-500 text-sm mb-6">Free, offline-first Housie caller. Here's how it works:</p>
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                <div className="text-2xl mb-2">🎲</div>
                <div className="font-bold text-slate-800 text-sm">Host a Game</div>
                <div className="text-xs text-slate-500 mt-1">Call numbers for your group. Works offline!</div>
              </div>
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                <div className="text-2xl mb-2">🎟️</div>
                <div className="font-bold text-slate-800 text-sm">Get Tickets</div>
                <div className="text-xs text-slate-500 mt-1">Generate up to 10 tickets online or offline.</div>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <div className="text-2xl mb-2">👥</div>
                <div className="font-bold text-slate-800 text-sm">Multiplayer</div>
                <div className="text-xs text-slate-500 mt-1">Play with friends in a live room (requires internet).</div>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <div className="text-2xl mb-2">✨</div>
                <div className="font-bold text-slate-800 text-sm">Modern UI</div>
                <div className="text-xs text-slate-500 mt-1">Sleek, easy to play, and fast experience.</div>
              </div>
            </div>
            <button
              onClick={dismissOnboarding}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              Let's Play! 🎉
            </button>
          </div>
        </div>
      )}

      {/* ── Skill 16: Daily Bonus Toast ──────────────────────────── */}
      {showDailyBonusToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] animate-fade-in-up w-[calc(100%-2rem)] max-w-sm">
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <div className="font-bold text-sm">Daily Bonus Ready!</div>
              <div className="text-xs opacity-90">Claim your +25 tokens in the Wallet tab</div>
            </div>
            <button
              onClick={dismissDailyBonus}
              className="text-white/80 hover:text-white font-bold text-lg leading-none px-1"
            >✕</button>
          </div>
        </div>
      )}

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

        {activeTab === 'stats' && (
          <StatsTab />
        )}

        {activeTab === 'wallet' && firebaseReady && (
          <WalletTab offlineMode={false} />
        )}

        {activeTab === 'about' && (
          <AboutTab />
        )}
      </div>

      {/* AdSense Banner — Bottom sticky */}
      <WebAdBanner className="mt-auto px-2 pb-2 shrink-0 max-h-24 bg-slate-50" />
    </div>
  );
}
