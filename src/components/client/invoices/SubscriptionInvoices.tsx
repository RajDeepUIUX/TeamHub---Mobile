import React, { useEffect, useMemo, useState } from 'react';
import { FileDown, GraduationCap, Receipt, ReceiptText } from 'lucide-react';
import { Card, EmptyCard } from '../staff/tabs/StaffTabParts';
import { formatMoney } from '../data/clientInvoicesData';
import { formatSubscriptionDate, subscriptionFileNames, subscriptionInvoices } from '../data/clientSubscriptionInvoicesData';
import { FileAction, InvoiceListSkeleton } from './InvoiceParts';

const LOAD_MS = 600;

/**
 * Invoices › Continuing Education — MyCPE ONE subscription billing history:
 * Subscription, License, Purchase Date, Next renewal, Total Paid, Payment Method; Invoice / Receipt downloads.
 */
export const SubscriptionInvoices: React.FC<{ canDownload: boolean; onNotice: (message: string) => void }> = ({ canDownload, onNotice }) => {
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

  return (
    <>
      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.id}>
            <Card className="overflow-hidden">
              <div className="p-3.5">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
                    <GraduationCap className="w-[18px] h-[18px]" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold text-[#1E293B] break-words">{s.title}</span>
                    <span className="block text-[11px] text-slate-500">
                      {s.licenses ? `${s.licenses} ${s.licenses === 1 ? 'license' : 'licenses'}` : 'Single user'}
                    </span>
                  </span>
                </div>

                <span className="mt-3 block text-[19px] leading-none font-extrabold text-[#1E293B] tabular-nums">{formatMoney(s.amount)}</span>

                <dl className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
                  <div className="min-w-0">
                    <dt className="text-slate-400">Purchase Date</dt>
                    <dd className="font-semibold text-slate-700 tabular-nums">{formatSubscriptionDate(s.purchasedOn)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-slate-400">Next renewal</dt>
                    <dd className="font-semibold text-slate-700 tabular-nums">{s.renewsOn ? formatSubscriptionDate(s.renewsOn) : '-'}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-slate-400">Payment Method</dt>
                    <dd className="font-semibold text-slate-700 truncate">{s.method ?? '-'}</dd>
                  </div>
                </dl>
              </div>

              {canDownload && (
                <div className="px-3.5 py-2.5 border-t border-slate-100 flex items-center gap-2">
                  {s.hasInvoice && (
                    <FileAction
                      icon={FileDown}
                      label="Invoice"
                      busy={busy === `inv-${s.id}`}
                      disabled={busy !== null}
                      onClick={() => download(`inv-${s.id}`, subscriptionFileNames.invoice(s))}
                      ariaLabel={`Download invoice for ${s.title}`}
                    />
                  )}
                  <FileAction
                    icon={Receipt}
                    label="Receipt"
                    busy={busy === `rec-${s.id}`}
                    disabled={busy !== null}
                    onClick={() => download(`rec-${s.id}`, subscriptionFileNames.receipt(s))}
                    ariaLabel={`Download receipt for ${s.title}`}
                  />
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
        Showing all {items.length} {items.length === 1 ? 'invoice' : 'invoices'}
      </p>
    </>
  );
};
