import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CalendarDays, CreditCard, FileDown, GraduationCap, Loader2, Receipt, ReceiptText } from 'lucide-react';
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
export const SubscriptionInvoices: React.FC<{ canDownload: boolean; onNotice: (message: string) => void; v2?: boolean }> = ({
  canDownload,
  onNotice,
  v2,
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

  if (loading) return <InvoiceListSkeleton v2={v2} />;

  if (items.length === 0) {
    return <EmptyCard icon={ReceiptText} title="No invoices found for this service." text="Your Continuing Education subscription invoices will show up here." />;
  }

  /** Invoice / Receipt download buttons; pill (V1) or segmented footer (V2) */
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
          className={
            v2
              ? 'flex-1 h-11 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-[#2F68FE] active:bg-[#EFF6FF] disabled:opacity-60 disabled:cursor-wait transition-colors cursor-pointer'
              : 'flex-1 h-10 rounded-full border border-[#BFDBFE] bg-white text-[11.5px] font-bold text-[#2F68FE] flex items-center justify-center gap-1.5 active:bg-[#EFF6FF] disabled:opacity-60 disabled:cursor-wait transition-colors cursor-pointer'
          }
        >
          {busy === a.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
          {a.label}
        </button>
      );
    });
  };

  const licenseText = (s: SubscriptionItem) => (s.licenses ? `${s.licenses} ${s.licenses === 1 ? 'license' : 'licenses'}` : 'Single user');

  const cardV1 = (s: SubscriptionItem) => {
    const tiles = [
      { icon: CalendarDays, label: 'Purchase Date', value: formatSubscriptionDate(s.purchasedOn) },
      { icon: CalendarClock, label: 'Next renewal', value: s.renewsOn ? formatSubscriptionDate(s.renewsOn) : '-' },
      { icon: CreditCard, label: 'Payment Method', value: s.method ?? '-' },
    ];
    return (
      <li key={s.id} className="bg-white border border-[#DCE3ED] rounded-[20px] shadow-[0_4px_16px_-6px_rgba(15,23,42,0.12)] p-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-[#2F68FE] text-white flex items-center justify-center shrink-0 shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)]" aria-hidden="true">
            <GraduationCap className="w-5 h-5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13.5px] font-bold text-[#1E293B] break-words">{s.title}</span>
            <span className="mt-0.5 inline-flex px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[10.5px] font-semibold text-[#2F68FE]">{licenseText(s)}</span>
          </span>
        </div>

        <div className="mt-3 px-3.5 py-3 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#EEF2FF] border border-[#DBEAFE]">
          <span className="block text-[22px] leading-none font-extrabold text-[#1E293B] tabular-nums">{formatMoney(s.amount)}</span>
        </div>

        <dl className="mt-2.5 grid grid-cols-3 gap-2">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="min-w-0 p-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
                <dt className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                  <Icon className="w-3 h-3 text-[#2F68FE] shrink-0" />
                  <span className="truncate">{t.label}</span>
                </dt>
                <dd className="mt-1 text-[11.5px] font-bold text-[#1E293B] tabular-nums truncate">{t.value}</dd>
              </div>
            );
          })}
        </dl>

        {canDownload && <div className="mt-3 flex items-center gap-2">{actions(s)}</div>}
      </li>
    );
  };

  const cardV2 = (s: SubscriptionItem) => (
    <li key={s.id} className="relative bg-white border border-[#DCE3ED] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <span className="absolute left-0 inset-y-0 w-1 bg-[#2F68FE]" aria-hidden="true" />
      <div className="pl-4 pr-3.5 py-3 flex items-start gap-3">
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold text-[#1E293B] break-words">{s.title}</span>
          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            {licenseText(s)}
          </span>
        </span>
        <span className="text-[16px] font-extrabold text-[#1E293B] tabular-nums shrink-0">{formatMoney(s.amount)}</span>
      </div>

      <dl className="mx-4 mr-3.5 border-t border-dashed border-slate-200 py-1.5 text-[11.5px]">
        {[
          ['Purchase Date', formatSubscriptionDate(s.purchasedOn)],
          ['Next renewal', s.renewsOn ? formatSubscriptionDate(s.renewsOn) : '-'],
          ['Payment Method', s.method ?? '-'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-1.5">
            <dt className="text-slate-400">{label}</dt>
            <dd className="font-semibold text-slate-700 tabular-nums truncate">{value}</dd>
          </div>
        ))}
      </dl>

      {canDownload && <div className="flex divide-x divide-slate-100 border-t border-slate-100 bg-[#F8FAFC]">{actions(s)}</div>}
    </li>
  );

  return (
    <>
      <ul className="space-y-3">{items.map(v2 ? cardV2 : cardV1)}</ul>
      <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
        Showing all {items.length} {items.length === 1 ? 'invoice' : 'invoices'}
      </p>
    </>
  );
};
