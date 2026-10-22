import React from 'react';
import { 
  FileText, 
  Trophy, 
  Terminal, 
  Server, 
  ExternalLink, 
  ShieldCheck, 
  Gamepad2, 
  Key, 
  Zap,
  CheckCircle2
} from 'lucide-react';

export const DocsPage: React.FC = () => {
  const scoringMatrix = [
    { rank: '#01 (WWCD)', placement: 10, label: 'CHAMPION / WINNER' },
    { rank: '#02', placement: 6, label: 'RUNNER UP' },
    { rank: '#03', placement: 5, label: '3RD PLACE' },
    { rank: '#04', placement: 4, label: '4TH PLACE' },
    { rank: '#05', placement: 3, label: '5TH PLACE' },
    { rank: '#06', placement: 2, label: '6TH PLACE' },
    { rank: '#07', placement: 1, label: '7TH PLACE' },
    { rank: '#08', placement: 1, label: '8TH PLACE' },
    { rank: '#09 - #16+', placement: 0, label: 'NO PLACEMENT POINTS' },
  ];

  const commandsList = [
    { cmd: '/setup autostructure', desc: '1-Click setup: provisions Scrims Category, locked channels (#registration, #slotlist, #idp), and auto-creates Organizer, Captain, & Player roles.' },
    { cmd: '/setup roles', desc: '1-Click provisioning of Scrim Organizer (Gold), Scrim Captain (Cyan), and Verified Player (Lime) roles.' },
    { cmd: '/setup games', desc: 'Configure game whitelist (e.g. ALL, only BGMI, only Valorant, only Free Fire) for the server.' },
    { cmd: '/scrim create', desc: 'Provision a new scrim lobby with title, game preset, tier, and slot count.' },
    { cmd: '/scrim open', desc: 'Open registrations: posts interactive [Register] & [IDP] buttons and creates/attaches the live standings channel.' },
    { cmd: '/scrim panel', desc: 'Open Admin Scrim Control Panel with Open, Close, IDP, and Slotlist buttons (auto-expires in 3m).' },
    { cmd: '/register', desc: 'Command or button modal to register team name, tag, captain, and roster players.' },
    { cmd: '/points add', desc: 'Record round placement and finish kills. Updates both Discord live channel and web leaderboard.' },
    { cmd: '/points table', desc: 'Render the live points table embed in chat or filter by round.' },
    { cmd: '/announce result', desc: 'Broadcast celebratory Win, Defeat, or Draw cards with esports GIFs to announcements.' },
    { cmd: '/bracket generate', desc: 'Generate single-elimination tournament bracket trees with ASCII preview.' },
    { cmd: '/advance blacklist', desc: 'Ban abusive teams/players from entering scrims with reason and expiration timer.' },
  ];

  return (
    <div className="space-y-12 pb-16 font-mono">
      {/* Header */}
      <div className="border-4 border-black dark:bg-[#0D0F16] bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000] transition-colors">
        <div className="inline-flex items-center space-x-2 border-2 border-black bg-[#FFDF00] text-black px-2.5 py-0.5 text-xs font-black uppercase mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>OFFICIAL RULEBOOK & COMMAND MANUAL</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black uppercase dark:text-white text-zinc-950">
          SCORING RULES & COMMAND GUIDE
        </h1>
        <p className="text-xs sm:text-sm dark:text-zinc-400 text-zinc-600 mt-1">
          Complete guide on esports points tables, Discord slash commands, and player participation.
        </p>
      </div>

      {/* 1. Official Scoring Engine */}
      <section className="space-y-4">
        <div className="border-b-2 dark:border-zinc-800 border-zinc-200 pb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-black uppercase dark:text-white text-black flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FFDF00]" />
            <span>OFFICIAL BGIS / PMGC SCORING MATRIX</span>
          </h2>
          <span className="brutal-badge bg-[#39FF14] text-black">1 FINISH KILL = 1 POINT</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {scoringMatrix.map((item, idx) => (
            <div 
              key={idx} 
              className={`brutal-card p-4 flex items-center justify-between ${
                idx === 0 ? 'border-2 border-[#FFDF00] dark:bg-[#FFDF00]/5 bg-[#FFDF00]/10' : ''
              }`}
            >
              <div>
                <span className="text-xs font-black dark:text-white text-black block">{item.rank}</span>
                <span className="text-[10px] dark:text-zinc-400 text-zinc-600 uppercase">{item.label}</span>
              </div>
              <div className="text-xl font-black text-[#00F0FF]">
                +{item.placement} <span className="text-xs dark:text-zinc-400 text-zinc-600">PTS</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Slash Commands Matrix */}
      <section className="space-y-4">
        <div className="border-b-2 dark:border-zinc-800 border-zinc-200 pb-2">
          <h2 className="text-lg sm:text-xl font-black uppercase dark:text-white text-black flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#00F0FF]" />
            <span>DISCORD SLASH COMMANDS REFERENCE</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commandsList.map((c, i) => (
            <div key={i} className="brutal-card p-4 space-y-1.5 hover:border-[#00F0FF] transition-all">
              <div className="flex items-center justify-between">
                <code className="text-xs font-black text-[#00F0FF] bg-black px-2 py-0.5 border border-black">
                  {c.cmd}
                </code>
              </div>
              <p className="text-xs dark:text-zinc-300 text-zinc-700 leading-relaxed">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Competitive Integrity & IDP Info */}
      <section className="brutal-card p-6 sm:p-8 space-y-4">
        <h3 className="text-base sm:text-lg font-black uppercase dark:text-white text-black flex items-center gap-2 border-b-2 dark:border-zinc-800 border-zinc-200 pb-2">
          <Key className="w-5 h-5 text-[#00F0FF]" />
          <span>HOW PLAYERS RECEIVE ROOM ID & PASSWORD</span>
        </h3>
        <p className="text-xs dark:text-zinc-300 text-zinc-700 leading-relaxed">
          Crystal Scrims Manager implements an <strong>Ephemeral IDP Delivery</strong> system. When organizers dispatch room credentials, room credentials are <strong>never leaked</strong> to chat or public websites.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 border dark:border-zinc-800 border-zinc-200 dark:bg-[#050507] bg-zinc-50 space-y-1">
            <span className="text-xs font-black text-[#39FF14] uppercase block">FOR SQUAD CAPTAINS</span>
            <p className="text-xs dark:text-zinc-400 text-zinc-600">
              In Discord, verified captains simply click the <strong>[🔑 View Room IDP]</strong> button. Only verified team captains get an ephemeral pop-up showing room credentials.
            </p>
          </div>
          <div className="p-4 border dark:border-zinc-800 border-zinc-200 dark:bg-[#050507] bg-zinc-50 space-y-1">
            <span className="text-xs font-black text-[#00F0FF] uppercase block">AUTO-PROMOTION ON LEAVE</span>
            <p className="text-xs dark:text-zinc-400 text-zinc-600">
              If a squad clicks <strong>[🚪 Leave Slot]</strong>, their spot is immediately released and the #1 waitlisted team is promoted into confirmed status automatically.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
