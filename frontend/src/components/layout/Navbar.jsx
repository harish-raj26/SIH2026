import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { healthService } from '../../services/healthService';
import { ActiveBusinessSwitcher } from './ActiveBusinessSwitcher';
import {
  Bell,
  User,
  LogOut,
  Sparkles,
  Menu,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { USER_ROLES } from '../../utils/constants';
import { formatDateShort } from '../../utils/formatters';

export function Navbar({ onMobileMenuToggle }) {
  const { user, role, logout, switchRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Ping backend health
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await healthService.checkHealth();
        if (mounted) setIsHealthy(res?.status === 'healthy');
      } catch {
        if (mounted) setIsHealthy(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'AI Discovery', path: '/approvals' },
    { label: 'Approvals', path: '/approvals' },
    { label: 'Documents', path: '/documents' },
    { label: 'Settings', path: '/profile' },
  ];

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#E5EAE8] bg-white text-[#172126] transition-colors shadow-2xs">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="p-1.5 rounded-lg text-[#66757A] hover:text-[#172126] hover:bg-[#F0F4F4] lg:hidden cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5">
            {/* Custom leaf/angled icon matching reference */}
            <div className="w-8 h-8 rounded-lg bg-[#0A4D46] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <span className="text-[#F2A51A] mr-0.5">/</span>/
            </div>
            <div className="flex items-center">
              <span className="text-xl font-extrabold text-[#0A4D46] tracking-tight">
                Biz<span className="text-[#006B68]">Clear</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Main Navigation Tabs matching reference */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link, idx) => {
            const isActive =
              link.path === '/dashboard'
                ? location.pathname === '/dashboard' || location.pathname === '/'
                : location.pathname.startsWith(link.path);

            return (
              <Link
                key={idx}
                to={link.path}
                className={`text-sm font-semibold transition-colors py-1 relative ${
                  isActive
                    ? 'text-[#006B68]'
                    : 'text-[#4A5859] hover:text-[#0A4D46]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#006B68] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Business Switcher, Notifications & User Avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ActiveBusinessSwitcher />
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-lg text-[#66757A] hover:text-[#172126] hover:bg-[#F0F4F4] transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E05252] ring-2 ring-white" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-[#E5EAE8] shadow-lg py-2 z-50 text-xs">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#E5EAE8]">
                  <span className="font-bold text-[#172126]">
                    Notifications ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-[#006B68] hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#E5EAE8]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[#66757A]">
                      No notifications at this time
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-3 hover:bg-[#F8FAF9] cursor-pointer flex gap-3 ${
                          !n.read ? 'bg-[#F0F7F5]' : ''
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-[#006B68]" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-[#172126] truncate">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-[#66757A] leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-[#9AA5A8]">
                            {formatDateShort(n.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full hover:bg-[#F0F4F4] transition-colors cursor-pointer border border-[#E5EAE8]"
            >
              <span className="hidden sm:block text-xs font-semibold text-[#172126] max-w-[110px] truncate">
                {user?.name || 'Compliance Officer'}
              </span>
              <div className="w-8 h-8 rounded-full bg-[#0A4D46] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CO'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#66757A]" />
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-[#E5EAE8] shadow-lg py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-[#E5EAE8] space-y-0.5">
                  <p className="font-bold text-[#172126] truncate">
                    {user?.name || 'Authorized Member'}
                  </p>
                  <p className="text-[11px] text-[#66757A] truncate">
                    {user?.email || 'officer@bizclear.ai'}
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#E6F2F2] text-[#0A4D46]">
                      {role.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full px-4 py-2 text-left text-[#172126] hover:bg-[#F8FAF9] flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <User className="w-4 h-4 text-[#66757A]" />
                    Account Profile & Settings
                  </button>

                  <div className="px-4 py-1.5 text-[10px] font-semibold uppercase text-[#66757A] tracking-wider">
                    Switch Persona
                  </div>
                  <button
                    onClick={() => switchRole(USER_ROLES.APPLICANT)}
                    className={`w-full px-4 py-1.5 text-left flex items-center justify-between cursor-pointer ${
                      role === USER_ROLES.APPLICANT ? 'font-bold text-[#006B68]' : 'text-[#66757A]'
                    }`}
                  >
                    Applicant / Business
                    {role === USER_ROLES.APPLICANT && <span className="text-xs">✓</span>}
                  </button>
                  <button
                    onClick={() => switchRole(USER_ROLES.OFFICER)}
                    className={`w-full px-4 py-1.5 text-left flex items-center justify-between cursor-pointer ${
                      role === USER_ROLES.OFFICER ? 'font-bold text-[#006B68]' : 'text-[#66757A]'
                    }`}
                  >
                    Compliance Officer
                    {role === USER_ROLES.OFFICER && <span className="text-xs">✓</span>}
                  </button>
                </div>

                <div className="border-t border-[#E5EAE8] pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full px-4 py-2 text-left text-[#E05252] hover:bg-[#FCEEEE] flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
