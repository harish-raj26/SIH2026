import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  ListChecks,
  CheckCircle2,
  FolderOpen,
  Bot,
  Search,
  Settings,
  ShieldAlert,
  X,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

export function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const { role, isOfficer, isAdmin } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/businesses',
      label: 'Select Business',
      icon: Building2,
      badge: null,
    },
    {
      to: '/approvals',
      label: 'Approvals & Roadmap',
      icon: ListChecks,
      badge: 'AI',
    },
    {
      to: '/applications/new',
      label: 'Application Wizard',
      icon: CheckCircle2,
      badge: '6-Step',
    },
    {
      to: '/documents',
      label: 'Document Hub',
      icon: FolderOpen,
      badge: null,
    },
    {
      to: '/ai-assistant',
      label: 'Ai Compliance Chat',
      icon: Bot,
      badge: 'Gemini',
      badgeDark: true,
    },
    {
      to: '/search',
      label: 'Regulatory Search',
      icon: Search,
      badge: 'RAG',
      badgeDark: true,
    },
  ];

  if (isOfficer || isAdmin) {
    navItems.push({
      to: '/officer-portal',
      label: 'Officer Audit Portal',
      icon: ShieldAlert,
      badge: role.toUpperCase(),
      special: true,
    });
  }

  navItems.push({
    to: '/profile',
    label: 'Profile & Settings',
    icon: Settings,
    badge: null,
  });

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#F7FAF8] border-r border-[#E5EAE8] text-[#172126] justify-between">
      <div>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E5EAE8] lg:hidden bg-white">
          <span className="text-sm font-bold text-[#0A4D46]">
            BizClear AI
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-[#66757A] hover:text-[#172126] hover:bg-[#F0F4F4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <div className="px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8A9B99]">
            CORE WORKFLOWS
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150',
                    isActive
                      ? 'bg-[#0A4D46] text-white shadow-xs'
                      : 'text-[#334144] hover:bg-[#EAEFE8] hover:text-[#0A4D46]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Icon className={clsx('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-[#66757A]')} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight',
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeDark
                            ? 'bg-[#0A4D46] text-white'
                            : 'bg-[#E2ECE8] text-[#0A4D46]'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Engine Status Card matching reference image bottom left */}
      <div className="p-3 m-3 rounded-xl bg-white border border-[#E5EAE8] space-y-1 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[#0A4D46]">
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#006B68]" />
          <span className="text-xs font-bold text-[#0A4D46]">BizClear AI Engine</span>
        </div>
        <p className="text-[10px] text-[#66757A] leading-relaxed">
          Statutory discovery powered by Google Gemini and Regulatory RAG index.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 h-[calc(100vh-4rem)] sticky top-16 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-[80vw] z-10 shadow-xl animate-in slide-in-from-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
