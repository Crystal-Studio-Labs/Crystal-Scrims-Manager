import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Gamepad2, 
  Calendar, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Award, 
  Layers,
  HelpCircle,
  Hash,
  ExternalLink
} from 'lucide-react';

interface SlotItem {
  slotNumber: number;
  teamId: string;
  teamName: string;
  teamTag: string | null;
  captainId: string;
  checkedIn: boolean;
  isWaitlist: boolean;
  waitlistPosition?: number;
}

interface LeaderboardRow {
  rank: number;
  teamId: string;
  teamName: string;
  teamTag: string | null;
  matchesPlayed: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
  wins: number;
}

interface LobbyDetails {
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

interface EventDetailPageProps {
  lobbyId: string;
  onBack: () => void;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({
  lobbyId,
  onBack,
}) => {
  const [lobby, setLobby] = useState<LobbyDetails | null>(null);
  const [confirmed, setConfirmed] = useState<SlotItem[]>([]);
  const [waitlist, setWaitlist] = useState<SlotItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'standings' | 'rosters' | 'waitlist' | 'rules'>('standings');
  const [searchFilter, setSearchFilter] = useState('');

  const fetchEventData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Slotlist & Lobby metadata
      const slotRes = await fetch(`${API_BASE}/api/v1/public/slotlist/${lobbyId}`);
      const slotData = await slotRes.json();
      if (slotData.success) {
        setLobby(slotData.lobby);
        setConfirmed(slotData.confirmed || []);
        setWaitlist(slotData.waitlist || []);
      }

      // 2. Fetch Leaderboard Results
      const leadRes = await fetch(`${API_BASE}/api/v1/public/leaderboard/${lobbyId}`);
      const leadData = await leadRes.json();
      if (leadData.success && leadData.results) {
        setLeaderboard(leadData.results);
      }
    } catch (e) {
      console.error('Error fetching event data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [lobbyId]);

  // Filtered confirmed squads
  const filteredConfirmed = confirmed.filter((slot) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      slot.teamName.toLowerCase().includes(q) ||
      (slot.teamTag && slot.teamTag.toLowerCase().includes(q)) ||
      slot.captainId.includes(q) ||
      String(slot.slotNumber) === q
    );
  });

  // Filtered leaderboard rows
  const filteredLeaderboard = leaderboard.filter((row) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      row.teamName.toLowerCase().includes(q) ||
      (row.teamTag && row.teamTag.toLowerCase().includes(q)) ||
      String(row.rank) === q
    );
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="brutal-badge bg-[#FFDF00] text-black font-black">
          🥇 1ST
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="brutal-badge bg-zinc-300 text-black font-black">
          🥈 2ND
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="brutal-badge bg-amber-600 text-white font-black">
          🥉 3RD
        </span>
      );
    }
    return <span className="font-mono font-bold dark:text-zinc-400 text-zinc-600">#{rank}</span>;
  };

  if (loading && !lobby) {
    return (
      <div className="brutal-card p-16 text-center font-mono">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#00F0FF]" />
        <span className="dark:text-zinc-300 text-zinc-700">RETRIEVING EVENT DATA [{lobbyId}]...</span>
      </div>
    );
  }

  const isLive = lobby?.status === 'OPEN' || lobby?.status === 'LIVE';

  return (
    <div className="space-y-6 font-mono pb-12">
      {/* Top Navigation Back Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="brutal-btn dark:bg-[#12151E] dark:text-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-xs py-2 px-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO EVENTS</span>
        </button>

        <button
          onClick={fetchEventData}
          className="brutal-btn bg-[#00F0FF] text-black hover:bg-cyan-300 text-xs py-2 px-4"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH STANDINGS</span>
        </button>
      </div>

      {/* Event Header Banner */}
      {lobby && (
        <div className="border-4 border-black dark:bg-[#0D0F16] bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000] space-y-4 transition-colors">
          <div className="flex flex-wrap items-center gap-2">
            <span className="brutal-badge bg-[#00F0FF] text-black font-bold">
              {lobby.gameType}
            </span>
            <span className="brutal-badge bg-[#FFDF00] text-black font-bold">
              {lobby.tier}
            </span>
            <span className="brutal-badge bg-[#39FF14] text-black font-bold">
              {lobby.status}
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#39FF14] font-black pl-2">
                <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse"></span>
                LIVE EVENT IN PROGRESS
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase dark:text-white text-zinc-950">
            {lobby.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs dark:text-zinc-400 text-zinc-600 pt-1">
            <span>EVENT ID: <strong className="text-[#00F0FF]">{lobby.lobbyId}</strong></span>
            <span>•</span>
            <span>CONFIRMED: <strong className="dark:text-white text-black">{confirmed.length} / {lobby.totalSlots} SQUADS</strong></span>
            <span>•</span>
            <span>WAITLIST: <strong className="text-[#FF0055]">{waitlist.length} TEAMS</strong></span>
          </div>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b-2 dark:border-zinc-800 border-zinc-200 overflow-x-auto pb-2">
        {[
          { id: 'standings', label: 'LIVE STANDINGS', icon: Trophy, count: leaderboard.length },
          { id: 'rosters', label: 'CONFIRMED SQUADS', icon: Users, count: confirmed.length },
          { id: 'waitlist', label: 'WAITLIST QUEUE', icon: Clock, count: waitlist.length },
          { id: 'rules', label: 'SCORING RULES', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold uppercase border-2 border-black whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-[#00F0FF] text-black shadow-[3px_3px_0px_#000] -translate-y-0.5'
                  : 'dark:bg-[#12151E] dark:text-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 shadow-[2px_2px_0px_#000]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 border border-black ${
                  isActive ? 'bg-black text-white' : 'dark:bg-zinc-800 dark:text-zinc-300 bg-white text-black'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Filter for Tables */}
      {(activeTab === 'standings' || activeTab === 'rosters') && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 dark:text-zinc-500 text-zinc-400" />
          <input
            type="text"
            placeholder={activeTab === 'standings' ? 'Search teams on leaderboard...' : 'Search confirmed teams or captains...'}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full brutal-input pl-10 pr-4 py-2 text-xs"
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: LIVE STANDINGS / LEADERBOARD                     */}
      {/* ======================================================== */}
      {activeTab === 'standings' && (
        <div className="brutal-card overflow-hidden">
          {leaderboard.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Trophy className="w-10 h-10 mx-auto dark:text-zinc-600 text-zinc-400" />
              <h3 className="text-base font-black uppercase dark:text-white text-zinc-900">
                NO SCORES RECORDED YET
              </h3>
              <p className="text-xs dark:text-zinc-400 text-zinc-600 max-w-md mx-auto">
                Organizers record points in Discord using <code>/points add</code>. As soon as match rounds conclude, the live leaderboard updates here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="dark:bg-[#050507] bg-zinc-100 border-b-2 dark:border-zinc-800 border-zinc-300 text-[11px] uppercase dark:text-zinc-400 text-zinc-600">
                    <th className="py-3 px-4">RANK</th>
                    <th className="py-3 px-4">TEAM NAME</th>
                    <th className="py-3 px-4 text-center">MATCHES</th>
                    <th className="py-3 px-4 text-center">WWCD (WINS)</th>
                    <th className="py-3 px-4 text-center">PLACEMENT PTS</th>
                    <th className="py-3 px-4 text-center">FINISH KILLS</th>
                    <th className="py-3 px-4 text-right">TOTAL POINTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-zinc-800 divide-zinc-200">
                  {filteredLeaderboard.map((row) => (
                    <tr 
                      key={row.teamId} 
                      className={`hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors ${
                        row.rank === 1 ? 'dark:bg-[#FFDF00]/5 bg-[#FFDF00]/10 font-bold' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRankBadge(row.rank)}
                      </td>
                      <td className="py-3.5 px-4 font-black dark:text-white text-black">
                        {row.teamTag && <span className="text-[#00F0FF] mr-1.5">[{row.teamTag}]</span>}
                        {row.teamName}
                      </td>
                      <td className="py-3.5 px-4 text-center dark:text-zinc-300 text-zinc-700">
                        {row.matchesPlayed}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[#FFDF00] font-black">
                        {row.wins}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[#00F0FF] font-black">
                        {row.placementPoints}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[#39FF14] font-black">
                        {row.killPoints}
                      </td>
                      <td className="py-3.5 px-4 text-right text-base font-black dark:text-white text-black">
                        {row.totalPoints} PTS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CONFIRMED SQUADS & ROSTERS                       */}
      {/* ======================================================== */}
      {activeTab === 'rosters' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredConfirmed.map((slot) => (
              <div 
                key={slot.slotNumber} 
                className="brutal-card p-4 space-y-2 hover:border-[#00F0FF] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="brutal-badge bg-black text-white text-[10px]">
                    SLOT #{slot.slotNumber}
                  </span>
                  {slot.checkedIn ? (
                    <span className="brutal-badge bg-[#39FF14] text-black text-[10px]">
                      CHECKED IN
                    </span>
                  ) : (
                    <span className="brutal-badge bg-[#00F0FF] text-black text-[10px]">
                      CONFIRMED
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-black text-sm uppercase dark:text-white text-black truncate">
                    {slot.teamTag && <span className="text-[#00F0FF] mr-1">[{slot.teamTag}]</span>}
                    {slot.teamName}
                  </h4>
                  <p className="text-[11px] dark:text-zinc-400 text-zinc-600 mt-0.5 truncate">
                    Captain ID: <span className="font-mono text-zinc-500">{slot.captainId}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: WAITLIST QUEUE                                    */}
      {/* ======================================================== */}
      {activeTab === 'waitlist' && (
        <div className="brutal-card p-6 space-y-4">
          <h3 className="text-base font-black uppercase dark:text-white text-black flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FFDF00]" />
            <span>WAITLIST AUTO-PROMOTION QUEUE ({waitlist.length})</span>
          </h3>
          <p className="text-xs dark:text-zinc-400 text-zinc-600">
            If any confirmed squad leaves the slot via <strong>[🚪 Leave Slot]</strong> or is disqualified by organizers via <code>/scrim kick</code>, the next team in the queue is automatically promoted into confirmed status.
          </p>

          {waitlist.length === 0 ? (
            <div className="p-8 text-center dark:text-zinc-500 text-zinc-500 text-xs border-2 border-dashed dark:border-zinc-800 border-zinc-300">
              NO SQUADS CURRENTLY ON THE WAITLIST.
            </div>
          ) : (
            <div className="space-y-2">
              {waitlist.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-3 border-2 dark:border-zinc-800 border-zinc-200 dark:bg-[#050507] bg-zinc-50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-[#FF0055] text-white text-xs font-black flex items-center justify-center border border-black">
                      #{idx + 1}
                    </span>
                    <span className="font-black dark:text-white text-black text-xs">
                      {item.teamTag && <span className="text-[#00F0FF] mr-1">[{item.teamTag}]</span>}
                      {item.teamName}
                    </span>
                  </div>
                  <span className="text-[10px] dark:text-zinc-400 text-zinc-600 font-bold uppercase">
                    NEXT IN LINE
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SCORING RULES & CREDENTIALS INFO                 */}
      {/* ======================================================== */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="brutal-card p-6 space-y-4">
            <h3 className="text-base font-black uppercase dark:text-white text-black flex items-center gap-2 border-b-2 dark:border-zinc-800 border-zinc-200 pb-2">
              <Award className="w-5 h-5 text-[#00F0FF]" />
              <span>OFFICIAL SCORING BREAKDOWN</span>
            </h3>
            <p className="text-xs dark:text-zinc-400 text-zinc-600 leading-relaxed">
              Standard BGIS / PMGC Point System is enforced for Battle Royale tiers:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 border dark:border-zinc-800 border-zinc-200 dark:bg-[#050507] bg-zinc-50 flex justify-between">
                <span>1st Place (WWCD):</span>
                <strong className="text-[#FFDF00]">10 PTS</strong>
              </div>
              <div className="p-2 border dark:border-zinc-800 border-zinc-200 dark:bg-[#050507] bg-zinc-50 flex justify-between">
                <span>2nd Place:</span>
                <strong className="text-[#00F0FF]">6 PTS</strong>
              </div>
              <div className="p-2 border dark:border-zinc-800 border-zinc-200 dark:bg-[#050507] bg-zinc-50 flex justify-between">
                <span>3rd Place:</span>
                <strong className="text-[#00F0FF]">5 PTS</strong>
              </div>
              <div className="p-2 border dark:border-zinc-800 border-zinc-200 dark:bg-[#050507] bg-zinc-50 flex justify-between">
                <span>4th Place:</span>
                <strong className="text-zinc-400">4 PTS</strong>
              </div>
              <div className="p-2 border dark:border-zinc-800 border-zinc-200 dark:bg-[#050507] bg-zinc-50 flex justify-between">
                <span>5th Place:</span>
                <strong className="text-zinc-400">3 PTS</strong>
              </div>
              <div className="p-2 border dark:border-zinc-800 border-zinc-200 dark:bg-[#050507] bg-zinc-50 flex justify-between">
                <span>Each Finish Kill:</span>
                <strong className="text-[#39FF14]">+1 PT</strong>
              </div>
            </div>
          </div>

          <div className="brutal-card p-6 space-y-4">
            <h3 className="text-base font-black uppercase dark:text-white text-black flex items-center gap-2 border-b-2 dark:border-zinc-800 border-zinc-200 pb-2">
              <ShieldCheck className="w-5 h-5 text-[#39FF14]" />
              <span>ROOM CREDENTIALS DELIVERY (IDP)</span>
            </h3>
            <p className="text-xs dark:text-zinc-400 text-zinc-600 leading-relaxed">
              To preserve competitive integrity and completely prevent room leaks, Room ID & Password are never published publicly on this website.
            </p>
            <div className="p-3 border-2 border-black bg-[#00F0FF] text-black text-xs space-y-1 shadow-[2px_2px_0px_#000]">
              <strong className="block font-black uppercase">HOW CAPTAINS GET ROOM ID & PASSWORD:</strong>
              <p>
                In your Discord server's confirmed slot channel, verified team captains simply click the <strong>[🔑 View Room IDP]</strong> button. The bot validates team ownership and displays credentials in a private ephemeral message.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
