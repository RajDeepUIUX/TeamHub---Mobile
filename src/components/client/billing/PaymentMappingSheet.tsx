import React, { useEffect, useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { ChoiceTiles } from '../../common/ChoiceTiles';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { SearchField, SheetHeader } from '../staff/tabs/StaffTabParts';
import { ErrorText, Label } from '../profile/ProfileParts';
import { SelectAllButton } from '../flexibility/WorkFlexParts';
import { StaffCheckRow } from './BillingParts';
import {
  BillingDetails,
  PaymentMappingRow,
  PaymentType,
  bankNameOf,
  formatExpiry,
  maskedLast4,
  methodLabel,
} from '../data/clientBillingData';

export interface MappingStaff {
  id: string;
  name: string;
  designation: string;
  tint: number;
}

interface Props {
  isOpen: boolean;
  /** Row being edited, or a new row (may carry preselected staff) */
  row: PaymentMappingRow | null;
  isNew: boolean;
  billing: BillingDetails;
  staff: MappingStaff[];
  onClose: () => void;
  onSave: (row: PaymentMappingRow) => void;
}

const TILE_LABEL: Record<PaymentType, string> = { bank: 'Bank', card: 'Card', direct: 'Direct Pay' };

/** One B Payment Mapping row as a sheet: Payment Type → Payment Method → Select Staff(s) */
export const PaymentMappingSheet: React.FC<Props> = ({ isOpen, row, isNew, billing, staff, onClose, onSave }) => {
  const [type, setType] = useState<PaymentType | null>(null);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || !row) return;
    setType(isNew && !row.staffIds.length && !row.methodId ? null : row.type);
    setMethodId(row.methodId);
    setPicked(row.staffIds);
    setSearch('');
    setErrors({});
  }, [isOpen, row, isNew]);

  // Desktop `buildPaymentTypeOptions`: only types that have something saved
  const types = useMemo(() => {
    const out: PaymentType[] = [];
    if (billing.banks.length) out.push('bank');
    if (billing.cards.length) out.push('card');
    if (billing.directPayEnabled) out.push('direct');
    return out;
  }, [billing]);

  if (!row) return null;

  const methodOptions =
    type === 'bank'
      ? billing.banks.map((b) => ({ value: b.id, label: `${bankNameOf(b)} (${maskedLast4(b.accountNumber)})`, description: b.accountName }))
      : type === 'card'
        ? billing.cards.map((c) => ({ value: c.id, label: `${c.cardType} (${maskedLast4(c.lastFour)})`, description: `${c.cardName} · Exp ${formatExpiry(c.expiry)}` }))
        : [];

  // A staff member sits in one mapping row
  const lockedIn: Record<string, string> = {};
  billing.mappings.forEach((r) => {
    if (r.id === row.id) return;
    r.staffIds.forEach((id) => {
      lockedIn[id] = `Mapped to ${methodLabel(billing, r.type, r.methodId)}`;
    });
  });

  const q = search.trim().toLowerCase();
  // Staff still free to map first, already-mapped (locked) after
  const list = staff
    .filter((s) => !q || s.name.toLowerCase().includes(q) || s.designation.toLowerCase().includes(q))
    .sort((a, b) => Number(Boolean(lockedIn[a.id])) - Number(Boolean(lockedIn[b.id])));
  const selectable = list.filter((s) => !lockedIn[s.id]);
  const allTicked = selectable.length > 0 && selectable.every((s) => picked.includes(s.id));
  const freeCount = staff.filter((s) => !lockedIn[s.id]).length;

  const toggle = (id: string) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    setErrors((e) => ({ ...e, staff: '' }));
  };
  const toggleAll = () => {
    setPicked((p) => (allTicked ? p.filter((id) => !selectable.some((s) => s.id === id)) : [...new Set([...p, ...selectable.map((s) => s.id)])]));
    setErrors((e) => ({ ...e, staff: '' }));
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (!type) e.type = 'Select a payment type.';
    else if (type !== 'direct' && !methodOptions.some((o) => o.value === methodId)) e.method = 'Select a payment method.';
    if (!picked.length) e.staff = 'Select at least one staff member.';
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ ...row, type: type as PaymentType, methodId: type === 'direct' ? null : methodId, staffIds: staff.filter((s) => picked.includes(s.id)).map((s) => s.id) });
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[92%]">
      <SheetHeader title={isNew ? 'Add Payment Mapping' : 'Edit Payment Mapping'} subtitle="Choose a payment method, then the staff it pays for" onClose={onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="px-5 pt-4 space-y-4">
          <div className="space-y-1.5">
            <Label text="Payment Type" required />
            <ChoiceTiles
              multiple={false}
              options={types.map((t) => TILE_LABEL[t])}
              selected={type ? [TILE_LABEL[type]] : []}
              onChange={([label]) => {
                const next = types.find((t) => TILE_LABEL[t] === label) ?? null;
                if (next === type) return;
                setType(next);
                // Desktop resets the method when the type changes; one saved method is picked for you (Added by designer)
                const only = next === 'bank' && billing.banks.length === 1 ? billing.banks[0].id : next === 'card' && billing.cards.length === 1 ? billing.cards[0].id : null;
                setMethodId(only);
                setErrors((x) => ({ ...x, type: '', method: '' }));
              }}
            />
            <ErrorText error={errors.type} />
          </div>

          {type && type !== 'direct' && (
            <div className="space-y-1.5">
              <Label text="Payment Method" required />
              <Dropdown
                ariaLabel="Payment Method"
                sheetTitle="Payment Method"
                value={methodId}
                placeholder="Please Select"
                options={methodOptions}
                onChange={(v) => {
                  setMethodId(v);
                  setErrors((x) => ({ ...x, method: '' }));
                }}
              />
              <ErrorText error={errors.method} />
            </div>
          )}
          {type === 'direct' && (
            <p className="flex gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-medium leading-relaxed text-emerald-700">
              <Info className="w-4 h-4 shrink-0 mt-px" />
              Direct Pay has no saved account to pick — the selected staff are billed through Direct Pay.
            </p>
          )}
        </div>

        <div className="px-5 pt-5 pb-1 bg-white sticky top-0 z-10 space-y-2.5">
          <Label text="Select Staff(s)" required hint={`${picked.length} selected`} />
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <SearchField variant="sheet" value={search} onChange={setSearch} placeholder="Search by name or role…" />
            </div>
            <SelectAllButton label={allTicked ? 'Clear all' : 'Select all'} onClick={toggleAll} disabled={selectable.length === 0} />
          </div>
          <ErrorText error={errors.staff} />
        </div>

        <div className="px-4 pt-2 pb-4">
          {freeCount === 0 && !picked.length ? (
            <p className="py-8 text-center text-xs font-medium text-slate-500">All staff have mapped payment details.</p>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-xs font-medium text-slate-500">No staff match “{search.trim()}”</p>
          ) : (
            <ul className="space-y-2">
              {list.map((s) => (
                <StaffCheckRow
                  key={s.id}
                  name={s.name}
                  designation={s.designation}
                  tint={s.tint}
                  checked={picked.includes(s.id)}
                  lockedNote={lockedIn[s.id]}
                  onToggle={() => toggle(s.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button type="button" onClick={onClose} className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer">
          Cancel
        </button>
        <button type="button" onClick={save} className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer">
          {isNew ? 'Add Mapping' : 'Update Mapping'}
        </button>
      </div>
    </BottomSheet>
  );
};
