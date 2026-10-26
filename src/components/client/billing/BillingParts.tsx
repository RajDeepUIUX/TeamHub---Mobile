import React from 'react';
import { Check, Landmark, Lock, Pencil, Plus, Trash2, Zap } from 'lucide-react';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import {
  BillingBankAccount,
  BillingCreditCard,
  CARD_BRAND,
  PaymentType,
  bankNameOf,
  formatExpiry,
  maskedLast4,
} from '../data/clientBillingData';
import { Pill } from '../staff/tabs/StaffTabParts';

/** Desktop numbered section header ("1 Payment Information", "2 Payment Mapping") */
export const StepHeader: React.FC<{ step: number; title: string; text: string; done?: boolean; aside?: React.ReactNode; v2?: boolean }> = ({
  step,
  title,
  text,
  done,
  aside,
  v2,
}) => (
  <div className="flex items-start gap-3">
    <span
      className={`flex items-center justify-center text-xs font-bold tabular-nums shrink-0 ${
        v2
          ? `w-9 h-9 rounded-xl border ${done ? 'border-emerald-200/50 bg-[#E8F8F0] text-[#10B981]' : 'border-blue-100 bg-blue-50 text-[#2F68FE]'}`
          : `w-9 h-9 rounded-xl ${done ? 'bg-[#E8F8F0] text-[#10B981]' : 'bg-[#EEF2FF] text-[#2F68FE]'}`
      }`}
      aria-hidden="true"
    >
      {done ? <Check className="w-4 h-4" strokeWidth={3} /> : v2 ? String(step).padStart(2, '0') : step}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-bold text-[#1E293B] leading-tight">{title}</span>
      <span className="block mt-0.5 text-[11px] font-medium text-slate-500 leading-snug">{text}</span>
    </span>
    {aside}
  </div>
);

/** Section shell: V1 soft rounded card, V2 ledger panel with a tinted header strip */
export const BillingSection = React.forwardRef<
  HTMLElement,
  { v2?: boolean; header: React.ReactNode; ariaLabel?: string; className?: string; children: React.ReactNode }
>(({ v2, header, ariaLabel, className = '', children }, ref) =>
  v2 ? (
    <section ref={ref} aria-label={ariaLabel} className={`bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden ${className}`}>
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">{header}</div>
      <div className="px-4 pt-3.5 pb-4">{children}</div>
    </section>
  ) : (
    <section
      ref={ref}
      aria-label={ariaLabel}
      className={`bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-4 ${className}`}
    >
      {header}
      <div className="mt-3.5">{children}</div>
    </section>
  ),
);
BillingSection.displayName = 'BillingSection';

/** Tab switch: V1 pill track with filled active tab, V2 underline tabs */
export function BillingTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  v2,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  v2?: boolean;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={v2 ? 'flex border-b border-[#EBF0F7]' : 'p-1 rounded-2xl bg-slate-100/90 border border-slate-200/60 flex gap-1'}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={
              v2
                ? `relative flex-1 h-11 text-[13px] transition-colors cursor-pointer ${active ? 'text-[#2F68FE] font-bold' : 'text-slate-500 font-medium active:text-slate-700'}`
                : `flex-1 h-9 rounded-xl text-xs transition-colors cursor-pointer ${
                    active ? 'bg-white text-[#1E293B] font-bold shadow-[0_1px_3px_rgba(15,23,42,0.12)]' : 'text-slate-500 font-semibold'
                  }`
            }
          >
            {o.label}
            {v2 && active && <span className="absolute left-2 right-2 -bottom-px h-[3px] rounded-t-full bg-[#2F68FE]" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

const IconButton: React.FC<{ icon: React.ElementType; label: string; danger?: boolean; onClick: () => void }> = ({ icon: Icon, label, danger, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
      danger ? 'bg-[#FEF2F2] text-rose-600 active:bg-rose-100' : 'bg-blue-50 text-[#2F68FE] active:bg-blue-100'
    }`}
  >
    <Icon className="w-4 h-4" />
  </button>
);

/** V2 joined icon buttons (edit | delete) */
const IconGroup: React.FC<{ items: { icon: React.ElementType; label: string; danger?: boolean; onClick: () => void }[] }> = ({ items }) => (
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

/** Label / value row like desktop `hrmsBicRow` */
export const LabelRow: React.FC<{ label: string; children: React.ReactNode; muted?: boolean }> = ({ label, children, muted }) => (
  <div className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-100 last:border-b-0">
    <dt className="text-[11px] font-medium text-slate-500 shrink-0">{label}</dt>
    <dd className={`text-xs font-semibold text-right tabular-nums break-all ${muted ? 'text-slate-400' : 'text-[#1E293B]'}`}>{children}</dd>
  </div>
);

/** Desktop `hrms-bank-info-card`: bank name, account type, edit / delete, holder, then every number row ("-" when empty) */
export const BankAccountCard: React.FC<{
  bank: BillingBankAccount;
  revealed: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  v2?: boolean;
}> = ({ bank, revealed, onEdit, onDelete, v2 }) => {
  const show = (v?: string) => (v ? (revealed ? v : maskedLast4(v)) : '-');
  const rows = [
    { label: 'Account No', value: show(bank.accountNumber) },
    { label: 'Institution No', value: bank.institutionNumber || '-' },
    { label: 'Transit No', value: show(bank.transitNumber) },
    { label: 'Routing No', value: show(bank.bankRouting) },
    { label: 'Sort Code', value: bank.sortCode || '-' },
  ];
  const name = bankNameOf(bank);
  const identity = (
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-bold text-[#1E293B] leading-snug break-words">{name}</span>
      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-xs font-medium text-slate-500 break-words">{bank.accountName}</span>
        <Pill tone="slate">{bank.accountType === 'checking' ? 'Checking' : 'Saving'}</Pill>
      </span>
    </span>
  );

  if (v2)
    return (
      <li className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-3.5 flex items-start gap-3 border-b border-slate-100">
          <span className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
            <Landmark className="w-4 h-4" />
          </span>
          {identity}
          {(onEdit || onDelete) && (
            <IconGroup
              items={[
                ...(onEdit ? [{ icon: Pencil, label: `Edit ${name}`, onClick: onEdit }] : []),
                ...(onDelete ? [{ icon: Trash2, label: `Delete ${name}`, danger: true, onClick: onDelete }] : []),
              ]}
            />
          )}
        </div>
        <dl className="px-3.5 py-0.5">
          {rows.map((r) => (
            <LabelRow key={r.label} label={r.label} muted={r.value === '-'}>
              {r.value}
            </LabelRow>
          ))}
        </dl>
      </li>
    );

  return (
    <li className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
      <div className="p-3.5 flex items-start gap-3">
        <span className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
          <Landmark className="w-5 h-5" />
        </span>
        {identity}
        {(onEdit || onDelete) && (
          <span className="flex items-center gap-1.5 shrink-0">
            {onEdit && <IconButton icon={Pencil} label={`Edit ${name}`} onClick={onEdit} />}
            {onDelete && <IconButton icon={Trash2} label={`Delete ${name}`} danger onClick={onDelete} />}
          </span>
        )}
      </div>
      <dl className="mx-3.5 mb-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100 grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map((r, i) => (
          <div key={r.label} className={`min-w-0 ${i === 0 ? 'col-span-2' : ''}`}>
            <dt className="text-[11px] text-slate-400">{r.label}</dt>
            <dd className={`mt-0.5 text-xs font-semibold tabular-nums break-all ${r.value === '-' ? 'text-slate-400' : 'text-[#1E293B]'}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
};

/** Desktop `Card_Img` tile (brand, card name, masked number, remove) with the card's fields labelled; HRMS returns the last 4 digits only */
export const CreditCardTile: React.FC<{ card: BillingCreditCard; onDelete?: () => void; v2?: boolean }> = ({ card, onDelete, v2 }) => {
  const brand = CARD_BRAND[card.cardType];
  const number = `**** - **** - **** - ${card.lastFour}`;
  const deleteLabel = `Delete ${card.cardType} ending ${card.lastFour}`;

  if (v2)
    return (
      <li className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-3.5 flex items-center gap-3 border-b border-slate-100">
          <span className={`w-11 h-7 rounded-md flex items-center justify-center text-[10px] font-black tracking-wide shrink-0 ${brand.className}`} aria-hidden="true">
            {brand.mark}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-[#1E293B] truncate">{card.cardName}</span>
            <span className="block text-[11px] font-medium text-slate-500 tabular-nums">{number}</span>
          </span>
          {onDelete && <IconGroup items={[{ icon: Trash2, label: deleteLabel, danger: true, onClick: onDelete }]} />}
        </div>
        <dl className="px-3.5 py-0.5">
          <LabelRow label="Card Name">{card.cardName}</LabelRow>
          <LabelRow label="Card Number">{number}</LabelRow>
          <LabelRow label="Card Type">{card.cardType}</LabelRow>
          <LabelRow label="Expiry Date">{formatExpiry(card.expiry)}</LabelRow>
        </dl>
      </li>
    );

  return (
    <li className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-3.5">
      <div className="flex items-center gap-3">
        <span className={`w-12 h-8 rounded-md flex items-center justify-center text-[10px] font-black tracking-wide shrink-0 ${brand.className}`} aria-hidden="true">
          {brand.mark}
        </span>
        <span className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] truncate">{card.cardName}</span>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={deleteLabel}
            className="w-9 h-9 rounded-full bg-[#FEF2F2] text-rose-600 flex items-center justify-center shrink-0 active:bg-rose-100 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <dl className="mt-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
        <div>
          <dt className="text-[11px] text-slate-400">Card Number</dt>
          <dd className="mt-0.5 text-sm font-bold text-[#1E293B] tracking-wider tabular-nums">{number}</dd>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
          <div className="min-w-0">
            <dt className="text-[11px] text-slate-400">Card Name</dt>
            <dd className="mt-0.5 text-xs font-semibold text-[#1E293B] truncate">{card.cardName}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-slate-400">Card Type</dt>
            <dd className="mt-0.5 text-xs font-semibold text-[#1E293B] truncate">{card.cardType}</dd>
          </div>
          <div className="min-w-0 text-right">
            <dt className="text-[11px] text-slate-400">Expiry Date</dt>
            <dd className="mt-0.5 text-xs font-semibold text-[#1E293B] tabular-nums">{formatExpiry(card.expiry)}</dd>
          </div>
        </div>
      </dl>
    </li>
  );
};

/** "Add Bank" / "Add Payment Method" button */
export const AddTile: React.FC<{ label: string; onClick: () => void; v2?: boolean }> = ({ label, onClick, v2 }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-center gap-2.5 transition-colors cursor-pointer ${
      v2
        ? 'h-12 rounded-xl border border-dashed border-slate-300 bg-white active:border-[#2F68FE] active:bg-blue-50/50'
        : 'h-12 rounded-xl border border-[#2F68FE] bg-white active:bg-blue-50'
    }`}
  >
    <span
      className={`flex items-center justify-center shrink-0 ${
        v2 ? 'w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#2F68FE]' : 'w-6 h-6 rounded-lg bg-blue-50 text-[#2F68FE]'
      }`}
    >
      <Plus className="w-4 h-4" />
    </span>
    <span className="text-xs font-bold text-[#2F68FE]">{label}</span>
  </button>
);

export const MethodIcon: React.FC<{ type: PaymentType; className?: string }> = ({ type, className = '' }) => {
  if (type === 'direct')
    return (
      <span className={`rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
        <Zap className="w-4 h-4" />
      </span>
    );
  if (type === 'bank')
    return (
      <span className={`rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
        <Landmark className="w-4 h-4" />
      </span>
    );
  return (
    <span className={`rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
      <span className="text-[10px] font-black">CARD</span>
    </span>
  );
};

/** Staff name chips with avatars; first `max` then "+N more" */
export const StaffChips: React.FC<{ names: { id: string; name: string; tint: number }[]; max?: number; tone?: 'blue' | 'amber'; v2?: boolean }> = ({
  names,
  max = 6,
  tone = 'blue',
  v2,
}) => (
  <ul className="flex flex-wrap gap-1.5">
    {names.slice(0, max).map((s) => (
      <li
        key={s.id}
        className={`h-7 border flex items-center gap-1.5 text-[11px] font-semibold ${v2 ? 'pl-1 pr-2 rounded-lg' : 'pl-0.5 pr-2.5 rounded-full'} ${
          tone === 'amber'
            ? 'bg-[#FEF8E7] border-amber-200/50 text-[#D97706]'
            : v2
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
        }`}
      >
        <span
          className={`flex items-center justify-center font-bold shrink-0 ${v2 ? 'w-5 h-5 rounded-md text-[10px]' : 'w-6 h-6 rounded-full text-[10px]'} ${avatarTint(s.tint)}`}
          aria-hidden="true"
        >
          {initialsOf(s.name)}
        </span>
        {s.name}
      </li>
    ))}
    {names.length > max && (
      <li className={`h-7 px-2.5 bg-slate-100 text-[11px] font-semibold text-slate-600 flex items-center ${v2 ? 'rounded-lg' : 'rounded-full'}`}>
        +{names.length - max} more
      </li>
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
    <li className={`rounded-xl border transition-colors ${locked ? 'border-slate-100 bg-slate-50' : checked ? 'border-[#2F68FE] bg-blue-50/70' : 'border-slate-200 bg-white shadow-2xs'}`}>
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

export const BillingSkeleton: React.FC<{ v2?: boolean }> = ({ v2 }) => {
  const box = 'bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-4 space-y-3';
  return (
    <div className="px-4 pt-4 space-y-3" aria-busy="true" aria-label="Loading billing details">
      <div className={box}>
        <StaffSkeleton className="w-48 h-5" />
        <StaffSkeleton className={`w-full h-11 ${v2 ? 'rounded-lg' : 'rounded-2xl'}`} />
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
      <div className={box}>
        <StaffSkeleton className="w-40 h-5" />
        <StaffSkeleton className="w-full h-16 rounded-xl" />
      </div>
    </div>
  );
};
