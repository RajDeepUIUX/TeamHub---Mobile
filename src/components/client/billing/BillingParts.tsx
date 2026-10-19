import React from 'react';
import { Check, Landmark, Lock, Pencil, Trash2, Zap } from 'lucide-react';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import {
  BillingBankAccount,
  BillingCountry,
  BillingCreditCard,
  CARD_BRAND,
  PaymentType,
  bankNameOf,
  cardExpiryState,
  formatExpiry,
  maskedLast4,
} from '../data/clientBillingData';
import { Pill } from '../staff/tabs/StaffTabParts';

/** Desktop numbered section header ("1 Payment Information", "2 Payment Mapping") */
export const StepHeader: React.FC<{ step: number; title: string; text: string; done?: boolean; aside?: React.ReactNode }> = ({
  step,
  title,
  text,
  done,
  aside,
}) => (
  <div className="flex items-start gap-3">
    <span
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0 ${
        done ? 'bg-[#10B981] text-white' : 'bg-[#2F68FE] text-white'
      }`}
      aria-hidden="true"
    >
      {done ? <Check className="w-4 h-4" strokeWidth={3} /> : step}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[15px] font-extrabold text-[#1E293B] leading-tight">{title}</span>
      <span className="block mt-0.5 text-[11.5px] text-slate-500 leading-snug">{text}</span>
    </span>
    {aside}
  </div>
);

const IconButton: React.FC<{ icon: React.ElementType; label: string; danger?: boolean; onClick: () => void }> = ({ icon: Icon, label, danger, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
      danger ? 'border-[#FECACA] text-rose-500 active:bg-[#FEF2F2]' : 'border-slate-200 text-slate-500 active:bg-slate-50'
    }`}
  >
    <Icon className="w-4 h-4" />
  </button>
);

/** Desktop `hrms-bank-info-card`; rows the client's country doesn't use are left out (desktop shows "-") */
export const BankAccountCard: React.FC<{
  bank: BillingBankAccount;
  country: BillingCountry;
  revealed: boolean;
  mappedCount: number;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ bank, country, revealed, mappedCount, onEdit, onDelete }) => {
  const show = (v?: string) => (v ? (revealed ? v : maskedLast4(v)) : null);
  const rows = [
    { label: 'Account No', value: show(bank.accountNumber) },
    ...(country === 'CA' || country === null
      ? [
          { label: 'Institution No', value: bank.institutionNumber ?? null },
          { label: 'Transit No', value: show(bank.transitNumber) },
        ]
      : []),
    ...(country === 'US' || country === null ? [{ label: 'Routing No', value: show(bank.bankRouting) }] : []),
    ...(country === 'UK' || country === null ? [{ label: 'Sort Code', value: bank.sortCode ?? null }] : []),
  ].filter((r) => r.value);

  return (
    <li className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-3.5">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
          <Landmark className="w-[18px] h-[18px]" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold text-[#1E293B] break-words">{bankNameOf(bank)}</span>
          <span className="block text-[11px] text-slate-500 break-words">{bank.accountName}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <Pill tone="slate">{bank.accountType === 'checking' ? 'Checking' : 'Saving'}</Pill>
            <Pill tone={mappedCount ? 'blue' : 'amber'}>{mappedCount ? `${mappedCount} staff mapped` : 'Not mapped'}</Pill>
          </span>
        </span>
        {(onEdit || onDelete) && (
          <span className="flex items-center gap-1.5 shrink-0">
            {onEdit && <IconButton icon={Pencil} label={`Edit ${bankNameOf(bank)}`} onClick={onEdit} />}
            {onDelete && <IconButton icon={Trash2} label={`Delete ${bankNameOf(bank)}`} danger onClick={onDelete} />}
          </span>
        )}
      </div>
      <dl className="mt-3 p-3 rounded-xl bg-slate-50 grid grid-cols-2 gap-x-4 gap-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <dt className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{r.label}</dt>
            <dd className={`mt-0.5 text-[12.5px] font-semibold tabular-nums break-all ${revealed ? 'text-[#1E293B]' : 'text-slate-600 tracking-wide'}`}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
};

/** Desktop `Card_Img` tile; number always masked (HRMS returns the last 4 digits only) */
export const CreditCardTile: React.FC<{ card: BillingCreditCard; mappedCount: number; onDelete?: () => void }> = ({ card, mappedCount, onDelete }) => {
  const brand = CARD_BRAND[card.cardType];
  const expiry = cardExpiryState(card.expiry);
  return (
    <li className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-2.5">
      <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-[#1E293B] to-[#334155] text-white">
        <span className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <span className="w-9 h-6 rounded-md bg-gradient-to-br from-amber-200 to-amber-400" aria-hidden="true" />
          <span className={`h-7 px-2 rounded-md flex items-center justify-center text-[10px] font-black tracking-wide shrink-0 ${brand.className}`} aria-hidden="true">
            {brand.mark}
          </span>
        </div>
        <p className="relative mt-4 text-[16px] font-bold tabular-nums tracking-[0.14em]">•••• •••• •••• {card.lastFour}</p>
        <div className="relative mt-3 flex items-end justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-[9px] font-semibold tracking-wider text-white/50">CARD HOLDER</span>
            <span className="block text-[12.5px] font-semibold truncate">{card.cardName}</span>
          </span>
          <span className="text-right shrink-0">
            <span className="block text-[9px] font-semibold tracking-wider text-white/50">EXPIRES</span>
            <span className="block text-[12.5px] font-semibold tabular-nums">{formatExpiry(card.expiry)}</span>
          </span>
        </div>
      </div>
      <div className="mt-2.5 px-1 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-slate-500">{card.cardType}</span>
        <span className="flex items-center gap-1.5">
          {expiry !== 'ok' && <Pill tone={expiry === 'expired' ? 'rose' : 'amber'}>{expiry === 'expired' ? 'Expired' : 'Expires soon'}</Pill>}
          <Pill tone={mappedCount ? 'blue' : 'amber'}>{mappedCount ? `${mappedCount} staff mapped` : 'Not mapped'}</Pill>
        </span>
        {onDelete && (
          <span className="ml-auto">
            <IconButton icon={Trash2} label={`Delete ${card.cardType} ending ${card.lastFour}`} danger onClick={onDelete} />
          </span>
        )}
      </div>
    </li>
  );
};

/** Dashed "Add Bank" / "Add Payment Method" tile */
export const AddTile: React.FC<{ icon: React.ElementType; label: string; hint: string; onClick: () => void }> = ({ icon: Icon, label, hint, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full p-3.5 rounded-2xl border-2 border-dashed border-[#BFDBFE] bg-[#F8FBFF] flex items-center gap-3 text-left active:bg-[#EFF6FF] transition-colors cursor-pointer"
  >
    <span className="w-10 h-10 rounded-full bg-[#EBEEFD] text-[#2F68FE] flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </span>
    <span className="min-w-0">
      <span className="block text-[13px] font-bold text-[#2F68FE]">{label}</span>
      <span className="block text-[11px] text-slate-500">{hint}</span>
    </span>
  </button>
);

export const MethodIcon: React.FC<{ type: PaymentType; className?: string }> = ({ type, className = '' }) => {
  if (type === 'direct')
    return (
      <span className={`rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
        <Zap className="w-[18px] h-[18px]" />
      </span>
    );
  if (type === 'bank')
    return (
      <span className={`rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
        <Landmark className="w-[18px] h-[18px]" />
      </span>
    );
  return (
    <span className={`rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
      <span className="text-[9px] font-black">CARD</span>
    </span>
  );
};

/** Staff name chips with avatars; first `max` then "+N more" */
export const StaffChips: React.FC<{ names: { id: string; name: string; tint: number }[]; max?: number; tone?: 'blue' | 'amber' }> = ({
  names,
  max = 6,
  tone = 'blue',
}) => (
  <ul className="flex flex-wrap gap-1.5">
    {names.slice(0, max).map((s) => (
      <li
        key={s.id}
        className={`h-7 pl-0.5 pr-2.5 rounded-full border flex items-center gap-1.5 text-[11px] font-semibold ${
          tone === 'amber' ? 'bg-white border-[#FDE68A] text-amber-900' : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[8.5px] font-bold shrink-0 ${avatarTint(s.tint)}`} aria-hidden="true">
          {initialsOf(s.name)}
        </span>
        {s.name}
      </li>
    ))}
    {names.length > max && (
      <li className="h-7 px-2.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500 flex items-center">+{names.length - max} more</li>
    )}
  </ul>
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
    <li className={`rounded-2xl border transition-colors ${locked ? 'border-slate-100 bg-slate-50' : checked ? 'border-[#BFDBFE] bg-[#EFF6FF]' : 'border-[#EBF0F7] bg-white'}`}>
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
            <span className="mt-0.5 flex items-center gap-1 text-[10.5px] font-semibold text-slate-400 min-w-0">
              <Lock className="w-3 h-3 shrink-0" />
              <span className="truncate">{lockedNote}</span>
            </span>
          ) : (
            <span className="block text-[11px] text-slate-500 truncate">{designation}</span>
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

export const BillingSkeleton: React.FC = () => (
  <div className="px-4 pt-4 space-y-3" aria-busy="true" aria-label="Loading billing details">
    <StaffSkeleton className="w-36 h-3" />
    <StaffSkeleton className="w-44 h-7" />
    <div className="bg-white border border-[#EBF0F7] rounded-2xl p-4 space-y-3">
      <StaffSkeleton className="w-full h-10" />
      <StaffSkeleton className="w-full h-2" />
    </div>
    <div className="bg-white border border-[#EBF0F7] rounded-2xl p-4 space-y-3">
      <StaffSkeleton className="w-48 h-5" />
      <StaffSkeleton className="w-full h-10 rounded-2xl" />
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-36 h-3.5" />
            <StaffSkeleton className="w-24 h-3" />
          </div>
        </div>
      ))}
    </div>
    <div className="bg-white border border-[#EBF0F7] rounded-2xl p-4 space-y-3">
      <StaffSkeleton className="w-40 h-5" />
      <StaffSkeleton className="w-full h-16" />
    </div>
  </div>
);
