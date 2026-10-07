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
  // Accordion: only one section open at a time; the current screen's section opens with the menu
  const [expanded, setExpanded] = useState<string | null>(null);

  // Mount → slide in; slide out → unmount
  useEffect(() => {
    if (isOpen) {
      // Open the section holding the current screen (all collapsed when nothing is active)
      setExpanded(MORE_GROUPS.find((g) => g.modules.some((m) => m.id === activeModuleId))?.id ?? null);
      setMounted(true);
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const t = setTimeout(() => {
      setMounted(false);
      setQuery('');
      setExpanded(null);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [isOpen, activeModuleId]);

  const portal = typeof document !== 'undefined' ? document.getElementById('mobile-sheet-portal') : null;
  if (!mounted || !portal) return null;

  const q = query.trim().toLowerCase();
  const groups = MORE_GROUPS.map((g) => ({
    ...g,
    modules: g.modules.filter(
      (m) => (!m.roles || m.roles.includes(role)) && (!q || m.label.toLowerCase().includes(q) || m.hint.toLowerCase().includes(q))
    ),
  })).filter((g) => g.modules.length > 0);

  const toggleGroup = (id: string) => setExpanded((prev) => (prev === id ? null : id));

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

        {/* Modules: large, readable rows (list style); sections expand in place */}
        <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-white py-2" aria-label="Modules">
          {groups.map((g) => {
            const GroupIcon = g.icon;
            // Searching always shows matches
            const open = Boolean(q) || expanded === g.id;
            const hasActive = g.modules.some((m) => m.id === activeModuleId);
            // A section with a single module (e.g. Company → Company Feed) is shown as that module directly
            if (g.modules.length === 1) {
              const m = g.modules[0];
              const Icon = m.icon;
              const active = m.id === activeModuleId;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onOpenModule(m)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-[calc(100%-1rem)] mx-2 h-12 flex items-center gap-4 px-3 rounded-xl text-left transition-colors cursor-pointer ${
                    active ? 'bg-[#EAF0FF] ring-1 ring-inset ring-[#D6E2FF]' : 'active:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5.5 h-5.5 stroke-[1.8] shrink-0 ${active ? 'text-[#2F68FE]' : 'text-slate-700'}`} />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[15px] truncate ${active ? 'font-bold text-[#2F68FE]' : 'font-medium text-[#1E293B]'}`}>{m.label}</span>
                    {q && <span className="block text-[11px] text-slate-400 truncate">{m.hint}</span>}
                  </span>
                </button>
              );
            }
            return (
              <section key={g.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  aria-expanded={open}
                  className="w-[calc(100%-1rem)] mx-2 h-12 flex items-center gap-4 px-3 rounded-xl text-left active:bg-slate-50 transition-colors cursor-pointer"
                >
                  <GroupIcon className={`w-5.5 h-5.5 stroke-[1.8] shrink-0 ${hasActive ? 'text-[#2F68FE]' : 'text-slate-700'}`} />
                  {/* Section holding the current screen: blue icon + bold blue name, no fill */}
                  <span className={`flex-1 text-[15px] ${hasActive ? 'font-bold text-[#2F68FE]' : 'font-medium text-[#1E293B]'}`}>{g.label}</span>
                  <ChevronDown
                    className={`w-4.5 h-4.5 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${hasActive ? 'text-[#2F68FE]' : 'text-slate-400'}`}
                  />
                </button>
                {open && (
                  <div className="pb-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    {g.modules.map((m) => {
                      const Icon = m.icon;
                      const active = m.id === activeModuleId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onOpenModule(m)}
                          aria-current={active ? 'page' : undefined}
                          className={`w-[calc(100%-3.25rem)] ml-11 mr-2 mt-0.5 h-11 flex items-center gap-3 pl-3 pr-3 rounded-xl text-left transition-colors cursor-pointer ${
                            active ? 'bg-[#EAF0FF] ring-1 ring-inset ring-[#D6E2FF]' : 'active:bg-slate-50'
                          }`}
                        >
                          {/* Current screen: soft tinted pill (the parent section stays unfilled) */}
                          <Icon className={`w-4.5 h-4.5 stroke-[1.8] shrink-0 ${active ? 'text-[#2F68FE]' : 'text-slate-500'}`} />
                          <span className="flex-1 min-w-0">
                            <span className={`block text-[14px] truncate ${active ? 'font-semibold text-[#2F68FE]' : 'text-slate-600'}`}>
                              {m.label}
                            </span>
                            {q && <span className={`block text-[11px] truncate ${active ? 'text-[#2F68FE]/70' : 'text-slate-400'}`}>{m.hint}</span>}
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
            <p className="py-10 text-center text-sm text-slate-400">No module matches “{query.trim()}”.</p>
          )}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-4 pt-3 pb-5 border-t border-[#EBF0F7] bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onLogout}
            className="h-10 px-3 -ml-1 rounded-xl flex items-center gap-3 text-[15px] font-medium text-rose-500 active:bg-rose-50 cursor-pointer"
          >
            <LogOut className="w-5 h-5 stroke-[1.8]" />
            Log out
          </button>
          <span className="text-[10.5px] font-medium text-slate-400">Version {version}</span>
        </div>
      </aside>
    </div>,
    portal
  );
};
