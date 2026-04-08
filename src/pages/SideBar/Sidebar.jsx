import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Users,
  User,
  MapPin,
  CalendarDays,
  CreditCard,
  FolderOpen,
  HeadphonesIcon,
  UserCog,
  UserCheck,
  Bell,
  BarChart3,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout, selectUser } from '@/Redux/Auth/authSlice';

import favicon from '@/Assets/favicon.png';
import ikadouLogo from '@/Assets/ikadou_logo.png';

const NAV_ITEMS = [
  {
    group: 'Vue globale',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Reporting', path: '/reporting', icon: BarChart3 },
    ],
  },
  {
    group: 'Commercial',
    items: [
      { label: 'Leads', path: '/leads', icon: Users },
      { label: 'Clients', path: '/clients', icon: User },
      { label: 'Terrains', path: '/terrains', icon: MapPin },
      { label: 'Visites', path: '/visites', icon: CalendarDays },
    ],
  },
  {
    group: 'Finance & Docs',
    items: [
      { label: 'Paiements', path: '/paiements', icon: CreditCard },
      { label: 'Documents', path: '/documents', icon: FolderOpen },
    ],
  },
  {
    group: 'Support',
    items: [
      { label: 'Tickets', path: '/support', icon: HeadphonesIcon },
      { label: 'Notifications', path: '/notifications', icon: Bell },
    ],
  },
  {
    group: 'Administration',
    items: [
      { label: 'Utilisateurs', path: '/utilisateurs', icon: UserCog },
      { label: 'Agents', path: '/agents', icon: UserCheck },
      { label: 'Zones', path: '/zones', icon: MapPin },
    ],
  },
];

const ROLE_RESTRICTIONS = {
  utilisateurs: ['admin', 'super_admin'],
  reporting: ['admin', 'super_admin', 'manager'],
  paiements: ['admin', 'super_admin', 'manager', 'finance'],
};

export default function Sidebar({ collapsed }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/auth/login');
  };

  const isVisible = (path) => {
    const key = path.replace('/', '');
    const allowed = ROLE_RESTRICTIONS[key];
    if (!allowed) return true;
    return user && allowed.includes(user.role);
  };

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r transition-all duration-300',
        collapsed ? 'w-[84px]' : 'w-[290px]'
      )}
      style={{
        background:
          'radial-gradient(circle at top left, rgba(14,165,183,0.10), transparent 24%), radial-gradient(circle at bottom right, rgba(255,107,0,0.10), transparent 22%), linear-gradient(180deg, #071521 0%, #0b1c2b 100%)',
        borderColor: '#123147',
      }}
    >
      {/* glow lines */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />

      {/* Logo */}
      <div
        className={cn(
          'border-b px-4 py-5',
          collapsed ? 'flex justify-center' : 'flex items-center gap-3'
        )}
        style={{ borderColor: '#123147' }}
      >
        <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-[0_10px_30px_rgba(14,165,183,0.15)]">
          <img
            src={favicon}
            alt="Ikadou favicon"
            className="h-6 w-6 object-contain"
          />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <img
              src={ikadouLogo}
              alt="Ikadou"
              className="h-8 w-auto max-w-[150px] object-contain"
            />
            <div className="mt-1 flex items-center gap-1.5">
              <Sparkles size={11} className="text-[#ff6b00]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[#ff6b00]">
                Backoffice 
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {NAV_ITEMS.map((group) => {
          const visibleItems = group.items.filter((item) => isVisible(item.path));
          if (!visibleItems.length) return null;

          return (
            <div key={group.group} className="mb-6">
              {!collapsed && (
                <div className="mb-2 px-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8aa6b2] opacity-80">
                    {group.group}
                  </p>
                </div>
              )}

              <ul className="space-y-1.5">
                {visibleItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center rounded-2xl transition-all duration-200',
                          collapsed
                            ? 'justify-center px-0 py-3'
                            : 'gap-3 px-3 py-3',
                          isActive
                            ? 'text-white shadow-[0_12px_30px_rgba(14,165,183,0.22)]'
                            : 'text-[#b7c9d1] hover:text-white hover:bg-white/[0.04]'
                        )
                      }
                      style={({ isActive }) => ({
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(14,165,183,1) 0%, rgba(11,127,140,1) 100%)'
                          : 'transparent',
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && !collapsed ? (
                            <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-white/80" />
                          ) : null}

                          <div
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
                              isActive
                                ? 'bg-white/10'
                                : 'bg-transparent group-hover:bg-white/[0.06]'
                            )}
                          >
                            <item.icon
                              size={17}
                              className={cn(
                                'flex-shrink-0 transition-opacity',
                                isActive
                                  ? 'text-white opacity-100'
                                  : 'opacity-80 group-hover:opacity-100'
                              )}
                            />
                          </div>

                          {!collapsed && (
                            <>
                              <span className="flex-1 text-sm font-medium">
                                {item.label}
                              </span>
                              <ChevronRight
                                size={13}
                                className={cn(
                                  'transition-all',
                                  isActive
                                    ? 'translate-x-0 opacity-70'
                                    : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50'
                                )}
                              />
                            </>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer user */}
      <div className="border-t p-3" style={{ borderColor: '#123147' }}>
        {!collapsed && user && (
          <div className="mb-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0ea5b7]/20 ring-1 ring-white/10">
                <img
                  src={favicon}
                  alt="Profil"
                  className="h-4 w-4 object-contain opacity-90"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="mt-0.5 text-[11px] capitalize text-[#8aa6b2]">
                  {user.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center rounded-2xl text-sm transition-all',
            collapsed
              ? 'justify-center px-0 py-3'
              : 'gap-3 px-3 py-3',
            'text-[#b7c9d1] hover:bg-white/[0.05] hover:text-white'
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-transparent transition-all hover:bg-white/[0.06]">
            <LogOut size={16} className="flex-shrink-0" />
          </div>
          {!collapsed && <span className="font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}