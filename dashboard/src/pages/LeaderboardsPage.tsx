import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { Trophy, Search, ChevronRight, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface Lobby {
  lobbyId: string;
  title: string;
  gameType: string;
  tier: string;
  status: string;
}

interface LeaderboardRow {
  teamName: string;
  placementPoints: number;
  kills: number;
  totalPoints: number;
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
    if (selectedLobbyId) {
      fetchLeaderboard(selectedLobbyId);
    }
  }, [selectedLobbyId]);

  const activeLobby = lobbies.find((l) => l.lobbyId === selectedLobbyId) || lobbies[0];

  const filteredRows = leaderboard.filter((row) =>
    row.teamName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="border-b-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#FFDF00] uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4 text-[#FFDF00]" />
            <span>GLOBAL STANDINGS & RESULTS HUB</span>
          </div>
          <h1 className="font-mono text-3xl md:text-4xl font-black uppercase text-white tracking-tight">
            TOURNAMENT LEADERBOARDS
          </h1>
          <p className="font-mono text-xs text-zinc-400 mt-1">
            Real-time standings, placement points, and kill rankings computed live for all competitive events.
          </p>
        </div>

        {/* Select Lobby Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="font-mono text-xs text-zinc-400 uppercase hidden sm:inline">SELECT EVENT:</label>
          <select
            value={selectedLobbyId}
            onChange={(e) => setSelectedLobbyId(e.target.value)}
            className="bg-[#090B10] border-2 border-black px-3 py-2 font-mono text-xs text-white shadow-[3px_3px_0px_#000] focus:border-[#FFDF00] outline-none max-w-xs"
          >
            {lobbies.map((l) => (
              <option key={l.lobbyId} value={l.lobbyId}>
                [{l.gameType}] {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeLobby ? (
        <div className="space-y-6">
          {/* Active Tournament Banner */}
          <div className="border-4 border-black bg-[#11141D] p-5 shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="border border-black bg-[#00F0FF] text-black font-mono text-[10px] font-black px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                  {activeLobby.gameType}
                </span>
                <span className="border border-black bg-zinc-800 text-white font-mono text-[10px] font-bold px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                  TIER {activeLobby.tier}
                </span>
                <span className="font-mono text-xs text-zinc-400">ID: `{activeLobby.lobbyId}`</span>
              </div>
              <h2 className="font-mono text-xl font-black uppercase text-white">{activeLobby.title}</h2>
            </div>

            <button
              onClick={() => onSelectEvent(activeLobby.lobbyId)}
              className="border-2 border-black bg-[#39FF14] text-black px-4 py-2 text-xs font-mono font-bold uppercase shadow-[3px_3px_0px_#000] hover:bg-[#32e012] flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>OPEN FULL EVENT ROSTER</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search bar inside leaderboard */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team name..."
              className="w-full bg-[#11141D] border-2 border-black pl-9 pr-4 py-2 font-mono text-xs text-white placeholder-zinc-500 shadow-[3px_3px_0px_#000] focus:border-[#FFDF00] outline-none"
            />
          </div>

          {loading ? (
            <div className="border-4 border-black bg-[#11141D] p-12 text-center font-mono text-zinc-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#FFDF00]" />
              COMPUTING SCORES...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="border-4 border-black bg-[#11141D] p-12 text-center font-mono text-zinc-400 shadow-[5px_5px_0px_#000] space-y-2">
              <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-base font-black uppercase text-white">NO MATCH SCORES RECORDED YET</h3>
              <p className="text-xs max-w-md mx-auto">
                Record round scores via Discord using `/points add` or use the Organizer Deck studio.
              </p>
            </div>
          ) : (
            <div className="border-4 border-black bg-[#11141D] shadow-[6px_6px_0px_#000] overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#090B10] border-b-2 border-black uppercase text-zinc-400">
                  <tr>
                    <th className="py-3 px-4"># RANK</th>
                    <th className="py-3 px-4">TEAM NAME</th>
                    <th className="py-3 px-4 text-center">PLACEMENT PTS</th>
                    <th className="py-3 px-4 text-center">FINISH KILLS</th>
                    <th className="py-3 px-4 text-right">TOTAL POINTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-zinc-800">
                  {filteredRows.map((row, index) => (
                    <tr key={row.teamName} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 font-black">
                        {index === 0 && <span className="text-[#FFDF00]">#01 🏆</span>}
                        {index === 1 && <span className="text-zinc-300">#02</span>}
                        {index === 2 && <span className="text-amber-600">#03</span>}
                        {index > 2 && <span className="text-zinc-500">#{String(index + 1).padStart(2, '0')}</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-white uppercase">{row.teamName}</td>
                      <td className="py-3 px-4 text-center text-zinc-300">{row.placementPoints} PTS</td>
                      <td className="py-3 px-4 text-center text-[#FF0055] font-bold">{row.kills} KILLS</td>
                      <td className="py-3 px-4 text-right font-black text-base text-[#39FF14]">{row.totalPoints} PTS</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="border-4 border-black bg-[#11141D] p-12 text-center font-mono text-zinc-400 shadow-[5px_5px_0px_#000]">
          No tournament events exist in the database yet.
        </div>
      )}
    </div>
  );
};
