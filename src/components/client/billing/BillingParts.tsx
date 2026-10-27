import React from 'react';
import { AlertTriangle, Check, ChevronRight, Clock, CreditCard, Eye, Landmark, Lock, Pencil, Plus, Trash2, Zap } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import {
  BillingBankAccount,
  BillingCreditCard,
  CARD_BRAND,
  PaymentType,
  bankNameOf,
  cardExpiryState,
  formatExpiry,
  maskedLast4,
} from '../data/clientBillingData';
import { Pill, SheetHeader } from '../staff/tabs/StaffTabParts';

/** Desktop numbered section header ("1 Payment Information", "2 Payment Mapping"); a done step shows a tick */
export const StepHeader: React.FC<{
  step: number;
  title: string;
  text: string;
  done?: boolean;
  aside?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ step, title, text, done, aside, children }) => (
  <div className="flex items-start gap-3">
    <span
      className={`w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-extrabold tabular-nums shrink-0 transition-colors ${
        done ? 'bg-[#E8F8F0] text-[#10B981]' : 'bg-[#EEF2FF] text-[#2F68FE]'
      }`}
      aria-hidden="true"
    >
      {done ? <Check className="w-4 h-4" strokeWidth={3} /> : step}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-bold text-[#1E293B] leading-tight">{title}</span>
      <span className="block mt-0.5 text-[11px] font-medium text-slate-500 leading-snug">{text}</span>
      {children}
    </span>
    {aside}
  </div>
);

/** Section card: header, then body */
export const BillingSection = React.forwardRef<
  HTMLElement,
  {
    header: React.ReactNode;
    ariaLabel?: string;
    className?: string;
    children: React.ReactNode;
  }
>(({ header, ariaLabel, className = '', children }, ref) => (
  <section ref={ref} aria-label={ariaLabel} className={`bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs ${className}`}>
    <div className="p-4 pb-3.5">{header}</div>
    <div className="px-4 pb-4">{children}</div>
  </section>
));
BillingSection.displayName = 'BillingSection';

/** "2 Banks" / "2 Cards" count pill */
export const CountPill: React.FC<{ icon: React.ElementType; children: React.ReactNode }> = ({ icon: Icon, children }) => (
  <span className="h-5 px-1.5 rounded-full bg-blue-50 text-[10px] font-bold text-[#2F68FE] flex items-center gap-1 whitespace-nowrap tabular-nums">
    <Icon className="w-3 h-3" aria-hidden="true" />
    {children}
  </span>
);

/** Payment method switch: segmented track, icon above the label */
export function BillingTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { id: T; label: string; icon: React.ElementType }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="grid gap-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/60"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(({ id, label, icon: Icon }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`h-9 px-0.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
              active ? 'bg-white text-[#1E293B] font-bold shadow-[0_1px_3px_rgba(15,23,42,0.12)]' : 'text-slate-500 font-semibold active:text-slate-700'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#2F68FE]' : 'text-slate-400'}`} aria-hidden="true" />
            <span className="min-w-0 text-[11px] truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Joined icon buttons (edit | delete) */
const IconGroup: React.FC<{
  items: {
    icon: React.ElementType;
    label: string;
    danger?: boolean;
    onClick: () => void;
  }[];
}> = ({ items }) => (
  <span className="flex rounded-xl border border-slate-200 divide-x divide-slate-200 bg-white shadow-2xs overflow-hidden shrink-0">
    {items.map(({ icon: Icon, label, danger, onClick }) => (
      <button
        key={label}
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`w-9 h-9 flex items-center justify-center bg-white cursor-pointer transition-colors ${
          danger ? 'text-rose-600 active:bg-rose-50' : 'text-[#2F68FE] active:bg-blue-50'
        }`}
      >
        <Icon className="w-4 h-4" />
      </button>
    ))}
  </span>
);

/** Desktop `hrms-bank-info-card` as a passbook: bank, holder, type, edit / delete, Account No up front, then every other number ("-" when empty) */
export const BankAccountCard: React.FC<{
  bank: BillingBankAccount;
  revealed: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ bank, revealed, onEdit, onDelete }) => {
  const show = (v?: string) => (v ? (revealed ? v : maskedLast4(v)) : '-');
  const rows = [
    { label: 'Institution No', value: bank.institutionNumber || '-' },
    { label: 'Transit No', value: show(bank.transitNumber) },
    { label: 'Routing No', value: show(bank.bankRouting) },
    { label: 'Sort Code', value: bank.sortCode || '-' },
  ];
  const name = bankNameOf(bank);

  return (
    <li className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-3.5">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
          <Landmark className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-[#1E293B] leading-snug break-words">{name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs font-medium text-slate-500 break-words">{bank.accountName}</span>
            <Pill tone="slate">{bank.accountType === 'checking' ? 'Checking' : 'Saving'}</Pill>
          </span>
        </span>
        {(onEdit || onDelete) && (
          <IconGroup
            items={[
              ...(onEdit ? [{ icon: Pencil, label: `Edit ${name}`, onClick: onEdit }] : []),
              ...(onDelete ? [{ icon: Trash2, label: `Delete ${name}`, danger: true, onClick: onDelete }] : []),
            ]}
          />
        )}
      </div>

      <div
        className={`mt-3 px-3 py-2.5 rounded-xl border flex items-center gap-3 transition-colors ${
          revealed ? 'bg-[#FEF8E7]/60 border-amber-200/60' : 'bg-slate-50 border-slate-100'
        }`}
      >
        <dl className="flex-1 min-w-0">
          <dt className="text-[11px] font-medium text-slate-500">Account No</dt>
          <dd className="mt-0.5 text-[15px] font-bold text-[#1E293B] tracking-wider tabular-nums break-all">{show(bank.accountNumber)}</dd>
        </dl>
        <span
          className={`w-8 h-8 rounded-full bg-white border flex items-center justify-center shrink-0 ${
            revealed ? 'border-amber-200/60 text-[#D97706]' : 'border-slate-200 text-slate-400'
          }`}
          aria-hidden="true"
        >
          {revealed ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        </span>
      </div>
      <dl className="mt-3 px-0.5 grid grid-cols-2 gap-x-3 gap-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <dt className="text-[11px] font-medium text-slate-500">{r.label}</dt>
            <dd className={`mt-0.5 text-xs font-semibold tabular-nums break-all ${r.value === '-' ? 'text-slate-400' : 'text-[#1E293B]'}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
};

/** Desktop `Card_Img` tile drawn as the card itself (brand, chip, masked number, name, type, expiry); HRMS returns the last 4 digits only */
export const CreditCardTile: React.FC<{
  card: BillingCreditCard;
  onDelete?: () => void;
}> = ({ card, onDelete }) => {
  const brand = CARD_BRAND[card.cardType];
  const number = `**** - **** - **** - ${card.lastFour}`;
  const expiry = cardExpiryState(card.expiry);
  const ExpiryIcon = expiry === 'expired' ? AlertTriangle : Clock;

  return (
    <li className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-4">
      <div className="flex items-center gap-2.5">
        <span className="w-10 h-7 rounded-md border border-amber-200 bg-[#FEF8E7] grid grid-cols-[1fr_1.3fr_1fr] grid-rows-2 overflow-hidden shrink-0" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`${i % 3 !== 2 ? 'border-r' : ''} ${i < 3 ? 'border-b' : ''} border-amber-200`} />
          ))}
        </span>
        <span className={`ml-auto h-7 px-2.5 rounded-md flex items-center text-[11px] font-black tracking-wide ${brand.className}`} aria-hidden="true">
          {brand.mark}
        </span>
        {onDelete && <IconGroup items={[{ icon: Trash2, label: `Delete ${card.cardType} ending ${card.lastFour}`, danger: true, onClick: onDelete }]} />}
      </div>

      <dl className="mt-4">
        <dt className="text-[11px] font-medium text-slate-500">Card Number</dt>
        <dd className="mt-0.5 text-[15px] font-bold text-[#1E293B] tracking-wider tabular-nums whitespace-nowrap">{number}</dd>
      </dl>
      <dl className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3">
        <div className="min-w-0">
          <dt className="text-[11px] font-medium text-slate-500">Card Name</dt>
          <dd className="mt-0.5 text-xs font-semibold text-[#1E293B] truncate">{card.cardName}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium text-slate-500">Card Type</dt>
          <dd className="mt-0.5 text-xs font-semibold text-[#1E293B] truncate">{card.cardType}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[11px] font-medium text-slate-500">Expiry Date</dt>
          <dd
            className={`mt-0.5 flex items-center justify-end gap-1 text-xs font-semibold tabular-nums ${
              expiry === 'expired' ? 'text-rose-600' : expiry === 'soon' ? 'text-[#D97706]' : 'text-[#1E293B]'
            }`}
          >
            {expiry !== 'ok' && <ExpiryIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
            {formatExpiry(card.expiry)}
            {expiry !== 'ok' && <span className="sr-only">{expiry === 'expired' ? '(expired)' : '(expires soon)'}</span>}
          </dd>
        </div>
      </dl>
    </li>
  );
};

/** "Add Bank" / "Add Payment Method" button */
export const AddTile: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full h-10 px-3 rounded-xl border border-dashed border-[#2F68FE]/50 bg-blue-50/40 flex items-center justify-center gap-2 transition-colors cursor-pointer active:border-[#2F68FE] active:bg-blue-50 focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
  >
    <span className="w-5 h-5 rounded-md bg-[#2F68FE] text-white flex items-center justify-center shrink-0" aria-hidden="true">
      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
    </span>
    <span className="text-xs font-bold text-[#2F68FE] truncate">{label}</span>
  </button>
);

const METHOD_ICON: Record<PaymentType, React.ElementType> = { bank: Landmark, card: CreditCard, direct: Zap };

/** Payment type icon tile; rose when the row's method is gone */
export const MethodIcon: React.FC<{ type: PaymentType; danger?: boolean }> = ({ type, danger }) => {
  const Icon = METHOD_ICON[type];
  return (
    <span
      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-[#FEF2F2] text-rose-600' : 'bg-[#EEF2FF] text-[#2F68FE]'}`}
      aria-hidden="true"
    >
      <Icon className="w-5 h-5" />
    </span>
  );
};

/** Status Overview ring: share of billable staff with a working payment method */
export const MappingRing: React.FC<{ mapped: number; total: number }> = ({ mapped, total }) => {
  const pct = total ? Math.round((mapped / total) * 100) : 0;
  const r = 23;
  const length = 2 * Math.PI * r;
  const complete = total > 0 && mapped === total;
  return (
    <span className="relative w-16 h-16 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 56 56" className="w-16 h-16 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="6" stroke="#E2E8F0" />
        {mapped > 0 && (
          <circle
            cx="28"
            cy="28"
            r={r}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            stroke={complete ? '#10B981' : '#2F68FE'}
            strokeDasharray={length}
            strokeDashoffset={length * (1 - pct / 100)}
            className="transition-[stroke-dashoffset] duration-500"
          />
        )}
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[13px] font-extrabold tabular-nums ${complete ? 'text-[#10B981]' : 'text-[#1E293B]'}`}>
        {pct}%
      </span>
    </span>
  );
};

type MappedStaff = { id: string; name: string; designation: string; tint: number };

/** Desktop "Select Staff(s)" field: avatar stack, count and names; tap opens the full list */
export const StaffSelectField: React.FC<{ staff: MappedStaff[]; onOpen: () => void }> = ({ staff, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    aria-haspopup="dialog"
    className="mt-1.5 w-full min-h-12 py-2 pl-2.5 pr-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center gap-3 text-left cursor-pointer transition-colors active:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
  >
    <span className="flex shrink-0" aria-hidden="true">
      {staff.slice(0, 3).map((s, i) => (
        <span
          key={s.id}
          className={`w-8 h-8 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold ${avatarTint(s.tint)} ${i ? '-ml-1.5' : ''}`}
        >
          {initialsOf(s.name)}
        </span>
      ))}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-xs font-bold text-[#1E293B] tabular-nums">{staff.length} selected</span>
      <span className="block text-[11px] font-medium text-slate-500 truncate">{staff.map((s) => s.name).join(', ')}</span>
    </span>
    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
  </button>
);

/** Every staff member on one mapping row */
export const MappedStaffSheet: React.FC<{ isOpen: boolean; method: string; staff: MappedStaff[]; onClose: () => void }> = ({
  isOpen,
  method,
  staff,
  onClose,
}) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[80%]">
    <SheetHeader title="Select Staff(s)" subtitle={`${staff.length} selected · ${method}`} onClose={onClose} />
    <ul className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-3 pb-6 space-y-2">
      {staff.map((s) => (
        <li key={s.id} className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center gap-3">
          <StaffAvatar name={s.name} tint={s.tint} />
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-[#1E293B] truncate">{s.name}</span>
            <span className="block text-[11px] font-medium text-slate-500 truncate">{s.designation}</span>
          </span>
        </li>
      ))}
    </ul>
  </BottomSheet>
);

/** Checkbox row in the mapping sheet; staff mapped in another row are locked (desktop drops them from the list) */
export const StaffCheckRow: React.FC<{
  name: string;
  designation: string;
  tint: number;
  checked: boolean;
  lockedNote?: string;
  onToggle: () => void;
}> = ({ name, designation, tint, checked, lockedNote, onToggle }) => {
  const locked = Boolean(lockedNote);
  return (
    <li
      className={`rounded-xl border transition-colors ${locked ? 'border-slate-100 bg-slate-50' : checked ? 'border-[#2F68FE] bg-blue-50/70' : 'border-slate-200 bg-white shadow-2xs'}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-disabled={locked}
        disabled={locked}
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 text-left cursor-pointer disabled:cursor-not-allowed"
      >
        <span className={locked ? 'grayscale opacity-60' : ''}>
          <StaffAvatar name={name} tint={tint} />
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block text-[13px] font-bold truncate ${locked ? 'text-slate-400' : 'text-[#1E293B]'}`}>{name}</span>
          {locked ? (
            <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-400 min-w-0">
              <Lock className="w-3 h-3 shrink-0" />
              <span className="truncate">{lockedNote}</span>
            </span>
          ) : (
            <span className="block text-[11px] font-medium text-slate-500 truncate">{designation}</span>
          )}
        </span>
        {!locked && (
          <span
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
              checked ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
            }`}
            aria-hidden="true"
          >
            {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
          </span>
        )}
      </button>
    </li>
  );
};

export const BillingSkeleton: React.FC = () => {
  const box = 'bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-4';
  const heading = (
    <div className="flex items-center gap-3">
      <StaffSkeleton className="w-9 h-9 rounded-xl" />
      <div className="flex-1 space-y-1.5">
        <StaffSkeleton className="w-40 h-4" />
        <StaffSkeleton className="w-28 h-3" />
      </div>
    </div>
  );
  return (
    <div className="px-4 pt-4 space-y-4" aria-busy="true" aria-label="Loading billing details">
      <div className={`${box} space-y-3.5`}>
        {heading}
        <StaffSkeleton className="w-full h-16 rounded-2xl" />
        <StaffSkeleton className="w-full h-12 rounded-xl" />
        <StaffSkeleton className="w-full h-40 rounded-2xl" />
      </div>
      <div className={`${box} space-y-3.5`}>
        {heading}
        <div className="flex items-center gap-3.5">
          <StaffSkeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-24 h-3" />
            <StaffSkeleton className="w-36 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
