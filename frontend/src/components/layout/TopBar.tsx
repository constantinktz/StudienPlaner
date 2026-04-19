import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, User, LogOut, Settings } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';

export function TopBar() {
  const { toggleSidebar, darkMode, toggleDarkMode } = useUiStore();
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore errors
    }
    clearUser();
    toast.success('Abgemeldet');
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">
          FH Dortmund — Studienplanung
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:block">{user?.email ?? 'Account'}</span>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-md z-50 dark:border-gray-700 dark:bg-gray-900"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => { navigate('/settings'); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Settings className="h-4 w-4" />
                Einstellungen
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
