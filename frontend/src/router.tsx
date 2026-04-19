import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Schedule from '@/pages/Schedule';
import Modules from '@/pages/Modules';
import Planner from '@/pages/Planner';
import Settings from '@/pages/Settings';
import { useAuthStore } from '@/store/authStore';

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user && !user.courseKey) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/onboarding',
    element: <Onboarding />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <RequireOnboarding>
            <Dashboard />
          </RequireOnboarding>
        ),
      },
      {
        path: 'schedule',
        element: (
          <RequireOnboarding>
            <Schedule />
          </RequireOnboarding>
        ),
      },
      {
        path: 'modules',
        element: (
          <RequireOnboarding>
            <Modules />
          </RequireOnboarding>
        ),
      },
      {
        path: 'planner',
        element: (
          <RequireOnboarding>
            <Planner />
          </RequireOnboarding>
        ),
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);
