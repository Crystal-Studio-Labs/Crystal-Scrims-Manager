import React from 'react';
import { FileText, Trophy, Terminal, Server, ExternalLink, ShieldCheck } from 'lucide-react';

export const DocsPage: React.FC = () => {
  const scoringMatrix = [
    { rank: '#01 (WWCD)', placement: 10, label: 'WINNER WINNER CHICKEN DINNER' },
    { rank: '#02', placement: 6, label: 'RUNNER UP' },
    { rank: '#03', placement: 5, label: '3RD PLACE' },
    { rank: '#04', placement: 4, label: '4TH PLACE' },
    { rank: '#05', placement: 3, label: '5TH PLACE' },
    { rank: '#06', placement: 2, label: '6TH PLACE' },
    { rank: '#07', placement: 1, label: '7TH PLACE' },
    { rank: '#08', placement: 1, label: '8TH PLACE' },
    { rank: '#09 - #16+', placement: 0, label: 'ELIMINATED' },
  ];

  const commandsList = [
    { cmd: '/setup autostructure', desc: '1-Click magic: automatically creates category, #registration, #slotlist, and #idp channels with locked permissions.' },
    { cmd: '/setup wizard', desc: 'Interactive ChannelSelectMenu and RoleSelectMenu to bind existing server channels.' },
    { cmd: '/scrim create', desc: 'Provision a new scrim lobby with game preset (BGMI, Free Fire, Valorant, CODM, Apex), tier (T1/T2/T3), and slot count.' },
    { cmd: '/scrim open', desc: 'Broadcast registration embed with interactive modal popup buttons and ephemeral IDP reveal.' },
    { cmd: '/scrim panel', desc: 'Open interactive Admin Control Panel with quick action buttons (open, lock, cancel).' },
    { cmd: '/scrim slotlist', desc: 'Public command to inspect live confirmed squads, check-in status, and waitlist overflow.' },
    { cmd: '/scrim reserve', desc: 'Pre-allocate a slot for an invited VIP esports organization.' },
    { cmd: '/scrim kick', desc: 'Remove a no-show squad; automatically promotes Waitlist #1 into the freed slot.' },
    { cmd: '/scrim set-idp', desc: 'Store Room ID and Password for secure ephemeral retrieval by verified captains.' },
    { cmd: '/points add', desc: 'Record round placement and finish kills. Updates leaderboard rankings instantly.' },
    { cmd: '/points table', desc: 'Render the live tournament points table embed in chat or filter by round.' },
    { cmd: '/announce result', desc: 'Broadcast pre-defined Victory, Defeat, or Draw cards with celebratory GIFs.' },
    { cmd: '/bracket generate', desc: 'Generate single-elimination tournament bracket trees (4, 8, or 16 teams).' },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="border-b-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000]">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#FFE600] uppercase tracking-wider mb-1">
          <FileText className="w-4 h-4 text-[#FFE600]" />
          <span>OFFICIAL DOCUMENTATION & OPERATIONAL MANUAL</span>
        </div>
        <h1 className="font-mono text-3xl md:text-4xl font-black uppercase text-white tracking-tight">
          SCORING RULES & COMMAND GUIDE
        </h1>
        <p className="font-mono text-xs text-zinc-400 mt-1">
          Everything you need to know about point allocations, Discord slash commands, and free-tier infrastructure.
        </p>
      </div>

      {/* 1. Official Scoring Engine */}
      <section className="space-y-4">
        <div className="border-b-2 border-black pb-2 flex items-center justify-between">
          <h2 className="font-mono text-xl font-black uppercase text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FFDF00]" />
            PMGC / BGIS OFFICIAL SCORING MATRIX
          </h2>
          <span className="font-mono text-xs text-[#39FF14] font-bold">1 KILL = 1 POINT</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {scoringMatrix.map((item, idx) => (
            <div
              key={item.rank}
              className={`border-2 border-black bg-[#11141D] p-4 shadow-[3px_3px_0px_#000] flex items-center justify-between font-mono ${
                idx === 0 ? 'border-[#FFDF00] border-4' : ''
              }`}
            >
              <div>
                <span className="text-sm font-black text-white">{item.rank}</span>
                <span className="text-[10px] text-zinc-500 block">{item.label}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-[#00F0FF]">{item.placement}</span>
                <span className="text-[10px] text-zinc-400 block">PTS</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Complete Slash Command Suite */}
      <section className="space-y-4">
        <div className="border-b-2 border-black pb-2">
          <h2 className="font-mono text-xl font-black uppercase text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#00F0FF]" />
            DISCORD SLASH COMMANDS REFERENCE
          </h2>
          <p className="font-mono text-xs text-zinc-400 mt-0.5">
            11 production-tested slash commands for server administrators, staff organizers, and esports players.
          </p>
        </div>

        <div className="border-4 border-black bg-[#11141D] shadow-[6px_6px_0px_#000] divide-y-2 divide-zinc-800 font-mono text-xs">
          {commandsList.map((c) => (
            <div key={c.cmd} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-zinc-800/40">
              <div className="md:w-1/3">
                <code className="text-[#00F0FF] font-bold bg-black px-2 py-1 border border-zinc-700 block w-max">
                  {c.cmd}
                </code>
              </div>
              <div className="md:w-2/3 text-zinc-300">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 100% Free-Tier Cloud Hosting Support */}
      <section className="border-4 border-black bg-[#11141D] p-6 shadow-[6px_6px_0px_#000] space-y-4">
        <h2 className="font-mono text-xl font-black uppercase text-white flex items-center gap-2 border-b-2 border-zinc-800 pb-3">
          <Server className="w-5 h-5 text-[#39FF14]" />
          UNIVERSAL HOSTING CONFIGURATIONS
        </h2>

        <p className="font-mono text-xs text-zinc-300 leading-relaxed">
          <strong>Crystal Scrims Manager</strong> ships with pre-configured templates for 6 major free hosting platforms:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 font-mono text-xs">
          <div className="border-2 border-zinc-800 bg-[#090B10] p-4 shadow-[2px_2px_0px_#000]">
            <span className="text-[#00F0FF] font-bold block mb-1">RENDER.COM</span>
            <span className="text-zinc-400 text-[11px]">Free Web Service with automated keep-alive HTTP server on port 8080.</span>
          </div>

          <div className="border-2 border-zinc-800 bg-[#090B10] p-4 shadow-[2px_2px_0px_#000]">
            <span className="text-[#39FF14] font-bold block mb-1">KOYEB</span>
            <span className="text-zinc-400 text-[11px]">Free micro-instance deploying via koyeb.yaml with zero cold starts.</span>
          </div>

          <div className="border-2 border-zinc-800 bg-[#090B10] p-4 shadow-[2px_2px_0px_#000]">
            <span className="text-[#FF0055] font-bold block mb-1">FLY.IO</span>
            <span className="text-zinc-400 text-[11px]">Deploy via fly.toml with global edge routing and persistent volume mounts.</span>
          </div>

          <div className="border-2 border-zinc-800 bg-[#090B10] p-4 shadow-[2px_2px_0px_#000]">
            <span className="text-[#FFE600] font-bold block mb-1">TURSO LIBSQL</span>
            <span className="text-zinc-400 text-[11px]">9GB free cloud LibSQL database with sub-millisecond edge replicas.</span>
          </div>

          <div className="border-2 border-zinc-800 bg-[#090B10] p-4 shadow-[2px_2px_0px_#000]">
            <span className="text-white font-bold block mb-1">DOCKER COMPOSE</span>
            <span className="text-zinc-400 text-[11px]">Containerized deployment via multi-stage alpine Dockerfile and compose file.</span>
          </div>

          <div className="border-2 border-zinc-800 bg-[#090B10] p-4 shadow-[2px_2px_0px_#000]">
            <span className="text-[#00F0FF] font-bold block mb-1">VERCEL & NETLIFY</span>
            <span className="text-zinc-400 text-[11px]">Static dashboard builds with edge rewrites configured in vercel.json.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
