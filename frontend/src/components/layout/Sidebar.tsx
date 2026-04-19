import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  ClipboardList,
  Settings,
  X,
  GraduationCap,
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/schedule', icon: Calendar, label: 'Stundenplan' },
  { to: '/modules', icon: BookOpen, label: 'Module' },
  { to: '/planner', icon: ClipboardList, label: 'Planner' },
  { to: '/settings', icon: Settings, label: 'Einstellungen' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUiStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white shadow-md transition-transform duration-300 dark:bg-gray-900 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">StudienPlaner</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700">
          FH Dortmund — StudienPlaner
        </div>
      </aside>
    </>
  );
}
