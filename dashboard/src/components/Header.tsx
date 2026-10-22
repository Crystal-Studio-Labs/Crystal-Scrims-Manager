import React, { useState } from 'react';
import { 
  Radio, 
  ExternalLink, 
  Terminal, 
  Trophy, 
  Calendar, 
  FileText, 
  Sun, 
  Moon, 
  Server, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export interface GuildInfo {
  guildId: string;
  name: string;
  prefix: string;
  categoryName?: string;
  allowedGames?: string;
  createdAt: string;
}

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  botStatus: string;
  guildCount: number;
  guilds: GuildInfo[];
  selectedGuildId: string;
  onSelectGuild: (guildId: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  botStatus,
  guildCount,
  guilds,
  selectedGuildId,
  onSelectGuild,
  theme,
  onToggleTheme,
}) => {
  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'landing', label: 'OVERVIEW', icon: Terminal, num: '01' },
    { id: 'events', label: 'EVENTS HUB', icon: Calendar, num: '02' },
    { id: 'standings', label: 'LEADERBOARDS', icon: Trophy, num: '03' },
    { id: 'docs', label: 'RULES & COMMANDS', icon: FileText, num: '04' },
  ];

  const activeGuild = guilds.find((g) => g.guildId === selectedGuildId);

  return (
    <header className="border-b-4 border-black dark:bg-[#090B10] bg-white sticky top-0 z-50 transition-colors">
      {/* Top Industrial Telemetry Ticker */}
      <div className="dark:bg-[#050507] bg-zinc-100 border-b-2 dark:border-zinc-800 border-zinc-300 px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono dark:text-zinc-400 text-zinc-600 gap-2">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <span className="flex items-center space-x-1.5 dark:text-zinc-300 text-zinc-800">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse"></span>
            <span className="font-bold uppercase tracking-wider">SYSTEM: {botStatus.toUpperCase()}</span>
          </span>
          <span className="text-zinc-400">|</span>
          <span>NET: <strong className="text-[#00F0FF]">{guildCount} SERVERS</strong></span>
          {activeGuild && (
            <>
              <span className="hidden md:inline text-zinc-400">|</span>
              <span className="hidden md:inline text-zinc-300">
                ACTIVE: <strong className="text-[#FFE600]">{activeGuild.name}</strong> ({activeGuild.prefix})
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline text-[#FFE600] font-bold">100% FREE-TIER READY</span>
          <span className="hidden sm:inline text-zinc-400">•</span>
          <a
            href="https://github.com/Crystal-Studio-Labs/Crystal-Scrims-Manager"
            target="_blank"
            rel="noreferrer"
            className="dark:text-zinc-400 text-zinc-600 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors font-bold"
          >
            GITHUB <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div 
          onClick={() => {
            setCurrentPage('landing');
            setMobileMenuOpen(false);
          }} 
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 bg-[#00F0FF] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[1px_1px_0px_#000] transition-all">
            <Radio className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-mono text-lg sm:text-xl font-black tracking-tight dark:text-white text-black uppercase">
                CRYSTAL<span className="text-[#00F0FF]">.</span>SCRIMS
              </span>
              <span className="bg-[#FF0055] text-white border border-black text-[9px] font-mono font-bold px-1.5 py-0.2 shadow-[1px_1px_0px_#000]">
                V2.0
              </span>
            </div>
            <p className="font-mono text-[9px] sm:text-[10px] dark:text-zinc-400 text-zinc-600 tracking-wider uppercase">
              {activeGuild ? activeGuild.name : 'COMMUNITY ESPORTS PORTAL'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-2">
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
                    : 'dark:bg-[#12151E] dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 shadow-[2px_2px_0px_#000]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>[{item.num}] {item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools: Server Selector + Dark/Light Toggle + Mobile Hamburger */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Server Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setServerMenuOpen(!serverMenuOpen)}
              className="border-2 border-black dark:bg-[#12151E] bg-zinc-100 dark:text-zinc-200 text-zinc-900 px-3 py-1.5 text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#000] flex items-center gap-1.5 hover:border-[#00F0FF] transition-all"
            >
              <Server className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="max-w-[120px] sm:max-w-[150px] truncate">
                {activeGuild ? activeGuild.name : 'ALL SERVERS'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {serverMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 border-2 border-black dark:bg-[#0D0F16] bg-white shadow-[4px_4px_0px_#000] z-50 font-mono text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
                <div className="p-2 dark:bg-[#050507] bg-zinc-100 text-[10px] uppercase font-bold dark:text-zinc-400 text-zinc-600 flex justify-between items-center">
                  <span>DISCORD SERVERS ({guilds.length})</span>
                </div>
                <button
                  onClick={() => {
                    onSelectGuild('');
                    setServerMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-[#00F0FF] hover:text-black transition-colors ${
                    !selectedGuildId ? 'bg-[#00F0FF] text-black font-bold' : 'dark:text-zinc-200 text-zinc-800'
                  }`}
                >
                  <span>🌐 All Connected Servers</span>
                  {!selectedGuildId && <span className="text-[10px] font-bold">ACTIVE</span>}
                </button>
                {guilds.map((g) => (
                  <button
                    key={g.guildId}
                    onClick={() => {
                      onSelectGuild(g.guildId);
                      setServerMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-[#00F0FF] hover:text-black transition-colors ${
                      selectedGuildId === g.guildId ? 'bg-[#00F0FF] text-black font-bold' : 'dark:text-zinc-200 text-zinc-800'
                    }`}
                  >
                    <span className="truncate pr-2">{g.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">{g.prefix}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle Button (Dark / Light) */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className="border-2 border-black dark:bg-[#12151E] bg-zinc-100 dark:text-[#FFE600] text-amber-600 p-2 text-xs font-mono font-bold shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800"
            title={theme === 'dark' ? 'Switch to Light Brutalism' : 'Switch to Ultra Dark Obsidian'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FFE600]" /> : <Moon className="w-4 h-4 text-zinc-900" />}
          </button>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden border-2 border-black dark:bg-[#12151E] bg-zinc-100 dark:text-white text-black p-2 shadow-[2px_2px_0px_#000]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-black dark:bg-[#0D0F16] bg-white p-4 space-y-2 font-mono text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left font-bold uppercase px-4 py-2.5 border-2 border-black flex items-center space-x-2 transition-all ${
                  isActive
                    ? 'bg-[#00F0FF] text-black shadow-[2px_2px_0px_#000]'
                    : 'dark:bg-[#12151E] dark:text-zinc-200 bg-zinc-100 text-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>[{item.num}] {item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
