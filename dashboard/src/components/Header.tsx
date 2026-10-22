import React from 'react';
import { ShieldCheck, Radio, ExternalLink, Terminal, Trophy, Calendar, FileText, Lock } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  botStatus: string;
  guildCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  botStatus,
  guildCount,
}) => {
  const navItems = [
    { id: 'landing', label: 'OVERVIEW', icon: Terminal, num: '01' },
    { id: 'events', label: 'EVENTS HUB', icon: Calendar, num: '02' },
    { id: 'standings', label: 'LEADERBOARDS', icon: Trophy, num: '03' },
    { id: 'admin', label: 'ADMIN DECK', icon: Lock, num: '04' },
    { id: 'docs', label: 'SCORING & DOCS', icon: FileText, num: '05' },
  ];

  return (
    <header className="border-b-4 border-black bg-[#11141D] sticky top-0 z-50">
      {/* Top Industrial Telemetry Ticker */}
      <div className="bg-[#090B10] border-b-2 border-zinc-800 px-6 py-1.5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse"></span>
            <span className="font-bold text-white uppercase tracking-wider">SYSTEM STATUS: {botStatus.toUpperCase()}</span>
          </span>
          <span className="hidden sm:inline text-zinc-500">|</span>
          <span className="hidden sm:inline">SERVERS: <strong className="text-[#00F0FF]">{guildCount} CONNECTED</strong></span>
          <span className="hidden md:inline text-zinc-500">|</span>
          <span className="hidden md:inline">STACK: <strong className="text-zinc-200">TS 5.6 + DISCORD.JS V14 + DRIZZLE</strong></span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[#FFE600] font-bold">FREE TIER: 100% COMPATIBLE</span>
          <span className="text-zinc-600">•</span>
          <a
            href="https://github.com/Crystal-Studio-Labs/Crystal-Scrims-Manager"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            GITHUB <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Neo-Brutalist Navbar */}
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentPage('landing')} 
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 bg-[#00F0FF] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[1px_1px_0px_#000] transition-all">
            <Radio className="w-6 h-6 text-black animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xl font-black tracking-tight text-white uppercase">
                CRYSTAL<span className="text-[#00F0FF]">.</span>SCRIMS
              </span>
              <span className="bg-[#FF0055] text-white border border-black text-[10px] font-mono font-bold px-1.5 py-0.2 shadow-[1px_1px_0px_#000]">
                V2.0
              </span>
            </div>
            <p className="font-mono text-[10px] text-zinc-400 tracking-widest uppercase">
              INDUSTRIAL ESPORTS ENGINE
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`font-mono text-xs font-bold uppercase px-3.5 py-2 border-2 border-black transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-[#00F0FF] text-black shadow-[3px_3px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-[#181C28] text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-[2px_2px_0px_#000]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>[{item.num}] {item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden lg:flex items-center space-x-3">
          <a
            href="https://github.com/Crystal-Studio-Labs/Crystal-Scrims-Manager"
            target="_blank"
            rel="noreferrer"
            className="border-2 border-black bg-[#39FF14] text-black text-xs font-mono font-bold uppercase px-4 py-2 shadow-[3px_3px_0px_#000] hover:bg-[#32e012] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5"
          >
            <span>STAR ON GITHUB</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
};
