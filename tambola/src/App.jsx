import React, { useState, useEffect } from 'react';
import { Grid3X3, Trophy, Users, Wallet, WifiOff, Ticket } from 'lucide-react';
import TambolaApp from './TambolaApp.jsx';
import PrizesAdmin from './PrizesAdmin.jsx';
import WalletTab from './WalletTab.jsx';
import TicketsTab from './TicketsTab.jsx';
import WebAdBanner from './WebAdBanner.jsx';
import { loadPrizes } from './prizesData.js';
import { checkFirebaseAvailability } from './firebaseStatus.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('game');
  const [prizes, setPrizes] = useState(() => loadPrizes());
  const [firebaseReady, setFirebaseReady] = useState(null); // null=checking, true/false

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
        if (inviteCode) {
          try {
            const { getFunctions, httpsCallable } = await import('firebase/functions');
            const { getApps } = await import('firebase/app');
            // Give auth a second to initialize anonymously
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

  // Dynamic tabs: hide Multiplayer when Firebase is unavailable
  const tabs = [
    { id: 'game', label: 'Game', icon: Grid3X3 },
    ...(firebaseReady ? [{ id: 'multi', label: 'Multiplayer', icon: Users }] : []),
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'prizes', label: 'Prizes', icon: Trophy },
  ];

  // Lazy-load MultiplayerTab only when Firebase is available
  const MultiplayerTab = firebaseReady
    ? React.lazy(() => import('./MultiplayerTab.jsx'))
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Tab Bar */}
      <div className="sticky top-0 z-50 flex bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-3.5 text-[11px] sm:text-sm font-semibold transition-all border-b-2 ${activeTab === id
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            <Icon size={14} />
            {label}
            {id === 'prizes' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold hidden sm:inline ${activeTab === id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                }`}>
                {prizes.filter(p => p.enabled).length}
              </span>
            )}
            {id === 'multi' && activeRoomCode && (
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Offline notice */}
      {firebaseReady === false && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs py-2 px-4">
          <WifiOff size={12} />
          Offline mode — Multiplayer is unavailable. Wallet uses local storage.
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1">
        {/* Game tab — always mounted so autoplay/timer keeps working across tab switches */}
        <div className={activeTab === 'game' ? 'block' : 'hidden'}>
          <TambolaApp
            prizes={prizes}
            onPrizesChange={setPrizes}
            activeRoomCode={activeRoomCode}
          />
        </div>

        {activeTab === 'multi' && firebaseReady && MultiplayerTab && (
          <React.Suspense fallback={<div className="text-center py-20 text-slate-400">Loading…</div>}>
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

        {activeTab === 'wallet' && (
          <WalletTab offlineMode={!firebaseReady} />
        )}

        {activeTab === 'prizes' && (
          <div className="max-w-2xl mx-auto p-4 md:p-6">
            <PrizesAdmin prizes={prizes} onPrizesChange={setPrizes} />
          </div>
        )}
      </div>

      {/* AdSense Banner — only renders on web/PWA, hidden on native */}
      <WebAdBanner className="mt-2 px-2 pb-2" />
    </div>
  );
}
