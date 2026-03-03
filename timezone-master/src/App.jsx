import { useState, useEffect, useMemo } from 'react';
import { Settings, Plus, MapPin, Search, Trash2, Clock, Globe, ArrowLeft, Bell, Calendar, ExternalLink, ChevronRight, Copy, Check, Sparkles } from 'lucide-react';
import { addMinutes, startOfDay } from 'date-fns';
import flagData from 'country-flag-emoji-json';

// Helper to find flag emoji by country name
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

const getInitialZones = () => {
  const saved = localStorage.getItem('tz-resolver-zones');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved zones', e);
    }
  }
  return [
    { id: 'local', tz: Intl.DateTimeFormat().resolvedOptions().timeZone, name: 'Local Time', country: 'Auto' },
    { id: 'utc', tz: 'UTC', name: 'Coordinated Universal', country: 'Global' },
    { id: 'pst', tz: 'America/Los_Angeles', name: 'Los Angeles', country: 'USA' }
  ];
};

const getInitialReminders = () => {
  const saved = localStorage.getItem('tz-resolver-reminders');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
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

export default function App() {
  const [activeTab, setActiveTab] = useState('resolver');
  const [zones, setZones] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const zonesParam = params.get('z');
    if (zonesParam) {
      try {
        const decoded = JSON.parse(atob(zonesParam));
        if (Array.isArray(decoded) && decoded.length > 0) {
          return decoded.map(z => ({
            ...z,
            tz: z.tz || z.timezone // Consistency fix
          }));
        }
      } catch (e) {
        console.error('Failed to parse zones from URL', e);
      }
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

  // The central interactive time (offset in minutes from start of today UTC)
  const [selectedMinutesOffset, setSelectedMinutesOffset] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const offset = params.get('t');
    if (offset !== null) return parseInt(offset, 10);

    const now = new Date();
    return now.getUTCHours() * 60 + now.getUTCMinutes();
  });

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('t', selectedMinutesOffset.toString());

    // Encode zones as base64 to keep URL clean-ish
    const encodedZones = btoa(JSON.stringify(zones.map(z => ({
      id: z.id,
      name: z.name,
      tz: z.tz || z.timezone,
      country: z.country
    }))));
    params.set('z', encodedZones);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [selectedMinutesOffset, zones]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('tz-resolver-zones', JSON.stringify(zones));
  }, [zones]);

  useEffect(() => {
    localStorage.setItem('tz-resolver-reminders', JSON.stringify(reminders));
  }, [reminders]);
  useEffect(() => {
    localStorage.setItem('tz-master-24h', use24Hour);
  }, [use24Hour]);

  const removeZone = (idToRemove) => {
    setZones(prev => prev.filter(z => z.id !== idToRemove));
  };

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

  // Real-time City Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=10&language=en&format=json`);
        const data = await response.json();
        if (data.results) {
          setSearchResults(data.results.filter(r => r.timezone));
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Crash-proof formatting
  const resetToCurrentTime = () => {
    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    setSelectedMinutesOffset(utcMinutes);
  };

  const suggestGoldenHour = () => {
    let bestOffset = 0;
    let maxOverlap = -1;

    // Check every 30 mins
    for (let offset = 0; offset < 1440; offset += 30) {
      let overlapCount = 0;

      const referenceDate = new Date();
      referenceDate.setUTCHours(0, offset, 0, 0);

      zones.forEach(zone => {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: zone.tz || zone.timezone,
          hour: 'numeric',
          hour12: false
        }).formatToParts(referenceDate);
        const hourValue = parts.find(p => p.type === 'hour')?.value;
        const hour = hourValue ? parseInt(hourValue, 10) : 0;

        // Working hours: 8 AM to 6 PM (18:00)
        if (hour >= 8 && hour < 18) {
          overlapCount++;
        }
      });

      if (overlapCount > maxOverlap) {
        maxOverlap = overlapCount;
        bestOffset = offset;
      } else if (overlapCount === maxOverlap) {
        const now = new Date();
        const currentOffset = now.getUTCHours() * 60 + now.getUTCMinutes();
        if (Math.abs(offset - currentOffset) < Math.abs(bestOffset - currentOffset)) {
          bestOffset = offset;
        }
      }
    }
    setSelectedMinutesOffset(bestOffset);
  };


  const getZonedParts = (date, timeZone) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: !use24Hour,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(date);
      const getPart = (type) => parts.find(p => p.type === type)?.value || '';

      const hour24 = parseInt(new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hour12: false }).format(date), 10);
      const timeStr = !use24Hour ? `${getPart('hour')}:${getPart('minute')}` : `${hour24.toString().padStart(2, '0')}:${getPart('minute')}`;

      return {
        time: timeStr,
        amPm: getPart('dayPeriod'),
        date: `${getPart('weekday')}, ${getPart('month')} ${getPart('day')}`,
        tzShort: getPart('timeZoneName'),
        hour24
      };
    } catch (e) {
      return { time: '--:--', amPm: '', date: 'Invalid TZ', tzShort: '???', hour24: 0 };
    }
  };

  const addReminder = (zone) => {
    const now = new Date();
    const utcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const anchor = addMinutes(utcStart, selectedMinutesOffset);
    const parts = getZonedParts(anchor, zone.tz);
    const newReminder = {
      id: Date.now(),
      title: `Sync: ${zone.name}`,
      time: parts.time,
      amPm: parts.amPm,
      date: parts.date,
      tz: zone.tz,
      name: zone.name,
      offset: selectedMinutesOffset
    };
    setReminders(prev => [newReminder, ...prev]);
    setActiveTab('reminders');
  };

  const copyMeetingSummary = () => {
    const now = new Date();
    const utcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const anchor = addMinutes(utcStart, selectedMinutesOffset);
    let summary = `📅 Meeting Schedule Summary:\n`;
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
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(rem.title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent('Scheduled via Timezone Master')}&sf=true&output=xml`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100 overflow-hidden flex flex-col antialiased font-sans">
      {/* Background Animated Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen blur-[100px] animate-blob" />
        <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] bg-accent/20 rounded-full mix-blend-screen blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full mix-blend-screen blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main Layout Wrapper */}
      <main className="flex-1 flex flex-col min-h-0 w-full max-w-2xl mx-auto relative pt-safe pb-safe">

        {/* Header */}
        <header className="px-6 py-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Timezone Master</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Elite Global Planner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyMeetingSummary} className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-300 hover:text-primary transition-all active:scale-90 relative">
              {copying ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              {copying && <span className="absolute -bottom-8 bg-emerald-500 text-white text-[8px] px-2 py-1 rounded font-black whitespace-nowrap animate-in fade-in slide-in-from-top-1">COPIED</span>}
            </button>
            <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-90">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-40 space-y-6 scroll-smooth scrollbar-hide min-h-0">

          {activeTab === 'resolver' && (
            <>
              {/* Synchronizer Card */}
              <div className="w-full glass rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl border-white/10 shrink-0">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Synchronizer
                  </h2>
                  <p className="sr-only">
                    The Timezone Resolver Synchronizer is an interactive time-anchoring tool for global teams. It uses a draggable UTC offset slider to resolve local times across multiple geographic regions simultaneously. This feature handles international daylight savings time patterns automatically without manual calculation.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={suggestGoldenHour}
                      className="group flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-95 border border-primary/20"
                      title="Suggest Best Meeting Time"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Golden Hour</span>
                    </button>
                    <div className="font-mono text-sm bg-slate-800/80 px-4 py-2 rounded-2xl text-primary-light border border-white/5 shadow-inner">
                      {Math.floor(selectedMinutesOffset / 60).toString().padStart(2, '0')}:{(selectedMinutesOffset % 60).toString().padStart(2, '0')} <span className="text-[10px] text-slate-500 font-sans font-black ml-1">UTC</span>
                    </div>
                    <button
                      onClick={resetToCurrentTime}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white group"
                      title="Reset to Current Time"
                    >
                      <Clock className="w-4 h-4 group-active:rotate-12 transition-transform shadow-lg" />
                    </button>
                  </div>
                </div>

                <input
                  type="range" min="0" max="1439" value={selectedMinutesOffset}
                  onChange={(e) => setSelectedMinutesOffset(Number(e.target.value))}
                  className="w-full h-3 bg-slate-900 rounded-full appearance-none cursor-pointer accent-primary hover:accent-accent transition-all mb-4"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">
                  <span>00:00</span>
                  <span className="text-primary/70 animate-pulse">Drag to anchor time</span>
                  <span>24:00</span>
                </div>
              </div>

              {/* Timezones List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black text-slate-500 tracking-[0.3em] uppercase">Active Pipelines</h3>
                  <p className="sr-only">
                    Active Pipelines represent the real-time timezone nodes selected by the user. Each pipeline shows the specific localized date and time based on the active synchronizer anchor. Working hour visualizations (green indicators) highlight colleagues available between 08:00 and 18:00 in their respective local timezones.
                  </p>
                  <button onClick={() => setActiveTab('search')} className="bg-primary/20 text-primary hover:bg-primary/30 px-5 py-2 rounded-full text-xs font-black tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/10">
                    + CONNECT CITY
                  </button>
                </div>

                {zones.length === 0 ? (
                  <div className="p-12 glass shadow-inner rounded-[2rem] text-center border-dashed border-slate-700">
                    <Globe className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm font-bold">No data nodes connected.</p>
                  </div>
                ) : (
                  zones.map(zone => {
                    const now = new Date();
                    const utcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                    const anchor = addMinutes(utcStart, selectedMinutesOffset);
                    const parts = getZonedParts(anchor, zone.tz);
                    const isWorking = parts.hour24 >= 8 && parts.hour24 <= 18;

                    return (
                      <div key={zone.id} className="w-full glass-dark rounded-3xl p-6 flex items-center justify-between group hover:bg-slate-800/40 hover:border-white/20 transition-all border border-white/5 active:scale-[0.99]">
                        <div className="flex items-center gap-4">
                          <div className={`w-1.5 h-12 rounded-full transition-all ${isWorking ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-700'}`}></div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl leading-none">{getFlagEmoji(zone.country)}</span>
                              <h4 className="text-lg font-bold text-white">{zone.name}</h4>
                              {isWorking && <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-full">ACTIVE</span>}
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">{parts.tzShort} • {zone.tz}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-2xl font-black font-mono text-white tracking-tighter">
                              {parts.time} <span className="text-xs text-slate-500 font-sans">{parts.amPm}</span>
                            </p>
                            <p className="text-[9px] font-black text-primary-light/80 mt-1 uppercase tracking-widest">{parts.date}</p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={() => addReminder(zone)} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl transition-all" title="Sync Reminder"><Bell className="w-4 h-4 text-emerald-500" /></button>
                            <button onClick={() => removeZone(zone.id)} className="bg-white/5 hover:bg-red-500/10 p-2.5 rounded-xl transition-all"><Trash2 className="w-4 h-4 text-red-500" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {activeTab === 'search' && (
            <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative group">
                <Search className={`w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 transition-all ${isSearching ? 'text-primary scale-110' : 'text-slate-500 group-focus-within:text-white'}`} />
                <input
                  type="text" autoFocus placeholder="Search Vancouver, Tokyo, NYC..."
                  className="w-full bg-slate-900 border border-slate-700 group-focus-within:border-primary rounded-[1.5rem] py-5 pl-14 pr-6 text-white text-lg font-bold outline-none glass-dark transition-all ring-0 focus:ring-4 focus:ring-primary/10 shadow-2xl"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery.length < 2 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-500 tracking-[0.3em] uppercase px-2">Regional Hubs</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {majorTimezones.map(tz => (
                      <button key={tz.timezone} onClick={() => addZone({ name: tz.name, timezone: tz.timezone, country: tz.country })}
                        className="text-left glass-dark rounded-2xl p-4 flex items-center gap-4 border border-white/5 hover:border-primary/50 transition-all hover:bg-primary/5 group active:scale-95">
                        <span className="text-2xl shadow-xl">{getFlagEmoji(tz.country)}</span>
                        <div>
                          <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{tz.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 truncate">{tz.timezone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {isSearching && <div className="flex justify-center p-12"><Globe className="w-10 h-10 text-primary animate-spin opacity-50" /></div>}
                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && <p className="text-center text-slate-500 font-bold">Node not found.</p>}
                {searchResults.map(city => (
                  <button key={city.id} onClick={() => addZone({ name: city.name, timezone: city.timezone, country: city.country || city.admin1 })}
                    className="w-full text-left glass-dark rounded-2xl p-5 flex items-center justify-between border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group active:scale-95">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{getFlagEmoji(city.country)}</span>
                      <div>
                        <p className="font-extrabold text-white text-lg">{city.name}</p>
                        <p className="text-xs font-bold text-slate-500">{city.country} • {city.timezone}</p>
                      </div>
                    </div>
                    <Plus className="w-6 h-6 text-primary group-hover:scale-125 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-white flex items-center gap-3"><Bell className="w-6 h-6 text-emerald-500" /> Pipeline Syncs</h2>
                <p className="sr-only">
                  Pipeline Syncs are persistent meeting reminders scheduled via the Timezone Resolver interface. These reminders store the specific UTC offset anchor and provide one-click integration with Google Calendar, allowing IT professionals to automate cross-border meeting scheduling with absolute precision.
                </p>
                <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase tracking-tighter">{reminders.length} Anchored</span>
              </div>

              {reminders.length === 0 ? (
                <div className="p-16 glass rounded-[3rem] text-center border-dashed border-slate-800 shadow-inner">
                  <Bell className="w-12 h-12 text-slate-900 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-500 font-black tracking-widest uppercase text-xs">No active trackers</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reminders.map(rem => (
                    <div key={rem.id} className="glass-dark rounded-[2rem] p-7 border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-500/5 to-transparent shadow-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-black text-white mb-1">{rem.title}</h4>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{rem.name} • {rem.tz}</p>
                        </div>
                        <button onClick={() => setReminders(prev => prev.filter(r => r.id !== rem.id))} className="text-slate-700 hover:text-red-500 transition-colors p-1"><Trash2 className="w-5 h-5" /></button>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-5">
                        <div className="text-emerald-400 text-2xl font-black font-mono tracking-tighter">
                          {rem.time} <span className="text-[10px] font-sans text-slate-500 uppercase ml-1">{rem.amPm}</span>
                        </div>
                        <button onClick={() => addToGoogleCalendar(rem)} className="flex items-center gap-2 text-[10px] font-extrabold bg-primary/20 hover:bg-primary/30 text-primary-light px-5 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary/20">
                          <Calendar className="w-4 h-4" /> ADD TO CALENDAR
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
        <nav className="absolute bottom-6 left-6 right-6 glass rounded-[2.5rem] p-3 flex justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10 z-50 backdrop-blur-3xl">
          <button onClick={() => setActiveTab('resolver')} className={`flex flex-col flex-1 items-center gap-1.5 py-4 rounded-[1.5rem] transition-all ${activeTab === 'resolver' ? 'text-primary bg-primary/10 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}>
            <Clock className="w-6 h-6" /><span className="text-[9px] font-black tracking-widest uppercase">Nodes</span>
          </button>
          <button onClick={() => setActiveTab('reminders')} className={`flex flex-col flex-1 items-center gap-1.5 py-4 rounded-[1.5rem] transition-all ${activeTab === 'reminders' ? 'text-emerald-500 bg-emerald-500/10 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}>
            <Bell className="w-6 h-6" /><span className="text-[9px] font-black tracking-widest uppercase">Syncs</span>
          </button>
          <button onClick={() => setActiveTab('search')} className={`flex flex-col flex-1 items-center gap-1.5 py-4 rounded-[1.5rem] transition-all ${activeTab === 'search' ? 'text-primary bg-primary/10 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}>
            <Search className="w-6 h-6" /><span className="text-[9px] font-black tracking-widest uppercase">Connect</span>
          </button>
        </nav>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowSettings(false)} />
          <div className="w-full max-w-sm glass rounded-[2.5rem] p-8 relative animate-in zoom-in-95 duration-200 shadow-2xl border-white/20">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
              <Settings className="w-6 h-6 text-primary" /> Preferences
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">24-Hour Format</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Toggle time display style</p>
                </div>
                <button
                  onClick={() => setUse24Hour(!use24Hour)}
                  className={`w-14 h-8 rounded-full p-1 transition-all ${use24Hour ? 'bg-primary shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-slate-800'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white transition-all ${use24Hour ? 'translate-x-6' : 'translate-x-0'} shadow-md`} />
                </button>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95 text-xs tracking-widest uppercase"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
