import React from 'react';
import { 
  Trophy, 
  Gamepad2, 
  Radio, 
  ArrowRight, 
  Users, 
  Zap, 
  Calendar, 
  CheckCircle2, 
  Server,
  Layers,
  ChevronRight,
  ExternalLink,
  Flame,
  ShieldAlert
} from 'lucide-react';
import type { GuildInfo } from '../components/Header';

interface Lobby {
  lobbyId: string;
  guildId?: string;
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
  activeGuild?: GuildInfo;
  guildsCount: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  lobbies,
  onSelectEvent,
  onNavigate,
  activeGuild,
  guildsCount,
}) => {
  const ongoingLobbies = lobbies.filter((l) => l.status === 'OPEN' || l.status === 'LIVE');
  const featuredLobby = ongoingLobbies[0] || lobbies[0];

  const gamePresets = [
    { name: 'BGMI / PUBG Mobile', format: '25 Squads • Battle Royale', badge: 'BGMI', color: '#00F0FF' },
    { name: 'Free Fire', format: '12 Squads • Rush Royale', badge: 'FREEFIRE', color: '#FFDF00' },
    { name: 'Valorant', format: '5v5 Custom • Tactical FPS', badge: 'VALORANT', color: '#FF0055' },
    { name: 'Call of Duty Mobile', format: '25 Squads • BR Classic', badge: 'CODM', color: '#39FF14' },
    { name: 'Apex Legends', format: '20 Trios • Arena / BR', badge: 'APEX', color: '#00F0FF' },
    { name: 'Custom Esports', format: 'Flexible 2 to 100 Teams', badge: 'CUSTOM', color: '#FFFFFF' },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-12 font-mono">
      {/* ======================================================== */}
      {/* 1. INDUSTRIAL HERO SECTION                               */}
      {/* ======================================================== */}
      <section className="relative border-4 border-black dark:bg-[#0D0F16] bg-white p-6 sm:p-10 md:p-14 shadow-[6px_6px_0px_#000] overflow-hidden transition-colors">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2433_1px,transparent_1px),linear-gradient(to_bottom,#1f2433_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto space-y-6">
          {/* Top Tag / Server Identity */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-2 border-2 border-black bg-[#00F0FF] text-black px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_#000]">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{activeGuild ? `COMMUNITY: ${activeGuild.name}` : 'ENTERPRISE ESPORTS ENGINE'}</span>
            </div>

            {activeGuild && (
              <div className="inline-flex items-center space-x-1.5 border-2 border-black bg-[#FFDF00] text-black px-3 py-1 text-xs font-bold uppercase shadow-[2px_2px_0px_#000]">
                <Server className="w-3.5 h-3.5" />
                <span>PREFIX: {activeGuild.prefix}</span>
              </div>
            )}
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase dark:text-white text-zinc-950 tracking-tight leading-none">
            HIGH-VELOCITY <br />
            <span className="text-[#00F0FF] bg-black px-2 py-0.5 inline-block border-2 border-black shadow-[4px_4px_0px_#00F0FF] my-1.5">
              SCRIMS & TOURNAMENTS
            </span> <br />
            LIVE COMMAND CONSOLE
          </h1>

          <p className="text-xs sm:text-sm md:text-base dark:text-zinc-300 text-zinc-700 max-w-3xl leading-relaxed">
            {activeGuild 
              ? `Official tournament standings, team rosters, and real-time brackets for ${activeGuild.name}. Automated slot registrations, live points recalculation, and zero room leaks.`
              : `The universal, open-source competitive esports platform for Discord. Autonomous slot reservations, ephemeral Room ID & Password dispatch, real-time Discord leaderboard channels, and instant waitlist promotions.`
            }
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('events')}
              className="brutal-btn bg-[#00F0FF] text-black hover:bg-[#4df5ff] px-6 py-3 text-xs sm:text-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>EXPLORE ALL EVENTS</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('standings')}
              className="brutal-btn dark:bg-[#12151E] dark:text-white bg-zinc-100 text-black hover:bg-zinc-200 px-6 py-3 text-xs sm:text-sm"
            >
              <Trophy className="w-4 h-4 text-[#FFE600]" />
              <span>LIVE LEADERBOARDS</span>
            </button>

            <a
              href="https://github.com/Crystal-Studio-Labs/Crystal-Scrims-Manager"
              target="_blank"
              rel="noreferrer"
              className="brutal-btn bg-[#39FF14] text-black hover:bg-[#62ff44] px-5 py-3 text-xs sm:text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>BOT REPO</span>
            </a>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. REAL-TIME PLATFORM METRICS LEDGER                     */}
      {/* ======================================================== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL TOURNAMENTS', val: lobbies.length, color: '#00F0FF', note: 'TRACKED SCRIMS' },
          { label: 'ACTIVE / LIVE', val: ongoingLobbies.length, color: '#39FF14', note: 'SLOTS OPEN' },
          { label: 'SERVERS CONNECTED', val: guildsCount, color: '#FFDF00', note: 'DISCORD GUILDS' },
          { label: 'RUSH LATENCY', val: '< 0.8s', color: '#FF0055', note: 'ATOMIC CONCURRENCY' },
        ].map((stat, i) => (
          <div key={i} className="brutal-card p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs font-bold dark:text-zinc-400 text-zinc-600 uppercase">
              {stat.label}
            </span>
            <div className="text-2xl sm:text-4xl font-black my-2" style={{ color: stat.color }}>
              {stat.val}
            </div>
            <span className="text-[9px] sm:text-[10px] dark:text-zinc-500 text-zinc-500 tracking-wider">
              {stat.note}
            </span>
          </div>
        ))}
      </section>

      {/* ======================================================== */}
      {/* 3. FEATURED LIVE MATCH SPOTLIGHT                         */}
      {/* ======================================================== */}
      {featuredLobby && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black uppercase dark:text-white text-zinc-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF0055]" />
              <span>FEATURED ACTIVE LOBBY</span>
            </h2>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs font-bold text-[#00F0FF] hover:underline flex items-center gap-1"
            >
              VIEW ALL ({lobbies.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="brutal-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-l-8 border-l-[#00F0FF]">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="brutal-badge bg-[#00F0FF] text-black">
                  {featuredLobby.gameType}
                </span>
                <span className="brutal-badge bg-[#FFDF00] text-black">
                  {featuredLobby.tier}
                </span>
                <span className="brutal-badge bg-[#39FF14] text-black">
                  {featuredLobby.status}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black uppercase dark:text-white text-black">
                {featuredLobby.title}
              </h3>

              <p className="text-xs dark:text-zinc-400 text-zinc-600">
                Lobby ID: <strong className="font-mono text-[#00F0FF]">{featuredLobby.lobbyId}</strong> • Total Slot Capacity: <strong className="font-mono dark:text-white text-black">{featuredLobby.totalSlots} SQUADS</strong>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => onSelectEvent(featuredLobby.lobbyId)}
                className="brutal-btn bg-[#00F0FF] text-black hover:bg-cyan-300 px-6 py-3 text-xs sm:text-sm"
              >
                <Trophy className="w-4 h-4" />
                <span>VIEW LIVE STANDINGS</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 4. SUPPORTED ESPORTS PRESETS                             */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black uppercase dark:text-white text-zinc-900 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-[#39FF14]" />
          <span>MULTI-DISCIPLINE ESPORTS ENGINE</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gamePresets.map((preset, idx) => (
            <div key={idx} className="brutal-card p-5 space-y-3 hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between">
                <span className="brutal-badge text-black" style={{ backgroundColor: preset.color }}>
                  {preset.badge}
                </span>
                <span className="text-[10px] font-bold dark:text-zinc-500 text-zinc-600">PRESET #{idx + 1}</span>
              </div>
              <h3 className="text-base font-black uppercase dark:text-white text-black">
                {preset.name}
              </h3>
              <p className="text-xs dark:text-zinc-400 text-zinc-600">
                {preset.format}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. PLAYER HOW-TO REGISTER CHEATSHEET                    */}
      {/* ======================================================== */}
      <section className="brutal-card p-6 sm:p-8 space-y-6">
        <h2 className="text-lg sm:text-xl font-black uppercase dark:text-white text-zinc-900 flex items-center gap-2 border-b-2 dark:border-zinc-800 border-zinc-200 pb-3">
          <Zap className="w-5 h-5 text-[#FFDF00]" />
          <span>CAPTAIN & PLAYER QUICK START</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-7 h-7 bg-[#00F0FF] text-black font-black flex items-center justify-center border-2 border-black text-sm">
              1
            </div>
            <h4 className="font-black uppercase text-sm dark:text-white text-black">REGISTER SQUAD</h4>
            <p className="text-xs dark:text-zinc-400 text-zinc-600">
              When registration opens in your server's registration channel, type <code>/register</code> or click the <strong>📝 Register Team</strong> button.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-7 h-7 bg-[#39FF14] text-black font-black flex items-center justify-center border-2 border-black text-sm">
              2
            </div>
            <h4 className="font-black uppercase text-sm dark:text-white text-black">EPHEMERAL IDP</h4>
            <p className="text-xs dark:text-zinc-400 text-zinc-600">
              Once confirmed, verified captains click <strong>[🔑 View Room IDP]</strong>. Credentials are sent privately in Discord with zero room leak risk.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-7 h-7 bg-[#FF0055] text-white font-black flex items-center justify-center border-2 border-black text-sm">
              3
            </div>
            <h4 className="font-black uppercase text-sm dark:text-white text-black">LIVE STANDINGS</h4>
            <p className="text-xs dark:text-zinc-400 text-zinc-600">
              Watch real-time standings on this website or inside your server's auto-generated <code>📊・event-standings</code> channel.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
