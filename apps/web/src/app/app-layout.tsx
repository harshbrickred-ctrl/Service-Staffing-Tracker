import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileSignature,
  UserCheck,
  Settings,
  LogOut,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme } from '@/shared/hooks/use-theme';
import { Button } from '@/shared/components/ui/button';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/requirements', label: 'Requirements', icon: Briefcase },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/offers', label: 'Offers', icon: FileSignature },
  { to: '/onboarding', label: 'Onboarding', icon: UserCheck },
  { to: '/admin', label: 'Admin', icon: Settings, roles: ['ADMIN'] },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          'sticky top-0 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-150 ease-out',
          collapsed ? 'w-[68px]' : 'w-56',
        )}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            S
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-semibold tracking-wide">SST</div>
              <div className="text-[11px] text-sidebar-foreground/60">
                Staffing Tracker
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {nav
            .filter(
              (item) =>
                !item.roles ||
                (user && item.roles.includes(user.role)),
            )
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-muted text-white'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-muted/60 hover:text-white',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
        </nav>
        <div className="border-t border-white/10 p-2 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-white"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" /> Collapse
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-white"
            onClick={toggle}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {!collapsed && (theme === 'dark' ? 'Light' : 'Dark')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-white"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && 'Sign out'}
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/70 px-6 backdrop-blur">
          <div className="text-sm text-muted-foreground">
            Hiring pipeline
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{user?.fullName}</div>
            <div className="text-xs text-muted-foreground font-mono">
              {user?.role}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
