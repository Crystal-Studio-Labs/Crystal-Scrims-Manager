import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  ChevronRight, 
  Users, 
  Trophy, 
  Radio, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Play
} from 'lucide-react';

interface Lobby {
  lobbyId: string;
  title: string;
  tier: string;
  gameType: string;
  totalSlots: number;
  reservedSlotsCount: number;
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
  const [filterTab, setFilterTab] = useState<'all' | 'ongoing' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Categorize lobbies
  const ongoingLobbies = lobbies.filter((l) => l.status === 'OPEN' || l.status === 'LIVE');
  const upcomingLobbies = lobbies.filter((l) => l.status === 'SCHEDULED');
  const pastLobbies = lobbies.filter((l) => l.status === 'COMPLETED' || l.status === 'CLOSED' || l.status === 'CANCELLED');

  // Filter based on active tab and search
  const filteredLobbies = lobbies.filter((lobby) => {
    // 1. Tab filter
    if (filterTab === 'ongoing' && lobby.status !== 'OPEN' && lobby.status !== 'LIVE') return false;
    if (filterTab === 'upcoming' && lobby.status !== 'SCHEDULED') return false;
    if (filterTab === 'past' && lobby.status !== 'COMPLETED' && lobby.status !== 'CLOSED' && lobby.status !== 'CANCELLED') return false;

    // 2. Game filter
    if (gameFilter !== 'ALL' && lobby.gameType !== gameFilter) return false;

    // 3. Tier filter
    if (tierFilter !== 'ALL' && lobby.tier !== tierFilter) return false;

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = lobby.title.toLowerCase().includes(q);
      const matchId = lobby.lobbyId.toLowerCase().includes(q);
      const matchGame = lobby.gameType.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchGame) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="border-2 border-black bg-[#39FF14] text-black text-[11px] font-mono font-black px-2.5 py-0.5 shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-black animate-ping inline-block"></span>
            REGISTRATION OPEN
          </span>
        );
      case 'LIVE':
        return (
          <span className="border-2 border-black bg-[#FF0055] text-white text-[11px] font-mono font-black px-2.5 py-0.5 shadow-[2px_2px_0px_#000] flex items-center gap-1.5 animate-pulse">
            <Play className="w-3 h-3 fill-white" />
            MATCH IN PROGRESS (LIVE)
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="border-2 border-black bg-[#00F0FF] text-black text-[11px] font-mono font-black px-2.5 py-0.5 shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            UPCOMING SCHEDULED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="border-2 border-black bg-[#FFE600] text-black text-[11px] font-mono font-black px-2.5 py-0.5 shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="border-2 border-black bg-zinc-800 text-zinc-300 text-[11px] font-mono font-black px-2.5 py-0.5 shadow-[2px_2px_0px_#000]">
            REGISTRATION LOCKED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="border-2 border-black bg-red-950 text-red-400 border-red-800 text-[11px] font-mono font-black px-2.5 py-0.5 shadow-[2px_2px_0px_#000]">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="border border-zinc-700 bg-zinc-900 text-zinc-400 text-[11px] font-mono px-2 py-0.5">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Section Header */}
      <div className="border-b-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>ESPORTS TOURNAMENTS & SCRIMS PORTAL</span>
          </div>
          <h1 className="font-mono text-3xl md:text-4xl font-black uppercase text-white tracking-tight">
            EVENTS DIRECTORY
          </h1>
          <p className="font-mono text-xs text-zinc-400 mt-1">
            Browse ongoing live tournaments, upcoming scheduled matches, and historical scrim archives.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="border-2 border-black bg-[#00F0FF] text-black px-4 py-2 text-xs font-mono font-bold uppercase shadow-[3px_3px_0px_#000] hover:bg-cyan-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          {loading ? 'REFRESHING...' : 'REFRESH EVENTS'}
        </button>
      </div>

      {/* Category Tabs: All, Ongoing, Upcoming, Past */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-zinc-800 pb-3">
        <button
          onClick={() => setFilterTab('all')}
          className={`font-mono text-xs font-bold uppercase px-4 py-2 border-2 border-black shadow-[2px_2px_0px_#000] transition-all ${
            filterTab === 'all'
              ? 'bg-[#00F0FF] text-black -translate-y-0.5'
              : 'bg-[#181C28] text-zinc-400 hover:text-white'
          }`}
        >
          ALL EVENTS [{lobbies.length}]
        </button>

        <button
          onClick={() => setFilterTab('ongoing')}
          className={`font-mono text-xs font-bold uppercase px-4 py-2 border-2 border-black shadow-[2px_2px_0px_#000] transition-all flex items-center gap-1.5 ${
            filterTab === 'ongoing'
              ? 'bg-[#39FF14] text-black -translate-y-0.5'
              : 'bg-[#181C28] text-zinc-400 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#39FF14] inline-block animate-pulse"></span>
          ONGOING & LIVE [{ongoingLobbies.length}]
        </button>

        <button
          onClick={() => setFilterTab('upcoming')}
          className={`font-mono text-xs font-bold uppercase px-4 py-2 border-2 border-black shadow-[2px_2px_0px_#000] transition-all flex items-center gap-1.5 ${
            filterTab === 'upcoming'
              ? 'bg-[#FFE600] text-black -translate-y-0.5'
              : 'bg-[#181C28] text-zinc-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          UPCOMING & FUTURE [{upcomingLobbies.length}]
        </button>

        <button
          onClick={() => setFilterTab('past')}
          className={`font-mono text-xs font-bold uppercase px-4 py-2 border-2 border-black shadow-[2px_2px_0px_#000] transition-all flex items-center gap-1.5 ${
            filterTab === 'past'
              ? 'bg-[#FF0055] text-white -translate-y-0.5'
              : 'bg-[#181C28] text-zinc-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          PAST & ARCHIVED [{pastLobbies.length}]
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tournament title, lobby ID, or game..."
            className="w-full bg-[#11141D] border-2 border-black pl-9 pr-4 py-2.5 font-mono text-xs text-white placeholder-zinc-500 shadow-[3px_3px_0px_#000] focus:border-[#00F0FF] outline-none"
          />
        </div>

        {/* Game Filter */}
        <div className="sm:col-span-3">
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="w-full bg-[#11141D] border-2 border-black px-3 py-2.5 font-mono text-xs text-white shadow-[3px_3px_0px_#000] focus:border-[#00F0FF] outline-none"
          >
            <option value="ALL">ALL GAMES</option>
            <option value="BGMI">BGMI / PUBG Mobile</option>
            <option value="FREEFIRE">Free Fire</option>
            <option value="VALORANT">Valorant</option>
            <option value="CODM">Call of Duty Mobile</option>
            <option value="APEX">Apex Legends</option>
            <option value="CUSTOM">Custom Game</option>
          </select>
        </div>

        {/* Tier Filter */}
        <div className="sm:col-span-3">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full bg-[#11141D] border-2 border-black px-3 py-2.5 font-mono text-xs text-white shadow-[3px_3px_0px_#000] focus:border-[#00F0FF] outline-none"
          >
            <option value="ALL">ALL TIERS</option>
            <option value="T1">Tier 1 (Elite)</option>
            <option value="T2">Tier 2 (Challenger)</option>
            <option value="T3">Tier 3 (Open)</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {filteredLobbies.length === 0 ? (
        <div className="border-4 border-black bg-[#11141D] p-12 text-center shadow-[6px_6px_0px_#000] space-y-3">
          <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="font-mono text-lg font-black uppercase text-white">NO TOURNAMENTS MATCH THIS FILTER</h3>
          <p className="font-mono text-xs text-zinc-400 max-w-md mx-auto">
            Try resetting your search query or create a new scrim lobby in Discord with <code className="text-[#00F0FF]">/scrim create</code> or the Organizer Deck!
          </p>
          <button
            onClick={() => {
              setFilterTab('all');
              setSearchQuery('');
              setGameFilter('ALL');
              setTierFilter('ALL');
            }}
            className="border-2 border-black bg-[#00F0FF] text-black px-4 py-2 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000] hover:bg-cyan-300"
          >
            CLEAR ALL FILTERS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLobbies.map((lobby) => (
            <div
              key={lobby.lobbyId}
              className="border-4 border-black bg-[#11141D] p-5 shadow-[5px_5px_0px_#000] flex flex-col justify-between hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0px_#000] transition-all"
            >
              <div className="space-y-3">
                {/* Badges Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="border border-black bg-[#00F0FF] text-black font-mono text-[10px] font-black px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                      {lobby.gameType}
                    </span>
                    <span className="border border-black bg-zinc-800 text-white font-mono text-[10px] font-bold px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                      {lobby.tier}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-zinc-500">
                    ID: <strong className="text-zinc-200">{lobby.lobbyId}</strong>
                  </span>
                </div>

                {/* Status Badge */}
                <div>{getStatusBadge(lobby.status)}</div>

                {/* Tournament Title */}
                <h3 className="font-mono text-lg font-black uppercase text-white leading-snug line-clamp-2">
                  {lobby.title}
                </h3>

                {/* Metrics */}
                <div className="border-t-2 border-zinc-800 pt-3 space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-400">Total Capacity:</span>
                    <strong className="text-white">{lobby.totalSlots} Slots</strong>
                  </div>
                  {lobby.reservedSlotsCount > 0 && (
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-zinc-400">Reserved / VIP:</span>
                      <strong className="text-[#FFE600]">{lobby.reservedSlotsCount} Reserved</strong>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-400">Created:</span>
                    <span className="text-zinc-500">{lobby.createdAt.slice(0, 10)}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t-2 border-zinc-800">
                <button
                  onClick={() => onSelectEvent(lobby.lobbyId)}
                  className="w-full border-2 border-black bg-[#39FF14] text-black py-2.5 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000] hover:bg-[#32e012] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center space-x-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>VIEW ROSTERS & LEADERBOARD</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
