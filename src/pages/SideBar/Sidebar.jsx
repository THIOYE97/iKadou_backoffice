import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Users, User, MapPin, CalendarDays,
  CreditCard, FolderOpen, HeadphonesIcon, UserCog,
  UserCheck, Bell, BarChart3, LogOut, ChevronRight,
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
        'flex h-full flex-col border-r transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{
        background: 'linear-gradient(180deg, #071521 0%, #0b1c2b 100%)',
        borderColor: '#123147',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 border-b px-4 py-5"
        style={{ borderColor: '#123147' }}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/10 overflow-hidden">
          <img
            src={favicon}
            alt="Ikadou favicon"
            className="h-6 w-6 object-contain"
          />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex flex-col justify-center">
            <img
              src={ikadouLogo}
              alt="Ikadou"
              className="h-8 w-auto max-w-[140px] object-contain"
            />
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#ff6b00]">
              Backoffice
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((group) => {
          const visibleItems = group.items.filter((item) => isVisible(item.path));
          if (!visibleItems.length) return null;

          return (
            <div key={group.group} className="mb-5">
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8aa6b2] opacity-80">
                  {group.group}
                </p>
              )}

              <ul className="space-y-1">
                {visibleItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                          isActive
                            ? 'font-medium text-white shadow-sm'
                            : 'text-[#b7c9d1] hover:text-white'
                        )
                      }
                      style={({ isActive }) => ({
                        background: isActive
                          ? 'linear-gradient(135deg, #0ea5b7 0%, #0b7f8c 100%)'
                          : 'transparent',
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            size={17}
                            className={cn(
                              'flex-shrink-0 transition-opacity',
                              isActive ? 'text-white opacity-100' : 'opacity-80 group-hover:opacity-100'
                            )}
                          />

                          {!collapsed && (
                            <>
                              <span className="flex-1">{item.label}</span>
                              <ChevronRight
                                size={13}
                                className={cn(
                                  'transition-opacity',
                                  isActive ? 'opacity-70' : 'opacity-0 group-hover:opacity-50'
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

      {/* User + logout */}
      <div className="border-t p-3" style={{ borderColor: '#123147' }}>
        {!collapsed && user && (
          <div
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0ea5b7]/20 overflow-hidden">
              <img
                src={favicon}
                alt="Profil"
                className="h-4 w-4 object-contain opacity-90"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] capitalize text-[#8aa6b2]">
                {user.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#b7c9d1] transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}