import React, { useState, useEffect } from 'react';
import { Grid3X3, Trophy, Users, Wallet, WifiOff, Ticket, PlaySquare, ArrowRight } from 'lucide-react';
import TambolaApp from './TambolaApp.jsx';
import PrizesAdmin from './PrizesAdmin.jsx';
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
    { id: 'prizes', label: 'Prizes', icon: Trophy },
  ];

  // Lazy-load MultiplayerTab only when Firebase is available
  const MultiplayerTab = firebaseReady
    ? React.lazy(() => import('./MultiplayerTab.jsx'))
    : null;

  // INITIAL ROLE SELECTION SCREEN
  if (!roleAssigned) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-indigo-200">
        {/* Background blobs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden max-w-[100vw]">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply blur-[80px] opacity-40 animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply blur-[80px] opacity-40 animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white flex flex-col items-center text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center mb-6 transform -rotate-6">
            <Grid3X3 className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-black text-slate-800 mb-2">Tambola Master</h1>
          <p className="text-slate-500 font-medium mb-8">How would you like to play today?</p>

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
                <h3 className="text-lg font-bold text-slate-800">Host a Game</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Call numbers & manage the board</p>
              </div>
              <ArrowRight className="relative z-10 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => { setActiveTab('multi'); setRoleAssigned(true); }}
              className="group relative w-full flex items-center p-4 bg-white border-2 border-purple-100 rounded-2xl hover:border-purple-600 hover:shadow-lg hover:shadow-purple-100 transition-all text-left overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={firebaseReady === false}
            >
              <div className="absolute inset-0 bg-purple-50/50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
              <div className="relative z-10 bg-purple-100 text-purple-600 p-3 rounded-xl mr-4">
                <Users size={24} />
              </div>
              <div className="relative z-10 flex-1">
                <h3 className="text-lg font-bold text-slate-800">Join a Room</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Play tickets with friends online</p>
              </div>
              {firebaseReady === false ? (
                <WifiOff className="relative z-10 text-slate-400" />
              ) : (
                <ArrowRight className="relative z-10 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              )}
            </button>
            {firebaseReady === false && <p className="text-[10px] text-rose-500 font-bold mt-1">Multiplayer unavailable (Offline Mode)</p>}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 w-full text-center">
            <button onClick={() => { setActiveTab('tickets'); setRoleAssigned(true); }} className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5 mx-auto">
              <Ticket size={16} /> Just need offline tickets?
            </button>
          </div>
        </div>

        {/* AdSense Block on Selection Screen */}
        <div className="mt-6 w-full max-w-md">
          <WebAdBanner className="rounded-xl overflow-hidden shadow-sm" />
        </div>
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
            {id === 'prizes' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black hidden lg:inline ml-1 ${activeTab === id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                }`}>
                {prizes.filter(p => p.enabled).length}
              </span>
            )}
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

        {activeTab === 'prizes' && (
          <div className="max-w-3xl mx-auto w-full p-4 md:p-6 lg:p-8 flex-1">
            <PrizesAdmin prizes={prizes} onPrizesChange={setPrizes} />
          </div>
        )}
      </div>

      {/* AdSense Banner — Bottom sticky */}
      <WebAdBanner className="mt-auto px-2 pb-2 shrink-0 max-h-24 bg-slate-50" />
    </div>
  );
}
