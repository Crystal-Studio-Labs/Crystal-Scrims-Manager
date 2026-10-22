import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Trophy, 
  Key, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface ConfirmedSlot {
  slotNumber: number;
  teamName: string;
  teamTag?: string | null;
  captainId: string;
  isReserved: boolean;
  checkedIn: boolean;
}

interface WaitlistSlot {
  position: number;
  teamName: string;
  captainId: string;
}

interface LobbyDetails {
  lobbyId: string;
  title: string;
  tier: string;
  gameType: string;
  totalSlots: number;
  reservedSlotsCount: number;
  status: string;
  createdAt: string;
  scheduledAt?: string | null;
  roomId?: string | null;
  roomPassword?: string | null;
}

interface LeaderboardRow {
  teamName: string;
  placementPoints: number;
  kills: number;
  totalPoints: number;
}

interface EventDetailPageProps {
  lobbyId: string;
  onBack: () => void;
  adminKey: string;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({
  lobbyId,
  onBack,
  adminKey,
}) => {
  const [activeTab, setActiveTab] = useState<'rosters' | 'leaderboard' | 'idp'>('rosters');
  const [lobby, setLobby] = useState<LobbyDetails | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedSlot[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistSlot[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<number | 'all'>('all');
  const [teamSearch, setTeamSearch] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // IDP edit form state
  const [adminRoomId, setAdminRoomId] = useState('');
  const [adminRoomPass, setAdminRoomPass] = useState('');

  // Fetch slotlist and lobby info
  const fetchEventData = async () => {
    try {
      setLoading(true);
      // Fetch slotlist
      const slotRes = await fetch(`/api/v1/public/slotlist/${lobbyId}`);
      const slotData = await slotRes.json();
      if (slotData.success) {
        setLobby(slotData.lobby);
        setConfirmed(slotData.confirmed || []);
        setWaitlist(slotData.waitlist || []);
      }

      // Fetch leaderboard
      const leadRes = await fetch(`/api/v1/public/leaderboard/${lobbyId}`);
      const leadData = await leadRes.json();
      if (leadData.success && leadData.results) {
        setLeaderboard(leadData.results);
      }
    } catch (e: any) {
      console.error('Error fetching event data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [lobbyId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Admin IDP save
  const handleSaveIdp = async () => {
    if (!adminRoomId || !adminRoomPass) return;
    try {
      const res = await fetch(`/api/v1/admin/scrims/${lobbyId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey ? { Authorization: 'Bearer ' + adminKey.trim() } : {}),
        },
        body: JSON.stringify({
          action: 'set-idp',
          roomId: adminRoomId,
          roomPassword: adminRoomPass,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminNotice('Room ID & Password saved successfully!');
        setAdminRoomId('');
        setAdminRoomPass('');
        fetchEventData();
      } else {
        setAdminNotice(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setAdminNotice(`Failed: ${e.message}`);
    }
    setTimeout(() => setAdminNotice(null), 4000);
  };

  // Filtered confirmed squads
  const filteredConfirmed = confirmed.filter((slot) => {
    if (!teamSearch.trim()) return true;
    const q = teamSearch.toLowerCase();
    return (
      slot.teamName.toLowerCase().includes(q) ||
      (slot.teamTag && slot.teamTag.toLowerCase().includes(q)) ||
      slot.captainId.includes(q) ||
      String(slot.slotNumber) === q
    );
  });

  const checkedInCount = confirmed.filter((c) => c.checkedIn).length;
  const fillPercentage = lobby ? Math.round((confirmed.length / lobby.totalSlots) * 100) : 0;

  if (loading && !lobby) {
    return (
      <div className="border-4 border-black bg-[#11141D] p-16 text-center shadow-[6px_6px_0px_#000] font-mono text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#00F0FF]" />
        LOADING EVENT DATA [{lobbyId}]...
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="border-4 border-black bg-[#11141D] p-16 text-center shadow-[6px_6px_0px_#000] font-mono text-white space-y-4">
        <AlertTriangle className="w-12 h-12 text-[#FF0055] mx-auto" />
        <h2 className="text-2xl font-black uppercase">EVENT NOT FOUND</h2>
        <p className="text-zinc-400 text-xs">The tournament lobby ID `{lobbyId}` does not exist in the database.</p>
        <button
          onClick={onBack}
          className="border-2 border-black bg-[#00F0FF] text-black px-4 py-2 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000]"
        >
          RETURN TO EVENTS
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="border-2 border-black bg-[#181C28] text-white px-4 py-2 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#000] hover:bg-zinc-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4 text-[#00F0FF]" />
          <span>BACK TO ALL EVENTS</span>
        </button>

        <button
          onClick={fetchEventData}
          className="border-2 border-black bg-[#00F0FF] text-black px-3.5 py-1.5 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000] hover:bg-cyan-300 transition-all flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Main Tournament Hero Header */}
      <div className="border-4 border-black bg-[#11141D] p-6 md:p-8 shadow-[6px_6px_0px_#000] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-black bg-[#00F0FF] text-black font-mono text-xs font-black px-2.5 py-0.5 shadow-[2px_2px_0px_#000]">
                {lobby.gameType}
              </span>
              <span className="border border-black bg-zinc-800 text-white font-mono text-xs font-bold px-2.5 py-0.5 shadow-[2px_2px_0px_#000]">
                TIER {lobby.tier}
              </span>
              <span className={`border border-black font-mono text-xs font-black px-2.5 py-0.5 shadow-[2px_2px_0px_#000] ${
                lobby.status === 'OPEN'
                  ? 'bg-[#39FF14] text-black'
                  : lobby.status === 'LIVE'
                  ? 'bg-[#FF0055] text-white'
                  : 'bg-[#FFE600] text-black'
              }`}>
                STATUS: {lobby.status}
              </span>
            </div>

            <h1 className="font-mono text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white tracking-tight">
              {lobby.title}
            </h1>
          </div>

          {/* Lobby ID with 1-Click Copy */}
          <div className="border-2 border-black bg-[#090B10] p-3 shadow-[3px_3px_0px_#000] self-start md:self-auto flex items-center space-x-3">
            <div>
              <span className="font-mono text-[10px] text-zinc-500 uppercase block">LOBBY IDENTIFIER</span>
              <code className="font-mono text-sm font-bold text-[#00F0FF]">{lobby.lobbyId}</code>
            </div>
            <button
              onClick={() => copyToClipboard(lobby.lobbyId)}
              className="border border-black bg-[#181C28] text-zinc-300 hover:text-white px-2.5 py-1.5 text-xs font-mono font-bold uppercase shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedId ? 'COPIED!' : 'COPY'}</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t-2 border-zinc-800">
          <div className="border-2 border-black bg-[#090B10] p-4 shadow-[3px_3px_0px_#000]">
            <span className="font-mono text-[11px] text-zinc-500 uppercase block">CONFIRMED ROSTERS</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-mono text-2xl font-black text-[#39FF14]">{confirmed.length}</span>
              <span className="font-mono text-xs text-zinc-500">/ {lobby.totalSlots} SLOTS</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-zinc-800 h-1.5 mt-2 overflow-hidden border border-black">
              <div
                style={{ width: `${fillPercentage}%` }}
                className="bg-[#39FF14] h-full"
              ></div>
            </div>
          </div>

          <div className="border-2 border-black bg-[#090B10] p-4 shadow-[3px_3px_0px_#000]">
            <span className="font-mono text-[11px] text-zinc-500 uppercase block">WAITLIST OVERFLOW</span>
            <span className="font-mono text-2xl font-black text-[#FFE600]">{waitlist.length} SQUADS</span>
            <span className="font-mono text-[10px] text-zinc-500 block mt-1">AUTO-PROMOTION ACTIVE</span>
          </div>

          <div className="border-2 border-black bg-[#090B10] p-4 shadow-[3px_3px_0px_#000]">
            <span className="font-mono text-[11px] text-zinc-500 uppercase block">CHECK-IN CONFIRMED</span>
            <span className="font-mono text-2xl font-black text-[#00F0FF]">{checkedInCount} TEAMS</span>
            <span className="font-mono text-[10px] text-zinc-500 block mt-1">
              {confirmed.length > 0 ? Math.round((checkedInCount / confirmed.length) * 100) : 0}% CHECK-IN RATE
            </span>
          </div>

          <div className="border-2 border-black bg-[#090B10] p-4 shadow-[3px_3px_0px_#000]">
            <span className="font-mono text-[11px] text-zinc-500 uppercase block">VIP RESERVED</span>
            <span className="font-mono text-2xl font-black text-white">{lobby.reservedSlotsCount} SLOTS</span>
            <span className="font-mono text-[10px] text-zinc-500 block mt-1">PRE-ALLOCATED SLOTS</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-black pb-2">
        <button
          onClick={() => setActiveTab('rosters')}
          className={`font-mono text-xs font-bold uppercase px-5 py-2.5 border-2 border-black shadow-[3px_3px_0px_#000] transition-all flex items-center space-x-2 ${
            activeTab === 'rosters'
              ? 'bg-[#39FF14] text-black -translate-y-0.5'
              : 'bg-[#181C28] text-zinc-300 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>[01] SQUAD ROSTERS & SLOTS ({confirmed.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`font-mono text-xs font-bold uppercase px-5 py-2.5 border-2 border-black shadow-[3px_3px_0px_#000] transition-all flex items-center space-x-2 ${
            activeTab === 'leaderboard'
              ? 'bg-[#FFDF00] text-black -translate-y-0.5'
              : 'bg-[#181C28] text-zinc-300 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>[02] EVENT LEADERBOARD & STANDINGS</span>
        </button>

        <button
          onClick={() => setActiveTab('idp')}
          className={`font-mono text-xs font-bold uppercase px-5 py-2.5 border-2 border-black shadow-[3px_3px_0px_#000] transition-all flex items-center space-x-2 ${
            activeTab === 'idp'
              ? 'bg-[#00F0FF] text-black -translate-y-0.5'
              : 'bg-[#181C28] text-zinc-300 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>[03] ROOM ID & PASS (IDP)</span>
        </button>
      </div>

      {/* Notice alert */}
      {adminNotice && (
        <div className="border-2 border-black bg-[#FFE600] text-black font-mono text-xs font-bold px-4 py-2.5 shadow-[4px_4px_0px_#000]">
          {adminNotice}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 1: SQUAD ROSTERS & SLOTS                         */}
      {/* ======================================================== */}
      {activeTab === 'rosters' && (
        <div className="space-y-8">
          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Search registered team, tag, slot #, or captain ID..."
                className="w-full bg-[#11141D] border-2 border-black pl-9 pr-4 py-2 font-mono text-xs text-white placeholder-zinc-500 shadow-[3px_3px_0px_#000] focus:border-[#39FF14] outline-none"
              />
            </div>
            <span className="font-mono text-xs text-zinc-400">
              Showing {filteredConfirmed.length} of {confirmed.length} teams
            </span>
          </div>

          {/* Confirmed Slots Grid */}
          <div className="space-y-4">
            <h3 className="font-mono text-base font-black uppercase text-white flex items-center gap-2 border-b-2 border-zinc-800 pb-2">
              <CheckCircle2 className="w-4 h-4 text-[#39FF14]" />
              CONFIRMED SQUADS ({confirmed.length} / {lobby.totalSlots})
            </h3>

            {confirmed.length === 0 ? (
              <div className="border-4 border-black bg-[#11141D] p-10 text-center shadow-[4px_4px_0px_#000] font-mono text-zinc-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                No squads have registered yet for this lobby.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConfirmed.map((slot) => (
                  <div
                    key={slot.slotNumber}
                    className="border-2 border-black bg-[#11141D] p-4 shadow-[4px_4px_0px_#000] flex flex-col justify-between hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  >
                    <div>
                      {/* Top Slot Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="border-2 border-black bg-[#00F0FF] text-black font-mono text-xs font-black px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                          SLOT #{String(slot.slotNumber).padStart(2, '0')}
                        </span>

                        {slot.isReserved && (
                          <span className="border border-black bg-[#FFE600] text-black font-mono text-[10px] font-bold px-1.5 py-0.2 shadow-[1px_1px_0px_#000]">
                            ⭐ VIP RESERVED
                          </span>
                        )}
                      </div>

                      {/* Team Name */}
                      <h4 className="font-mono text-base font-black uppercase text-white tracking-tight flex items-center gap-2">
                        <span>{slot.teamName}</span>
                        {slot.teamTag && (
                          <span className="text-[#39FF14] text-xs font-bold">[{slot.teamTag}]</span>
                        )}
                      </h4>

                      {/* Captain ID */}
                      <div className="font-mono text-xs text-zinc-400 mt-2">
                        Captain ID: <code className="text-zinc-200 bg-black px-1.5 py-0.5 border border-zinc-800">{slot.captainId}</code>
                      </div>
                    </div>

                    {/* Check-In Pill */}
                    <div className="border-t-2 border-zinc-800 pt-3 mt-3 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-500 uppercase">CHECK-IN:</span>
                      {slot.checkedIn ? (
                        <span className="font-mono text-[10px] font-black text-[#39FF14] bg-emerald-950/60 border border-emerald-600 px-2 py-0.5">
                          ✓ CHECKED IN
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] font-bold text-[#FFE600] bg-yellow-950/40 border border-yellow-700 px-2 py-0.5">
                          ⏳ PENDING
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waitlist Overflow Queue */}
          {waitlist.length > 0 && (
            <div className="space-y-4 pt-6 border-t-2 border-zinc-800">
              <h3 className="font-mono text-base font-black uppercase text-white flex items-center gap-2 border-b-2 border-zinc-800 pb-2">
                <Clock className="w-4 h-4 text-[#FFE600]" />
                WAITLIST QUEUE ({waitlist.length} SQUADS)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {waitlist.map((w) => (
                  <div
                    key={w.position}
                    className="border-2 border-black bg-[#090B10] p-4 shadow-[3px_3px_0px_#000] border-l-4 border-l-[#FFE600]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#FFE600]">
                        WAITLIST POSITION #{w.position}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">AUTO-PROMOTION</span>
                    </div>
                    <div className="font-mono text-sm font-black text-white uppercase">{w.teamName}</div>
                    <div className="font-mono text-[11px] text-zinc-400 mt-1">Captain: <code className="text-zinc-300">{w.captainId}</code></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: EVENT'S OWN DEDICATED LEADERBOARD              */}
      {/* ======================================================== */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-800 pb-4">
            <div>
              <h3 className="font-mono text-xl font-black uppercase text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FFDF00]" />
                {lobby.title} • TOURNAMENT STANDINGS
              </h3>
              <p className="font-mono text-xs text-zinc-400 mt-0.5">
                Official PMGC/BGIS scoring engine (10-6-5-4-3-2-1-1) with 1 point per finish kill.
              </p>
            </div>

            {/* Round Filter */}
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-zinc-400 uppercase">ROUND:</span>
              <button
                onClick={() => setSelectedRound('all')}
                className={`font-mono text-xs font-bold uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000] ${
                  selectedRound === 'all'
                    ? 'bg-[#FFDF00] text-black'
                    : 'bg-[#181C28] text-zinc-400 hover:text-white'
                }`}
              >
                OVERALL
              </button>
              {[1, 2, 3, 4, 5].map((rnd) => (
                <button
                  key={rnd}
                  onClick={() => setSelectedRound(rnd)}
                  className={`font-mono text-xs font-bold uppercase px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000] ${
                    selectedRound === rnd
                      ? 'bg-[#00F0FF] text-black'
                      : 'bg-[#181C28] text-zinc-400 hover:text-white'
                  }`}
                >
                  R{rnd}
                </button>
              ))}
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="border-4 border-black bg-[#11141D] p-12 text-center shadow-[6px_6px_0px_#000] space-y-3 font-mono">
              <Trophy className="w-12 h-12 text-zinc-600 mx-auto" />
              <h4 className="text-lg font-black uppercase text-white">NO SCORES RECORDED YET FOR THIS LOBBY</h4>
              <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Match scores can be recorded by server organizers via Discord using <code className="text-[#39FF14]">/points add</code> or directly through the Web Dashboard Organizer Deck.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Podium Highlight Cards (Top 3) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaderboard.slice(0, 3).map((team, idx) => {
                  const colors = [
                    { border: '#FFDF00', bg: 'bg-[#FFDF00]', text: 'text-black', label: '🥇 1ST PLACE / CHAMPION' },
                    { border: '#E0E0E0', bg: 'bg-[#E0E0E0]', text: 'text-black', label: '🥈 2ND PLACE / RUNNER UP' },
                    { border: '#CD7F32', bg: 'bg-[#CD7F32]', text: 'text-black', label: '🥉 3RD PLACE / PODIUM' },
                  ];
                  const c = colors[idx];
                  return (
                    <div
                      key={team.teamName}
                      style={{ borderColor: c.border }}
                      className="border-4 bg-[#11141D] p-5 shadow-[4px_4px_0px_#000] flex flex-col justify-between"
                    >
                      <div>
                        <span className={`${c.bg} ${c.text} font-mono text-[11px] font-black px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000] block w-max mb-3`}>
                          {c.label}
                        </span>
                        <h4 className="font-mono text-xl font-black uppercase text-white tracking-tight">{team.teamName}</h4>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-t-2 border-zinc-800 pt-3 mt-4 text-center font-mono">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block">PLAC PTS</span>
                          <span className="text-base font-bold text-zinc-200">{team.placementPoints}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block">KILLS</span>
                          <span className="text-base font-bold text-[#FF0055]">{team.kills}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block">TOTAL</span>
                          <span className="text-xl font-black text-[#39FF14]">{team.totalPoints}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Points Table */}
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
                    {leaderboard.map((row, index) => (
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
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: ROOM CREDENTIALS (IDP)                        */}
      {/* ======================================================== */}
      {activeTab === 'idp' && (
        <div className="space-y-6">
          <div className="border-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] space-y-4">
            <h3 className="font-mono text-lg font-black uppercase text-white flex items-center gap-2 border-b-2 border-zinc-800 pb-2">
              <Key className="w-5 h-5 text-[#00F0FF]" /> SECURE IDP ROOM DELIVERY ARCHITECTURE
            </h3>

            <p className="font-mono text-xs text-zinc-300 leading-relaxed">
              To guarantee competitive fairness and eliminate room leaks, <strong>Crystal Scrims Manager</strong> does not expose Room Passwords in public REST APIs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="border-2 border-zinc-800 bg-[#090B10] p-4 shadow-[3px_3px_0px_#000]">
                <span className="font-mono text-xs font-bold text-[#39FF14] uppercase block mb-1">
                  1. FOR TEAM CAPTAINS (DISCORD)
                </span>
                <p className="font-mono text-xs text-zinc-400">
                  Captains click the <strong>[🔑 View Room IDP]</strong> button in the server's registration channel. The bot delivers credentials via private ephemeral modal or direct message.
                </p>
              </div>

              <div className="border-2 border-zinc-800 bg-[#090B10] p-4 shadow-[3px_3px_0px_#000]">
                <span className="font-mono text-xs font-bold text-[#00F0FF] uppercase block mb-1">
                  2. FOR ORGANIZERS (WEB CONSOLE)
                </span>
                <p className="font-mono text-xs text-zinc-400">
                  Event hosts authenticate with their server's <code>ADMIN_API_KEY</code> below to update Room Credentials in real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Admin Room Dispatcher Form */}
          <div className="border-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] space-y-4">
            <h3 className="font-mono text-sm font-black uppercase text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#39FF14]" /> ORGANIZER ROOM CREDENTIALS DISPATCHER
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Custom Room ID:</label>
                <input
                  type="text"
                  placeholder="e.g. 984210"
                  value={adminRoomId}
                  onChange={(e) => setAdminRoomId(e.target.value)}
                  className="w-full bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white focus:border-[#00F0FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Custom Room Password:</label>
                <input
                  type="text"
                  placeholder="e.g. 1234"
                  value={adminRoomPass}
                  onChange={(e) => setAdminRoomPass(e.target.value)}
                  className="w-full bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white focus:border-[#00F0FF] outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveIdp}
              className="border-2 border-black bg-[#00F0FF] text-black px-6 py-2.5 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#000] hover:bg-cyan-300 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>SAVE & DISPATCH ROOM CREDENTIALS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
