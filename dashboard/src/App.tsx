import React, { useState, useEffect } from 'react';
import { Header, type GuildInfo } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { LeaderboardsPage } from './pages/LeaderboardsPage';
import { DocsPage } from './pages/DocsPage';
import { API_BASE } from './config/api';

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

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('event')) return 'event-detail';
    return params.get('page') || 'landing';
  });

  const [selectedLobbyId, setSelectedLobbyId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('event') || '';
  });

  const [selectedGuildId, setSelectedGuildId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('guild') || localStorage.getItem('crystal_selected_guild') || '';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('crystal_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [guilds, setGuilds] = useState<GuildInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [botStatus, setBotStatus] = useState<string>('online');
  const [guildCount, setGuildCount] = useState<number>(1);

  // Apply dark / light mode class to <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('crystal_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch servers & lobbies
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Guilds list
      try {
        const guildRes = await fetch(`${API_BASE}/api/v1/public/guilds`);
        const guildData = await guildRes.json();
        if (guildData.success && guildData.guilds) {
          setGuilds(guildData.guilds);
          setGuildCount(guildData.guilds.length || 1);
        }
      } catch (err) {
        console.error('Failed to fetch guilds:', err);
      }

      // 2. Fetch Lobbies (optionally filtered by selected guild)
      const url = selectedGuildId 
        ? `${API_BASE}/api/v1/public/scrims?guildId=${selectedGuildId}`
        : `${API_BASE}/api/v1/public/scrims`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.lobbies) {
        setLobbies(data.lobbies);
      }

      // 3. Health status
      try {
        const healthRes = await fetch(`${API_BASE}/health`);
        const healthData = await healthRes.json();
        if (healthData.botStatus) setBotStatus(healthData.botStatus);
      } catch {}
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [selectedGuildId]);

  // Handle server switcher
  const handleSelectGuild = (guildId: string) => {
    setSelectedGuildId(guildId);
    if (guildId) {
      localStorage.setItem('crystal_selected_guild', guildId);
    } else {
      localStorage.removeItem('crystal_selected_guild');
    }

    const url = new URL(window.location.href);
    if (guildId) {
      url.searchParams.set('guild', guildId);
    } else {
      url.searchParams.delete('guild');
    }
    window.history.pushState({}, '', url.toString());
  };

  // Navigation router
  const navigateTo = (page: string, eventId?: string) => {
    setCurrentPage(page);
    const url = new URL(window.location.href);

    if (page === 'event-detail' && eventId) {
      setSelectedLobbyId(eventId);
      url.searchParams.set('event', eventId);
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', page);
      url.searchParams.delete('event');
    }

    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectEvent = (lobbyId: string) => {
    navigateTo('event-detail', lobbyId);
  };

  const activeGuild = guilds.find((g) => g.guildId === selectedGuildId);

  return (
    <div className="min-h-screen dark:bg-[#050507] bg-[#F4F4F0] dark:text-zinc-100 text-zinc-900 flex flex-col font-sans selection:bg-[#00F0FF] selection:text-black transition-colors">
      {/* Top Header */}
      <Header
        currentPage={currentPage}
        setCurrentPage={(page) => navigateTo(page)}
        botStatus={botStatus}
        guildCount={guildCount}
        guilds={guilds}
        selectedGuildId={selectedGuildId}
        onSelectGuild={handleSelectGuild}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {currentPage === 'landing' && (
          <LandingPage
            lobbies={lobbies}
            onSelectEvent={handleSelectEvent}
            onNavigate={(p) => navigateTo(p)}
            activeGuild={activeGuild}
            guildsCount={guildCount}
          />
        )}

        {currentPage === 'events' && (
          <EventsPage
            lobbies={lobbies}
            onSelectEvent={handleSelectEvent}
            onRefresh={fetchData}
            loading={loading}
          />
        )}

        {currentPage === 'event-detail' && (
          <EventDetailPage
            lobbyId={selectedLobbyId || lobbies[0]?.lobbyId || ''}
            onBack={() => navigateTo('events')}
          />
        )}

        {currentPage === 'standings' && (
          <LeaderboardsPage
            lobbies={lobbies}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {currentPage === 'docs' && <DocsPage />}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
