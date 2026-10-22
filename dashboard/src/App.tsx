import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { LeaderboardsPage } from './pages/LeaderboardsPage';
import { AdminPage } from './pages/AdminPage';
import { DocsPage } from './pages/DocsPage';

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

  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState<string>(() => localStorage.getItem('crystal_admin_key') || '');
  const [botStatus, setBotStatus] = useState<string>('online');
  const [guildCount, setGuildCount] = useState<number>(1);

  // Fetch all lobbies and system telemetry
  const fetchLobbiesAndStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/public/scrims');
      const data = await res.json();
      if (data.success && data.lobbies) {
        setLobbies(data.lobbies);
      }

      // Fetch health telemetry
      const healthRes = await fetch('/health');
      const healthData = await healthRes.json();
      if (healthData.botStatus) {
        setBotStatus(healthData.botStatus);
      }
      if (healthData.guilds !== undefined) {
        setGuildCount(healthData.guilds);
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbiesAndStatus();
    // Poll telemetry every 30s
    const timer = setInterval(fetchLobbiesAndStatus, 30000);
    return () => clearInterval(timer);
  }, []);

  // Update URL search parameters when page or selected event changes
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

  return (
    <div className="min-h-screen bg-[#090B10] text-zinc-100 flex flex-col font-sans selection:bg-[#00F0FF] selection:text-black">
      {/* Top Navigation */}
      <Header
        currentPage={currentPage}
        setCurrentPage={(page) => navigateTo(page)}
        botStatus={botStatus}
        guildCount={guildCount}
      />

      {/* Main Multi-Page Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {currentPage === 'landing' && (
          <LandingPage
            lobbies={lobbies}
            onSelectEvent={handleSelectEvent}
            onNavigate={(p) => navigateTo(p)}
          />
        )}

        {currentPage === 'events' && (
          <EventsPage
            lobbies={lobbies}
            onSelectEvent={handleSelectEvent}
            onRefresh={fetchLobbiesAndStatus}
            loading={loading}
          />
        )}

        {currentPage === 'event-detail' && (
          <EventDetailPage
            lobbyId={selectedLobbyId || lobbies[0]?.lobbyId || ''}
            onBack={() => navigateTo('events')}
            adminKey={adminKey}
          />
        )}

        {currentPage === 'standings' && (
          <LeaderboardsPage
            lobbies={lobbies}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {currentPage === 'admin' && (
          <AdminPage
            lobbies={lobbies}
            adminKey={adminKey}
            setAdminKey={setAdminKey}
            onRefreshLobbies={fetchLobbiesAndStatus}
          />
        )}

        {currentPage === 'docs' && <DocsPage />}
      </main>

      {/* Global Neo-Brutalist Footer */}
      <Footer />
    </div>
  );
}
