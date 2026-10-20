import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Info, Loader2, Lock, Pencil, Plus, Save, Trash2, Zap } from 'lucide-react';
import { SegmentedTabs } from '../../../design-system/components/SegmentedTabs';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, Card, ConfirmSheet } from '../staff/tabs/StaffTabParts';
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
import { AddTile, BankAccountCard, BillingSkeleton, CreditCardTile, StaffChips, StepHeader } from './BillingParts';
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
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

type PaneTab = 'bank' | 'card' | 'direct';
type DeleteTarget = { kind: 'bank' | 'card'; id: string };
type VerifyThen = { purpose: string; then: () => void };

const LOAD_MS = 700;
const SUBMIT_MS = 900;

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
        <BillingSkeleton />
      </div>
    );

  // Desktop shows the Direct Pay tab only for eligible accounts
  const paneTabs = [
    { id: 'bank' as const, label: 'Bank Details' },
    { id: 'card' as const, label: 'Credit Card' },
    ...(billing.directPayEligible ? [{ id: 'direct' as const, label: 'Direct Pay' }] : []),
  ];
  const countPill = (n: number, one: string, many: string) => (
    <span className="h-6 px-2.5 rounded-full bg-[#EFF6FF] text-[10.5px] font-bold text-[#2F68FE] flex items-center whitespace-nowrap">
      {n} {n === 1 ? one : many}
    </span>
  );

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Billing Details" onBack={onBack} />
      {notice}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          {/* 1 Payment Information */}
          <Card className="p-4">
            <StepHeader
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
            <div className="mt-3.5">
              <SegmentedTabs options={paneTabs} value={tab} onChange={setTab} ariaLabel="Payment method type" />
            </div>

            {tab === 'bank' && (
              <div className="mt-3.5">
                {billing.banks.length > 0 && canView && (
                  <div className="mb-2.5 flex justify-end">
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
                {canAdd && (
                  <div className={billing.banks.length ? 'mb-2.5' : ''}>
                    <AddTile label="Add Bank" onClick={() => setMethodTarget({ kind: 'bank' })} />
                  </div>
                )}
                {billing.banks.length > 0 ? (
                  <ul className="space-y-2.5">
                    {billing.banks.map((b) => (
                      <BankAccountCard
                        key={b.id}
                        bank={b}
                        revealed={revealed}
                        onEdit={canEdit && canView ? () => withVerify('edit this bank account', () => setMethodTarget({ kind: 'bank', edit: b })) : undefined}
                        onDelete={canDelete ? () => setDeleteTarget({ kind: 'bank', id: b.id }) : undefined}
                      />
                    ))}
                  </ul>
                ) : (
                  !canAdd && <p className="py-6 text-center text-[12px] text-slate-400">No Data Found</p>
                )}
              </div>
            )}

            {tab === 'card' && (
              <div className="mt-3.5">
                {canAdd && (
                  <div className={billing.cards.length ? 'mb-2.5' : ''}>
                    <AddTile label={billing.cards.length ? 'Add New Card' : 'Add Payment Method'} onClick={() => setMethodTarget({ kind: 'card' })} />
                  </div>
                )}
                {billing.cards.length > 0 ? (
                  <ul className="space-y-2.5">
                    {billing.cards.map((c) => (
                      <CreditCardTile key={c.id} card={c} onDelete={canDelete ? () => setDeleteTarget({ kind: 'card', id: c.id }) : undefined} />
                    ))}
                  </ul>
                ) : (
                  !canAdd && <p className="py-6 text-center text-[12px] text-slate-400">No Data Found</p>
                )}
              </div>
            )}

            {tab === 'direct' && (
              <div className="mt-3.5 p-5 rounded-2xl border border-[#DCE3ED] bg-slate-50/60 flex flex-col items-center text-center">
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
                    {directBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : !billing.directPayEnabled && <Zap className="w-4 h-4" />}
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
                text="Assign Saved payment methods to Staff"
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
                  If you have multiple timesheets and want to setup different payment methods for your timesheets then in step 1 you can add multiple
                  payment methods and map specific timesheets to them below. Group multiple staff timesheet numbers per method.
                </p>
              )}

              {!hasPayment ? (
                <div className="mt-3.5 py-6 px-4 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
                  <span className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </span>
                  <p className="mt-2.5 text-[12.5px] font-bold text-[#1E293B]">Add at least one payment method to unlock mapping</p>
                </div>
              ) : (
                <>
                  {rows.length > 0 ? (
                    <ul className="mt-3.5 space-y-2.5">
                      {rows.map((r) => {
                        const complete = isMappingComplete(billing, r);
                        return (
                          <li key={r.id} className={`rounded-2xl border p-3.5 ${complete ? 'border-[#DCE3ED] bg-white' : 'border-[#FECACA] bg-[#FFFBFB]'}`}>
                            <span className="block text-[11.5px] font-medium text-slate-500">Select Staff(s)</span>
                            <div className="mt-1.5">
                              <StaffChips names={chipsFor(r.staffIds)} />
                            </div>
                            <dl className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-3">
                              <div className="min-w-0">
                                <dt className="text-[11.5px] font-medium text-slate-500">Payment Type</dt>
                                <dd className="mt-0.5 text-[12.5px] font-bold text-[#1E293B]">{PAYMENT_TYPE_LABEL[r.type]}</dd>
                              </div>
                              <div className="min-w-0">
                                <dt className="text-[11.5px] font-medium text-slate-500">Payment Method</dt>
                                <dd className={`mt-0.5 text-[12.5px] font-bold break-words ${complete ? 'text-[#1E293B]' : 'text-rose-600'}`}>
                                  {complete ? methodLabel(billing, r.type, r.methodId) : r.type === 'direct' ? '-' : 'Please Select'}
                                </dd>
                              </div>
                            </dl>
                            {!complete && (
                              <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                {r.type === 'direct' ? 'Direct Pay is disabled — pick another method.' : 'Its payment method was removed — pick another.'}
                              </p>
                            )}
                            {canEdit && (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                                <span className="text-[11.5px] font-medium text-slate-500">Action</span>
                                <span className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setMappingEdit({ row: r, isNew: false })}
                                    className="h-8 px-2.5 rounded-lg text-[11.5px] font-bold text-[#2F68FE] flex items-center gap-1.5 active:bg-blue-50 cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRemoveRowId(r.id)}
                                    className="h-8 px-2.5 rounded-lg text-[11.5px] font-bold text-rose-500 flex items-center gap-1.5 active:bg-[#FEF2F2] cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Remove
                                  </button>
                                </span>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-3.5 py-6 text-center text-[12px] text-slate-400">No Data Found</p>
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

                  <div className="mt-3 px-3 py-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-bold tracking-wide text-slate-400">STATUS OVERVIEW</span>
                    <span className="text-[12px] font-extrabold tabular-nums">
                      {mappedCount} / {billableIds.length} Staff Mapped
                    </span>
                  </div>

                  {canEdit && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => submitMapping(true)}
                        disabled={!dirty || Boolean(submitting) || Boolean(billing.draftSavedAt)}
                        className="h-11 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white flex items-center justify-center gap-2 active:bg-blue-50 cursor-pointer disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        {submitting === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save As Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => submitMapping(false)}
                        disabled={Boolean(submitting)}
                        className="h-11 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer disabled:opacity-80 disabled:cursor-wait"
                      >
                        {submitting === 'submit' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {submitting === 'submit' ? 'Submitting…' : 'Submit Mapping'}
                      </button>
                    </div>
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
