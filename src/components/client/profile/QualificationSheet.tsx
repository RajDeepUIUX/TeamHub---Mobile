import React, { useEffect, useState } from 'react';
import { Info, Trash2 } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { DateField, SheetHeader, fieldInputClass } from '../staff/tabs/StaffTabParts';
import { ErrorText, Label, LockedField } from './ProfileParts';
import {
  ClientQualification,
  LICENSE_NUMBER_MAX,
  QUALIFICATION_TYPES,
  QualificationType,
  qualificationMeta,
  statesOf,
} from '../data/clientUserProfileData';

type FieldKey = 'type' | 'state' | 'licenseNumber' | 'issueDate' | 'expiryDate' | 'cycleStartDate' | 'cycleEndDate' | 'reciprocalExemption';
type Errors = Partial<Record<FieldKey, string>>;

type Draft = Omit<ClientQualification, 'id' | 'type'> & { type: QualificationType | '' };

const EMPTY: Draft = {
  type: '',
  state: '',
  licenseNumber: '',
  issueDate: '',
  expiryDate: '',
  cycleStartDate: '',
  cycleEndDate: '',
  reciprocalExemption: null,
};

const US_STATES = statesOf('United States');

/** B license-details add / edit validation (field set follows the chosen qualification) */
const validate = (d: Draft, others: ClientQualification[]): Errors => {
  const e: Errors = {};
  if (!d.type) {
    e.type = 'Please select qualification.';
    return e;
  }
  const meta = qualificationMeta(d.type);
  if (meta.needsState && !d.state) e.state = 'Please select state.';
  if (!d.licenseNumber.trim()) e.licenseNumber = 'Please enter license number.';
  if (!d.issueDate) e.issueDate = 'Please select latest license date.';
  if (!meta.noExpiry) {
    if (!d.expiryDate) e.expiryDate = 'Please select latest expiry date.';
    else if (d.issueDate && d.expiryDate <= d.issueDate) e.expiryDate = 'Expiry date must be after the license date.';
  }
  if (!d.cycleStartDate) e.cycleStartDate = 'Please select cycle start date.';
  if (!d.cycleEndDate) e.cycleEndDate = 'Please select cycle end date.';
  else if (d.cycleStartDate && d.cycleEndDate <= d.cycleStartDate) e.cycleEndDate = 'Cycle end date must be after the start date.';
  if (meta.reciprocal && d.reciprocalExemption === null) e.reciprocalExemption = 'Please select an option.';
  if (!e.type && others.some((q) => q.type === d.type && (!meta.needsState || q.state === d.state))) {
    e[meta.needsState ? 'state' : 'type'] = 'This qualification is already added.';
  }
  return e;
};

/** MyCPE ONE "Add Qualification" / "Edit Qualification" (Qualification Details tab) */
export const QualificationSheet: React.FC<{
  isOpen: boolean;
  /** null = add */
  qualification: ClientQualification | null;
  existing: ClientQualification[];
  onClose: () => void;
  onSave: (q: ClientQualification) => void;
  onDelete: (q: ClientQualification) => void;
}> = ({ isOpen, qualification, existing, onClose, onSave, onDelete }) => {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(qualification ? { ...qualification } : EMPTY);
    setErrors({});
    setSaving(false);
  }, [isOpen, qualification]);

  const meta = draft.type ? qualificationMeta(draft.type) : null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const pickType = (type: QualificationType) => {
    if (type === draft.type) return;
    const next = qualificationMeta(type);
    setDraft((d) => ({
      ...d,
      type,
      state: next.needsState ? d.state : '',
      expiryDate: next.noExpiry ? '' : d.expiryDate,
      reciprocalExemption: next.reciprocal ? d.reciprocalExemption : null,
    }));
    setErrors({});
  };

  const submit = () => {
    const others = existing.filter((q) => q.id !== qualification?.id);
    const found = validate(draft, others);
    setErrors(found);
    if (Object.values(found).some(Boolean) || !draft.type) return;
    setSaving(true);
    setTimeout(() => {
      onSave({ ...draft, type: draft.type as QualificationType, licenseNumber: draft.licenseNumber.trim(), id: qualification?.id ?? `q-${Date.now()}` });
    }, 600);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[92%]">
      <SheetHeader
        title={qualification ? 'Edit Qualification' : 'Add Qualification'}
        subtitle="Used for your CPE compliance tracking"
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="space-y-1.5">
          <Label text="Qualification" required />
          <Dropdown
            ariaLabel="Qualification"
            value={draft.type || null}
            placeholder="Select Qualification"
            options={QUALIFICATION_TYPES.map((q) => ({ value: q.value, label: q.label }))}
            onChange={pickType}
          />
          <ErrorText error={errors.type} />
        </div>

        {meta && (
          <>
            <LockedField label="Regulator" value={meta.regulator} />
            {meta.syncsTo && (
              <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-[#1D4ED8] leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-px" />
                This license number also fills your {meta.syncsTo === 'ptin' ? 'PTIN No.' : meta.syncsTo === 'ctec' ? 'CTEC No.' : 'CFP Board No.'} in Basic Details.
              </p>
            )}
            {meta.needsState && (
              <div className="space-y-1.5">
                <Label text="State" required />
                <Dropdown ariaLabel="State" value={draft.state || null} placeholder="Select State" options={US_STATES} onChange={(s) => set('state', s)} />
                <ErrorText error={errors.state} />
              </div>
            )}
            <label className="block space-y-1.5">
              <Label text="License Number" required hint={`${draft.licenseNumber.length}/${LICENSE_NUMBER_MAX}`} />
              <input
                type="text"
                autoCapitalize="characters"
                spellCheck={false}
                value={draft.licenseNumber}
                onChange={(e) => set('licenseNumber', e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, LICENSE_NUMBER_MAX))}
                placeholder="License Number"
                aria-invalid={Boolean(errors.licenseNumber)}
                className={`${fieldInputClass(errors.licenseNumber)} tabular-nums`}
              />
              <ErrorText error={errors.licenseNumber} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <DateField
                label="Latest License Date"
                required
                value={draft.issueDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(iso) => set('issueDate', iso)}
                error={errors.issueDate}
              />
              {!meta.noExpiry && (
                <DateField
                  label="Latest Expiry Date"
                  required
                  value={draft.expiryDate}
                  min={draft.issueDate || undefined}
                  onChange={(iso) => set('expiryDate', iso)}
                  error={errors.expiryDate}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DateField
                label="Cycle Start Date"
                required
                value={draft.cycleStartDate}
                onChange={(iso) => set('cycleStartDate', iso)}
                error={errors.cycleStartDate}
              />
              <DateField
                label="Cycle End Date"
                required
                value={draft.cycleEndDate}
                min={draft.cycleStartDate || undefined}
                onChange={(iso) => set('cycleEndDate', iso)}
                error={errors.cycleEndDate}
              />
            </div>
            {meta.reciprocal && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-[#1E293B] leading-relaxed">
                  Are you exempt from CPE requirements in this state because you hold an active license in another state where your principal place of
                  business is located?<span className="text-rose-500"> *</span>
                </p>
                <Dropdown
                  ariaLabel="Reciprocal Exemption"
                  value={draft.reciprocalExemption === null ? null : draft.reciprocalExemption ? 'yes' : 'no'}
                  placeholder="Select"
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ]}
                  onChange={(v) => set('reciprocalExemption', v === 'yes')}
                />
                <ErrorText error={errors.reciprocalExemption} />
              </div>
            )}
            {qualification && (
              <button
                type="button"
                onClick={() => onDelete(qualification)}
                className="h-11 -ml-1 px-1 flex items-center gap-1.5 text-xs font-bold text-rose-500 active:text-rose-600 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete this Qualification
              </button>
            )}
          </>
        )}
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-2.5 p-4 pb-6 border-t border-slate-100 shrink-0">
        <button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : qualification ? 'Update this Qualification' : 'Add This Qualification'}
        </button>
      </div>
    </BottomSheet>
  );
};
