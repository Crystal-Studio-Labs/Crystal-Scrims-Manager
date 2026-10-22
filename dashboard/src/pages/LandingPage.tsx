import React from 'react';
import { 
  Trophy, 
  Gamepad2, 
  ShieldCheck, 
  Radio, 
  ArrowRight, 
  Key, 
  Users, 
  Zap, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface Lobby {
  lobbyId: string;
  title: string;
  tier: string;
  gameType: string;
  totalSlots: number;
  status: string;
  createdAt: string;
}

interface LandingPageProps {
  lobbies: Lobby[];
  onSelectEvent: (lobbyId: string) => void;
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  lobbies,
  onSelectEvent,
  onNavigate,
}) => {
  const ongoingLobbies = lobbies.filter((l) => l.status === 'OPEN' || l.status === 'LIVE');
  const featuredLobby = ongoingLobbies[0] || lobbies[0];

  const gamePresets = [
    { name: 'BGMI / PUBG Mobile', format: '25 Squads • Battle Royale', badge: 'BGMI', color: '#00F0FF' },
    { name: 'Free Fire', format: '12 Squads • Rush Royale', badge: 'FREEFIRE', color: '#FFE600' },
    { name: 'Valorant', format: '5v5 Custom • Tactical FPS', badge: 'VALORANT', color: '#FF0055' },
    { name: 'Call of Duty Mobile', format: '25 Squads • BR Classic', badge: 'CODM', color: '#39FF14' },
    { name: 'Apex Legends', format: '20 Trios • Arena / BR', badge: 'APEX', color: '#00F0FF' },
    { name: 'Custom Tournaments', format: 'Flexible 2 to 100 Teams', badge: 'CUSTOM', color: '#FFFFFF' },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* ======================================================== */}
      {/* 1. INDUSTRIAL HERO SECTION                               */}
      {/* ======================================================== */}
      <section className="relative border-b-4 border-black bg-[#11141D] p-8 md:p-14 shadow-[6px_6px_0px_#000] overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2433_1px,transparent_1px),linear-gradient(to_bottom,#1f2433_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto space-y-6 text-center md:text-left">
          {/* Top Tag */}
          <div className="inline-flex items-center space-x-2 border-2 border-black bg-[#00F0FF] text-black px-3.5 py-1 text-xs font-mono font-black uppercase shadow-[2px_2px_0px_#000]">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>ENTERPRISE OPEN-SOURCE ESPORTS ENGINE</span>
          </div>

          {/* Main Giant Headline */}
          <h1 className="font-mono text-4xl sm:text-5xl md:text-7xl font-black uppercase text-white tracking-tight leading-none">
            THE ZERO-LATENCY <br />
            <span className="text-[#00F0FF] bg-black px-2 inline-block border-2 border-[#00F0FF] shadow-[4px_4px_0px_#00F0FF] my-1">
              SCRIMS & TOURNAMENT
            </span> <br />
            INFRASTRUCTURE
          </h1>

          <p className="font-mono text-sm sm:text-base text-zinc-300 max-w-3xl leading-relaxed">
            Engineered for high-stakes esports communities. Autonomous slot reservations, ephemeral Room ID & Password dispatch, 
            instant waitlist overflow promotions, and automated points tables. Built to run <strong>100% on free-tier cloud servers</strong>.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4 justify-center md:justify-start">
            <button
              onClick={() => onNavigate('events')}
              className="border-2 border-black bg-[#39FF14] text-black px-6 py-3 font-mono text-sm font-black uppercase shadow-[4px_4px_0px_#000] hover:bg-[#32e012] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>EXPLORE ALL EVENTS ({lobbies.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className="border-2 border-black bg-[#181C28] text-white px-6 py-3 font-mono text-sm font-black uppercase shadow-[4px_4px_0px_#000] hover:bg-zinc-800 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#FF0055]" />
              <span>ORGANIZER COMMAND DECK</span>
            </button>

            <button
              onClick={() => onNavigate('docs')}
              className="border-2 border-black bg-[#FFE600] text-black px-5 py-3 font-mono text-sm font-black uppercase shadow-[4px_4px_0px_#000] hover:bg-yellow-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              SCORING RULES
            </button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t-2 border-zinc-800">
            <div className="border-2 border-black bg-[#090B10] p-4 shadow-[3px_3px_0px_#000]">
              <span className="font-mono text-[11px] text-zinc-500 uppercase block">ACTIVE SCRIMS</span>
              <span className="font-mono text-2xl font-black text-[#00F0FF]">{lobbies.length} TOURNAMENTS</span>
            </div>
            <div className="border-2 border-black bg-[#090B10] p-4 shadow-[3px_3px_0px_#000]">
              <span className="font-mono text-[11px] text-zinc-500 uppercase block">SLOT ENGINE</span>
              <span className="font-mono text-2xl font-black text-[#39FF14]">&lt;1MS RUSH</span>
            </div>
            <div className="border-2 border-black bg-[#090B10] p-4 shadow-[3px_3px_0px_#000]">
              <span className="font-mono text-[11px] text-zinc-500 uppercase block">IDP DELIVERY</span>
              <span className="font-mono text-2xl font-black text-[#FF0055]">100% EPHEMERAL</span>
            </div>
            <div className="border-2 border-black bg-[#090B10] p-4 shadow-[3px_3px_0px_#000]">
              <span className="font-mono text-[11px] text-zinc-500 uppercase block">CLOUD COST</span>
              <span className="font-mono text-2xl font-black text-[#FFE600]">$0 / FREE TIER</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. FEATURED LIVE TOURNAMENT SPOTLIGHT                     */}
      {/* ======================================================== */}
      {featuredLobby && (
        <section className="border-4 border-black bg-[#11141D] p-6 shadow-[6px_6px_0px_#000]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-zinc-800 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-[#39FF14] animate-ping"></span>
              <span className="font-mono text-xs font-bold text-[#39FF14] uppercase tracking-wider">
                FEATURED TOURNAMENT SPOTLIGHT
              </span>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              ID: <code className="text-[#00F0FF] bg-black px-2 py-0.5 border border-zinc-700">{featuredLobby.lobbyId}</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-black bg-[#00F0FF] text-black text-[10px] font-mono font-bold px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                  {featuredLobby.gameType}
                </span>
                <span className="border border-black bg-zinc-800 text-white text-[10px] font-mono font-bold px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                  TIER {featuredLobby.tier}
                </span>
                <span className="border border-black bg-[#39FF14] text-black text-[10px] font-mono font-bold px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                  STATUS: {featuredLobby.status}
                </span>
              </div>
              <h3 className="font-mono text-2xl md:text-3xl font-black uppercase text-white tracking-tight">
                {featuredLobby.title}
              </h3>
              <p className="font-mono text-xs text-zinc-400">
                Total Capacity: <strong>{featuredLobby.totalSlots} Slots</strong> • Registered: <strong>{featuredLobby.createdAt.slice(0, 10)}</strong>
              </p>
            </div>

            <div className="flex md:justify-end">
              <button
                onClick={() => onSelectEvent(featuredLobby.lobbyId)}
                className="w-full md:w-auto border-2 border-black bg-[#00F0FF] text-black px-6 py-3 font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_#000] hover:bg-cyan-300 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center space-x-2"
              >
                <span>OPEN SQUADS & STANDINGS</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 3. MULTI-GAME PRESETS MATRIX                              */}
      {/* ======================================================== */}
      <section className="space-y-6">
        <div className="border-b-2 border-black pb-3 flex items-center justify-between">
          <div>
            <h2 className="font-mono text-xl md:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-[#00F0FF]" /> SUPPORTED ESPORTS DISCIPLINES
            </h2>
            <p className="font-mono text-xs text-zinc-400 mt-1">
              Custom preset slots, point systems, and match setups pre-configured out-of-the-box.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gamePresets.map((g) => (
            <div
              key={g.badge}
              className="border-2 border-black bg-[#11141D] p-5 shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  style={{ backgroundColor: g.color }}
                  className="border border-black text-black font-mono text-xs font-black px-2 py-0.5 shadow-[2px_2px_0px_#000]"
                >
                  {g.badge}
                </span>
                <Zap className="w-4 h-4 text-zinc-500" />
              </div>
              <h4 className="font-mono text-lg font-bold uppercase text-white mb-1">{g.name}</h4>
              <p className="font-mono text-xs text-zinc-400">{g.format}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. CORE ENGINE BENTO GRID                                 */}
      {/* ======================================================== */}
      <section className="space-y-6">
        <div className="border-b-2 border-black pb-3">
          <h2 className="font-mono text-xl md:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#39FF14]" /> ENGINE CAPABILITIES
          </h2>
          <p className="font-mono text-xs text-zinc-400 mt-1">
            Why esports organizers and tournament administrators choose Crystal Scrims Manager.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="border-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] space-y-3">
            <div className="w-10 h-10 border-2 border-black bg-[#00F0FF] text-black flex items-center justify-center font-bold shadow-[2px_2px_0px_#000]">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-black uppercase text-white">Ephemeral Room IDP</h3>
            <p className="font-mono text-xs text-zinc-400 leading-relaxed">
              No leaked passwords in public chat. Captains click a private Discord button that retrieves Room ID & Password ephemerally, ensuring only confirmed rosters join.
            </p>
          </div>

          {/* Card 2 */}
          <div className="border-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] space-y-3">
            <div className="w-10 h-10 border-2 border-black bg-[#39FF14] text-black flex items-center justify-center font-bold shadow-[2px_2px_0px_#000]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-black uppercase text-white">Atomic Slot Rush</h3>
            <p className="font-mono text-xs text-zinc-400 leading-relaxed">
              Sub-millisecond registration concurrency prevents race conditions. When max slots are filled, teams seamlessly overflow into a live prioritized waitlist.
            </p>
          </div>

          {/* Card 3 */}
          <div className="border-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] space-y-3">
            <div className="w-10 h-10 border-2 border-black bg-[#FF0055] text-white flex items-center justify-center font-bold shadow-[2px_2px_0px_#000]">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-black uppercase text-white">Dynamic Points Table</h3>
            <p className="font-mono text-xs text-zinc-400 leading-relaxed">
              Automates PMGC/BGIS scoring with placement points and finish kills. Renders real-time leaderboards on both Discord embeds and the Web Dashboard.
            </p>
          </div>

          {/* Card 4 */}
          <div className="border-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] space-y-3">
            <div className="w-10 h-10 border-2 border-black bg-[#FFE600] text-black flex items-center justify-center font-bold shadow-[2px_2px_0px_#000]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-black uppercase text-white">Auto-Outcome Broadcasts</h3>
            <p className="font-mono text-xs text-zinc-400 leading-relaxed">
              Pre-defined victory, defeat, and draw cards with celebratory GIFs sent straight to your designated results channel when organizers record match conclusions.
            </p>
          </div>

          {/* Card 5 */}
          <div className="border-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] space-y-3">
            <div className="w-10 h-10 border-2 border-black bg-[#00F0FF] text-black flex items-center justify-center font-bold shadow-[2px_2px_0px_#000]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-black uppercase text-white">1-Click Server Wizard</h3>
            <p className="font-mono text-xs text-zinc-400 leading-relaxed">
              Run <code className="text-[#00F0FF]">/setup autostructure</code> and the bot automatically creates the category, registration channel, locked slotlist, and IDP channel.
            </p>
          </div>

          {/* Card 6 */}
          <div className="border-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] space-y-3">
            <div className="w-10 h-10 border-2 border-black bg-[#39FF14] text-black flex items-center justify-center font-bold shadow-[2px_2px_0px_#000]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-black uppercase text-white">100% Free Hosting</h3>
            <p className="font-mono text-xs text-zinc-400 leading-relaxed">
              Ready-to-deploy configurations for Render, Koyeb, Fly.io, Railway, and Docker with zero paid dependencies. Uses free Turso LibSQL or local SQLite.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. QUICK WORKFLOW GUIDE                                   */}
      {/* ======================================================== */}
      <section className="border-4 border-black bg-[#090B10] p-8 shadow-[6px_6px_0px_#000]">
        <h2 className="font-mono text-xl font-black uppercase text-white mb-6 text-center">
          3-STEP OPERATIONAL FLOW
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-2 border-zinc-800 bg-[#11141D] p-5 shadow-[3px_3px_0px_#000]">
            <span className="font-mono text-xs font-black text-[#00F0FF] bg-black px-2 py-0.5 border border-zinc-700 block w-max mb-2">
              STEP 01
            </span>
            <h4 className="font-mono text-sm font-bold uppercase text-white mb-1">PROVISION LOBBY</h4>
            <p className="font-mono text-xs text-zinc-400">
              Run <code className="text-[#00F0FF]">/scrim create</code> in Discord or provision via the web dashboard. Select your game preset, tier, and slots.
            </p>
          </div>

          <div className="border-2 border-zinc-800 bg-[#11141D] p-5 shadow-[3px_3px_0px_#000]">
            <span className="font-mono text-xs font-black text-[#39FF14] bg-black px-2 py-0.5 border border-zinc-700 block w-max mb-2">
              STEP 02
            </span>
            <h4 className="font-mono text-sm font-bold uppercase text-white mb-1">LAUNCH REGISTRATIONS</h4>
            <p className="font-mono text-xs text-zinc-400">
              Run <code className="text-[#39FF14]">/scrim open</code>. Captains submit their squad lineup via modal popups and receive secure room credentials.
            </p>
          </div>

          <div className="border-2 border-zinc-800 bg-[#11141D] p-5 shadow-[3px_3px_0px_#000]">
            <span className="font-mono text-xs font-black text-[#FF0055] bg-black px-2 py-0.5 border border-zinc-700 block w-max mb-2">
              STEP 03
            </span>
            <h4 className="font-mono text-sm font-bold uppercase text-white mb-1">CALCULATE & BROADCAST</h4>
            <p className="font-mono text-xs text-zinc-400">
              Record match finishes via <code className="text-[#FF0055]">/points add</code> or Web Studio. Broadcast victory cards via <code className="text-[#FF0055]">/announce result</code>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
