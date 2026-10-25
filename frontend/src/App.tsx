import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { LandingPage } from './pages/LandingPage';
import { SearchPage } from './pages/SearchPage';
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
          <Header onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

          <div className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/design" element={<DesignSystemShowcase />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
          />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
