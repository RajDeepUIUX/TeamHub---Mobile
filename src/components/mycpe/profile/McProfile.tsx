import React, { useState } from 'react';
import { ChevronRight, CircleHelp, FileText, GraduationCap, Info, Settings, X } from 'lucide-react';
import { AppTourIcon, CertificateIcon, ComplianceIcon, DollarIcon, InvoiceIcon, LogoutIcon, NoLicenseIcon, PreferenceIcon } from '../common/McIcons';
import { McRow } from '../common/McPage';
import { LICENSE_STATES, McAccount, MYCPE_AVATAR } from '../data/mycpeHomeData';

type Icon = React.ComponentType<{ className?: string }>;

const GROUPS: { title: string; items: { label: string; icon: Icon }[] }[] = [
  {
    title: 'Profile Preferences',
    items: [
      { label: 'Qualification Details', icon: GraduationCap },
      { label: 'Learning Preference', icon: PreferenceIcon },
    ],
  },
  {
    title: 'Learning & Compliance',
    items: [
      { label: 'Compliance', icon: ComplianceIcon },
      { label: 'Credit Certificates', icon: CertificateIcon },
    ],
  },
  {
    title: 'Subscription and Billing',
    items: [
      { label: 'Subscription Plan', icon: DollarIcon },
      { label: 'Invoice', icon: InvoiceIcon },
    ],
  },
  {
    title: 'Support & Account',
    items: [
      { label: 'Help Centre', icon: CircleHelp },
      { label: 'Privacy Policy', icon: FileText },
      { label: 'About us', icon: Info },
      { label: 'Take App Tour', icon: AppTourIcon },
      { label: 'Account Settings', icon: Settings },
    ],
  },
];

/** Licences whose details aren't added yet */
const LicenseCard: React.FC<{ onAdd: () => void }> = ({ onAdd }) => {
  const [active, setActive] = useState(0);
  return (
    <section className="rounded-[26px] border border-mc-line bg-mc-primary-soft overflow-hidden">
      <McRow className="px-4 pt-4 gap-4">
        {LICENSE_STATES.map((l, i) => (
          <button
            key={l.state}
            type="button"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={`shrink-0 h-9 px-2 rounded-lg flex items-center gap-2 whitespace-nowrap cursor-pointer ${i === active ? 'bg-mc-primary text-white' : 'bg-white text-mc-ink'}`}
          >
            <span className="text-sm font-medium">{l.qualification}</span>
            <span className={`text-xs ${i === active ? 'text-white' : 'text-mc-text'}`}>{l.state}</span>
          </button>
        ))}
      </McRow>
      <div className="relative m-4 mt-5 rounded-lg bg-white px-3 pt-[18px] pb-4 text-center">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" rx="8" fill="none" stroke="#B8B0F5" strokeDasharray="5 5" />
        </svg>
        <NoLicenseIcon className="w-6 h-6 mx-auto text-[#98A2B3]" />
        <h2 className="mt-2.5 text-base leading-6 font-semibold text-[#2A3343]">No License Details Added</h2>
        <p className="mt-1 mx-auto max-w-[260px] text-sm leading-5 text-mc-muted">Add your license details to track your compliance progress</p>
        <button type="button" onClick={onAdd} className="mt-3 w-full h-10 rounded-xl bg-mc-primary text-white text-sm font-semibold active:bg-mc-primary-pressed cursor-pointer">
          Add License Details
        </button>
      </div>
    </section>
  );
};

interface McProfileProps {
  account: McAccount;
  /** Compliance is set up, so its licences show */
  showLicenses: boolean;
  onClose: () => void;
  onOpen: (title: string) => void;
  onLogout: () => void;
  /** Real phone: prototype switches */
  footer?: React.ReactNode;
}

export const McProfile: React.FC<McProfileProps> = ({ account, showLicenses, onClose, onOpen, onLogout, footer }) => (
  <div className="flex-1 min-h-0 flex flex-col bg-mc-page">
    {/* Title + person stay; the list scrolls under them */}
    <div className="relative z-[1] shrink-0 px-4" style={{ paddingTop: 'calc(var(--safe-top) + 11px)' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-lg leading-7 font-semibold text-mc-ink">Profile</h1>
        <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white text-mc-ink-2 flex items-center justify-center active:bg-mc-line cursor-pointer" aria-label="Close">
          <X className="w-[18px] h-[18px] stroke-[1.6]" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onOpen('My Profile')}
        className="mt-5 w-full rounded-[28px] p-1 bg-linear-to-b from-white to-[#F4EEF6] shadow-[0_10px_18px_-6px_rgba(86,98,190,0.22)] text-left cursor-pointer"
      >
        <span className="h-[74px] px-3 rounded-3xl bg-linear-to-b from-[#F6F6F7] to-[#F0F0F5] flex items-center gap-4">
          <span className="w-[50px] h-[50px] rounded-full border-2 border-mc-line overflow-hidden shrink-0">
            <img src={MYCPE_AVATAR} alt="" className="w-full h-full object-cover" draggable={false} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-base leading-6 font-semibold text-[#2A3343] truncate">
              {account.firstName} {account.lastName}
            </span>
            <span className="block text-sm leading-5 text-mc-muted truncate">{account.email}</span>
          </span>
          <ChevronRight className="w-6 h-6 mr-1 stroke-[1.5] text-mc-muted shrink-0" />
        </span>
      </button>
    </div>

    <div className="flex-1 min-h-0 mt-2 overflow-y-auto no-scrollbar px-4 pt-4 space-y-5" style={{ paddingBottom: 'calc(var(--safe-bottom) + 24px)' }}>
      {showLicenses && <LicenseCard onAdd={() => onOpen('Add License Details')} />}
      {GROUPS.map((g) => (
        <section key={g.title} className="rounded-[28px] bg-white overflow-hidden">
          <h2 className="h-11 pt-4 px-4 text-sm leading-5 font-medium text-[#98A2B3]">{g.title}</h2>
          {g.items.map(({ label, icon: Icon }) => (
            <button key={label} type="button" onClick={() => onOpen(label)} className="w-full h-[53px] px-4 flex items-center gap-3 text-left active:bg-mc-page cursor-pointer">
              <Icon className="w-5 h-5 stroke-[1.6] text-mc-muted shrink-0" />
              <span className="flex-1 text-base font-medium text-mc-text">{label}</span>
              <ChevronRight className="w-6 h-6 mr-1 stroke-[1.5] text-mc-muted shrink-0" />
            </button>
          ))}
        </section>
      ))}
      <button type="button" onClick={onLogout} className="w-full h-[53px] px-4 flex items-center gap-3 text-left text-base font-medium text-mc-text cursor-pointer">
        <LogoutIcon className="w-5 h-5 text-mc-muted" />
        Logout
      </button>
      {footer}
    </div>
  </div>
);
