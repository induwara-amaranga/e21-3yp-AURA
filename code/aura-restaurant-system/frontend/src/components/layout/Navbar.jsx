/**
 * ============================================================
 *  AURA Restaurant System — Top Navigation Bar
 * ============================================================
 *  Rendered ONLY for admin and kitchen roles.
 *  Table (customer) role renders fullscreen RobotUI with NO navbar.
 *
 *  Shows different nav links based on session.role:
 *    - admin   → Dashboard + Kitchen links
 *    - kitchen → Kitchen link only
 * ============================================================
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Bot, LayoutDashboard, ChefHat, Zap, LogOut } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

// Nav items per role — kitchen staff shouldn't need admin access
const NAV_ITEMS_ADMIN = [
  { path: '/admin',   label: 'Dashboard', icon: LayoutDashboard },
  { path: '/kitchen', label: 'Kitchen',   icon: ChefHat         },
];
const NAV_ITEMS_KITCHEN = [
  { path: '/kitchen', label: 'Kitchen',   icon: ChefHat         },
];

export default function Navbar() {
  const { session, logout } = useAppContext();
  const location = useLocation();

  const navItems =
    session?.role === 'admin' ? NAV_ITEMS_ADMIN : NAV_ITEMS_KITCHEN;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aura-500 to-neon-cyan
                            flex items-center justify-center shadow-lg shadow-aura-500/30">
              <Zap size={20} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold gradient-text tracking-tight">
              AURA
            </span>
            {/* Role pill */}
            {session && (
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest
                               px-2 py-0.5 rounded-full bg-aura-600/20 text-aura-400 border border-aura-500/20">
                {session.role}
              </span>
            )}
          </div>

          {/* ── Nav links ── */}
          <div className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <NavLink
                  key={path}
                  to={path}
                  id={`nav-link-${label.toLowerCase()}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                              transition-all duration-300 ease-out
                              ${isActive
                                ? 'bg-aura-600/20 text-aura-300 shadow-inner shadow-aura-500/10 border border-aura-500/20'
                                : 'text-dark-300 hover:text-white hover:bg-dark-700/50'}`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* ── Right side: system status + logout ── */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-dark-400">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              System Online
            </div>

            {/* Logout */}
            <button
              id="navbar-logout-btn"
              onClick={logout}
              title="Sign out"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                         text-dark-400 hover:text-white bg-white/5 hover:bg-white/10
                         border border-white/5 transition-all active:scale-95"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
