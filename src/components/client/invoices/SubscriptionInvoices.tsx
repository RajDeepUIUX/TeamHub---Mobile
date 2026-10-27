import React, { useEffect, useMemo, useState } from 'react';
import { FileDown, GraduationCap, Loader2, Receipt, ReceiptText } from 'lucide-react';
import { EmptyCard } from '../staff/tabs/StaffTabParts';
import { formatMoney } from '../data/clientInvoicesData';
import { formatSubscriptionDate, subscriptionFileNames, subscriptionInvoices } from '../data/clientSubscriptionInvoicesData';
import { InvoiceListSkeleton } from './InvoiceParts';

const LOAD_MS = 600;

type SubscriptionItem = ReturnType<typeof subscriptionInvoices>[number];

/**
 * Invoices › Continuing Education — MyCPE ONE subscription billing history:
 * Subscription, License, Purchase Date, Next renewal, Total Paid, Payment Method; Invoice / Receipt downloads.
 */
export const SubscriptionInvoices: React.FC<{ canDownload: boolean; onNotice: (message: string) => void }> = ({
  canDownload,
  onNotice,
}) => {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const items = useMemo(() => subscriptionInvoices(), []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const download = (key: string, fileName: string) => {
    setBusy(key);
    setTimeout(() => {
      setBusy(null);
      onNotice(`${fileName} downloaded`);
    }, 700);
  };

  if (loading) return <InvoiceListSkeleton />;

  if (items.length === 0) {
    return <EmptyCard icon={ReceiptText} title="No invoices found for this service." text="Your Continuing Education subscription invoices will show up here." />;
  }

  /** Invoice / Receipt download buttons (segmented footer) */
  const actions = (s: SubscriptionItem) => {
    const list = [
      ...(s.hasInvoice
        ? [{ key: `inv-${s.id}`, icon: FileDown, label: 'Invoice', file: subscriptionFileNames.invoice(s), aria: `Download invoice for ${s.title}` }]
        : []),
      { key: `rec-${s.id}`, icon: Receipt, label: 'Receipt', file: subscriptionFileNames.receipt(s), aria: `Download receipt for ${s.title}` },
    ];
    return list.map((a) => {
      const Icon = a.icon;
      return (
        <button
          key={a.key}
          type="button"
          onClick={() => download(a.key, a.file)}
          disabled={busy !== null}
          aria-label={a.aria}
          className="flex-1 h-11 flex items-center justify-center gap-1.5 text-xs font-bold text-[#2F68FE] active:bg-blue-50 disabled:opacity-60 disabled:cursor-wait transition-colors cursor-pointer"
        >
          {busy === a.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
          {a.label}
        </button>
      );
    });
  };

  const licenseText = (s: SubscriptionItem) => (s.licenses ? `${s.licenses} ${s.licenses === 1 ? 'license' : 'licenses'}` : 'Single user');

  const card = (s: SubscriptionItem) => (
    <li key={s.id} className="bg-white border border-[#EBF0F7] rounded-2xl overflow-hidden shadow-2xs">
      <div className="px-4 pt-3.5 pb-3 flex items-start gap-3">
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-[#1E293B] break-words">{s.title}</span>
          <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-slate-500">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            {licenseText(s)}
          </span>
        </span>
        <span className="text-base font-extrabold text-[#1E293B] tabular-nums shrink-0">{formatMoney(s.amount)}</span>
      </div>

      <dl className="mx-4 border-t border-slate-100 py-1.5 text-[11px]">
        {[
          ['Purchase Date', formatSubscriptionDate(s.purchasedOn)],
          ['Next renewal', s.renewsOn ? formatSubscriptionDate(s.renewsOn) : '-'],
          ['Payment Method', s.method ?? '-'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-1.5">
            <dt className="text-slate-500 font-medium">{label}</dt>
            <dd className="text-xs font-semibold text-[#1E293B] tabular-nums truncate">{value}</dd>
          </div>
        ))}
      </dl>

      {canDownload && <div className="flex divide-x divide-slate-100 border-t border-slate-100">{actions(s)}</div>}
    </li>
  );

  return (
    <>
      <ul className="space-y-3">{items.map(card)}</ul>
      <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
        Showing {items.length} Of {items.length} Records
      </p>
    </>
  );
};
