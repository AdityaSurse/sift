import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { CompanyDirectoryModal } from './components/CompanyDirectoryModal';
import { LandingPage } from './pages/LandingPage';
import { JobsPage } from './pages/JobsPage';
import { SavedPage } from './pages/SavedPage';
import { AdminPage } from './pages/AdminPage';
import { DesignSystemShowcase } from './pages/DesignSystemShowcase';

/**
 * Configure TanStack Query client with sensible cache durations.
 * Why: 1-minute stale time prevents duplicate requests while keeping active searches fresh.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // Global hotkey listener: Cmd+K / Ctrl+K opens the command palette anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-bg text-text selection:bg-accent-subdued selection:text-accent font-sans antialiased transition-colors duration-150 ease-editorial flex flex-col justify-between">
          {/* 1. Slim announcement bar (live from API) */}
          <AnnouncementBar />

          {/* 2. Navbar with Logo, Jobs, Companies, Saved, Theme Toggle */}
          <Header
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenCompanies={() => setIsCompanyModalOpen(true)}
          />

          <div className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/search" element={<Navigate to="/jobs" replace />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/design" element={<DesignSystemShowcase />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Global Cmd+K Command Palette */}
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
          />

          {/* Company Roster Directory Modal */}
          <CompanyDirectoryModal
            isOpen={isCompanyModalOpen}
            onClose={() => setIsCompanyModalOpen(false)}
          />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
