import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Play, 
  Lock, 
  AlertTriangle, 
  UserX, 
  PlusCircle, 
  Trophy, 
  CheckCircle2, 
  Clock,
  Radio
} from 'lucide-react';

interface Lobby {
  lobbyId: string;
  title: string;
  gameType: string;
  tier: string;
  status: string;
}

interface AdminPageProps {
  lobbies: Lobby[];
  adminKey: string;
  setAdminKey: (key: string) => void;
  onRefreshLobbies: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  lobbies,
  adminKey,
  setAdminKey,
  onRefreshLobbies,
}) => {
  const [selectedLobbyId, setSelectedLobbyId] = useState<string>(lobbies[0]?.lobbyId || '');
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Form states
  const [adminKickTarget, setAdminKickTarget] = useState('');
  const [adminRoomId, setAdminRoomId] = useState('');
  const [adminRoomPass, setAdminRoomPass] = useState('');
  const [scoreTeam, setScoreTeam] = useState('');
  const [scorePlacement, setScorePlacement] = useState(1);
  const [scoreKills, setScoreKills] = useState(0);
  const [scoreRound, setScoreRound] = useState(1);

  const notify = (msg: string) => {
    setAdminNotice(msg);
    setTimeout(() => setAdminNotice(null), 4000);
  };

  const handleAdminAction = async (action: string, payload: any = {}) => {
    if (!selectedLobbyId) {
      notify('Please select an active tournament lobby first.');
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/scrims/${selectedLobbyId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey ? { Authorization: 'Bearer ' + adminKey.trim() } : {}),
        },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Success: ${data.message || 'Action executed successfully'}`);
        onRefreshLobbies();
      } else {
        notify(`Error: ${data.error}`);
      }
    } catch (e: any) {
      notify(`Action failed: ${e.message}`);
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLobbyId || !scoreTeam) return;

    try {
      const res = await fetch('/api/v1/admin/points/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey ? { Authorization: 'Bearer ' + adminKey.trim() } : {}),
        },
        body: JSON.stringify({
          lobbyId: selectedLobbyId,
          teamName: scoreTeam,
          placement: Number(scorePlacement),
          kills: Number(scoreKills),
          round: Number(scoreRound),
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Points recorded for ${scoreTeam}: ${data.result.totalPoints} total pts (Round #${scoreRound})`);
        setScoreTeam('');
        onRefreshLobbies();
      } else {
        notify(`Error: ${data.error}`);
      }
    } catch (e: any) {
      notify(`Score recording failed: ${e.message}`);
    }
  };

  const activeLobby = lobbies.find((l) => l.lobbyId === selectedLobbyId) || lobbies[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#FF0055] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-[#FF0055]" />
            <span>AUTHENTICATED OPERATOR COMMAND CONSOLE</span>
          </div>
          <h1 className="font-mono text-3xl md:text-4xl font-black uppercase text-white tracking-tight">
            ADMIN COMMAND DECK
          </h1>
          <p className="font-mono text-xs text-zinc-400 mt-1">
            Execute real-time tournament operations, kick no-show squads, dispatch IDP, and record official finish points.
          </p>
        </div>

        {/* Active Lobby Picker */}
        <div className="flex items-center space-x-2">
          <label className="font-mono text-xs text-zinc-400 uppercase hidden sm:inline">TARGET LOBBY:</label>
          <select
            value={selectedLobbyId}
            onChange={(e) => setSelectedLobbyId(e.target.value)}
            className="bg-[#090B10] border-2 border-black px-3 py-2 font-mono text-xs text-white shadow-[3px_3px_0px_#000] focus:border-[#FF0055] outline-none max-w-xs"
          >
            {lobbies.map((l) => (
              <option key={l.lobbyId} value={l.lobbyId}>
                [{l.status}] {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Security Gate Card */}
      <div className="border-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sm font-bold text-[#00F0FF] tracking-wider uppercase font-mono">
              <Key className="w-4 h-4 text-[#00F0FF]" />
              <span>Operator Security Passkey</span>
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Provide the <code className="text-zinc-200">ADMIN_API_KEY</code> from your server's <code className="text-zinc-200">.env</code> to authenticate write operations.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => {
                setAdminKey(e.target.value);
                localStorage.setItem('crystal_admin_key', e.target.value);
              }}
              placeholder="Paste ADMIN_API_KEY..."
              className="bg-black border-2 border-zinc-700 px-3 py-2 text-xs font-mono text-white focus:border-[#00F0FF] outline-none min-w-[240px]"
            />
            <button
              onClick={() => {
                localStorage.setItem('crystal_admin_key', adminKey);
                notify('Admin security passkey stored locally.');
              }}
              className="border-2 border-black bg-[#00F0FF] text-black px-4 py-2 text-xs font-mono font-bold uppercase hover:bg-cyan-300 shadow-[2px_2px_0px_#000]"
            >
              SAVE KEY
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {adminNotice && (
        <div className="border-2 border-black bg-[#FFE600] text-black font-mono text-xs font-bold px-4 py-3 shadow-[4px_4px_0px_#000]">
          {adminNotice}
        </div>
      )}

      {/* Main Admin Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Quick Lobby Lifecycle Actions */}
        <div className="border-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] space-y-6">
          <div className="border-b-2 border-zinc-800 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-base font-black uppercase text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FF0055]" /> LIFECYCLE CONTROLS
              </h3>
              {activeLobby && (
                <span className="border border-black bg-[#00F0FF] text-black text-[10px] font-mono font-bold px-2 py-0.5">
                  ID: {activeLobby.lobbyId}
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-zinc-400 mt-1">
              Trigger state changes for <strong>{activeLobby?.title || 'Selected Lobby'}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAdminAction('open')}
              className="border-2 border-black bg-[#39FF14] text-black font-mono text-xs font-black uppercase py-2.5 shadow-[3px_3px_0px_#000] hover:bg-[#32e012] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> OPEN REGISTRATION
            </button>

            <button
              onClick={() => handleAdminAction('close')}
              className="border-2 border-black bg-zinc-800 text-white font-mono text-xs font-black uppercase py-2.5 shadow-[3px_3px_0px_#000] hover:bg-zinc-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" /> LOCK SLOTS
            </button>

            <button
              onClick={() => handleAdminAction('status', { status: 'LIVE' })}
              className="border-2 border-black bg-[#FF0055] text-white font-mono text-xs font-black uppercase py-2.5 shadow-[3px_3px_0px_#000] hover:bg-rose-600 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" /> MARK AS LIVE
            </button>

            <button
              onClick={() => handleAdminAction('status', { status: 'COMPLETED' })}
              className="border-2 border-black bg-[#FFE600] text-black font-mono text-xs font-black uppercase py-2.5 shadow-[3px_3px_0px_#000] hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> MARK COMPLETED
            </button>

            <button
              onClick={() => handleAdminAction('cancel')}
              className="border-2 border-black bg-red-950 border-red-700 text-red-300 font-mono text-xs font-black uppercase py-2 shadow-[3px_3px_0px_#000] col-span-2 hover:bg-red-900 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> CANCEL TOURNAMENT LOBBY
            </button>
          </div>

          {/* Kick & Auto-promote */}
          <div className="border-t-2 border-zinc-800 pt-4 space-y-2">
            <label className="block text-xs font-mono uppercase text-zinc-300 font-bold">
              Kick Squad & Auto-Promote Waitlist:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Slot # (e.g. 5) or Exact Team Name"
                value={adminKickTarget}
                onChange={(e) => setAdminKickTarget(e.target.value)}
                className="flex-1 bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white focus:border-[#FF0055] outline-none"
              />
              <button
                onClick={() => {
                  if (adminKickTarget) {
                    handleAdminAction('kick', { target: adminKickTarget });
                    setAdminKickTarget('');
                  }
                }}
                className="border-2 border-black bg-black text-[#FF0055] border-[#FF0055] px-4 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000] hover:bg-[#FF0055] hover:text-white transition-all"
              >
                KICK
              </button>
            </div>
            <p className="font-mono text-[10px] text-zinc-500">
              When a squad is kicked, Waitlist #1 is automatically promoted to fill the vacant slot.
            </p>
          </div>

          {/* Room IDP Dispatcher */}
          <div className="border-t-2 border-zinc-800 pt-4 space-y-3">
            <label className="block text-xs font-mono uppercase text-zinc-300 font-bold">
              Set Room ID & Password (IDP):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Room ID"
                value={adminRoomId}
                onChange={(e) => setAdminRoomId(e.target.value)}
                className="bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white focus:border-[#00F0FF] outline-none"
              />
              <input
                type="text"
                placeholder="Password"
                value={adminRoomPass}
                onChange={(e) => setAdminRoomPass(e.target.value)}
                className="bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white focus:border-[#00F0FF] outline-none"
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
              className="w-full border-2 border-black bg-[#00F0FF] text-black py-2 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#000] hover:bg-cyan-300 transition-all flex items-center justify-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" /> SAVE & DISPATCH ROOM CREDENTIALS
            </button>
          </div>
        </div>

        {/* 2. Live Scorekeeper Studio Form */}
        <div className="border-4 border-black bg-[#11141D] p-6 shadow-[5px_5px_0px_#000] space-y-6">
          <div className="border-b-2 border-zinc-800 pb-3">
            <h3 className="font-mono text-base font-black uppercase text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#39FF14]" /> LIVE SCOREKEEPER STUDIO
            </h3>
            <p className="font-mono text-xs text-zinc-400 mt-1">
              Submit round finish kills and placement ranks. Standings recompile instantly.
            </p>
          </div>

          <form onSubmit={handleScoreSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-300 font-bold mb-1">
                Competing Team Name:
              </label>
              <input
                type="text"
                required
                placeholder="Exact registered squad name"
                value={scoreTeam}
                onChange={(e) => setScoreTeam(e.target.value)}
                className="w-full bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white focus:border-[#39FF14] outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-300 font-bold mb-1">
                  Placement Rank:
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={scorePlacement}
                  onChange={(e) => setScorePlacement(Number(e.target.value))}
                  className="w-full bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white focus:border-[#39FF14] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-300 font-bold mb-1">
                  Finish Kills:
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={scoreKills}
                  onChange={(e) => setScoreKills(Number(e.target.value))}
                  className="w-full bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white focus:border-[#39FF14] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-300 font-bold mb-1">
                  Match Round:
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={20}
                  value={scoreRound}
                  onChange={(e) => setScoreRound(Number(e.target.value))}
                  className="w-full bg-black border-2 border-zinc-700 px-3 py-2 font-mono text-xs text-white focus:border-[#39FF14] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full border-2 border-black bg-[#39FF14] text-black py-3 font-mono text-xs font-black uppercase shadow-[4px_4px_0px_#000] hover:bg-[#32e012] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> RECORD MATCH ROUND SCORE
            </button>
          </form>

          <div className="border-t-2 border-zinc-800 pt-4">
            <span className="font-mono text-xs text-zinc-400 font-bold uppercase block mb-1">
              SCORING REFERENCE (PMGC / BGIS STANDARD):
            </span>
            <div className="font-mono text-[11px] text-zinc-500 space-y-1">
              <div>#01 (10 pts) • #02 (6 pts) • #03 (5 pts) • #04 (4 pts)</div>
              <div>#05 (3 pts) • #06 (2 pts) • #07-#08 (1 pt) • #09+ (0 pts)</div>
              <div className="text-[#39FF14]">+ 1 Point per finish kill</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
