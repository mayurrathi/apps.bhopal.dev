import { useState, useEffect, useCallback } from 'react';
import { Settings, Plus, Search, Trash2, Clock, Globe, Bell, Calendar, Copy, Check, Sparkles, ArrowLeftRight, Minimize2, Maximize2, AlertTriangle } from 'lucide-react';
import { addMinutes, startOfDay } from 'date-fns';
import flagData from 'country-flag-emoji-json';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getFlagEmoji = (countryName) => {
  if (!countryName) return '🌎';
  const name = countryName.toLowerCase();
  const match = flagData.find(f => f.name.toLowerCase() === name);
  if (match) return match.emoji;
  if (name === 'united states of america' || name === 'usa' || name === 'united states') return '🇺🇸';
  if (name === 'united kingdom' || name === 'uk') return '🇬🇧';
  if (name === 'auto') return '📍';
  if (name === 'global') return '🌐';
  return '🌎';
};

// Get current UTC offset in minutes for a timezone
const getUTCOffsetMinutes = (tz, date) => {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    return (tzDate - utcDate) / 60000;
  } catch {
    return 0;
  }
};

// Check if a timezone has a DST change within next 30 days
const getDSTWarning = (tz) => {
  try {
    const now = new Date();
    const check = (days) => {
      const d = new Date(now.getTime() + days * 86400000);
      return getUTCOffsetMinutes(tz, d);
    };
    const offsetNow = check(0);
    for (let day = 1; day <= 30; day++) {
      if (check(day) !== offsetNow) {
        // Find the exact day
        const changeDate = new Date(now.getTime() + day * 86400000);
        return `DST change ~${changeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
    }
    return null;
  } catch {
    return null;
  }
};

const getNowOffset = () => {
  const now = new Date();
  return now.getUTCHours() * 60 + now.getUTCMinutes();
};

const getInitialZones = () => {
  const saved = localStorage.getItem('tz-resolver-zones');
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  return [
    { id: 'local', tz: Intl.DateTimeFormat().resolvedOptions().timeZone, name: 'Local Time', country: 'Auto' },
    { id: 'utc', tz: 'UTC', name: 'Coordinated Universal', country: 'Global' },
    { id: 'pst', tz: 'America/Los_Angeles', name: 'Los Angeles', country: 'USA' },
  ];
};

const getInitialReminders = () => {
  const saved = localStorage.getItem('tz-resolver-reminders');
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  return [];
};

const majorTimezones = [
  { name: 'UTC / GMT', timezone: 'UTC', country: 'Global' },
  { name: 'London (GMT/BST)', timezone: 'Europe/London', country: 'United Kingdom' },
  { name: 'New York (EST/EDT)', timezone: 'America/New_York', country: 'USA' },
  { name: 'Los Angeles (PST/PDT)', timezone: 'America/Los_Angeles', country: 'USA' },
  { name: 'Tokyo (JST)', timezone: 'Asia/Tokyo', country: 'Japan' },
  { name: 'Sydney (AEST/AEDT)', timezone: 'Australia/Sydney', country: 'Australia' },
  { name: 'Dubai (GST)', timezone: 'Asia/Dubai', country: 'UAE' },
  { name: 'Mumbai (IST)', timezone: 'Asia/Kolkata', country: 'India' },
  { name: 'Singapore (SGT)', timezone: 'Asia/Singapore', country: 'Singapore' },
];

// ─── Fast Track Presets ───────────────────────────────────────────────────────
const FAST_TRACKS = [
  {
    label: 'NY → London',
    emoji: '🗽→🎡',
    zones: [
      { id: 'ft-nyc', tz: 'America/New_York', name: 'New York', country: 'USA' },
      { id: 'ft-lon', tz: 'Europe/London', name: 'London', country: 'United Kingdom' },
    ],
  },
  {
    label: 'SF → Tokyo',
    emoji: '🌁→🗼',
    zones: [
      { id: 'ft-sfo', tz: 'America/Los_Angeles', name: 'San Francisco', country: 'USA' },
      { id: 'ft-tyo', tz: 'Asia/Tokyo', name: 'Tokyo', country: 'Japan' },
    ],
  },
  {
    label: 'London → Dubai',
    emoji: '🎡→🌆',
    zones: [
      { id: 'ft-lon2', tz: 'Europe/London', name: 'London', country: 'United Kingdom' },
      { id: 'ft-dxb', tz: 'Asia/Dubai', name: 'Dubai', country: 'UAE' },
    ],
  },
  {
    label: 'Mumbai → Singapore',
    emoji: '🇮🇳→🇸🇬',
    zones: [
      { id: 'ft-bom', tz: 'Asia/Kolkata', name: 'Mumbai', country: 'India' },
      { id: 'ft-sin', tz: 'Asia/Singapore', name: 'Singapore', country: 'Singapore' },
    ],
  },
];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('resolver');
  const [zones, setZones] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const zonesParam = params.get('z');
    if (zonesParam) {
      try {
        const decoded = JSON.parse(atob(zonesParam));
        if (Array.isArray(decoded) && decoded.length > 0) {
          return decoded.map(z => ({ ...z, tz: z.tz || z.timezone }));
        }
      } catch { /* fall through */ }
    }
    return getInitialZones();
  });

  const [reminders, setReminders] = useState(getInitialReminders);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [copying, setCopying] = useState(false);
  const [use24Hour, setUse24Hour] = useState(() => localStorage.getItem('tz-master-24h') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [minimalMode, setMinimalMode] = useState(() => localStorage.getItem('tz-master-minimal') === 'true');

  // Always initialize to local current time (ignoring URL ?t= on first load for freshness)
  const [selectedMinutesOffset, setSelectedMinutesOffset] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const offset = params.get('t');
    // Only restore from URL if it was intentionally shared (url has 'z' param too)
    if (offset !== null && params.get('z') !== null) return parseInt(offset, 10);
    return getNowOffset();
  });

  // Live clock: update current time every minute
  useEffect(() => {
    const tick = () => setSelectedMinutesOffset(getNowOffset());
    // Only auto-tick when slider is at "now" (within 2 min tolerance) 
    // to avoid overriding manual adjustments
    const interval = setInterval(() => {
      setSelectedMinutesOffset(prev => {
        const now = getNowOffset();
        const diff = Math.abs(prev - now);
        // If close to "now" (within 3 minutes), keep synced
        if (diff <= 3 || diff >= 1437) return now;
        return prev;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('t', selectedMinutesOffset.toString());
    const encodedZones = btoa(JSON.stringify(zones.map(z => ({
      id: z.id, name: z.name, tz: z.tz || z.timezone, country: z.country
    }))));
    params.set('z', encodedZones);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [selectedMinutesOffset, zones]);

  // Persistence
  useEffect(() => { localStorage.setItem('tz-resolver-zones', JSON.stringify(zones)); }, [zones]);
  useEffect(() => { localStorage.setItem('tz-resolver-reminders', JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { localStorage.setItem('tz-master-24h', use24Hour); }, [use24Hour]);
  useEffect(() => { localStorage.setItem('tz-master-minimal', minimalMode); }, [minimalMode]);

  const removeZone = (idToRemove) => setZones(prev => prev.filter(z => z.id !== idToRemove));

  const addZone = (cityData) => {
    const newZone = {
      id: `${cityData.name}-${Date.now()}`,
      tz: cityData.timezone,
      name: cityData.name,
      country: cityData.country || cityData.admin1 || ''
    };
    setZones(prev => [...prev, newZone]);
    setActiveTab('resolver');
    setSearchQuery('');
    setSearchResults([]);
  };

  const swapTopTwo = () => {
    setZones(prev => {
      if (prev.length < 2) return prev;
      const rest = prev.slice(2);
      return [prev[1], prev[0], ...rest];
    });
  };

  const loadFastTrack = (track) => {
    // Keep local time zone at top if present, then fast track zones
    const localZone = zones.find(z => z.id === 'local');
    const newZones = localZone
      ? [localZone, ...track.zones]
      : track.zones;
    setZones(newZones);
    setSelectedMinutesOffset(getNowOffset());
    setActiveTab('resolver');
  };

  // Real-time City Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) { setSearchResults([]); return; }
      setIsSearching(true);
      try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=10&language=en&format=json`);
        const data = await response.json();
        setSearchResults(data.results ? data.results.filter(r => r.timezone) : []);
      } catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const resetToCurrentTime = () => setSelectedMinutesOffset(getNowOffset());

  const suggestGoldenHour = () => {
    let bestOffset = 0;
    let maxOverlap = -1;
    for (let offset = 0; offset < 1440; offset += 30) {
      let overlapCount = 0;
      const referenceDate = new Date();
      referenceDate.setUTCHours(0, offset, 0, 0);
      zones.forEach(zone => {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: zone.tz || zone.timezone, hour: 'numeric', hour12: false
        }).formatToParts(referenceDate);
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
        if (hour >= 8 && hour < 18) overlapCount++;
      });
      if (overlapCount > maxOverlap) {
        maxOverlap = overlapCount;
        bestOffset = offset;
      } else if (overlapCount === maxOverlap) {
        const currentOffset = getNowOffset();
        if (Math.abs(offset - currentOffset) < Math.abs(bestOffset - currentOffset)) bestOffset = offset;
      }
    }
    setSelectedMinutesOffset(bestOffset);
  };

  const getZonedParts = useCallback((date, timeZone) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone, hour: '2-digit', minute: '2-digit', hour12: !use24Hour,
        weekday: 'short', month: 'short', day: 'numeric', timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(date);
      const getPart = (type) => parts.find(p => p.type === type)?.value || '';
      const hour24 = parseInt(new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hour12: false }).format(date), 10);
      const timeStr = !use24Hour
        ? `${getPart('hour')}:${getPart('minute')}`
        : `${hour24.toString().padStart(2, '0')}:${getPart('minute')}`;
      return {
        time: timeStr, amPm: getPart('dayPeriod'),
        date: `${getPart('weekday')}, ${getPart('month')} ${getPart('day')}`,
        tzShort: getPart('timeZoneName'), hour24
      };
    } catch {
      return { time: '--:--', amPm: '', date: 'Invalid TZ', tzShort: '???', hour24: 0 };
    }
  }, [use24Hour]);

  const addReminder = (zone) => {
    const now = new Date();
    const utcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const anchor = addMinutes(utcStart, selectedMinutesOffset);
    const parts = getZonedParts(anchor, zone.tz);
    setReminders(prev => [{
      id: Date.now(), title: `Sync: ${zone.name}`,
      time: parts.time, amPm: parts.amPm, date: parts.date,
      tz: zone.tz, name: zone.name, offset: selectedMinutesOffset
    }, ...prev]);
    setActiveTab('reminders');
  };

  const copyMeetingSummary = () => {
    const now = new Date();
    const utcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const anchor = addMinutes(utcStart, selectedMinutesOffset);
    let summary = `📅 Meeting Schedule:\n`;
    zones.forEach(z => {
      const parts = getZonedParts(anchor, z.tz);
      summary += `• ${z.name}: ${parts.time} ${parts.amPm} (${parts.tzShort})\n`;
    });
    navigator.clipboard.writeText(summary);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const addToGoogleCalendar = (rem) => {
    const now = new Date();
    const anchor = addMinutes(startOfDay(now), rem.offset);
    const startStr = anchor.toISOString().replace(/-|:|\.\d+/g, '');
    const endStr = addMinutes(anchor, 30).toISOString().replace(/-|:|\.\d+/g, '');
    window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(rem.title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent('Scheduled via Timezone Master')}&sf=true&output=xml`, '_blank');
  };

  // ─── Anchor date for display ───────────────────────────────────────────────
  const now = new Date();
  const utcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const anchor = addMinutes(utcStart, selectedMinutesOffset);
  const isAtCurrentTime = Math.abs(selectedMinutesOffset - getNowOffset()) <= 2;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100 overflow-hidden flex flex-col antialiased font-sans">

      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen blur-[100px] animate-blob" />
        <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] bg-accent/20 rounded-full mix-blend-screen blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full mix-blend-screen blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      <main className="flex-1 flex flex-col min-h-0 w-full max-w-5xl mx-auto relative pt-safe">

        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">Timezone Master</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Elite Global Planner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Minimal Mode Toggle */}
            <button
              onClick={() => setMinimalMode(m => !m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${minimalMode
                  ? 'bg-accent/20 text-accent border-accent/30'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                }`}
              title={minimalMode ? 'Switch to Full Mode' : 'Switch to Minimal Mode'}
            >
              {minimalMode ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              {minimalMode ? 'Full' : 'Minimal'}
            </button>
            <button
              onClick={copyMeetingSummary}
              className="w-9 h-9 rounded-full glass flex items-center justify-center text-slate-300 hover:text-primary transition-all active:scale-90 relative"
              title="Copy meeting summary"
            >
              {copying ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copying && <span className="absolute -bottom-8 bg-emerald-500 text-white text-[8px] px-2 py-1 rounded font-black whitespace-nowrap animate-in fade-in slide-in-from-top-1">COPIED</span>}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full glass flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-90"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-32 scroll-smooth scrollbar-hide min-h-0 space-y-5 pt-5">

          {/* ═══ RESOLVER TAB ════════════════════════════════════════════════ */}
          {activeTab === 'resolver' && (
            <>
              {/* Fast Tracks */}
              <div>
                <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-3 px-1">⚡ Fast Tracks</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FAST_TRACKS.map(track => (
                    <button
                      key={track.label}
                      onClick={() => loadFastTrack(track)}
                      className="glass-dark rounded-2xl px-4 py-3 text-left hover:bg-primary/10 hover:border-primary/30 border border-white/5 transition-all active:scale-95 group"
                    >
                      <p className="text-base mb-1">{track.emoji}</p>
                      <p className="text-[11px] font-black text-white group-hover:text-primary transition-colors leading-tight">{track.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Synchronizer (hidden in minimal mode) */}
              {!minimalMode && (
                <div className="w-full glass rounded-[2rem] p-6 relative overflow-hidden shadow-2xl border-white/10 shrink-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h2 className="text-sm font-bold flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-primary" /> Synchronizer
                      {isAtCurrentTime && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse">Live</span>
                      )}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={suggestGoldenHour}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-95 border border-primary/20 text-[10px] font-black uppercase tracking-widest"
                        title="Suggest Best Meeting Time"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Golden Hour</span>
                      </button>
                      <div className="font-mono text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl text-primary-light border border-white/5 shadow-inner">
                        {Math.floor(selectedMinutesOffset / 60).toString().padStart(2, '0')}:{(selectedMinutesOffset % 60).toString().padStart(2, '0')} <span className="text-[9px] text-slate-500 font-black">UTC</span>
                      </div>
                      <button
                        onClick={resetToCurrentTime}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 border border-white/10 text-[10px] font-black uppercase tracking-widest"
                        title="Reset to Current Time"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reset</span>
                      </button>
                    </div>
                  </div>

                  <input
                    type="range" min="0" max="1439" value={selectedMinutesOffset}
                    onChange={(e) => setSelectedMinutesOffset(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-primary mb-3"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600 font-black uppercase tracking-widest px-1">
                    <span>00:00</span>
                    <span className="text-primary/60">Drag to set time</span>
                    <span>24:00</span>
                  </div>
                </div>
              )}

              {/* Global Grid */}
              <div>
                <div className="flex items-center justify-between px-1 mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">Global Grid</h3>
                    {zones.length >= 2 && (
                      <button
                        onClick={swapTopTwo}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95 text-[10px] font-black"
                        title="Swap top two cities"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Swap</span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="bg-primary/20 text-primary hover:bg-primary/30 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all active:scale-95"
                  >
                    + CONNECT CITY
                  </button>
                </div>

                {zones.length === 0 ? (
                  <div className="p-10 glass shadow-inner rounded-[2rem] text-center border-dashed border-slate-700 col-span-full">
                    <Globe className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-bold">No cities added yet.</p>
                    <p className="text-slate-600 text-xs mt-1">Tap a Fast Track above or "Connect City"</p>
                  </div>
                ) : (
                  <div className={`grid gap-3 ${minimalMode ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                    {zones.map(zone => {
                      const parts = getZonedParts(anchor, zone.tz);
                      const isWorking = parts.hour24 >= 8 && parts.hour24 <= 18;
                      const dstWarning = getDSTWarning(zone.tz || zone.timezone);

                      return (
                        <div key={zone.id} className={`glass-dark rounded-3xl border border-white/5 hover:border-white/15 transition-all active:scale-[0.99] group ${minimalMode ? 'p-5' : 'p-5'}`}>
                          {/* Card Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-1 h-10 rounded-full shrink-0 ${isWorking ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-700'}`} />
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xl leading-none">{getFlagEmoji(zone.country)}</span>
                                  <h4 className="text-sm font-bold text-white leading-tight">{zone.name}</h4>
                                  {isWorking && (
                                    <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded-full">OPEN</span>
                                  )}
                                </div>
                                <p className="text-[10px] font-medium text-slate-500 mt-0.5">{parts.tzShort}</p>
                              </div>
                            </div>
                            {/* Action buttons */}
                            {!minimalMode && (
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <button onClick={() => addReminder(zone)} className="bg-white/5 hover:bg-emerald-500/10 p-2 rounded-xl transition-all" title="Save Reminder">
                                  <Bell className="w-3.5 h-3.5 text-emerald-500" />
                                </button>
                                <button onClick={() => removeZone(zone.id)} className="bg-white/5 hover:bg-red-500/10 p-2 rounded-xl transition-all">
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </div>
                            )}
                            {minimalMode && (
                              <button onClick={() => removeZone(zone.id)} className="bg-white/5 hover:bg-red-500/10 p-1.5 rounded-lg transition-all ml-2">
                                <Trash2 className="w-3 h-3 text-slate-600 hover:text-red-500" />
                              </button>
                            )}
                          </div>

                          {/* Time Display */}
                          <div className="pl-4">
                            <p className={`font-black font-mono text-white tracking-tight leading-none ${minimalMode ? 'text-4xl' : 'text-3xl'}`}>
                              {parts.time}
                              {!use24Hour && parts.amPm && (
                                <span className="text-sm text-slate-400 font-sans ml-1.5">{parts.amPm}</span>
                              )}
                            </p>
                            <p className="text-[10px] font-bold text-primary/60 mt-1.5 uppercase tracking-widest">{parts.date}</p>

                            {/* DST Badge */}
                            {dstWarning && (
                              <div className="flex items-center gap-1 mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">
                                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                <p className="text-[9px] font-black text-amber-400 uppercase tracking-wide">{dstWarning}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ SEARCH TAB ══════════════════════════════════════════════════ */}
          {activeTab === 'search' && (
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative group">
                <Search className={`w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 transition-all ${isSearching ? 'text-primary scale-110' : 'text-slate-500 group-focus-within:text-white'}`} />
                <input
                  type="text" autoFocus placeholder="Search cities worldwide…"
                  className="w-full bg-slate-900 border border-slate-700/80 group-focus-within:border-primary rounded-[1.5rem] py-4 pl-14 pr-6 text-white text-base font-bold outline-none glass-dark transition-all focus:ring-4 focus:ring-primary/10 shadow-2xl"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery.length < 2 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase px-1">Regional Hubs</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {majorTimezones.map(tz => (
                      <button key={tz.timezone} onClick={() => addZone({ name: tz.name, timezone: tz.timezone, country: tz.country })}
                        className="text-left glass-dark rounded-2xl p-4 flex items-center gap-3 border border-white/5 hover:border-primary/40 transition-all hover:bg-primary/5 group active:scale-95">
                        <span className="text-xl">{getFlagEmoji(tz.country)}</span>
                        <div>
                          <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{tz.name}</p>
                          <p className="text-[10px] font-medium text-slate-500">{tz.timezone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                {isSearching && <div className="flex justify-center p-10"><Globe className="w-8 h-8 text-primary animate-spin opacity-50" /></div>}
                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <p className="text-center text-slate-500 font-bold py-10">No results found for "{searchQuery}"</p>
                )}
                {searchResults.map(city => (
                  <button key={city.id} onClick={() => addZone({ name: city.name, timezone: city.timezone, country: city.country || city.admin1 })}
                    className="w-full text-left glass-dark rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group active:scale-95">
                    <div className="flex items-center gap-4">
                      <span className="text-xl">{getFlagEmoji(city.country)}</span>
                      <div>
                        <p className="font-bold text-white">{city.name}</p>
                        <p className="text-xs text-slate-500">{city.country} • {city.timezone}</p>
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-primary group-hover:scale-125 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══ REMINDERS TAB ═══════════════════════════════════════════════ */}
          {activeTab === 'reminders' && (
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-500" /> Saved Reminders
                </h2>
                <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase tracking-tight">{reminders.length} saved</span>
              </div>

              {reminders.length === 0 ? (
                <div className="p-14 glass rounded-[2.5rem] text-center border-dashed border-slate-800 shadow-inner">
                  <Bell className="w-10 h-10 text-slate-900 mx-auto mb-3 opacity-50" />
                  <p className="text-slate-500 font-bold text-sm">No reminders saved yet</p>
                  <p className="text-slate-600 text-xs mt-1">Tap the bell icon on any city card</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reminders.map(rem => (
                    <div key={rem.id} className="glass-dark rounded-[2rem] p-6 border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-500/5 to-transparent shadow-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-base font-black text-white mb-0.5">{rem.title}</h4>
                          <p className="text-xs font-medium text-slate-500">{rem.name} • {rem.tz}</p>
                        </div>
                        <button onClick={() => setReminders(prev => prev.filter(r => r.id !== rem.id))} className="text-slate-700 hover:text-red-500 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <div className="text-emerald-400 text-2xl font-black font-mono tracking-tighter">
                          {rem.time} <span className="text-[10px] font-sans text-slate-500 uppercase ml-1">{rem.amPm}</span>
                        </div>
                        <button onClick={() => addToGoogleCalendar(rem)} className="flex items-center gap-2 text-[10px] font-extrabold bg-primary/20 hover:bg-primary/30 text-primary-light px-4 py-2.5 rounded-2xl transition-all active:scale-95">
                          <Calendar className="w-3.5 h-3.5" /> ADD TO CALENDAR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Navigation */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-xs sm:max-w-sm glass rounded-[2rem] p-2.5 flex justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10 z-50 backdrop-blur-3xl">
          <button onClick={() => setActiveTab('resolver')} className={`flex flex-col flex-1 items-center gap-1 py-3 rounded-[1.25rem] transition-all ${activeTab === 'resolver' ? 'text-primary bg-primary/10 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}>
            <Clock className="w-5 h-5" /><span className="text-[8px] font-black tracking-widest uppercase">Grid</span>
          </button>
          <button onClick={() => setActiveTab('reminders')} className={`flex flex-col flex-1 items-center gap-1 py-3 rounded-[1.25rem] transition-all ${activeTab === 'reminders' ? 'text-emerald-500 bg-emerald-500/10 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}>
            <Bell className="w-5 h-5" /><span className="text-[8px] font-black tracking-widest uppercase">Saved</span>
          </button>
          <button onClick={() => setActiveTab('search')} className={`flex flex-col flex-1 items-center gap-1 py-3 rounded-[1.25rem] transition-all ${activeTab === 'search' ? 'text-primary bg-primary/10 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}>
            <Search className="w-5 h-5" /><span className="text-[8px] font-black tracking-widest uppercase">Add City</span>
          </button>
        </nav>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowSettings(false)} />
          <div className="w-full max-w-sm glass rounded-[2.5rem] p-7 relative animate-in zoom-in-95 duration-200 shadow-2xl border-white/20">
            <h2 className="text-lg font-black text-white mb-5 flex items-center gap-3">
              <Settings className="w-5 h-5 text-primary" /> Preferences
            </h2>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">24-Hour Format</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Toggle time display style</p>
                </div>
                <button
                  onClick={() => setUse24Hour(!use24Hour)}
                  className={`w-12 h-7 rounded-full p-1 transition-all ${use24Hour ? 'bg-primary shadow-[0_0_12px_rgba(79,70,229,0.3)]' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-all ${use24Hour ? 'translate-x-5' : 'translate-x-0'} shadow-md`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Minimal Mode</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Hide Synchronizer planner</p>
                </div>
                <button
                  onClick={() => setMinimalMode(!minimalMode)}
                  className={`w-12 h-7 rounded-full p-1 transition-all ${minimalMode ? 'bg-accent shadow-[0_0_12px_rgba(139,92,246,0.3)]' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-all ${minimalMode ? 'translate-x-5' : 'translate-x-0'} shadow-md`} />
                </button>
              </div>
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 text-xs tracking-widest uppercase"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
