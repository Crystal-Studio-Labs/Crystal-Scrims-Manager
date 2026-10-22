import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Trophy, 
  Users, 
  Clock, 
  Gamepad2, 
  ChevronRight,
  Flame,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface Lobby {
  lobbyId: string;
  guildId?: string;
  title: string;
  tier: string;
  gameType: string;
  totalSlots: number;
  reservedSlotsCount?: number;
  status: string;
  createdAt: string;
  scheduledAt?: string | null;
}

interface EventsPageProps {
  lobbies: Lobby[];
  onSelectEvent: (lobbyId: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  lobbies,
  onSelectEvent,
  onRefresh,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [gameFilter, setGameFilter] = useState<string>('ALL');

  // Filter lobbies
  const filteredLobbies = lobbies.filter((lobby) => {
    // Status filter
    if (statusFilter === 'ONGOING' && lobby.status !== 'OPEN' && lobby.status !== 'LIVE') return false;
    if (statusFilter === 'UPCOMING' && lobby.status !== 'SCHEDULED' && lobby.status !== 'DRAFT') return false;
    if (statusFilter === 'COMPLETED' && lobby.status !== 'CLOSED' && lobby.status !== 'COMPLETED') return false;

    // Game filter
    if (gameFilter !== 'ALL' && lobby.gameType !== gameFilter) return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        lobby.title.toLowerCase().includes(q) ||
        lobby.lobbyId.toLowerCase().includes(q) ||
        lobby.tier.toLowerCase().includes(q) ||
        lobby.gameType.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'LIVE':
        return <span className="brutal-badge bg-[#39FF14] text-black animate-pulse">● LIVE / OPEN</span>;
      case 'SCHEDULED':
        return <span className="brutal-badge bg-[#00F0FF] text-black">UPCOMING</span>;
      case 'CLOSED':
      case 'COMPLETED':
        return <span className="brutal-badge bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 text-zinc-800">COMPLETED</span>;
      default:
        return <span className="brutal-badge bg-[#FFDF00] text-black">{status}</span>;
    }
  };

  const getGameColor = (gameType: string) => {
    switch (gameType.toUpperCase()) {
      case 'BGMI': return '#00F0FF';
      case 'FREEFIRE': return '#FFDF00';
      case 'VALORANT': return '#FF0055';
      case 'CODM': return '#39FF14';
      default: return '#00F0FF';
    }
  };

  return (
    <div className="space-y-8 font-mono pb-12">
      {/* Header Banner */}
      <div className="border-4 border-black dark:bg-[#0D0F16] bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="inline-flex items-center space-x-2 border-2 border-black bg-[#FFDF00] text-black px-2.5 py-0.5 text-xs font-black uppercase mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>TOURNAMENT DIRECTORY</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase dark:text-white text-zinc-950">
            EVENTS & SCRIMS HUB
          </h1>
          <p className="text-xs sm:text-sm dark:text-zinc-400 text-zinc-600 mt-1">
            Browse ongoing, scheduled, and past esports events. Select any lobby to inspect live standings, team rosters, and rules.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="brutal-btn dark:bg-[#12151E] dark:text-white bg-zinc-100 text-black hover:bg-zinc-200 self-start md:self-auto text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00F0FF]' : ''}`} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 dark:text-zinc-500 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title, event ID, or tier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full brutal-input pl-10 pr-4 py-2.5 text-xs"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['ALL', 'ONGOING', 'UPCOMING', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 text-xs font-bold uppercase border-2 border-black whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-[#00F0FF] text-black shadow-[2px_2px_0px_#000]'
                  : 'dark:bg-[#0D0F16] dark:text-zinc-400 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Game Filter Dropdown */}
        <div className="md:col-span-3">
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="w-full brutal-input py-2.5 text-xs font-bold uppercase cursor-pointer"
          >
            <option value="ALL">🎮 ALL DISCIPLINES</option>
            <option value="BGMI">🔫 BGMI / PUBG</option>
            <option value="FREEFIRE">🔥 FREE FIRE</option>
            <option value="VALORANT">🎯 VALORANT</option>
            <option value="CODM">🎖️ COD MOBILE</option>
            <option value="APEX">⚡ APEX LEGENDS</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {filteredLobbies.length === 0 ? (
        <div className="brutal-card p-12 text-center space-y-3">
          <Gamepad2 className="w-10 h-10 mx-auto dark:text-zinc-600 text-zinc-400" />
          <h3 className="text-base font-black uppercase dark:text-white text-zinc-900">
            NO TOURNAMENTS FOUND
          </h3>
          <p className="text-xs dark:text-zinc-400 text-zinc-600 max-w-md mx-auto">
            No events match your current filter criteria. Try clearing search or selecting "ALL" disciplines.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLobbies.map((lobby) => {
            const isLive = lobby.status === 'OPEN' || lobby.status === 'LIVE';
            return (
              <div 
                key={lobby.lobbyId} 
                className={`brutal-card p-6 flex flex-col justify-between hover:-translate-y-1 transition-all ${
                  isLive ? 'border-l-8 border-l-[#39FF14]' : ''
                }`}
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span 
                      className="brutal-badge text-black font-black"
                      style={{ backgroundColor: getGameColor(lobby.gameType) }}
                    >
                      {lobby.gameType}
                    </span>
                    {getStatusBadge(lobby.status)}
                  </div>

                  {/* Title & Info */}
                  <div>
                    <span className="text-[10px] font-bold dark:text-zinc-500 text-zinc-500">
                      EVENT #{lobby.lobbyId} • {lobby.tier}
                    </span>
                    <h3 className="text-lg font-black uppercase dark:text-white text-zinc-900 mt-1 line-clamp-2">
                      {lobby.title}
                    </h3>
                  </div>

                  {/* Capacity & Format Details */}
                  <div className="border-t dark:border-zinc-800 border-zinc-200 pt-3 space-y-1.5 text-xs dark:text-zinc-400 text-zinc-600">
                    <div className="flex justify-between items-center">
                      <span>SLOT CAPACITY:</span>
                      <strong className="dark:text-white text-black font-mono">
                        {lobby.totalSlots} SQUADS
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>CREATED:</span>
                      <span className="font-mono text-[11px]">
                        {new Date(lobby.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-6 pt-3 border-t dark:border-zinc-800 border-zinc-200">
                  <button
                    onClick={() => onSelectEvent(lobby.lobbyId)}
                    className="w-full brutal-btn bg-[#00F0FF] text-black hover:bg-cyan-300 py-2.5 text-xs font-black flex items-center justify-center gap-1.5"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>VIEW LIVE STANDINGS</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
