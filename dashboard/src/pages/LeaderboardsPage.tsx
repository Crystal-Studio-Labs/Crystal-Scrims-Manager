import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { 
  Trophy, 
  Search, 
  ChevronRight, 
  RefreshCw, 
  ExternalLink,
  Award,
  Gamepad2
} from 'lucide-react';

interface Lobby {
  lobbyId: string;
  guildId?: string;
  title: string;
  gameType: string;
  tier: string;
  status: string;
}

interface LeaderboardRow {
  rank?: number;
  teamId?: string;
  teamName: string;
  teamTag?: string | null;
  matchesPlayed?: number;
  placementPoints: number;
  killPoints?: number;
  kills?: number;
  totalPoints: number;
  wins?: number;
}

interface LeaderboardsPageProps {
  lobbies: Lobby[];
  onSelectEvent: (lobbyId: string) => void;
}

export const LeaderboardsPage: React.FC<LeaderboardsPageProps> = ({
  lobbies,
  onSelectEvent,
}) => {
  const [selectedLobbyId, setSelectedLobbyId] = useState<string>(lobbies[0]?.lobbyId || '');
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchLeaderboard = async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/public/leaderboard/${id}`);
      const data = await res.json();
      if (data.success && data.results) {
        setLeaderboard(data.results);
      } else {
        setLeaderboard([]);
      }
    } catch {
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lobbies.length > 0 && !selectedLobbyId) {
      setSelectedLobbyId(lobbies[0].lobbyId);
    }
  }, [lobbies]);

  useEffect(() => {
    if (selectedLobbyId) {
      fetchLeaderboard(selectedLobbyId);
    }
  }, [selectedLobbyId]);

  const activeLobby = lobbies.find((l) => l.lobbyId === selectedLobbyId) || lobbies[0];

  const filteredRows = leaderboard.filter((row) =>
    row.teamName.toLowerCase().includes(search.toLowerCase()) ||
    (row.teamTag && row.teamTag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-16 font-mono">
      {/* Page Header */}
      <div className="border-4 border-black dark:bg-[#0D0F16] bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="inline-flex items-center space-x-2 border-2 border-black bg-[#FFDF00] text-black px-2.5 py-0.5 text-xs font-black uppercase mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>STANDINGS & RESULTS HUB</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase dark:text-white text-zinc-950">
            TOURNAMENT LEADERBOARDS
          </h1>
          <p className="text-xs sm:text-sm dark:text-zinc-400 text-zinc-600 mt-1">
            Real-time standings, placement points, and finish kill rankings computed automatically.
          </p>
        </div>

        {activeLobby && (
          <button
            onClick={() => onSelectEvent(activeLobby.lobbyId)}
            className="brutal-btn bg-[#00F0FF] text-black hover:bg-cyan-300 text-xs py-2.5 px-4 self-start md:self-auto"
          >
            <span>FULL EVENT BREAKDOWN</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lobby Selector and Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-7">
          <label className="block text-[10px] uppercase font-bold dark:text-zinc-400 text-zinc-600 mb-1">
            SELECT COMPETITIVE EVENT:
          </label>
          <select
            value={selectedLobbyId}
            onChange={(e) => setSelectedLobbyId(e.target.value)}
            className="w-full brutal-input py-2.5 text-xs font-bold uppercase cursor-pointer"
          >
            {lobbies.map((l) => (
              <option key={l.lobbyId} value={l.lobbyId}>
                #{l.lobbyId} — {l.title} ({l.gameType} • {l.tier})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-5">
          <label className="block text-[10px] uppercase font-bold dark:text-zinc-400 text-zinc-600 mb-1">
            SEARCH TEAMS:
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 dark:text-zinc-500 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter by team name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full brutal-input pl-9 pr-3 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="brutal-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#00F0FF]" />
            <span className="text-xs dark:text-zinc-400 text-zinc-600">CALCULATING STANDINGS...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Trophy className="w-8 h-8 mx-auto dark:text-zinc-600 text-zinc-400" />
            <h4 className="text-sm font-black uppercase dark:text-white text-black">NO SCORES RECORDED</h4>
            <p className="text-xs dark:text-zinc-400 text-zinc-600">
              Matches for this event have not yet been scored in Discord via <code>/points add</code>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="dark:bg-[#050507] bg-zinc-100 border-b-2 dark:border-zinc-800 border-zinc-300 text-[11px] uppercase dark:text-zinc-400 text-zinc-600">
                  <th className="py-3 px-4">RANK</th>
                  <th className="py-3 px-4">TEAM NAME</th>
                  <th className="py-3 px-4 text-center">PLACEMENT PTS</th>
                  <th className="py-3 px-4 text-center">FINISH KILLS</th>
                  <th className="py-3 px-4 text-right">TOTAL POINTS</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800 divide-zinc-200">
                {filteredRows.map((row, idx) => {
                  const rank = row.rank || idx + 1;
                  return (
                    <tr 
                      key={idx}
                      className={`hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors ${
                        rank === 1 ? 'dark:bg-[#FFDF00]/5 bg-[#FFDF00]/10 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap font-black">
                        {rank === 1 && <span className="brutal-badge bg-[#FFDF00] text-black mr-2">🥇 1ST</span>}
                        {rank === 2 && <span className="brutal-badge bg-zinc-300 text-black mr-2">🥈 2ND</span>}
                        {rank === 3 && <span className="brutal-badge bg-amber-600 text-white mr-2">🥉 3RD</span>}
                        {rank > 3 && <span>#{rank}</span>}
                      </td>
                      <td className="py-3 px-4 font-black dark:text-white text-black">
                        {row.teamTag && <span className="text-[#00F0FF] mr-1">[{row.teamTag}]</span>}
                        {row.teamName}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#00F0FF]">
                        {row.placementPoints}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#39FF14]">
                        {row.killPoints ?? row.kills ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-black dark:text-white text-black">
                        {row.totalPoints} PTS
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
