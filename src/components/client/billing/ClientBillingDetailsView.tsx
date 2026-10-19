import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronRight, CreditCard, Eye, EyeOff, Info, Landmark, Loader2, Lock, Pencil, Plus, ReceiptText, Trash2, Zap } from 'lucide-react';
import { SegmentedTabs } from '../../../design-system/components/SegmentedTabs';
import { useClientPermission } from '../context/ClientPermissionContext';
import { Card, ConfirmSheet, Pill } from '../staff/tabs/StaffTabParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { CLIENT_IS_MOS, formatTimesheetDate } from '../data/clientTimesheetsData';
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
import { AddTile, BankAccountCard, BillingSkeleton, CreditCardTile, MethodIcon, StaffChips, StepHeader } from './BillingParts';
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
  /** Hidden without Invoices access */
  onOpenInvoices?: () => void;
}

type PaneTab = 'bank' | 'card' | 'direct';
type DeleteTarget = { kind: 'bank' | 'card'; id: string };
type VerifyThen = { purpose: string; then: () => void };

const LOAD_MS = 700;
const SUBMIT_MS = 900;

const listNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? '');
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/**
 * Invoices › Billing Details — MyCPE ONE "Billing → HRMS (Offshoring)" (data in system C via `HrmsPaymentService`):
 * 1 Payment Information (Bank Details / Credit Card / Direct Pay, portal password to view or edit bank details)
 * 2 Payment Mapping (each staff member → one saved payment method; Save As Draft / Submit Mapping).
 */
export const ClientBillingDetailsView: React.FC<Props> = ({ billing, staff, country, userName, onChange, onOpenInvoices }) => {
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
  const submittedById = new Map(billing.submittedMappings.map((r) => [r.id, r]));
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

  const serviceName = CLIENT_IS_MOS ? 'HRMS 24 x 7 (Offshoring)' : 'HRMS (Offshoring)';
  const statusLine = billing.draftSavedAt
    ? `Draft saved at ${timeOf(billing.draftSavedAt)} · not submitted yet`
    : dirty
      ? 'You have unsaved mapping changes'
      : billing.submittedAt
        ? `Submitted ${formatTimesheetDate(billing.submittedAt.slice(0, 10))}${billing.submittedBy ? ` by ${billing.submittedBy}` : ''}`
        : 'Mapping not submitted yet';

  if (loading)
    return (
      <div className="flex-1 bg-[#F8FAFC] overflow-hidden">
        <BillingSkeleton />
      </div>
    );

  const paneTabs = [
    { id: 'bank' as const, label: 'Bank Details', badge: billing.banks.length },
    { id: 'card' as const, label: 'Credit Card', badge: billing.cards.length },
    ...(billing.directPayEligible ? [{ id: 'direct' as const, label: 'Direct Pay' }] : []),
  ];
  // Shown while something is left to submit (unsaved changes or unmapped staff)
  const showFooter = canEdit && hasPayment && (dirty || unmapped.length > 0);
  const pct = billableIds.length ? Math.round((mappedCount / billableIds.length) * 100) : 0;

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {notice}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Invoices <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Billing Details</span>
          </p>
          <h1 className="mt-0.5 mb-1.5 text-xl font-extrabold leading-tight">Billing Details</h1>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Payment methods for <span className="font-semibold text-slate-700">{serviceName}</span> invoices
          </p>

          {/* Setup overview (Added by designer) */}
          <Card className="mt-3 p-4 relative overflow-hidden !border-0 bg-gradient-to-br from-[#2F68FE] to-[#1E40AF] text-white shadow-[0_8px_24px_rgba(47,104,254,0.28)]">
            <span className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-white/10" aria-hidden="true" />
            <span className="absolute right-10 -bottom-12 w-24 h-24 rounded-full bg-white/5" aria-hidden="true" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-white/70">Staff mapped to a payment method</span>
                <span className="mt-1.5 block text-[30px] leading-none font-extrabold tabular-nums">
                  {mappedCount}
                  <span className="text-[16px] font-bold text-white/60"> / {billableIds.length}</span>
                </span>
              </div>
              <span
                className={`px-2.5 h-6 rounded-full flex items-center text-[10.5px] font-bold shrink-0 ${
                  !hasPayment ? 'bg-rose-500 text-white' : unmapped.length + needsMethod.length ? 'bg-amber-400 text-amber-950' : dirty ? 'bg-white/20 text-white' : 'bg-emerald-400 text-emerald-950'
                }`}
              >
                {!hasPayment
                  ? 'No payment method'
                  : unmapped.length + needsMethod.length
                    ? `${unmapped.length + needsMethod.length} to map`
                    : dirty
                      ? 'Not submitted'
                      : 'All set'}
              </span>
            </div>
            <span className="relative mt-3.5 block h-2 rounded-full bg-white/20 overflow-hidden" aria-hidden="true">
              <span className={`block h-full rounded-full transition-all ${mappedCount < billableIds.length ? 'bg-amber-300' : 'bg-emerald-300'}`} style={{ width: `${pct}%` }} />
            </span>
            <div className="relative mt-3.5 grid grid-cols-3 gap-2">
              {[
                { label: 'Banks', value: billing.banks.length, icon: Landmark },
                { label: 'Cards', value: billing.cards.length, icon: CreditCard },
                { label: 'Direct Pay', value: billing.directPayEnabled ? 'On' : 'Off', icon: Zap },
              ].map((t) => (
                <div key={t.label} className="py-2.5 px-2.5 rounded-xl bg-white/15 flex items-center gap-2">
                  <t.icon className="w-4 h-4 shrink-0 text-white/80" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[14px] leading-none font-extrabold tabular-nums">{t.value}</span>
                    <span className="mt-0.5 block text-[10px] font-semibold text-white/70 truncate">{t.label}</span>
                  </span>
                </div>
              ))}
            </div>
            {unmapped.length > 0 && hasPayment && (
              <div className="mt-3 p-3 rounded-xl bg-[#FEF8E7] border border-[#FDE68A]">
                <p className="flex items-start gap-2 text-[11.5px] text-amber-900 leading-snug">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706]" />
                  <span>
                    <strong>{listNames(unmapped.map((id) => staffById(id)?.name ?? id))}</strong> {unmapped.length === 1 ? "doesn't" : "don't"} have a payment
                    method yet.
                  </span>
                </p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => openNewMapping(unmapped)}
                    className="mt-2.5 w-full h-10 rounded-xl bg-white border border-[#FDE68A] text-[12px] font-bold text-[#B45309] active:bg-amber-50 cursor-pointer"
                  >
                    Map {unmapped.length} staff now
                  </button>
                )}
              </div>
            )}
            {needsMethod.length > 0 && (
              <p className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[11.5px] text-rose-700 leading-snug">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                {needsMethod.length} staff lost their payment method when it was removed. Edit their mapping below to pick another.
              </p>
            )}
            {onOpenInvoices && (
              <button
                type="button"
                onClick={onOpenInvoices}
                className="relative mt-3 pt-3 w-full border-t border-white/20 flex items-center gap-2 text-left text-[11.5px] text-white/80 cursor-pointer"
              >
                <ReceiptText className="w-3.5 h-3.5 text-white/70" />
                <span className="flex-1">See the invoices these methods pay</span>
                <span className="flex items-center gap-0.5 font-bold text-white">
                  Invoices <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>
            )}
          </Card>

          {/* 1 Payment Information */}
          <Card className="mt-3 p-4">
            <StepHeader step={1} title="Payment Information" text="Add and manage payment methods" done={hasPayment} />
            <div className="mt-3.5">
              <SegmentedTabs options={paneTabs} value={tab} onChange={setTab} ariaLabel="Payment method type" />
            </div>

            {tab === 'bank' && (
              <div className="mt-3.5">
                {billing.banks.length > 0 && canView && (
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">{revealed ? 'Full numbers visible · hides in 2 min' : 'Numbers are masked'}</span>
                    <button
                      type="button"
                      onClick={() => (revealed ? hide() : setVerify({ purpose: 'view bank details', then: reveal }))}
                      className="h-8 px-2.5 rounded-lg text-[11.5px] font-bold text-[#2F68FE] flex items-center gap-1.5 active:bg-blue-50 cursor-pointer"
                    >
                      {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {revealed ? 'Hide Details' : 'View Bank Details'}
                    </button>
                  </div>
                )}
                {billing.banks.length > 0 ? (
                  <ul className="space-y-2.5">
                    {billing.banks.map((b) => (
                      <BankAccountCard
                        key={b.id}
                        bank={b}
                        country={countryCode}
                        revealed={revealed}
                        mappedCount={staffOnMethod('bank', b.id)}
                        onEdit={canEdit && canView ? () => withVerify('edit this bank account', () => setMethodTarget({ kind: 'bank', edit: b })) : undefined}
                        onDelete={canDelete ? () => setDeleteTarget({ kind: 'bank', id: b.id }) : undefined}
                      />
                    ))}
                  </ul>
                ) : (
                  !canAdd && <p className="py-6 text-center text-[12px] text-slate-400">No bank accounts added yet.</p>
                )}
                {canAdd && (
                  <div className={billing.banks.length ? 'mt-2.5' : ''}>
                    <AddTile
                      icon={Plus}
                      label="Add Bank"
                      hint={billing.banks.length ? 'Add another account' : 'No bank accounts yet · ACH / bank transfer'}
                      onClick={() => setMethodTarget({ kind: 'bank' })}
                    />
                  </div>
                )}
              </div>
            )}

            {tab === 'card' && (
              <div className="mt-3.5">
                {billing.cards.length > 0 ? (
                  <ul className="space-y-2.5">
                    {billing.cards.map((c) => (
                      <CreditCardTile
                        key={c.id}
                        card={c}
                        mappedCount={staffOnMethod('card', c.id)}
                        onDelete={canDelete ? () => setDeleteTarget({ kind: 'card', id: c.id }) : undefined}
                      />
                    ))}
                  </ul>
                ) : (
                  !canAdd && <p className="py-6 text-center text-[12px] text-slate-400">No cards added yet.</p>
                )}
                {canAdd && (
                  <div className={billing.cards.length ? 'mt-2.5' : ''}>
                    <AddTile
                      icon={Plus}
                      label={billing.cards.length ? 'Add New Card' : 'Add Payment Method'}
                      hint={billing.cards.length ? 'Add another credit card' : 'No cards yet · Visa, Mastercard, Amex…'}
                      onClick={() => setMethodTarget({ kind: 'card' })}
                    />
                  </div>
                )}
              </div>
            )}

            {tab === 'direct' && (
              <div className="mt-3.5 p-4 rounded-2xl border border-[#EBF0F7] bg-slate-50/60 flex flex-col items-center text-center">
                <span
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    billing.directPayEnabled ? 'bg-[#E8F8F0] text-[#10B981]' : 'bg-[#EFF6FF] text-[#2F68FE]'
                  }`}
                >
                  <Zap className="w-6 h-6" />
                </span>
                <p className="mt-3 text-[13px] font-bold text-[#1E293B]">
                  {billing.directPayEnabled ? 'Direct pay is currently enabled for your account' : 'Enable Direct Payment Method'}
                </p>
                <p className="mt-1 text-[11.5px] text-slate-500 leading-snug">
                  {billing.directPayEnabled
                    ? directMapped
                      ? `${directMapped} staff ${directMapped === 1 ? 'is' : 'are'} billed through Direct Pay.`
                      : 'No staff are mapped to Direct Pay yet.'
                    : 'Pay staff invoices without a saved bank account or card.'}
                </p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={toggleDirect}
                    disabled={directBusy}
                    className={`mt-4 h-11 px-5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:cursor-wait ${
                      billing.directPayEnabled
                        ? 'border border-[#FECACA] bg-white text-rose-600 active:bg-[#FEF2F2]'
                        : 'bg-[#2F68FE] text-white active:bg-[#1D4ED8]'
                    }`}
                  >
                    {directBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {billing.directPayEnabled ? 'Disable Direct Pay' : directBusy ? 'Enabling…' : 'Enable & Save Direct Pay'}
                  </button>
                )}
              </div>
            )}
          </Card>

          {/* 2 Payment Mapping */}
          <section ref={mappingRef} aria-label="Payment Mapping" className="mt-3 scroll-mt-3">
            <Card className="p-4">
              <StepHeader
                step={2}
                title="Payment Mapping"
                text="Assign saved payment methods to staff"
                done={hasPayment && !unmapped.length && !dirty}
                aside={
                  <button
                    type="button"
                    onClick={() => setShowHelp((v) => !v)}
                    aria-expanded={showHelp}
                    aria-label="How payment mapping works"
                    className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                }
              />
              {showHelp && (
                <p className="mt-3 px-3 py-2.5 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] text-[11px] leading-relaxed text-[#3730A3]">
                  If you have several timesheets and want different payment methods for them, add more payment methods in step 1 and map specific staff
                  to each one here. Group several staff per method.
                </p>
              )}

              {!hasPayment ? (
                <div className="mt-3.5 py-6 px-4 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
                  <span className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </span>
                  <p className="mt-2.5 text-[12.5px] font-bold text-[#1E293B]">Add at least one payment method to unlock mapping</p>
                  {canAdd && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('bank');
                        setMethodTarget({ kind: 'bank' });
                      }}
                      className="mt-3 h-10 px-4 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer"
                    >
                      Add Bank Account
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="mt-3.5 px-3 py-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-bold tracking-wide text-slate-400">STATUS OVERVIEW</span>
                    <span className="text-[12px] font-extrabold tabular-nums">
                      {mappedCount} / {billableIds.length} Staff Mapped
                    </span>
                  </div>
                  {!showFooter && <p className="mt-1.5 px-1 text-[10.5px] text-slate-400">{statusLine}</p>}

                  <ul className="mt-3 space-y-2.5">
                    {rows.map((r) => {
                      const complete = isMappingComplete(billing, r);
                      const saved = submittedById.get(r.id);
                      const changed = !saved || !mappingsEqual([r], [saved]);
                      return (
                        <li
                          key={r.id}
                          className={`rounded-2xl border border-l-4 p-3.5 shadow-2xs ${
                            !complete
                              ? 'border-[#FECACA] border-l-rose-400 bg-[#FFFBFB]'
                              : r.type === 'direct'
                                ? 'border-[#EBF0F7] border-l-[#10B981] bg-white'
                                : r.type === 'bank'
                                  ? 'border-[#EBF0F7] border-l-[#2F68FE] bg-white'
                                  : 'border-[#EBF0F7] border-l-[#4F46E5] bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <MethodIcon type={r.type} className="w-10 h-10" />
                            <span className="flex-1 min-w-0">
                              <span className="block text-[13px] font-bold truncate">
                                {complete ? methodLabel(billing, r.type, r.methodId) : `${PAYMENT_TYPE_LABEL[r.type]} · choose a method`}
                              </span>
                              <span className="block text-[11px] text-slate-500">
                                {PAYMENT_TYPE_LABEL[r.type]} · {r.staffIds.length} staff
                              </span>
                            </span>
                            {changed && <Pill tone="indigo">{saved ? 'Edited' : 'New'}</Pill>}
                          </div>
                          {!complete && (
                            <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              {r.type === 'direct' ? 'Direct Pay is disabled — pick another method.' : 'Its payment method was removed — pick another.'}
                            </p>
                          )}
                          <div className="mt-3">
                            <StaffChips names={chipsFor(r.staffIds)} />
                          </div>
                          {canEdit && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setRemoveRowId(r.id)}
                                className="h-8 px-2.5 rounded-lg text-[11.5px] font-bold text-rose-500 flex items-center gap-1.5 active:bg-[#FEF2F2] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => setMappingEdit({ row: r, isNew: false })}
                                className="h-8 px-2.5 rounded-lg text-[11.5px] font-bold text-[#2F68FE] flex items-center gap-1.5 active:bg-blue-50 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}

                    {unmapped.length > 0 && (
                      <li className="rounded-2xl border border-dashed border-[#FDE68A] bg-[#FFFCF2] p-3.5">
                        <p className="text-[12px] font-bold text-amber-900">Not mapped yet · {unmapped.length} staff</p>
                        <div className="mt-2.5">
                          <StaffChips names={chipsFor(unmapped)} tone="amber" />
                        </div>
                      </li>
                    )}
                  </ul>

                  {rows.length === 0 && !unmapped.length && (
                    <p className="mt-3 text-center text-[12px] text-slate-400">No staff to map yet.</p>
                  )}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => openNewMapping()}
                      disabled={!unmapped.length}
                      className="mt-3 w-full h-11 rounded-xl border-2 border-dashed border-[#BFDBFE] text-[12px] font-bold text-[#2F68FE] flex items-center justify-center gap-1.5 active:bg-[#EFF6FF] cursor-pointer disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      {unmapped.length ? <Plus className="w-4 h-4" /> : null}
                      {unmapped.length ? 'Add Payment Mapping' : 'All staff have mapped payment details.'}
                    </button>
                  )}
                </>
              )}
            </Card>
          </section>

          {!canEdit && (
            <p className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 text-[11.5px] font-medium text-slate-500">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              View only — your role can't change billing details.
            </p>
          )}
        </div>
      </div>

      {showFooter && (
        <div className="px-4 pt-2.5 pb-4 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
          <p className="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500" aria-live="polite">
            <span className={`w-1.5 h-1.5 rounded-full ${dirty ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}`} aria-hidden="true" />
            {statusLine}
          </p>
          <div className="grid grid-cols-[2fr_3fr] gap-3">
            <button
              type="button"
              onClick={() => submitMapping(true)}
              disabled={!dirty || Boolean(submitting) || Boolean(billing.draftSavedAt)}
              className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white flex items-center justify-center gap-2 active:bg-blue-50 cursor-pointer disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {submitting === 'draft' && <Loader2 className="w-4 h-4 animate-spin" />}
              Save As Draft
            </button>
            <button
              type="button"
              onClick={() => submitMapping(false)}
              disabled={Boolean(submitting)}
              className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer disabled:opacity-80 disabled:cursor-wait"
            >
              {submitting === 'submit' && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting === 'submit' ? 'Submitting…' : 'Submit Mapping'}
            </button>
          </div>
        </div>
      )}

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
