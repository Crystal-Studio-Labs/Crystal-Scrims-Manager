import React from 'react';
import { ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t-4 border-black bg-[#0C0E14] text-zinc-400 font-mono text-xs mt-auto">
      {/* Top Banner */}
      <div className="border-b-2 border-zinc-800 py-6 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-center justify-between">
          <div>
            <div className="font-mono text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
              <span className="w-3 h-3 bg-[#00F0FF] border border-black inline-block"></span>
              CRYSTAL SCRIMS MANAGER
            </div>
            <p className="text-zinc-500 text-xs mt-1">
              Autonomous tournament and scrim operations platform with native Discord components and zero-cost cloud hosting.
            </p>
          </div>

          <div className="text-center md:text-left">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500 block mb-1">
              ARCHITECTURE & CREDITS
            </span>
            <div className="text-sm">
              Architected by{' '}
              <a
                href="https://sahooshuvranshu.is-a.dev"
                target="_blank"
                rel="noreferrer"
                className="text-[#00F0FF] font-bold hover:underline"
              >
                Shuvransu Sekhar Sahoo
              </a>{' '}
              for{' '}
              <a
                href="https://github.com/Crystal-Studio-Labs/"
                target="_blank"
                rel="noreferrer"
                className="text-[#39FF14] font-bold hover:underline"
              >
                Crystal Studio Labs
              </a>
            </div>
          </div>

          <div className="flex md:justify-end items-center gap-3">
            <a
              href="https://github.com/Crystal-Studio-Labs/Crystal-Scrims-Manager"
              target="_blank"
              rel="noreferrer"
              className="border-2 border-black bg-[#181C28] text-white px-3.5 py-1.5 text-xs font-bold uppercase shadow-[2px_2px_0px_#000] hover:bg-zinc-800 transition-all flex items-center gap-1.5"
            >
              REPOSITORY <ExternalLink className="w-3 h-3 text-[#00F0FF]" />
            </a>
            <a
              href="https://sahooshuvranshu.is-a.dev"
              target="_blank"
              rel="noreferrer"
              className="border-2 border-black bg-[#FFE600] text-black px-3.5 py-1.5 text-xs font-bold uppercase shadow-[2px_2px_0px_#000] hover:bg-yellow-400 transition-all flex items-center gap-1.5"
            >
              PORTFOLIO <ExternalLink className="w-3 h-3 text-black" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="py-4 px-6 bg-[#090B10]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500">
          <div>
            © 2026 CRYSTAL STUDIO LABS & SHUVRANSU SEKHAR SAHOO • DISTRIBUTED UNDER MIT LICENSE
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[#39FF14]">● TURSO LIBSQL READY</span>
            <span>•</span>
            <span className="text-[#00F0FF]">● 100% FREE-TIER CLOUD READY</span>
            <span>•</span>
            <span className="text-zinc-400">DISCORD.JS V14</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
