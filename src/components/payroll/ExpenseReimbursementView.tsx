import React, { useRef, useState } from 'react';
import { Wand2, ArrowLeft, ArrowRight, Check, Inbox, BarChart2, ChevronRight, MessageSquareQuote, Plus, Trash2, Upload, X, FileText, CalendarDays, ChevronDown, ClipboardList, ShieldCheck, Wallet, Eye, Pencil } from 'lucide-react';
import { DatePickerSheet } from '../common/DatePickerSheet';
import { BottomSheet } from '../common/BottomSheet';
import { FilterSelection, TeamFilterBar, TeamFilterSheet, matchesFilters } from '../common/TeamFilterSheet';
import { SegmentedTabs } from '../../design-system/components/SegmentedTabs';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import { toDateKey } from '../../design-system/components/RangeCalendar';
import { Dropdown } from '../../design-system/components/Dropdown';
import {
  EXPENSE_BRANCHES,
  EXPENSE_CATEGORIES,
  EXPENSE_KIND_LABEL,
  expenseStatusLabel,
  ExpenseDecision,
  ExpenseItem,
  ExpenseRequest,
  ExpenseRequestKind,
  emptyExpenseItem,
  formatRupees,
} from '../../data/reimbursementData';
import { AttachmentInput, AttachmentInputHandle } from '../common/AttachmentInput';

/* ------------------------------ Illustrations ------------------------------ */

const MoneyBagArt: React.FC<{ className?: string }> = ({ className = 'w-36 h-auto' }) => (
  <svg viewBox="0 0 160 130" className={className} aria-hidden="true">
    <ellipse cx="85" cy="68" rx="58" ry="54" fill="#FFFFFF" opacity="0.7" />
    <circle cx="30" cy="30" r="3.5" fill="#F59E0B" />
    <circle cx="140" cy="28" r="3" fill="#3B82F6" />
    {/* Coins */}
    <ellipse cx="45" cy="92" rx="17" ry="7" fill="#F59E0B" />
    <ellipse cx="45" cy="88" rx="17" ry="7" fill="#FBBF24" />
    <ellipse cx="50" cy="62" rx="16" ry="6.5" fill="#F59E0B" />
    <rect x="34" y="52" width="32" height="10" fill="#FBBF24" />
    <ellipse cx="50" cy="52" rx="16" ry="6.5" fill="#FCD34D" />
    {/* Bag */}
    <path d="M78 42c-18 8-30 26-30 44 0 18 16 28 38 28s38-10 38-28c0-18-12-36-30-44Z" fill="#F4A261" />
    <path d="M78 42c-5-6-12-10-8-16 4-5 10 2 16 2s12-7 16-2c4 6-3 10-8 16Z" fill="#E76F51" />
    <rect x="76" y="40" width="20" height="5" rx="2.5" fill="#B45309" />
    <text x="86" y="90" textAnchor="middle" fontSize="26" fontWeight="800" fill="#7C2D12">₹</text>
  </svg>
);

const ReceiptArt: React.FC<{ className?: string }> = ({ className = 'w-36 h-auto' }) => (
  <svg viewBox="0 0 160 130" className={className} aria-hidden="true">
    <ellipse cx="82" cy="68" rx="58" ry="54" fill="#FFFFFF" opacity="0.7" />
    <circle cx="140" cy="26" r="3" fill="#2DD4BF" />
    <circle cx="24" cy="70" r="3" fill="#F59E0B" />
    {/* Back sheet */}
    <rect x="80" y="34" width="44" height="64" rx="4" transform="rotate(8 102 66)" fill="#FCD34D" />
    {[46, 54, 62, 70, 78].map((y) => (
      <rect key={y} x="90" y={y} width="26" height="3" rx="1.5" transform="rotate(8 102 66)" fill="#F59E0B" opacity="0.7" />
    ))}
    {/* Front sheet */}
    <rect x="44" y="24" width="54" height="78" rx="5" fill="#EEF2FF" stroke="#C7D2FE" />
    <rect x="52" y="34" width="10" height="9" rx="2" fill="#2DD4BF" />
    {[36, 48, 56, 64, 72, 80, 88].map((y) => (
      <rect key={y} x={y === 36 ? 66 : 52} y={y} width={y === 36 ? 24 : 38} height="3" rx="1.5" fill="#93C5FD" />
    ))}
    {/* Rupee coin */}
    <circle cx="48" cy="74" r="15" fill="#F59E0B" />
    <circle cx="48" cy="74" r="11" fill="#FBBF24" />
    <text x="48" y="80" textAnchor="middle" fontSize="16" fontWeight="800" fill="#FFFFFF">₹</text>
  </svg>
);

/* --------------------------------- Header --------------------------------- */

const Header: React.FC<{ title: string; onBack: () => void; onQuickFill?: () => void }> = ({ title, onBack, onQuickFill }) => (
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
      <h1 className={`text-base font-bold screen-title ${onQuickFill ? 'screen-title-tight' : ''}`}>{title}</h1>
      {onQuickFill && (
        <button
          type="button"
          onClick={onQuickFill}
          className="ml-auto h-8 px-2.5 rounded-full bg-indigo-50 text-[#4F46E5] text-[11px] font-semibold flex items-center gap-1 active:bg-indigo-100 cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Quick Fill
        </button>
      )}
    </div>
  </header>
);

/* ------------------------------ One expense row ------------------------------ */

type ItemErrors = Partial<Record<'category' | 'expenseDate' | 'branch' | 'quantity' | 'amount' | 'receiptName', string>>;
type FormMode = 'advance' | 'reimbursement';

const formatExpenseDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const ExpenseItemCard: React.FC<{
  index: number;
  item: ExpenseItem;
  /** Reimbursement claims also ask when the expense happened */
  withDate: boolean;
  errors: ItemErrors;
  canRemove: boolean;
  onChange: (patch: Partial<ExpenseItem>) => void;
  onRemove: () => void;
}> = ({ index, item, withDate, errors, canRemove, onChange, onRemove }) => {
  const fileRef = useRef<AttachmentInputHandle>(null);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const label = (text: string, required = false) => (
    <span className="block text-[11px] font-semibold text-slate-600 mb-1">
      {text}
      {required && <span className="text-rose-500">*</span>}
    </span>
  );
  const err = (m?: string) => (m ? <p className="mt-1 px-0.5 text-[11px] font-medium text-rose-500">{m}</p> : null);
  const inputCls = (bad?: string) =>
    `w-full h-11 px-3.5 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text ${
      bad ? 'border-rose-300' : 'border-slate-200'
    }`;

  return (
    <section className="bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#1E293B]">Expense {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="h-8 px-2.5 -mr-1 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold text-rose-500 active:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        )}
      </div>

      {/* Category + Branch side by side */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="min-w-0">
          {label('Category', true)}
          <Dropdown
            size="md"
            ariaLabel="Category of expenses"
            sheetTitle="Category of Expenses"
            value={item.category}
            placeholder="Select"
            options={EXPENSE_CATEGORIES}
            onChange={(v) => onChange({ category: v })}
          />
          {err(errors.category)}
        </div>
        <div className="min-w-0">
          {label('Branch', true)}
          <Dropdown
            size="md"
            ariaLabel="For branch"
            sheetTitle="For Branch"
            value={item.branch}
            placeholder="Select"
            options={EXPENSE_BRANCHES}
            onChange={(v) => onChange({ branch: v })}
          />
          {err(errors.branch)}
        </div>
      </div>

      {withDate && (
        <div>
          {label('Expense Date', true)}
          <button
            type="button"
            onClick={() => setIsDateOpen(true)}
            className={`w-full h-11 px-3.5 bg-white border rounded-xl flex items-center gap-2.5 text-xs shadow-2xs cursor-pointer ${
              errors.expenseDate ? 'border-rose-300' : 'border-slate-200'
            }`}
          >
            <CalendarDays className={`w-4 h-4 shrink-0 ${item.expenseDate ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
            <span className={`flex-1 text-left ${item.expenseDate ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-400'}`}>
              {item.expenseDate ? formatExpenseDate(item.expenseDate) : 'Select Date'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
          {err(errors.expenseDate)}
          <DatePickerSheet
            isOpen={isDateOpen}
            mode="single"
            title="Expense Date"
            start={item.expenseDate}
            maxDate={toDateKey(new Date())}
            onClose={() => setIsDateOpen(false)}
            onApply={(d) => {
              onChange({ expenseDate: d });
              setIsDateOpen(false);
            }}
          />
        </div>
      )}

      <div>
        {label('Description')}
        <textarea
          rows={2}
          value={item.description}
          maxLength={300}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Write"
          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 resize-none focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          {label('Quantity', true)}
          <input
            type="text"
            inputMode="numeric"
            value={item.quantity}
            onChange={(e) => onChange({ quantity: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            placeholder="Write"
            className={inputCls(errors.quantity)}
          />
          {err(errors.quantity)}
        </div>
        <div>
          {label('Amount (₹)', true)}
          <input
            type="text"
            inputMode="decimal"
            value={item.amount}
            onChange={(e) => {
              // digits with up to 2 decimals
              const v = e.target.value.replace(/[^\d.]/g, '').replace(/^(\d*\.?\d{0,2}).*$/, '$1');
              onChange({ amount: v });
            }}
            placeholder="Write"
            className={inputCls(errors.amount)}
          />
          {err(errors.amount)}
        </div>
      </div>

      <div>
        {label('Receipt', withDate)}
        {item.receiptName ? (
          <div className="flex items-center gap-2.5 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50">
            <FileText className="w-4 h-4 text-[#2F68FE] shrink-0" />
            <span className="flex-1 min-w-0 text-xs font-semibold text-[#1E293B] truncate">{item.receiptName}</span>
            <button
              type="button"
              onClick={() => onChange({ receiptName: null })}
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-200 cursor-pointer"
              aria-label="Remove receipt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`w-full h-11 px-3.5 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs font-semibold text-[#2F68FE] active:bg-blue-50 cursor-pointer ${
              errors.receiptName ? 'border-rose-300 bg-rose-50/40' : 'border-blue-200 bg-blue-50/30'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload receipt
          </button>
        )}
        <AttachmentInput
          title="Upload Receipt"
          ref={fileRef}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange({ receiptName: file.name });
            e.target.value = '';
          }}
        />
        {err(errors.receiptName)}
      </div>
    </section>
  );
};

/* ------------------------------ Advance form ------------------------------ */

const ExpenseForm: React.FC<{
  mode: FormMode;
  /** Pre-filled items (editing a pending request) */
  initialItems?: ExpenseItem[];
  /** Overrides the header title (e.g. "Edit Request") */
  title?: string;
  /** Shown under the header, e.g. which advance these expenses settle */
  note?: string;
  onBack: () => void;
  onSubmit: (items: ExpenseItem[], total: number) => void;
}> = ({ mode, initialItems, title, note, onBack, onSubmit }) => {
  const isClaim = mode === 'reimbursement';
  const [items, setItems] = useState<ExpenseItem[]>(() =>
    initialItems?.length ? initialItems.map((it) => ({ ...it })) : [emptyExpenseItem()]
  );
  const [errors, setErrors] = useState<Record<string, ItemErrors>>({});
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const total = items.reduce((n, it) => n + (parseFloat(it.amount) || 0), 0);

  // Demo data: realistic items (claims get past dates)
  const quickFill = () => {
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return toDateKey(d);
    };
    const sample: Omit<ExpenseItem, 'id'>[] = isClaim
      ? [
          { category: 'Cab', expenseDate: daysAgo(3), branch: 'Ahmedabad', description: 'Cab to client office and back for the quarterly review meeting.', quantity: '2', amount: '640', receiptName: 'uber-receipt.pdf' },
          { category: 'Food', expenseDate: daysAgo(3), branch: 'Ahmedabad', description: 'Working lunch with the client team.', quantity: '1', amount: '1250', receiptName: 'lunch-bill.jpg' },
        ]
      : [
          { category: 'Travel Tickets', expenseDate: null, branch: 'Bangalore', description: 'Flight tickets for the onboarding training at the Bangalore office.', quantity: '1', amount: '8500', receiptName: null },
          { category: 'Hotel', expenseDate: null, branch: 'Bangalore', description: 'Hotel stay for 2 nights during the training.', quantity: '2', amount: '6000', receiptName: null },
        ];
    setItems(sample.map((x) => ({ ...emptyExpenseItem(), ...x })));
    setErrors({});
  };

  const update = (id: string, patch: Partial<ExpenseItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    // clear the matching error as soon as it's fixed
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev[id] };
      (Object.keys(patch) as (keyof ItemErrors)[]).forEach((k) => delete next[k]);
      return { ...prev, [id]: next };
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyExpenseItem()]);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }));
  };

  const submit = () => {
    const found: Record<string, ItemErrors> = {};
    items.forEach((it) => {
      const e: ItemErrors = {};
      if (!it.category) e.category = 'Select a category.';
      if (isClaim && !it.expenseDate) e.expenseDate = 'Select the expense date.';
      if (!it.branch) e.branch = 'Select a branch.';
      if (!it.quantity || Number(it.quantity) < 1) e.quantity = 'Enter the quantity.';
      if (!(parseFloat(it.amount) > 0)) e.amount = 'Enter the amount.';
      // Receipts are mandatory for reimbursement claims (optional for advances)
      if (isClaim && !it.receiptName) e.receiptName = 'Upload the receipt.';
      if (Object.keys(e).length) found[it.id] = e;
    });
    setErrors(found);
    if (Object.keys(found).length) {
      // bring the first incomplete item into view
      requestAnimationFrame(() =>
        scrollRef.current?.querySelector('p.text-rose-500')?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      );
      return;
    }
    setSubmitting(true);
    setTimeout(() => onSubmit(items, total), 500);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <Header title={title ?? (isClaim ? 'Add Expenses' : 'Request Advance')} onBack={onBack} onQuickFill={quickFill} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {note && (
          <p className="px-3.5 py-2.5 rounded-xl bg-orange-50 border border-orange-100 text-[11.5px] text-orange-800 leading-relaxed">{note}</p>
        )}
        {items.map((it, idx) => (
          <ExpenseItemCard
            key={it.id}
            index={idx}
            item={it}
            withDate={isClaim}
            errors={errors[it.id] ?? {}}
            canRemove={items.length > 1}
            onChange={(patch) => update(it.id, patch)}
            onRemove={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
          />
        ))}

        <button
          type="button"
          onClick={addItem}
          className="w-full h-11 rounded-xl border border-dashed border-[#2F68FE]/40 bg-white flex items-center justify-center gap-1.5 text-xs font-bold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add More
        </button>
      </div>

      {/* Total + actions */}
      <div className="shrink-0 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-4 pt-3 pb-5 space-y-3">
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#EEF2FF]">
          <span className="text-xs font-bold text-[#1E293B]">{isClaim ? 'Total Reimbursement Amount' : 'Requesting Advance Amount'}</span>
          <span className="text-sm font-extrabold text-[#2F68FE] tabular-nums">{formatRupees(total)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------ Request card + sheets ------------------------------ */

const STATUS_CHIP: Record<ExpenseRequest['status'], string> = {
  Pending: 'bg-[#FEF8E7] text-[#D97706]',
  Approved: 'bg-[#E8F8F0] text-[#059669]',
  Rejected: 'bg-[#FEF2F2] text-[#DC2626]',
};
const submittedOn = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

/** One submitted request (mirrors a row of the web table) */
const RequestCard: React.FC<{
  request: ExpenseRequest;
  /** Manager view: show who raised it */
  showStaff?: boolean;
  /** e.g. "Against AH/14102026/1" for claims that settle an advance */
  linkedNote?: string;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddExpenses?: () => void;
  onDecide?: (decision: ExpenseDecision) => void;
}> = ({ request: r, showStaff, linkedNote, onView, onEdit, onDelete, onAddExpenses, onDecide }) => {
  const categories = Array.from(new Set(r.items.map((it) => it.category).filter(Boolean))).join(', ');
  const isPending = r.status === 'Pending';
  const actions: { label: string; icon: React.ElementType; onClick: () => void; tone?: string }[] = [
    { label: 'View', icon: Eye, onClick: onView },
    ...(isPending && onEdit ? [{ label: 'Edit', icon: Pencil, onClick: onEdit }] : []),
    ...(r.kind === 'advance' && r.status === 'Approved' && onAddExpenses ? [{ label: 'Add Expenses', icon: Plus, onClick: onAddExpenses }] : []),
    ...(isPending && onDelete ? [{ label: 'Delete', icon: Trash2, onClick: onDelete, tone: 'text-rose-500 active:bg-rose-50' }] : []),
  ];

  return (
    <article className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
      <div className="p-3.5 space-y-2.5">
        {showStaff && (
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarTint(
                Number(r.staffCode.replace(/\D/g, '')) || 0
              )}`}
            >
              {initialsOf(r.staffName)}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-[#1E293B] truncate">{r.staffName}</span>
              <span className="block text-[10.5px] text-slate-400">{r.staffCode}</span>
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#1E293B] tabular-nums">{r.trackingNo}</p>
            <p className="mt-0.5 text-[11.5px] text-slate-500 truncate">{categories}</p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold shrink-0 ${STATUS_CHIP[r.status]}`}>{expenseStatusLabel(r)}</span>
        </div>

        {linkedNote && <p className="text-[10.5px] font-semibold text-orange-700">{linkedNote}</p>}

        <div className="grid grid-cols-3 rounded-xl border border-slate-100 divide-x divide-slate-100 text-center">
          {[
            { label: 'Amount', value: formatRupees(r.total) },
            { label: 'Approved', value: r.approvedAmount !== undefined ? formatRupees(r.approvedAmount) : '—' },
            { label: 'Paid On', value: r.paidOn ?? submittedOn(r.submittedAt) },
          ].map(({ label, value }) => (
            <div key={label} className="py-2 px-1 min-w-0">
              <span className="block text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
              <span className="block mt-0.5 text-[11.5px] font-bold text-[#1E293B] tabular-nums truncate">{value}</span>
            </div>
          ))}
        </div>

        {r.status !== 'Pending' && r.reviewedBy && (
          <p
            className={`flex items-start gap-2 px-3 py-2 rounded-xl text-[11px] ${
              r.status === 'Approved' ? 'bg-[#E8F8F0]/70 text-emerald-800' : 'bg-[#FEF2F2] text-rose-700'
            }`}
          >
            <MessageSquareQuote className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>
              <span className="font-bold">
                {r.status} by {r.reviewedBy}
                {r.reviewedAt ? ` · ${r.reviewedAt}` : ''}
              </span>
              {r.managerComment && <span className="block mt-0.5 opacity-90">“{r.managerComment}”</span>}
            </span>
          </p>
        )}
      </div>

      {/* Staff actions */}
      {!onDecide && (
        <div className="flex items-center border-t border-slate-100 divide-x divide-slate-100">
          {actions.map(({ label, icon: Icon, onClick, tone }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className={`flex-1 h-10 flex items-center justify-center gap-1.5 text-[11px] font-semibold cursor-pointer ${
                tone ?? 'text-[#2F68FE] active:bg-blue-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Manager actions */}
      {onDecide && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onView}
            className="h-9 px-3 rounded-xl text-[11px] font-semibold text-[#2F68FE] flex items-center gap-1.5 active:bg-blue-50 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          {isPending && (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDecide('Rejected')}
                className="h-9 px-3.5 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-bold flex items-center gap-1 active:bg-rose-50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Decline
              </button>
              <button
                type="button"
                onClick={() => onDecide('Approved')}
                className="h-9 px-3.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 active:bg-emerald-700 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Approve
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

const SheetTop: React.FC<{ title: string; subtitle?: string; onClose: () => void }> = ({ title, subtitle, onClose }) => (
  <>
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-[#1E293B] truncate">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </>
);

/** Item-by-item breakdown */
const RequestDetailSheet: React.FC<{ request: ExpenseRequest | null; onClose: () => void }> = ({ request: r, onClose }) => (
  <BottomSheet isOpen={Boolean(r)} onClose={onClose} maxHeight="max-h-[88%]">
    {r && (
      <>
        <SheetTop title={r.trackingNo} subtitle={`${EXPENSE_KIND_LABEL[r.kind]} · ${r.staffName} · ${submittedOn(r.submittedAt)}`} onClose={onClose} />
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-2.5">
          {r.items.map((it, i) => (
            <div key={it.id + i} className="rounded-2xl border border-[#EBF0F7] p-3.5 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#1E293B]">{it.category}</p>
                  <p className="text-[11px] text-slate-500">
                    {it.branch}
                    {it.expenseDate ? ` · ${formatExpenseDate(it.expenseDate)}` : ''} · Qty {it.quantity}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-[#1E293B] tabular-nums shrink-0">{formatRupees(parseFloat(it.amount) || 0)}</span>
              </div>
              {it.description && <p className="text-[11.5px] text-slate-600 leading-relaxed">{it.description}</p>}
              {it.receiptName && (
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2F68FE]">
                  <FileText className="w-3.5 h-3.5" />
                  {it.receiptName}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="shrink-0 px-5 pt-3 pb-6 border-t border-slate-100">
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#EEF2FF]">
            <span className="text-xs font-bold text-[#1E293B]">Total</span>
            <span className="text-sm font-extrabold text-[#2F68FE] tabular-nums">{formatRupees(r.total)}</span>
          </div>
        </div>
      </>
    )}
  </BottomSheet>
);

/** Approve / Decline confirmation (a comment is required to decline) */
const ReviewSheet: React.FC<{
  request: ExpenseRequest | null;
  decision: ExpenseDecision | null;
  onClose: () => void;
  onConfirm: (comment: string) => void;
}> = ({ request: r, decision, onClose, onConfirm }) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const isDecline = decision === 'Rejected';
  React.useEffect(() => {
    if (r) {
      setComment('');
      setError('');
    }
  }, [r]);
  return (
    <BottomSheet isOpen={Boolean(r && decision)} onClose={onClose} maxHeight="max-h-[80%]">
      {r && decision && (
        <>
          <SheetTop
            title={isDecline ? 'Decline request?' : 'Approve request?'}
            subtitle={`${r.trackingNo} · ${r.staffName} · ${formatRupees(r.total)}`}
            onClose={onClose}
          />
          <div className="px-5 py-4 space-y-1.5">
            <label className="block text-xs font-bold text-[#1E293B]">
              {isDecline ? 'Reason for declining' : 'Note (optional)'}
              {isDecline && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={comment}
              maxLength={300}
              onChange={(e) => {
                setComment(e.target.value);
                setError('');
              }}
              placeholder={isDecline ? 'Let them know why…' : 'Add a note for them…'}
              className={`w-full p-3 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 resize-none focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text ${
                error ? 'border-rose-300' : 'border-slate-200'
              }`}
            />
            {error && <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 pt-1 pb-6 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (isDecline && !comment.trim()) return setError('Add a reason so they know what to fix.');
                onConfirm(comment.trim());
              }}
              className={`h-12 rounded-xl text-white text-xs font-bold cursor-pointer ${
                isDecline ? 'bg-rose-600 active:bg-rose-700' : 'bg-emerald-600 active:bg-emerald-700'
              }`}
            >
              {isDecline ? 'Decline' : 'Approve'}
            </button>
          </div>
        </>
      )}
    </BottomSheet>
  );
};

/** Delete a pending request */
const DeleteSheet: React.FC<{ request: ExpenseRequest | null; onClose: () => void; onConfirm: () => void }> = ({
  request: r,
  onClose,
  onConfirm,
}) => (
  <BottomSheet isOpen={Boolean(r)} onClose={onClose} maxHeight="max-h-[60%]">
    {r && (
      <>
        <SheetTop title="Delete request?" subtitle={`${r.trackingNo} · ${formatRupees(r.total)}`} onClose={onClose} />
        <p className="px-5 py-4 text-xs text-slate-600 leading-relaxed">
          This removes the request and your manager won't see it any more. This can't be undone.
        </p>
        <div className="grid grid-cols-2 gap-3 p-4 pt-1 pb-6 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-12 rounded-xl bg-rose-600 text-white text-xs font-bold active:bg-rose-700 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </>
    )}
  </BottomSheet>
);

/* ------------------------------ Lists ------------------------------ */

const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected'] as const;

/** Date + status filter row (like the web toolbar) */
const ListFilters: React.FC<{
  date: string | null;
  status: string | null;
  onDate: (d: string | null) => void;
  onStatus: (s: string | null) => void;
}> = ({ date, status, onDate, onStatus }) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDateOpen(true)}
          className="w-full h-11 pl-3 pr-8 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs shadow-2xs cursor-pointer"
        >
          <CalendarDays className={`w-4 h-4 shrink-0 ${date ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
          <span className={`truncate ${date ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-400'}`}>
            {date ? formatExpenseDate(date) : 'Select Date'}
          </span>
        </button>
        {date && (
          <button
            type="button"
            onClick={() => onDate(null)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
            aria-label="Clear date"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <Dropdown
        size="md"
        ariaLabel="Status"
        value={status}
        placeholder="All Status"
        options={['All Status', ...STATUS_OPTIONS]}
        onChange={(v) => onStatus(v === 'All Status' ? null : v)}
      />
      <DatePickerSheet
        isOpen={isDateOpen}
        mode="single"
        title="Submitted on"
        start={date}
        maxDate={toDateKey(new Date())}
        onClose={() => setIsDateOpen(false)}
        onApply={(d) => {
          onDate(d);
          setIsDateOpen(false);
        }}
      />
    </div>
  );
};

const applyFilters = (list: ExpenseRequest[], date: string | null, status: string | null) =>
  list.filter((r) => (!date || r.submittedAt.slice(0, 10) === date) && (!status || r.status === status));

const EmptyList: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-10 flex flex-col items-center text-center">
    <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
      <Inbox className="w-6 h-6" />
    </span>
    <p className="mt-3 text-sm font-bold text-[#1E293B]">{text}</p>
  </div>
);

const TeamRequests: React.FC<{
  requests: ExpenseRequest[];
  onReview: (id: string, decision: ExpenseDecision, comment: string) => void;
}> = ({ requests, onReview }) => {
  const [filters, setFilters] = useState<FilterSelection>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const pickFromSummary = (selection: FilterSelection) => {
    setFilters(selection);
    setIsSummaryOpen(false);
  };
  const [detail, setDetail] = useState<ExpenseRequest | null>(null);
  const [review, setReview] = useState<{ request: ExpenseRequest; decision: ExpenseDecision } | null>(null);

  const ofKind = requests;
  // Pending first, then newest
  const sorted = [...ofKind].sort(
    (a, b) => Number(b.status === 'Pending') - Number(a.status === 'Pending') || b.submittedAt.localeCompare(a.submittedAt)
  );
  const visible = sorted.filter((r) => matchesFilters(filters, { member: r.staffName, type: EXPENSE_KIND_LABEL[r.kind], status: r.status }));
  const count = (st: ExpenseRequest['status']) => ofKind.filter((r) => r.status === st).length;
  const amount = (st: ExpenseRequest['status']) => ofKind.filter((r) => r.status === st).reduce((n, r) => n + r.total, 0);

  return (
    <div className="space-y-3.5">
      <TeamFilterBar selection={filters} placeholder="All team members" onClick={() => setIsFilterOpen(true)} />

      <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Pending', value: count('Pending'), pill: 'bg-[#FEF8E7] text-[#D97706]' },
            { label: 'Approved', value: count('Approved'), pill: 'bg-[#E8F8F0] text-[#10B981]' },
            { label: 'Rejected', value: count('Rejected'), pill: 'bg-[#FDECEC] text-[#F43F5E]' },
          ].map(({ label, value, pill }) => (
            <div key={label} className="flex flex-col items-center">
              <div className={`w-14 h-9 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${pill}`}>{value}</div>
              <span className="text-xs text-gray-500 font-medium">{label}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#F1F5F9] mt-3.5 pt-3">
          <button
            type="button"
            onClick={() => setIsSummaryOpen(true)}
            className="w-full flex items-center justify-between text-xs font-semibold text-[#1E293B] cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#2F68FE]" />
              View Full Summary
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <span className="font-bold text-sm text-[#1E293B]">Team Requests</span>
        <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full tabular-nums">{visible.length}</span>
      </div>

      {visible.map((r) => (
        <RequestCard key={r.id} request={r} showStaff onView={() => setDetail(r)} onDecide={(decision) => setReview({ request: r, decision })} />
      ))}
      {visible.length === 0 && (
        <EmptyList text={Object.values(filters).flat().length ? 'No requests match your filters' : 'Your team hasn\u2019t raised any requests yet'} />
      )}

      <TeamFilterSheet
        isOpen={isFilterOpen}
        title="Filter Team's Requests"
        sections={[
          { id: 'member', label: 'Team Member', options: Array.from(new Set(ofKind.map((r) => r.staffName))).sort() },
          { id: 'type', label: 'Type', options: ['Advance', 'Reimbursement'] },
          { id: 'status', label: 'Status', options: [...STATUS_OPTIONS] },
        ]}
        selection={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setIsFilterOpen(false);
        }}
      />

      <BottomSheet isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} maxHeight="max-h-[85%]">
        <SheetTop title="Team Requests Summary" subtitle="Advances & reimbursements" onClose={() => setIsSummaryOpen(false)} />
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-3 text-xs">
          {/* Each row filters the list by its status / type */}
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => pickFromSummary({ status: [st] })}
              className="w-full flex items-center justify-between bg-[#F8FAFC] border border-[#EBF0F7] rounded-xl px-3.5 py-3 text-left active:bg-slate-100 active:border-[#2F68FE]/40 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-slate-600">
                {st} <span className="text-slate-400 font-medium">({count(st)})</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-extrabold text-[#1E293B] tabular-nums">{formatRupees(amount(st))}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </span>
            </button>
          ))}
          {(['advance', 'reimbursement'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => pickFromSummary({ type: [EXPENSE_KIND_LABEL[k]] })}
              className="w-full flex items-center justify-between bg-white border border-[#EBF0F7] rounded-xl px-3.5 py-3 text-left active:bg-slate-50 active:border-[#2F68FE]/40 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-slate-600">{EXPENSE_KIND_LABEL[k]} requests</span>
              <span className="flex items-center gap-1">
                <span className="font-extrabold text-[#1E293B] tabular-nums">{ofKind.filter((r) => r.kind === k).length}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </span>
            </button>
          ))}
        </div>
        <div className="p-4 pt-2 pb-6 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => setIsSummaryOpen(false)}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
          >
            Close Summary
          </button>
        </div>
      </BottomSheet>

      <RequestDetailSheet request={detail} onClose={() => setDetail(null)} />
      <ReviewSheet
        request={review?.request ?? null}
        decision={review?.decision ?? null}
        onClose={() => setReview(null)}
        onConfirm={(comment) => {
          if (review) onReview(review.request.id, review.decision, comment);
          setReview(null);
        }}
      />
    </div>
  );
};

/* ------------------------------ Screen ------------------------------ */

export interface ExpenseSubmitMeta {
  /** Replace this pending request instead of creating a new one */
  editId?: string;
  /** Claim that settles this approved advance */
  advanceId?: string;
}

interface ExpenseReimbursementViewProps {
  onBack: () => void;
  /** The signed-in user's own requests (newest first) */
  myRequests: ExpenseRequest[];
  onSubmit: (kind: ExpenseRequestKind, items: ExpenseItem[], total: number, meta: ExpenseSubmitMeta) => void;
  onDelete: (id: string) => void;
  /** Present for managers: enables the "Team's Requests" tab with Approve / Decline */
  team?: {
    requests: ExpenseRequest[];
    onReview: (id: string, decision: ExpenseDecision, comment: string) => void;
  };
}

type FormState = { mode: FormMode; editing?: ExpenseRequest; advance?: ExpenseRequest };

/** Payroll › Expense Reimbursement: Advance and Reimbursement tabs; managers also review their team's */
export const ExpenseReimbursementView: React.FC<ExpenseReimbursementViewProps> = ({ onBack, myRequests, onSubmit, onDelete, team }) => {
  const [form, setForm] = useState<FormState | null>(null);
  const [scope, setScope] = useState<'mine' | 'team'>(team ? 'team' : 'mine');
  const [date, setDate] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExpenseRequest | null>(null);
  const [deleting, setDeleting] = useState<ExpenseRequest | null>(null);
  const showTeam = Boolean(team) && scope === 'team';
  const pendingTeam = team ? team.requests.filter((r) => r.status === 'Pending').length : 0;

  if (form) {
    const { mode, editing, advance } = form;
    return (
      <ExpenseForm
        key={`${mode}-${editing?.id ?? advance?.id ?? 'new'}`}
        mode={mode}
        initialItems={editing?.items}
        title={editing ? `Edit ${editing.trackingNo}` : undefined}
        note={advance ? `Add the expenses you paid using advance ${advance.trackingNo} (${formatRupees(advance.approvedAmount ?? advance.total)}).` : undefined}
        onBack={() => setForm(null)}
        onSubmit={(items, total) => {
          setForm(null);
          setScope('mine');
          onSubmit(mode, items, total, { editId: editing?.id, advanceId: advance?.id ?? editing?.advanceId });
        }}
      />
    );
  }

  const visible = applyFilters(myRequests, date, status);
  const byId = (id?: string) => myRequests.find((r) => r.id === id);

  const options = [
    {
      key: 'advance' as const,
      art: <MoneyBagArt className="w-28 h-auto" />,
      when: 'Before you spend',
      title: 'Request an Advance',
      text: 'Get money upfront for planned work expenses like travel or events.',
      cta: 'Request advance',
      card: 'bg-linear-to-br from-[#FFF4E6] to-[#FFFBF5] border-[#FDE3C3]',
      tag: 'bg-white text-[#C2410C]',
      button: 'bg-[#F97316] active:bg-[#EA580C]',
    },
    {
      key: 'reimbursement' as const,
      art: <ReceiptArt className="w-28 h-auto" />,
      when: 'After you spend',
      title: 'Claim a Reimbursement',
      text: 'Already paid? Add your expenses with receipts and get paid back.',
      cta: 'Claim reimbursement',
      card: 'bg-linear-to-br from-[#EEF2FF] to-[#F7F5FF] border-[#DDE3FB]',
      tag: 'bg-white text-[#4F46E5]',
      button: 'bg-[#2F68FE] active:bg-[#1D4ED8]',
    },
  ];

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
          <h1 className="text-base font-bold screen-title">Reimbursement</h1>
        </div>
        {team && (
          <div className="px-4 pb-3">
            <SegmentedTabs
              ariaLabel="Whose requests"
              value={scope}
              onChange={setScope}
              options={[
                { id: 'mine', label: 'My Requests' },
                { id: 'team', label: "Team's Requests", badge: pendingTeam },
              ]}
            />
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3.5">
        {showTeam && team ? (
          <TeamRequests requests={team.requests} onReview={team.onReview} />
        ) : myRequests.length === 0 ? (
          <>
            {/* First visit: explain both options */}
            <div className="px-1">
              <h2 className="text-[15px] font-bold text-[#1E293B]">How would you like to be paid?</h2>
              <p className="text-xs text-slate-500">Pick one to get started.</p>
            </div>
            {options.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setForm({ mode: o.key })}
                className={`relative w-full overflow-hidden rounded-3xl border p-4 pr-3 text-left active:scale-[0.99] transition-transform cursor-pointer ${o.card}`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs ${o.tag}`}>{o.when}</span>
                    <h3 className="mt-2 text-base font-extrabold text-[#1E293B] leading-tight">{o.title}</h3>
                    <p className="mt-1 text-[11.5px] text-slate-600 leading-relaxed">{o.text}</p>
                    <span className={`mt-3 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-white text-[11.5px] font-bold shadow-xs ${o.button}`}>
                      {o.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="shrink-0 -mr-1">{o.art}</div>
                </div>
              </button>
            ))}
            <section className="rounded-2xl bg-white border border-[#EBF0F7] p-4 shadow-2xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">How it works</p>
              <ol className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { icon: ClipboardList, label: 'Add expenses & receipts' },
                  { icon: ShieldCheck, label: 'Manager reviews & approves' },
                  { icon: Wallet, label: 'Amount is paid to you' },
                ].map(({ icon: Icon, label }, i, arr) => (
                  <li key={label} className="relative flex flex-col items-center text-center">
                    {i < arr.length - 1 && (
                      <span className="absolute top-4.5 left-[calc(50%+22px)] right-[calc(-50%+22px)] h-px border-t border-dashed border-slate-300" aria-hidden="true" />
                    )}
                    <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                    <span className="mt-1.5 text-[10.5px] font-semibold text-slate-600 leading-snug">{label}</span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        ) : (
          <>
            <ListFilters date={date} status={status} onDate={setDate} onStatus={setStatus} />

            <div className="flex items-center gap-2 px-1">
              <span className="font-bold text-sm text-[#1E293B]">My Requests</span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full tabular-nums">{visible.length}</span>
            </div>

            {visible.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                linkedNote={r.advanceId && byId(r.advanceId) ? `Against advance ${byId(r.advanceId)!.trackingNo}` : undefined}
                onView={() => setDetail(r)}
                onEdit={() => setForm({ mode: r.kind, editing: r })}
                onDelete={() => setDeleting(r)}
                onAddExpenses={() => setForm({ mode: 'reimbursement', advance: r })}
              />
            ))}
            {visible.length === 0 && <EmptyList text="No requests match your filters" />}
          </>
        )}
      </div>

      {/* Request buttons pinned to the bottom (list view) */}
      {!showTeam && myRequests.length > 0 && (
        <div className="shrink-0 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-4 pt-3 pb-5">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setForm({ mode: 'advance' })}
            className="h-12 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-50 cursor-pointer"
          >
            <span className="text-sm leading-none">₹</span>
            Req. Advance
          </button>
          <button
            type="button"
            onClick={() => setForm({ mode: 'reimbursement' })}
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Req. Reimbursement
          </button>
        </div>
        </div>
      )}

      <RequestDetailSheet request={detail} onClose={() => setDetail(null)} />
      <DeleteSheet
        request={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) onDelete(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
};
