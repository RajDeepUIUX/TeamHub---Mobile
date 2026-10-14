import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  Mail,
  Copy,
  Phone,
  Building2,
  DoorOpen,
  UsersRound,
  Coffee,
  IdCard,
  Briefcase,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import {
  VOIP_FILTERS,
  VOIP_OFFICE_LINES,
  VOIP_PEOPLE,
  VoipEntry,
  VoipFilter,
  VoipLineKind,
} from '../../data/voipDirectoryData';

interface VoipDirectoryViewProps {
  firstName: string;
  onBack: () => void;
  onToast: (message: string) => void;
}

const LINE_ICONS: Record<VoipLineKind, React.ElementType> = {
  'Branch office': Building2,
  'Meeting room': DoorOpen,
  'Team line': UsersRound,
  Facility: Coffee,
};

const copyText = (value: string) => navigator.clipboard?.writeText(value).catch(() => undefined);

const EntryAvatar: React.FC<{ entry: VoipEntry; size: 'md' | 'lg' }> = ({ entry, size }) => {
  const box = size === 'lg' ? 'w-12 h-12 text-sm' : 'w-10 h-10 text-xs';
  if (entry.lineKind) {
    const Icon = LINE_ICONS[entry.lineKind];
    return (
      <span className={`${box} rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0`}>
        <Icon className={size === 'lg' ? 'w-5 h-5' : 'w-[18px] h-[18px]'} />
      </span>
    );
  }
  return (
    <span
      className={`${box} rounded-full flex items-center justify-center font-bold shrink-0 ${avatarTint(VOIP_PEOPLE.indexOf(entry))}`}
    >
      {initialsOf(entry.name)}
    </span>
  );
};

/* ------------------------------ Illustration ------------------------------ */

const DirectoryIllustration: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-44 h-auto" role="img" aria-label="A desk phone with no matching entry">
    <defs>
      <linearGradient id="voip-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#F5F3FF" />
      </linearGradient>
      <linearGradient id="voip-body" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5B7BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="78" rx="80" ry="60" fill="url(#voip-bg)" />
    <ellipse cx="100" cy="134" rx="54" ry="5" fill="#E0E7FF" />
    {/* Desk phone base */}
    <path d="M56 84h88l8 40a6 6 0 0 1-6 7H54a6 6 0 0 1-6-7l8-40Z" fill="#FFFFFF" stroke="#E0E7FF" strokeWidth="2" />
    <rect x="66" y="92" width="36" height="12" rx="3" fill="#C7D2FE" />
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <circle key={`${r}-${c}`} cx={116 + c * 9} cy={96 + r * 9} r="2.6" fill="#E2E8F0" />
      ))
    )}
    {/* Handset */}
    <path
      d="M52 70c0-8 22-14 48-14s48 6 48 14v4a5 5 0 0 1-5 5h-12a5 5 0 0 1-5-5v-2c-8-2-18-3-26-3s-18 1-26 3v2a5 5 0 0 1-5 5H57a5 5 0 0 1-5-5v-4Z"
      fill="url(#voip-body)"
    />
    {/* Magnifier */}
    <circle cx="150" cy="44" r="13" fill="#FFFFFF" stroke="#A78BFA" strokeWidth="3.5" />
    <line x1="159" y1="53" x2="168" y2="62" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round" />
    <path d="M36 38l1.8 4.2L42 44l-4.2 1.8L36 50l-1.8-4.2L30 44l4.2-1.8L36 38Z" fill="#A78BFA" opacity="0.75" />
    <circle cx="30" cy="100" r="2.5" fill="#C4B5FD" />
    <circle cx="176" cy="92" r="2" fill="#A5B4FC" />
  </svg>
);

/* ------------------------------ Detail sheet ------------------------------ */

const EntrySheet: React.FC<{
  entry: VoipEntry | null;
  onClose: () => void;
  onCopy: (value: string, label: string) => void;
}> = ({ entry, onClose, onCopy }) => {
  // Keep the last entry while the sheet animates closed
  const [shown, setShown] = useState<VoipEntry | null>(entry);
  if (entry && entry !== shown) setShown(entry);
  const e = entry ?? shown;
  if (!e) return null;

  const rows: { icon: React.ElementType; label: string; value: string; href?: string; copyLabel?: string }[] = [
    { icon: Phone, label: 'VOIP extension', value: e.ext, copyLabel: 'Extension' },
    ...(e.email ? [{ icon: Mail, label: 'Email', value: e.email, href: `mailto:${e.email}`, copyLabel: 'Email' }] : []),
    ...(e.designation ? [{ icon: Briefcase, label: 'Designation', value: e.designation }] : []),
    ...(e.empCode ? [{ icon: IdCard, label: 'Employee ID', value: e.empCode }] : []),
  ];

  return (
    <BottomSheet isOpen={Boolean(entry)} onClose={onClose} maxHeight="max-h-[88%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <h2 className="text-[15px] font-bold text-[#1E293B]">{e.lineKind ? 'Office Line' : 'Contact Information'}</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <EntryAvatar entry={e} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1E293B] truncate">{e.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{e.lineKind ?? e.designation}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {rows.map(({ icon: Icon, label, value, href, copyLabel }) => (
            <div key={label} className="flex items-center gap-3 px-3.5 py-3">
              <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-[10.5px] font-semibold text-slate-400">{label}</span>
                {href ? (
                  <a href={href} className="block text-[13px] font-semibold text-[#2F68FE] truncate select-text">
                    {value}
                  </a>
                ) : (
                  <span className="block text-[13px] font-semibold text-[#1E293B] truncate select-text tabular-nums">
                    {value}
                  </span>
                )}
              </div>
              {copyLabel && (
                <button
                  type="button"
                  onClick={() => onCopy(value, copyLabel)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
                  aria-label={`Copy ${label.toLowerCase()}`}
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="flex items-start gap-2 rounded-xl bg-teal-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-teal-800">
          <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Dial {e.ext} from any office desk phone to reach {e.lineKind ? 'this line' : e.name.split(' ')[0]} directly.
        </p>
      </div>

      <div className={`shrink-0 px-5 pt-3 pb-5 border-t border-slate-100 grid gap-2.5 ${e.email ? 'grid-cols-2' : ''}`}>
        {e.email && (
          <a
            href={`mailto:${e.email}`}
            className="h-11 rounded-xl border border-slate-200 text-[13px] font-semibold text-[#1E293B] flex items-center justify-center gap-2 active:bg-slate-50"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        )}
        <button
          type="button"
          onClick={() => onCopy(e.ext, 'Extension')}
          className="h-11 rounded-xl bg-[#2F68FE] text-[13px] font-semibold text-white flex items-center justify-center gap-2 active:bg-blue-700 cursor-pointer"
        >
          <Copy className="w-4 h-4" />
          Copy extension
        </button>
      </div>
    </BottomSheet>
  );
};

/* --------------------------------- Rows ---------------------------------- */

const EntryRow: React.FC<{ entry: VoipEntry; onOpen: () => void; onCopyExt: () => void }> = ({
  entry,
  onOpen,
  onCopyExt,
}) => (
  <div className="flex items-center gap-3 px-3.5 py-3 active:bg-slate-50">
    <button type="button" onClick={onOpen} className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer">
      <EntryAvatar entry={entry} size="md" />
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-[#1E293B] truncate">
          {entry.name}
          {entry.empCode && <span className="ml-1.5 text-[10.5px] font-medium text-slate-400">{entry.empCode}</span>}
        </p>
        <p className="text-[11px] text-slate-400 truncate">{entry.lineKind ?? entry.designation}</p>
      </div>
    </button>
    <button
      type="button"
      onClick={onCopyExt}
      className="h-8 pl-2.5 pr-3 rounded-full bg-teal-50 text-teal-700 flex items-center gap-1.5 text-[12px] font-bold tabular-nums active:bg-teal-100 cursor-pointer shrink-0"
      aria-label={`Copy extension ${entry.ext}`}
    >
      <Phone className="w-3.5 h-3.5" />
      {entry.ext}
    </button>
  </div>
);

/* --------------------------------- Screen --------------------------------- */

export const VoipDirectoryView: React.FC<VoipDirectoryViewProps> = ({ firstName, onBack, onToast }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<VoipFilter>('all');
  const [viewing, setViewing] = useState<VoipEntry | null>(null);
  const q = query.trim().toLowerCase();

  const matches = (e: VoipEntry) =>
    !q ||
    [e.name, e.ext, e.empCode, e.designation, e.email, e.lineKind].some((v) => v?.toLowerCase().includes(q));

  const lines = filter === 'people' ? [] : VOIP_OFFICE_LINES.filter(matches);
  const people = filter === 'lines' ? [] : VOIP_PEOPLE.filter(matches);
  const total = lines.length + people.length;

  // People grouped A–Z under sticky letter headers
  const groups = people.reduce<{ letter: string; entries: VoipEntry[] }[]>((acc, p) => {
    const letter = p.name[0].toUpperCase();
    const last = acc[acc.length - 1];
    if (last?.letter === letter) last.entries.push(p);
    else acc.push({ letter, entries: [p] });
    return acc;
  }, []);

  const copy = (value: string, label: string) => {
    copyText(value);
    onToast(`${label} ${label === 'Extension' ? value + ' ' : ''}copied.`);
  };

  const sectionHeader = (label: string) => (
    <div className="sticky top-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-sm px-5 py-1.5 text-[11px] font-bold text-slate-500 tracking-wide">
      {label}
    </div>
  );

  const card = (entries: VoipEntry[]) => (
    <div className="mx-4 mb-3 bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden divide-y divide-slate-100">
      {entries.map((e) => (
        <EntryRow key={e.id} entry={e} onOpen={() => setViewing(e)} onCopyExt={() => copy(e.ext, 'Extension')} />
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4 relative">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold screen-title">VOIP Directory</h1>
        </div>
        <div className="px-4 pb-3 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="Search name, extension or employee ID..."
              className="w-full h-11 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            {VOIP_FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`h-8 px-3.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#2F68FE] border-[#2F68FE] text-white'
                      : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {total > 0 && (
          <p className="px-5 pt-3 pb-1 text-[11px] font-medium text-slate-400">
            {total} {total === 1 ? 'entry' : 'entries'} · tap an extension to copy it
          </p>
        )}

        {lines.length > 0 && (
          <section>
            {sectionHeader('OFFICE LINES')}
            {card(lines)}
          </section>
        )}

        {groups.map((g) => (
          <section key={g.letter}>
            {sectionHeader(g.letter)}
            {card(g.entries)}
          </section>
        ))}

        {total === 0 && (
          <div className="px-6 pt-10 flex flex-col items-center text-center">
            <DirectoryIllustration />
            <p className="mt-3 text-sm font-bold text-[#1E293B]">Hmm, no one picks up at that one, {firstName}</p>
            <p className="mt-1 text-xs text-slate-500 max-w-[250px] leading-relaxed">
              We couldn't find “{query.trim()}”. Try a first name, a 4-digit extension or an employee ID.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
              className="mt-5 h-10 px-5 rounded-xl bg-[#2F68FE] text-xs font-semibold text-white active:bg-blue-700 cursor-pointer"
            >
              Show full directory
            </button>
          </div>
        )}
      </div>

      <EntrySheet entry={viewing} onClose={() => setViewing(null)} onCopy={copy} />
    </div>
  );
};
