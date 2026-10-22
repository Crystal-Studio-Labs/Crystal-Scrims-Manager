import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Gamepad2, 
  Terminal, 
  ShieldCheck, 
  Radio, 
  RefreshCw, 
  Users, 
  Key, 
  AlertTriangle,
  Play,
  Lock,
  UserX,
  PlusCircle,
  ExternalLink
} from 'lucide-react';

interface Lobby {
  lobbyId: string;
  title: string;
  tier: string;
  gameType: string;
  totalSlots: number;
  status: string;
  roomId?: string;
  createdAt: string;
}

interface SlotlistData {
  lobby: Lobby;
  confirmed: Array<{
    slotNumber: number;
    teamName: string;
    teamTag?: string;
    captainId: string;
    isReserved: boolean;
    checkedIn: boolean;
  }>;
  waitlist: Array<{
    position: number;
    teamName: string;
    captainId: string;
  }>;
}

interface LeaderboardData {
  lobby: Lobby;
  results: Array<{
    teamName: string;
    placementPoints: number;
    kills: number;
    totalPoints: number;
    round: number;
  }>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'lobbies' | 'standings' | 'admin'>('lobbies');
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [selectedLobbyId, setSelectedLobbyId] = useState<string>('');
  const [slotlist, setSlotlist] = useState<SlotlistData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusTelemetry, setStatusTelemetry] = useState<{ uptime: number; memoryRss: string }>({ uptime: 0, memoryRss: '0' });

  // Admin form states
  const [adminKickTarget, setAdminKickTarget] = useState('');
  const [adminRoomId, setAdminRoomId] = useState('');
  const [adminRoomPass, setAdminRoomPass] = useState('');
  const [scoreTeam, setScoreTeam] = useState('');
  const [scorePlacement, setScorePlacement] = useState(1);
  const [scoreKills, setScoreKills] = useState(0);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Fetch telemetry and lobbies
  const fetchLobbies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/public/scrims');
      const data = await res.json();
      if (data.success && data.lobbies) {
        setLobbies(data.lobbies);
        if (data.lobbies.length > 0 && !selectedLobbyId) {
          setSelectedLobbyId(data.lobbies[0].lobbyId);
        }
      }

      // Fetch health telemetry
      const healthRes = await fetch('/health');
      const healthData = await healthRes.json();
      if (healthData.status === 'ok') {
        setStatusTelemetry({
          uptime: healthData.uptimeSeconds,
          memoryRss: healthData.memoryMB?.rss || '45',
        });
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbies();
  }, []);

  // Fetch slotlist or leaderboard when selected lobby changes
  useEffect(() => {
    if (!selectedLobbyId) return;

    if (activeTab === 'lobbies') {
      fetch(`/api/v1/public/slotlist/${selectedLobbyId}`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setSlotlist(d); })
        .catch(console.error);
    } else if (activeTab === 'standings') {
      fetch(`/api/v1/public/leaderboard/${selectedLobbyId}`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setLeaderboard(d); })
        .catch(console.error);
    }
  }, [selectedLobbyId, activeTab]);

  // Admin Actions
  const handleAdminAction = async (action: string, payload: any = {}) => {
    if (!selectedLobbyId) return;
    try {
      const res = await fetch(`/api/v1/admin/scrims/${selectedLobbyId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminNotice(`Success: ${data.message || 'Action executed'}`);
        fetchLobbies();
        // refresh slotlist
        fetch(`/api/v1/public/slotlist/${selectedLobbyId}`).then(r => r.json()).then(d => setSlotlist(d));
      } else {
        setAdminNotice(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setAdminNotice(`Request failed: ${e.message}`);
    }
    setTimeout(() => setAdminNotice(null), 4000);
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLobbyId || !scoreTeam) return;
    try {
      const res = await fetch('/api/v1/admin/points/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId: selectedLobbyId,
          teamName: scoreTeam,
          placement: Number(scorePlacement),
          kills: Number(scoreKills),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminNotice(`Points added for ${scoreTeam}: ${data.result.totalPoints} total pts!`);
        setScoreTeam('');
        // refresh leaderboard
        fetch(`/api/v1/public/leaderboard/${selectedLobbyId}`).then(r => r.json()).then(d => setLeaderboard(d));
      } else {
        setAdminNotice(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setAdminNotice(`Score submission failed: ${e.message}`);
    }
    setTimeout(() => setAdminNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#090B10] text-zinc-100 flex flex-col">
      {/* Top Cyber Telemetry Bar */}
      <header className="border-b-2 border-zinc-800 bg-[#11141D] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#00F0FF] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-mono font-extrabold tracking-wider text-white">
                CRYSTAL SCRIMS <span className="text-[#00F0FF]">//</span> CONSOLE
              </h1>
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                Esports Automation Engine • Open Source
              </p>
            </div>
          </div>

          {/* Telemetry Badges */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
            <span className="brutal-badge bg-[#39FF14] text-black flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> LIVE GATEWAY
            </span>
            <span className="brutal-badge bg-zinc-800 text-zinc-200 border-zinc-700">
              RAM: {statusTelemetry.memoryRss} MB
            </span>
            <span className="brutal-badge bg-zinc-800 text-[#00F0FF] border-zinc-700">
              DB: TURSO / SQLITE
            </span>
            <button 
              onClick={fetchLobbies}
              className="brutal-btn bg-black text-[#00F0FF] border-[#00F0FF] text-xs py-1 px-2.5 flex items-center gap-1 hover:bg-[#00F0FF] hover:text-black"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> SYNC
            </button>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="border-b-2 border-zinc-800 bg-[#0C0E14] px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <button
            onClick={() => setActiveTab('lobbies')}
            className={`brutal-btn text-xs py-2 px-4 flex items-center gap-2 ${
              activeTab === 'lobbies'
                ? 'bg-[#00F0FF] text-black shadow-brutal'
                : 'bg-[#11141D] text-zinc-400 hover:text-white border-zinc-700'
            }`}
          >
            <Gamepad2 className="w-4 h-4" /> [01] PUBLIC LOBBIES
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`brutal-btn text-xs py-2 px-4 flex items-center gap-2 ${
              activeTab === 'standings'
                ? 'bg-[#39FF14] text-black shadow-brutal'
                : 'bg-[#11141D] text-zinc-400 hover:text-white border-zinc-700'
            }`}
          >
            <Trophy className="w-4 h-4" /> [02] LIVE STANDINGS
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`brutal-btn text-xs py-2 px-4 flex items-center gap-2 ${
              activeTab === 'admin'
                ? 'bg-[#FF0055] text-white shadow-brutal'
                : 'bg-[#11141D] text-zinc-400 hover:text-white border-zinc-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> [03] ADMIN CONSOLE
          </button>
        </div>
      </nav>

      {/* Admin Toast Alerts */}
      {adminNotice && (
        <div className="bg-[#FFDF00] border-b-2 border-black text-black px-6 py-2.5 font-mono font-bold text-center text-sm shadow-brutal">
          ⚠️ {adminNotice}
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-6 flex-1 w-full">
        {/* Lobby Selector Dropdown */}
        <div className="mb-6 brutal-card p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase text-[#00F0FF] font-bold">Active Scrim Lobby:</span>
            <select
              value={selectedLobbyId}
              onChange={(e) => setSelectedLobbyId(e.target.value)}
              className="bg-black border-2 border-zinc-700 px-3 py-1.5 font-mono text-sm text-white focus:border-[#00F0FF] focus:outline-none"
            >
              {lobbies.length === 0 ? (
                <option value="">No scrim lobbies created yet</option>
              ) : (
                lobbies.map((l) => (
                  <option key={l.lobbyId} value={l.lobbyId}>
                    [{l.gameType}] {l.title} ({l.tier}) — ID: {l.lobbyId}
                  </option>
                ))
              )}
            </select>
          </div>

          <span className="font-mono text-xs text-zinc-400">
            Total Lobbies Loaded: <strong className="text-white">{lobbies.length}</strong>
          </span>
        </div>

        {/* ==================================================== */}
        {/* TAB 1: PUBLIC LOBBIES & SLOTLIST MATRIX               */}
        {/* ==================================================== */}
        {activeTab === 'lobbies' && (
          <div className="space-y-6">
            {!slotlist ? (
              <div className="brutal-card p-12 text-center text-zinc-400 font-mono">
                {lobbies.length === 0 ? 'No active scrim lobbies found. Create one using `/scrim create` in Discord!' : 'Select a lobby above to view live slots.'}
              </div>
            ) : (
              <div>
                {/* Lobby Details Banner */}
                <div className="brutal-card p-6 mb-6 border-l-8 border-l-[#00F0FF]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="brutal-badge bg-black text-[#00F0FF] border-[#00F0FF] mb-2 inline-block">
                        {slotlist.lobby.gameType} • {slotlist.lobby.tier}
                      </span>
                      <h2 className="text-2xl font-mono font-extrabold uppercase text-white">
                        {slotlist.lobby.title}
                      </h2>
                      <p className="text-xs font-mono text-zinc-400 mt-1">
                        Lobby ID: <code className="text-[#00F0FF]">{slotlist.lobby.lobbyId}</code> • Status: <span className="text-[#39FF14] uppercase font-bold">{slotlist.lobby.status}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono">
                        <div className="text-xs text-zinc-400 uppercase">Confirmed Slots</div>
                        <div className="text-2xl font-bold text-[#00F0FF]">
                          {slotlist.confirmed.length} / {slotlist.lobby.totalSlots}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirmed Slots Grid */}
                <h3 className="font-mono text-sm uppercase text-zinc-400 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00F0FF]" /> Confirmed Team Roster
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {slotlist.confirmed.map((slot) => (
                    <div 
                      key={slot.slotNumber}
                      className="brutal-card p-3 border-zinc-800 hover:border-[#00F0FF] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-black bg-[#00F0FF] px-1.5 py-0.5">
                          SLOT #{slot.slotNumber}
                        </span>
                        {slot.isReserved && (
                          <span className="text-[10px] font-mono text-[#FFDF00] uppercase font-bold">VIP RESERVED</span>
                        )}
                      </div>
                      <div className="font-mono font-bold text-white truncate text-sm">
                        {slot.teamName} {slot.teamTag && <span className="text-zinc-400">[{slot.teamTag}]</span>}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 truncate mt-1">
                        Captain ID: {slot.captainId}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Waitlist Queue */}
                {slotlist.waitlist.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-mono text-sm uppercase text-zinc-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#FFDF00]" /> Waitlist Overflow Queue ({slotlist.waitlist.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slotlist.waitlist.map((w) => (
                        <div key={w.position} className="brutal-card p-3 border-zinc-800 bg-[#161313]">
                          <span className="font-mono text-xs text-[#FFDF00] font-bold">WAITLIST #{w.position}</span>
                          <div className="font-mono font-bold text-white text-sm mt-1">{w.teamName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: LIVE STANDINGS & POINTS LEADERBOARD           */}
        {/* ==================================================== */}
        {activeTab === 'standings' && (
          <div className="space-y-6">
            {!leaderboard || leaderboard.results.length === 0 ? (
              <div className="brutal-card p-12 text-center text-zinc-400 font-mono">
                No match results recorded yet for this lobby. Record scores via the Admin Console or `/points add` in Discord!
              </div>
            ) : (
              <div className="brutal-card p-6">
                <div className="flex items-center justify-between mb-6 border-b-2 border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-xl font-mono font-extrabold uppercase text-white">
                      STANDINGS // {leaderboard.lobby.title}
                    </h2>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      Standard BGIS/PMGC Scoring Matrix (Placement + Finish Kills)
                    </p>
                  </div>
                  <span className="brutal-badge bg-[#39FF14] text-black">
                    OFFICIAL STANDINGS
                  </span>
                </div>

                {/* Monospace Brutalist Leaderboard Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono border-collapse">
                    <thead>
                      <tr className="border-b-2 border-zinc-700 bg-black text-[#00F0FF] text-xs uppercase">
                        <th className="p-3">Rank</th>
                        <th className="p-3">Team Name</th>
                        <th className="p-3">Placement Pts</th>
                        <th className="p-3">Finish Kills</th>
                        <th className="p-3">Total Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {leaderboard.results.map((row, idx) => (
                        <tr 
                          key={idx}
                          className={`hover:bg-[#181C28] ${
                            idx === 0 ? 'bg-[#39FF14]/10 text-white font-bold' : ''
                          }`}
                        >
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-xs font-bold ${
                              idx === 0 ? 'bg-[#FFDF00] text-black' : idx === 1 ? 'bg-zinc-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'text-zinc-400'
                            }`}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-white">{row.teamName}</td>
                          <td className="p-3 text-zinc-300">{row.placementPoints} pts</td>
                          <td className="p-3 text-[#00F0FF]">{row.kills}</td>
                          <td className="p-3 text-[#39FF14] font-extrabold text-base">{row.totalPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: ADMIN & ORGANIZER COMMAND CONSOLE              */}
        {/* ==================================================== */}
        {activeTab === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Quick Lobby Controls */}
            <div className="brutal-card p-6">
              <h3 className="font-mono text-base font-bold uppercase text-white mb-4 flex items-center gap-2 border-b-2 border-zinc-800 pb-2">
                <ShieldCheck className="w-5 h-5 text-[#FF0055]" /> Quick Lobby Actions
              </h3>
              <p className="text-xs font-mono text-zinc-400 mb-4">
                Execute live controls on selected lobby <code className="text-[#00F0FF]">{selectedLobbyId}</code>.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => handleAdminAction('open')}
                  className="brutal-btn bg-[#39FF14] text-black text-xs flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" /> OPEN REG
                </button>
                <button
                  onClick={() => handleAdminAction('close')}
                  className="brutal-btn bg-zinc-800 text-white text-xs flex items-center justify-center gap-2 hover:bg-zinc-700"
                >
                  <Lock className="w-3.5 h-3.5" /> LOCK SLOTS
                </button>
                <button
                  onClick={() => handleAdminAction('cancel')}
                  className="brutal-btn bg-[#FF0055] text-white text-xs flex items-center justify-center gap-2 col-span-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> CANCEL LOBBY
                </button>
              </div>

              {/* Kick Team */}
              <div className="border-t-2 border-zinc-800 pt-4">
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Kick Squad & Auto-Promote Waitlist:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Slot # (e.g. 3) or Team Name"
                    value={adminKickTarget}
                    onChange={(e) => setAdminKickTarget(e.target.value)}
                    className="flex-1 bg-black border-2 border-zinc-700 px-3 py-1.5 font-mono text-xs text-white focus:border-[#FF0055] focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (adminKickTarget) {
                        handleAdminAction('kick', { target: adminKickTarget });
                        setAdminKickTarget('');
                      }
                    }}
                    className="brutal-btn bg-black text-[#FF0055] border-[#FF0055] text-xs py-1.5"
                  >
                    KICK
                  </button>
                </div>
              </div>

              {/* Set Room Credentials */}
              <div className="border-t-2 border-zinc-800 pt-4 mt-4">
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Set Room ID & Password (IDP):
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Room ID"
                    value={adminRoomId}
                    onChange={(e) => setAdminRoomId(e.target.value)}
                    className="bg-black border-2 border-zinc-700 px-3 py-1.5 font-mono text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Password"
                    value={adminRoomPass}
                    onChange={(e) => setAdminRoomPass(e.target.value)}
                    className="bg-black border-2 border-zinc-700 px-3 py-1.5 font-mono text-xs text-white"
                  />
                </div>
                <button
                  onClick={() => {
                    if (adminRoomId && adminRoomPass) {
                      handleAdminAction('set-idp', { roomId: adminRoomId, roomPassword: adminRoomPass });
                      setAdminRoomId('');
                      setAdminRoomPass('');
                    }
                  }}
                  className="brutal-btn bg-[#00F0FF] text-black text-xs w-full flex items-center justify-center gap-1"
                >
                  <Key className="w-3.5 h-3.5" /> SAVE CREDENTIALS
                </button>
              </div>
            </div>

            {/* 2. Live Scorekeeper Studio */}
            <div className="brutal-card p-6">
              <h3 className="font-mono text-base font-bold uppercase text-white mb-4 flex items-center gap-2 border-b-2 border-zinc-800 pb-2">
                <Trophy className="w-5 h-5 text-[#39FF14]" /> Live Scorekeeper Studio
              </h3>
              <p className="text-xs font-mono text-zinc-400 mb-4">
                Record match finish kills and placements. Automatically updates points table in real-time.
              </p>

              <form onSubmit={handleScoreSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Team Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="Exact registered team name"
                    value={scoreTeam}
                    onChange={(e) => setScoreTeam(e.target.value)}
                    className="w-full bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white focus:border-[#39FF14] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Placement Rank (1-25):</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={scorePlacement}
                      onChange={(e) => setScorePlacement(Number(e.target.value))}
                      className="w-full bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Finish Kills:</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={scoreKills}
                      onChange={(e) => setScoreKills(Number(e.target.value))}
                      className="w-full bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="brutal-btn bg-[#39FF14] text-black text-xs w-full py-2.5 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> RECORD MATCH SCORE
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-zinc-800 bg-[#0C0E14] px-6 py-4 text-center font-mono text-xs text-zinc-500">
        <div>
          CRYSTAL SCRIMS MANAGER • DEVELOPED BY{' '}
          <a 
            href="https://sahooshuvranshu.is-a.dev" 
            target="_blank" 
            rel="noreferrer" 
            className="text-[#00F0FF] hover:underline font-bold"
          >
            SHUVRANSU SEKHAR SAHOO
          </a>{' '}
          FOR{' '}
          <a 
            href="https://github.com/Crystal-Studio-Labs/" 
            target="_blank" 
            rel="noreferrer" 
            className="text-[#39FF14] hover:underline font-bold"
          >
            CRYSTAL STUDIO LABS
          </a>
        </div>
        <div className="text-[10px] text-zinc-600 mt-1">
          100% FREE-TIER COMPATIBLE • OPEN SOURCE ESPORTS ENGINE
        </div>
      </footer>
    </div>
  );
}
