import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Info, Loader2, Lock, Pencil, Plus, Save, Trash2, Zap } from 'lucide-react';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, ConfirmSheet, DesignVersion } from '../staff/tabs/StaffTabParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import {
  BillingDetails,
  PAYMENT_TYPE_LABEL,
  PaymentMappingRow,
  REVEAL_MS,
  billableStaffOf,
  billingCountryOf,
  isMappingComplete,
  mappingsEqual,
  methodLabel,
  needsMethodStaffIds,
  newBillingId,
  unmappedStaffIds,
} from '../data/clientBillingData';
import { AddTile, BankAccountCard, BillingSection, BillingSkeleton, BillingTabs, CreditCardTile, MethodIcon, StaffChips, StepHeader } from './BillingParts';
import { PaymentMethodSheet, PaymentMethodTarget } from './PaymentMethodSheet';
import { VerifyPasswordSheet } from './VerifyPasswordSheet';
import { MappingStaff, PaymentMappingSheet } from './PaymentMappingSheet';

interface Props {
  billing: BillingDetails;
  staff: ClientStaffMember[];
  /** Company Profile country → which bank fields apply */
  country: string;
  userName: string;
  onChange: (next: BillingDetails) => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

type PaneTab = 'bank' | 'card' | 'direct';
type DeleteTarget = { kind: 'bank' | 'card'; id: string };
type VerifyThen = { purpose: string; then: () => void };

const LOAD_MS = 700;
const SUBMIT_MS = 900;
const DESIGN_VERSIONS = ['V1', 'V2'] as const;

const listNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? '');

/**
 * Invoices › Billing Details — MyCPE ONE "Billing → HRMS (Offshoring)" (data in system C via `HrmsPaymentService`):
 * 1 Payment Information (Bank Details / Credit Card / Direct Pay, portal password to view or edit bank details)
 * 2 Payment Mapping (each staff member → one saved payment method; Save As Draft / Submit Mapping).
 */
export const ClientBillingDetailsView: React.FC<Props> = ({ billing, staff, country, userName, onChange, onBack }) => {
  // `is_view` = see bank numbers; `is_add` = add bank / card; `is_edit` = edit bank, Direct Pay, mapping; `is_delete` = remove methods
  const { view: canView, add: canAdd, edit: canEdit, delete: canDelete } = useClientPermission('billing-details');

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PaneTab>('bank');
  const [revealed, setRevealed] = useState(false);
  const [verify, setVerify] = useState<VerifyThen | null>(null);
  const [methodTarget, setMethodTarget] = useState<PaymentMethodTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [mappingEdit, setMappingEdit] = useState<{ row: PaymentMappingRow; isNew: boolean } | null>(null);
  const [removeRowId, setRemoveRowId] = useState<string | null>(null);
  const [disableDirect, setDisableDirect] = useState(false);
  const [directBusy, setDirectBusy] = useState(false);
  const [submitting, setSubmitting] = useState<'draft' | 'submit' | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [notice, showNotice] = useTimesheetNotice();
  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
  const mappingRef = useRef<HTMLElement>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const busyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);
  useEffect(
    () => () => {
      clearTimeout(revealTimer.current);
      clearTimeout(busyTimer.current);
    },
    [],
  );

  const countryCode = billingCountryOf(country);
  const billable = useMemo(() => billableStaffOf(staff), [staff]);
  const mappingStaff: MappingStaff[] = useMemo(
    () => billable.map((s, tint) => ({ id: s.id, name: s.name, designation: s.designation, tint })),
    [billable],
  );
  const staffById = (id: string) => mappingStaff.find((s) => s.id === id);
  const chipsFor = (ids: string[]) => ids.map(staffById).filter((s): s is MappingStaff => Boolean(s));

  const billableIds = billable.map((s) => s.id);
  const unmapped = unmappedStaffIds(billing, billableIds);
  const needsMethod = needsMethodStaffIds(billing);
  const mappedCount = billableIds.length - unmapped.length - needsMethod.length;
  const hasPayment = billing.banks.length > 0 || billing.cards.length > 0 || billing.directPayEnabled;
  const rows = billing.mappings.filter((r) => r.staffIds.length);
  const dirty = !mappingsEqual(billing.mappings, billing.submittedMappings);
  const staffOnMethod = (type: PaymentMappingRow['type'], id: string | null) =>
    billing.mappings.filter((r) => r.type === type && (type === 'direct' || r.methodId === id)).reduce((n, r) => n + r.staffIds.length, 0);
  const directMapped = staffOnMethod('direct', null);

  /* ---------- Bank details reveal (portal password) ---------- */
  const reveal = () => {
    setRevealed(true);
    clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => setRevealed(false), REVEAL_MS);
  };
  const hide = () => {
    clearTimeout(revealTimer.current);
    setRevealed(false);
  };
  const withVerify = (purpose: string, then: () => void) => (revealed ? then() : setVerify({ purpose, then }));

  /* ---------- Mapping changes (working copy; Submit sends it) ---------- */
  const setMappings = (mappings: PaymentMappingRow[], patch: Partial<BillingDetails> = {}) => {
    onChange({ ...billing, ...patch, mappings, draftSavedAt: null });
  };

  const openNewMapping = (staffIds: string[] = []) =>
    setMappingEdit({ row: { id: newBillingId('map'), staffIds, type: 'bank', methodId: null }, isNew: true });

  const saveMapping = (row: PaymentMappingRow) => {
    const exists = billing.mappings.some((r) => r.id === row.id);
    setMappings(exists ? billing.mappings.map((r) => (r.id === row.id ? row : r)) : [...billing.mappings, row]);
    setMappingEdit(null);
    showNotice(`${row.staffIds.length} staff mapped to ${methodLabel(billing, row.type, row.methodId)}. Submit to save.`);
  };

  const submitMapping = (asDraft: boolean) => {
    if (asDraft) {
      setSubmitting('draft');
      busyTimer.current = setTimeout(() => {
        setSubmitting(null);
        onChange({ ...billing, draftSavedAt: new Date().toISOString() });
        showNotice('Draft saved. Submit Mapping once every staff member is mapped.');
      }, 600);
      return;
    }
    // Desktop checks: every row complete, at least one row, nobody left unmapped
    const incomplete = rows.filter((r) => !isMappingComplete(billing, r)).map((r) => r.id);
    if (unmapped.length) {
      const names = unmapped.map((id) => staffById(id)?.name ?? id);
      showNotice(`${unmapped.length} staff ${unmapped.length > 1 ? 'have' : 'has'} not been mapped to any payment details yet: ${listNames(names)}.`, true);
      mappingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (incomplete.length || !rows.length) {
      showNotice('Please complete all mapping rows before saving.', true);
      mappingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setSubmitting('submit');
    busyTimer.current = setTimeout(() => {
      setSubmitting(null);
      onChange({
        ...billing,
        mappings: rows,
        submittedMappings: rows,
        submittedAt: new Date().toISOString(),
        submittedBy: userName,
        draftSavedAt: null,
      });
      showNotice('Payment mapping saved successfully.');
    }, SUBMIT_MS);
  };

  /* ---------- Payment methods ---------- */
  const deleteMethod = () => {
    if (!deleteTarget) return;
    const { kind, id } = deleteTarget;
    // Rows that used it keep their staff but need a new method before the next submit
    const mappings = billing.mappings.map((r) => (r.type === kind && r.methodId === id ? { ...r, methodId: null } : r));
    onChange({
      ...billing,
      banks: kind === 'bank' ? billing.banks.filter((b) => b.id !== id) : billing.banks,
      cards: kind === 'card' ? billing.cards.filter((c) => c.id !== id) : billing.cards,
      mappings,
      draftSavedAt: null,
    });
    setDeleteTarget(null);
    showNotice('Payment method deleted successfully.');
  };

  const deleteInfo = (() => {
    if (!deleteTarget) return null;
    const n = staffOnMethod(deleteTarget.kind, deleteTarget.id);
    const label = methodLabel(billing, deleteTarget.kind, deleteTarget.id);
    return { label, note: n ? `${n} staff ${n === 1 ? 'is' : 'are'} mapped to ${label}. You'll need to map them to another payment method and submit.` : undefined };
  })();

  const toggleDirect = () => {
    if (billing.directPayEnabled) {
      if (directMapped) {
        showNotice('Direct Pay is already mapped, please unmap it first.', true);
        return;
      }
      setDisableDirect(true);
      return;
    }
    setDirectBusy(true);
    busyTimer.current = setTimeout(() => {
      setDirectBusy(false);
      onChange({ ...billing, directPayEnabled: true });
      showNotice('Direct Pay enabled. You can now map staff to it.');
    }, 600);
  };

  if (loading)
    return (
      <div className="flex-1 bg-[#F8FAFC] overflow-hidden">
        <BillingSkeleton v2={v2} />
      </div>
    );

  // Desktop shows the Direct Pay tab only for eligible accounts
  const paneTabs = [
    { id: 'bank' as const, label: 'Bank Details' },
    { id: 'card' as const, label: 'Credit Card' },
    ...(billing.directPayEligible ? [{ id: 'direct' as const, label: 'Direct Pay' }] : []),
  ];
  const countPill = (n: number, one: string, many: string) => (
    <span
      className={`h-6 px-2.5 text-[10.5px] font-bold text-[#2F68FE] flex items-center whitespace-nowrap ${
        v2 ? 'rounded-md border border-[#BFDBFE] bg-white' : 'rounded-full bg-[#EFF6FF]'
      }`}
    >
      {n} {n === 1 ? one : many}
    </span>
  );
  const noData = <p className="py-6 text-center text-[12px] text-slate-400">No Data Found</p>;
  const mappedPct = billableIds.length ? Math.round((mappedCount / billableIds.length) * 100) : 0;

  /* ---------- Mapping row: V1 soft card (staff + type / method tiles, pill actions) ---------- */
  const rowV1 = (r: PaymentMappingRow) => {
    const complete = isMappingComplete(billing, r);
    return (
      <li key={r.id} className={`rounded-[20px] border p-3.5 ${complete ? 'border-[#E2E8F0] bg-[#F8FAFC]' : 'border-[#FECACA] bg-[#FFF5F5]'}`}>
        <span className="block text-[11.5px] font-semibold text-slate-500">Select Staff(s)</span>
        <div className="mt-2">
          <StaffChips names={chipsFor(r.staffIds)} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2">
          <div className="min-w-0 p-2.5 rounded-2xl bg-white flex items-center gap-2.5">
            <MethodIcon type={r.type} className="w-8 h-8" />
            <span className="min-w-0">
              <dt className="text-[10.5px] font-medium text-slate-500">Payment Type</dt>
              <dd className="mt-0.5 text-[12.5px] font-bold text-[#1E293B]">{PAYMENT_TYPE_LABEL[r.type]}</dd>
            </span>
          </div>
          <div className="min-w-0 p-2.5 rounded-2xl bg-white">
            <dt className="text-[10.5px] font-medium text-slate-500">Payment Method</dt>
            <dd className={`mt-0.5 text-[12.5px] font-bold break-words ${complete ? 'text-[#1E293B]' : 'text-rose-600'}`}>
              {complete ? methodLabel(billing, r.type, r.methodId) : r.type === 'direct' ? '-' : 'Please Select'}
            </dd>
          </div>
        </dl>
        {!complete && (
          <p className="mt-2.5 px-3 py-2 rounded-xl bg-white flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {r.type === 'direct' ? 'Direct Pay is disabled — pick another method.' : 'Its payment method was removed — pick another.'}
          </p>
        )}
        {canEdit && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-slate-500">Action</span>
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMappingEdit({ row: r, isNew: false })}
                className="h-8 px-3 rounded-full bg-[#EFF6FF] text-[11.5px] font-bold text-[#2F68FE] flex items-center gap-1.5 active:bg-[#DBEAFE] cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setRemoveRowId(r.id)}
                className="h-8 px-3 rounded-full bg-[#FEF2F2] text-[11.5px] font-bold text-rose-500 flex items-center gap-1.5 active:bg-[#FEE2E2] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </span>
          </div>
        )}
      </li>
    );
  };

  /* ---------- Mapping row: V2 ledger (status rail, dashed rows, segmented actions) ---------- */
  const rowV2 = (r: PaymentMappingRow) => {
    const complete = isMappingComplete(billing, r);
    return (
      <li key={r.id} className={`relative rounded-xl border bg-white overflow-hidden ${complete ? 'border-[#DCE3ED]' : 'border-[#FECACA]'}`}>
        <span className={`absolute inset-y-0 left-0 w-1 ${complete ? 'bg-[#2F68FE]' : 'bg-rose-500'}`} aria-hidden="true" />
        <div className="pl-4 pr-3.5 pt-3 pb-3">
          <span className="block text-[10.5px] font-bold tracking-wide uppercase text-slate-400">Select Staff(s)</span>
          <div className="mt-2">
            <StaffChips names={chipsFor(r.staffIds)} v2 />
          </div>
        </div>
        <dl className="pl-4 pr-3.5 border-t border-dashed border-slate-200">
          <div className="flex items-center justify-between gap-3 py-2 border-b border-dashed border-slate-200">
            <dt className="text-[11.5px] font-medium text-slate-500 shrink-0">Payment Type</dt>
            <dd className="text-[12.5px] font-bold text-[#1E293B] text-right">{PAYMENT_TYPE_LABEL[r.type]}</dd>
          </div>
          <div className="flex items-start justify-between gap-3 py-2">
            <dt className="text-[11.5px] font-medium text-slate-500 shrink-0">Payment Method</dt>
            <dd className={`text-[12.5px] font-bold text-right break-words ${complete ? 'text-[#1E293B]' : 'text-rose-600'}`}>
              {complete ? methodLabel(billing, r.type, r.methodId) : r.type === 'direct' ? '-' : 'Please Select'}
            </dd>
          </div>
        </dl>
        {!complete && (
          <p className="pl-4 pr-3.5 py-2 bg-[#FEF2F2] flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {r.type === 'direct' ? 'Direct Pay is disabled — pick another method.' : 'Its payment method was removed — pick another.'}
          </p>
        )}
        {canEdit && (
          <div className="pl-4 pr-3 py-2 bg-[#F8FAFC] border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-medium text-slate-500">Action</span>
            <span className="flex rounded-lg border border-slate-200 divide-x divide-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setMappingEdit({ row: r, isNew: false })}
                className="h-8 px-3 bg-white text-[11.5px] font-bold text-[#2F68FE] flex items-center gap-1.5 active:bg-blue-50 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setRemoveRowId(r.id)}
                className="h-8 px-3 bg-white text-[11.5px] font-bold text-rose-500 flex items-center gap-1.5 active:bg-[#FEF2F2] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </span>
          </div>
        )}
      </li>
    );
  };

  const directOn = billing.directPayEnabled;

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Billing Details" onBack={onBack} version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }} />
      {notice}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          {/* 1 Payment Information */}
          <BillingSection
            v2={v2}
            header={
              <StepHeader
                v2={v2}
                step={1}
                title="Payment Information"
                text="Add and manage payment methods"
                aside={
                  <span className="flex flex-col items-end gap-1 shrink-0">
                    {countPill(billing.banks.length, 'Bank', 'Banks')}
                    {countPill(billing.cards.length, 'Card', 'Cards')}
                  </span>
                }
              />
            }
          >
            <BillingTabs v2={v2} options={paneTabs} value={tab} onChange={setTab} ariaLabel="Payment method type" />

            {tab === 'bank' && (
              <div className="mt-3.5">
                {billing.banks.length > 0 && canView && (
                  <div className="mb-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => (revealed ? hide() : setVerify({ purpose: 'view bank details', then: reveal }))}
                      className={`h-8 px-3 text-[11.5px] font-bold text-[#2F68FE] flex items-center gap-1.5 cursor-pointer ${
                        v2 ? 'rounded-lg border border-[#BFDBFE] bg-white active:bg-blue-50' : 'rounded-full bg-[#EFF6FF] active:bg-[#DBEAFE]'
                      }`}
                    >
                      {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {revealed ? 'Hide Details' : 'View Bank Details'}
                    </button>
                  </div>
                )}
                {canAdd && (
                  <div className={billing.banks.length ? 'mb-2.5' : ''}>
                    <AddTile v2={v2} label="Add Bank" onClick={() => setMethodTarget({ kind: 'bank' })} />
                  </div>
                )}
                {billing.banks.length > 0 ? (
                  <ul className={v2 ? 'space-y-2.5' : 'space-y-3'}>
                    {billing.banks.map((b) => (
                      <BankAccountCard
                        key={b.id}
                        v2={v2}
                        bank={b}
                        revealed={revealed}
                        onEdit={canEdit && canView ? () => withVerify('edit this bank account', () => setMethodTarget({ kind: 'bank', edit: b })) : undefined}
                        onDelete={canDelete ? () => setDeleteTarget({ kind: 'bank', id: b.id }) : undefined}
                      />
                    ))}
                  </ul>
                ) : (
                  !canAdd && noData
                )}
              </div>
            )}

            {tab === 'card' && (
              <div className="mt-3.5">
                {canAdd && (
                  <div className={billing.cards.length ? 'mb-2.5' : ''}>
                    <AddTile v2={v2} label={billing.cards.length ? 'Add New Card' : 'Add Payment Method'} onClick={() => setMethodTarget({ kind: 'card' })} />
                  </div>
                )}
                {billing.cards.length > 0 ? (
                  <ul className={v2 ? 'space-y-2.5' : 'space-y-3'}>
                    {billing.cards.map((c) => (
                      <CreditCardTile key={c.id} v2={v2} card={c} onDelete={canDelete ? () => setDeleteTarget({ kind: 'card', id: c.id }) : undefined} />
                    ))}
                  </ul>
                ) : (
                  !canAdd && noData
                )}
              </div>
            )}

            {tab === 'direct' &&
              (v2 ? (
                <div className="mt-3.5 relative rounded-xl border border-[#DCE3ED] bg-white overflow-hidden">
                  <span className={`absolute inset-y-0 left-0 w-1 ${directOn ? 'bg-[#10B981]' : 'bg-[#2F68FE]'}`} aria-hidden="true" />
                  <div className="pl-4 pr-3.5 py-3.5 flex items-center gap-3">
                    <span
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        directOn ? 'bg-[#E8F8F0] text-[#10B981]' : 'bg-[#EFF6FF] text-[#2F68FE]'
                      }`}
                    >
                      <Zap className="w-5 h-5" />
                    </span>
                    <p className="flex-1 min-w-0 text-[13px] font-bold text-[#1E293B] leading-snug">
                      {directOn ? 'Direct pay is currently enabled for your account' : 'Enable Direct Payment Method'}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="pl-4 pr-3.5 py-3 bg-[#F8FAFC] border-t border-slate-100">
                      <button
                        type="button"
                        onClick={toggleDirect}
                        disabled={directBusy}
                        className={`w-full h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait ${
                          directOn ? 'border border-[#FECACA] bg-white text-rose-600 active:bg-[#FEF2F2]' : 'bg-[#2F68FE] text-white active:bg-[#1D4ED8]'
                        }`}
                      >
                        {directBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : !directOn && <Zap className="w-4 h-4" />}
                        {directOn ? 'Disable Direct Pay' : directBusy ? 'Enabling…' : 'Enable & Save Direct Pay'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`mt-3.5 p-5 rounded-[20px] flex flex-col items-center text-center bg-gradient-to-b ${
                    directOn ? 'from-[#E8F8F0] to-white' : 'from-[#EFF6FF] to-white'
                  }`}
                >
                  <span
                    className={`w-14 h-14 rounded-full text-white flex items-center justify-center ${
                      directOn ? 'bg-[#10B981] shadow-[0_8px_18px_-8px_rgba(16,185,129,0.8)]' : 'bg-[#2F68FE] shadow-[0_8px_18px_-8px_rgba(47,104,254,0.8)]'
                    }`}
                  >
                    <Zap className="w-6 h-6" />
                  </span>
                  <p className="mt-3 text-[13.5px] font-bold text-[#1E293B]">
                    {directOn ? 'Direct pay is currently enabled for your account' : 'Enable Direct Payment Method'}
                  </p>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={toggleDirect}
                      disabled={directBusy}
                      className={`mt-4 h-11 px-6 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer disabled:cursor-wait ${
                        directOn ? 'border border-[#FECACA] bg-white text-rose-600 active:bg-[#FEF2F2]' : 'bg-[#2F68FE] text-white active:bg-[#1D4ED8]'
                      }`}
                    >
                      {directBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : !directOn && <Zap className="w-4 h-4" />}
                      {directOn ? 'Disable Direct Pay' : directBusy ? 'Enabling…' : 'Enable & Save Direct Pay'}
                    </button>
                  )}
                </div>
              ))}
          </BillingSection>

          {/* 2 Payment Mapping */}
          <BillingSection
            ref={mappingRef}
            v2={v2}
            ariaLabel="Payment Mapping"
            className="mt-3 scroll-mt-3"
            header={
              <StepHeader
                v2={v2}
                step={2}
                title="Payment Mapping"
                text="Assign Saved payment methods to Staff"
                aside={
                  <button
                    type="button"
                    onClick={() => setShowHelp((v) => !v)}
                    aria-expanded={showHelp}
                    aria-label="How payment mapping works"
                    className={`w-8 h-8 flex items-center justify-center cursor-pointer ${
                      v2
                        ? `rounded-lg border ${showHelp ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE]' : 'border-slate-200 bg-white text-slate-400'} active:bg-slate-50`
                        : `-mr-1 rounded-full ${showHelp ? 'bg-[#EFF6FF] text-[#2F68FE]' : 'text-slate-400'} active:bg-slate-100`
                    }`}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                }
              />
            }
          >
            {showHelp && (
              <p
                className={`mb-3.5 px-3 py-2.5 text-[11px] leading-relaxed text-[#3730A3] ${
                  v2 ? 'rounded-lg bg-[#EEF2FF] border-l-[3px] border-[#4F46E5]' : 'rounded-2xl bg-[#EEF2FF]'
                }`}
              >
                If you have multiple timesheets and want to setup different payment methods for your timesheets then in step 1 you can add multiple
                payment methods and map specific timesheets to them below. Group multiple staff timesheet numbers per method.
              </p>
            )}

            {!hasPayment ? (
              <div
                className={`py-6 px-4 flex flex-col items-center text-center ${
                  v2 ? 'rounded-lg border border-dashed border-slate-300 bg-[#F8FAFC]' : 'rounded-[20px] bg-gradient-to-b from-[#F1F5F9] to-white'
                }`}
              >
                <span className={`flex items-center justify-center text-slate-400 ${v2 ? 'w-10 h-10 rounded-lg bg-white border border-slate-200' : 'w-12 h-12 rounded-full bg-white shadow-sm'}`}>
                  <Lock className="w-5 h-5" />
                </span>
                <p className="mt-2.5 text-[12.5px] font-bold text-[#1E293B]">Add at least one payment method to unlock mapping</p>
              </div>
            ) : (
              <>
                {rows.length > 0 ? <ul className={v2 ? 'space-y-2.5' : 'space-y-3'}>{rows.map(v2 ? rowV2 : rowV1)}</ul> : noData}

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => openNewMapping()}
                    disabled={!unmapped.length}
                    className={`mt-3 w-full h-11 text-[12px] font-bold text-[#2F68FE] flex items-center justify-center gap-1.5 cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed ${
                      v2
                        ? 'rounded-lg border border-dashed border-[#93C5FD] bg-white active:bg-[#EFF6FF] disabled:border-slate-200 disabled:bg-[#F8FAFC]'
                        : 'rounded-full border border-[#BFDBFE] bg-[#EFF6FF] active:bg-[#DBEAFE] disabled:border-slate-200 disabled:bg-slate-50'
                    }`}
                  >
                    {unmapped.length ? <Plus className="w-4 h-4" /> : null}
                    {unmapped.length ? 'Add Payment Mapping' : 'All staff have mapped payment details.'}
                  </button>
                )}

                {v2 ? (
                  <div className="mt-3 rounded-lg border border-[#E2E8F0] overflow-hidden">
                    <div className="px-3 py-2.5 flex items-center justify-between gap-2 bg-[#F8FAFC]">
                      <span className="text-[10.5px] font-bold tracking-wide text-slate-400">STATUS OVERVIEW</span>
                      <span className="text-[12px] font-extrabold tabular-nums">
                        {mappedCount} / {billableIds.length} Staff Mapped
                      </span>
                    </div>
                    <span className="block h-1 bg-slate-100" aria-hidden="true">
                      <span className="block h-full bg-[#2F68FE] transition-[width]" style={{ width: `${mappedPct}%` }} />
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 p-3 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#F8FAFC]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-bold tracking-wide text-slate-400">STATUS OVERVIEW</span>
                      <span className="text-[12px] font-extrabold tabular-nums">
                        {mappedCount} / {billableIds.length} Staff Mapped
                      </span>
                    </div>
                    <span className="mt-2 block h-1.5 rounded-full bg-white" aria-hidden="true">
                      <span className="block h-full rounded-full bg-gradient-to-r from-[#2F68FE] to-[#5B8CFF] transition-[width]" style={{ width: `${mappedPct}%` }} />
                    </span>
                  </div>
                )}

                {canEdit && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => submitMapping(true)}
                      disabled={!dirty || Boolean(submitting) || Boolean(billing.draftSavedAt)}
                      className={`border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white flex items-center justify-center gap-2 active:bg-blue-50 cursor-pointer disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed ${
                        v2 ? 'h-10 rounded-lg' : 'h-11 rounded-full'
                      }`}
                    >
                      {submitting === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save As Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => submitMapping(false)}
                      disabled={Boolean(submitting)}
                      className={`bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer disabled:opacity-80 disabled:cursor-wait ${
                        v2 ? 'h-10 rounded-lg' : 'h-11 rounded-full shadow-[0_8px_18px_-8px_rgba(47,104,254,0.8)]'
                      }`}
                    >
                      {submitting === 'submit' && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting === 'submit' ? 'Submitting…' : 'Submit Mapping'}
                    </button>
                  </div>
                )}
              </>
            )}
          </BillingSection>

          {!canEdit && (
            <p
              className={`mt-3 flex items-center gap-2 px-3 py-2.5 text-[11.5px] font-medium text-slate-500 ${
                v2 ? 'rounded-lg border border-slate-200 bg-white' : 'rounded-full bg-slate-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              View only — your role can't change billing details.
            </p>
          )}
        </div>
      </div>

      <VerifyPasswordSheet
        isOpen={verify !== null}
        purpose={verify?.purpose ?? ''}
        onClose={() => setVerify(null)}
        onVerified={() => {
          const then = verify?.then;
          setVerify(null);
          reveal();
          if (then && then !== reveal) setTimeout(then, 250);
        }}
      />
      <PaymentMethodSheet
        isOpen={methodTarget !== null}
        target={methodTarget}
        billing={billing}
        country={countryCode}
        onClose={() => setMethodTarget(null)}
        onSave={(m) => {
          setMethodTarget(null);
          if (m.kind === 'card') {
            onChange({ ...billing, cards: [...billing.cards, m.card] });
            setTab('card');
            showNotice('Payment method added successfully.');
          } else {
            onChange({ ...billing, banks: m.isEdit ? billing.banks.map((b) => (b.id === m.bank.id ? m.bank : b)) : [...billing.banks, m.bank] });
            setTab('bank');
            showNotice(m.isEdit ? 'Payment method updated successfully.' : 'Payment method added successfully.');
          }
        }}
      />
      <PaymentMappingSheet
        isOpen={mappingEdit !== null}
        row={mappingEdit?.row ?? null}
        isNew={mappingEdit?.isNew ?? true}
        billing={billing}
        staff={mappingStaff}
        onClose={() => setMappingEdit(null)}
        onSave={saveMapping}
      />
      <ConfirmSheet
        isOpen={deleteTarget !== null}
        title="Delete Payment Method?"
        message={`Are you sure? This will permanently remove ${deleteInfo?.label ?? 'this payment method'}.`}
        note={deleteInfo?.note}
        confirmLabel="Confirm Delete"
        danger
        onConfirm={deleteMethod}
        onClose={() => setDeleteTarget(null)}
      />
      <ConfirmSheet
        isOpen={removeRowId !== null}
        title="Remove this mapping?"
        message={(() => {
          const r = billing.mappings.find((x) => x.id === removeRowId);
          return r
            ? `${r.staffIds.length} staff will no longer be mapped to ${methodLabel(billing, r.type, r.methodId)}. Map them again before you submit.`
            : '';
        })()}
        confirmLabel="Remove"
        danger
        onConfirm={() => {
          setMappings(billing.mappings.filter((x) => x.id !== removeRowId));
          setRemoveRowId(null);
        }}
        onClose={() => setRemoveRowId(null)}
      />
      <ConfirmSheet
        isOpen={disableDirect}
        title="Disable Direct Pay?"
        message="Are you sure you want to disable Direct Pay? You will need to re-enable it or use another method for billing."
        confirmLabel="Yes, Disable"
        danger
        onConfirm={() => {
          setDisableDirect(false);
          onChange({ ...billing, directPayEnabled: false });
          showNotice('Direct Pay disabled.');
        }}
        onClose={() => setDisableDirect(false)}
      />
    </div>
  );
};
