import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { BrandLogoHorizontal } from '../auth/BrandLogo';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { MORE_GROUPS, MoreModule } from '../more/MoreView';
import type { UserRole } from '../../types/user';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  fullName: string;
  subtitle: string;
  profilePhoto?: string | null;
  /** Module currently on screen (highlighted) */
  activeModuleId: string | null;
  version: string;
  onOpenModule: (module: MoreModule) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

const SLIDE_MS = 280;

/** Left navigation drawer with every portal module (replaces the old More tab); leaves a strip of the screen visible */
export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  role,
  fullName,
  subtitle,
  profilePhoto,
  activeModuleId,
  version,
  onOpenModule,
  onOpenProfile,
  onLogout,
}) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  // All groups start collapsed; the user opens the ones they need
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Mount → slide in; slide out → unmount
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const t = setTimeout(() => {
      setMounted(false);
      setQuery('');
      setExpanded(new Set());
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [isOpen]);

  const portal = typeof document !== 'undefined' ? document.getElementById('mobile-sheet-portal') : null;
  if (!mounted || !portal) return null;

  const q = query.trim().toLowerCase();
  const groups = MORE_GROUPS.map((g) => ({
    ...g,
    modules: g.modules.filter(
      (m) => (!m.roles || m.roles.includes(role)) && (!q || m.label.toLowerCase().includes(q) || m.hint.toLowerCase().includes(q))
    ),
  })).filter((g) => g.modules.length > 0);

  const toggleGroup = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return createPortal(
    <div className="absolute inset-0 z-50 pointer-events-auto select-none" role="dialog" aria-modal="true" aria-label="Main menu">
      {/* Backdrop: the uncovered strip closes the drawer */}
      <div
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity ease-out cursor-pointer ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDuration: `${SLIDE_MS}ms` }}
        onClick={onClose}
      />

      <aside
        className={`absolute inset-y-0 left-0 w-[84%] max-w-[330px] bg-[#F8FAFC] flex flex-col rounded-r-[28px] overflow-hidden shadow-[12px_0_40px_-12px_rgba(15,23,42,0.45)] transition-transform ease-out ${
          visible ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ transitionDuration: `${SLIDE_MS}ms` }}
      >
        {/* Header: brand + who's signed in */}
        <div className="relative shrink-0 bg-linear-to-br from-[#EEF2FF] via-white to-[#F5F3FF] px-4 pt-11 pb-4 border-b border-[#EBF0F7]">
          <span className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-violet-200/40 blur-2xl pointer-events-none" />
          <span className="absolute top-16 -left-12 w-28 h-28 rounded-full bg-blue-200/40 blur-2xl pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <BrandLogoHorizontal className="h-5" />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-slate-500 active:bg-white/80 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenProfile}
            className="relative mt-4 w-full flex items-center gap-3 p-2.5 rounded-2xl bg-white/80 border border-white shadow-[0_8px_24px_-14px_rgba(79,70,229,0.45)] text-left active:bg-white cursor-pointer"
          >
            <span className="block w-11 h-11 rounded-xl bg-linear-to-br from-amber-200 via-rose-200 to-violet-300 p-0.5 shrink-0">
              <ProfileAvatar name={fullName} photoUrl={profilePhoto} className="w-full h-full rounded-[10px]" textClassName="text-xs" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="text-[13.5px] font-extrabold text-[#1E293B] truncate">{fullName}</span>
                <span
                  className={`px-1.5 py-px rounded-md text-[9px] font-bold uppercase tracking-wide shrink-0 ${
                    role === 'Manager' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-[#2F68FE]'
                  }`}
                >
                  {role}
                </span>
              </span>
              <span className="block text-[11px] text-slate-500 truncate">{subtitle}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <div className="relative mt-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules..."
              className="w-full h-10 pl-9 pr-8 bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Modules */}
        <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 py-3 space-y-2" aria-label="Modules">
          {groups.map((g) => {
            const GroupIcon = g.icon;
            // Searching always shows matches
            const open = Boolean(q) || expanded.has(g.id);
            return (
              <section key={g.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-wider text-slate-400 active:bg-slate-100 cursor-pointer"
                >
                  <GroupIcon className="w-3.5 h-3.5" />
                  <span className="flex-1 text-left">{g.label}</span>
                  <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-slate-200/70 text-slate-500 text-[9.5px] font-bold flex items-center justify-center normal-case tracking-normal">
                    {g.modules.length}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
                </button>
                {open && (
                  <div className="mt-1 space-y-0.5">
                    {g.modules.map((m) => {
                      const Icon = m.icon;
                      const active = m.id === activeModuleId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onOpenModule(m)}
                          aria-current={active ? 'page' : undefined}
                          className={`relative w-full flex items-center gap-3 pl-2 pr-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            active ? 'bg-white shadow-[0_4px_14px_-8px_rgba(47,104,254,0.55)]' : 'active:bg-white'
                          }`}
                        >
                          {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#2F68FE]" />}
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.tint}`}>
                            <Icon className="w-4.5 h-4.5" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className={`block text-[12.5px] truncate ${active ? 'font-bold text-[#2F68FE]' : 'font-semibold text-[#1E293B]'}`}>
                              {m.label}
                            </span>
                            {q && <span className="block text-[10.5px] text-slate-400 truncate">{m.hint}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
          {groups.length === 0 && (
            <p className="py-10 text-center text-xs text-slate-400">No module matches “{query.trim()}”.</p>
          )}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-4 pt-3 pb-5 border-t border-[#EBF0F7] bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onLogout}
            className="h-9 px-3 -ml-1 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-500 active:bg-rose-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
          <span className="text-[10.5px] font-medium text-slate-400">Version {version}</span>
        </div>
      </aside>
    </div>,
    portal
  );
};
