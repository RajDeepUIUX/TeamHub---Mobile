import React, { useEffect, useState } from 'react';
import { X, Download, BadgeCheck } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { FlexRequest } from '../../types/workTiming';
import { FLEX_AGREEMENT_TERMS, flexPeriodLabel, formatFlexDate } from '../../data/workTimingData';
import { BrandLogoHorizontal } from '../auth/BrandLogo';

interface FlexAgreementSheetProps {
  request: FlexRequest | null;
  onClose: () => void;
  onDownload: (request: FlexRequest) => void;
}

/** Read-only view of the signed Work Flexibility agreement (available once approved) */
export const FlexAgreementSheet: React.FC<FlexAgreementSheetProps> = ({ request, onClose, onDownload }) => {
  const [cached, setCached] = useState<FlexRequest | null>(request);
  useEffect(() => {
    if (request) setCached(request);
  }, [request]);
  const r = request || cached;
  if (!r || !r.wfh) return null;

  const docNo = `WFA-${r.id.replace(/\D/g, '').slice(-6).padStart(6, '0')}`;
  const summary: { label: string; value: string }[] = [
    { label: 'Employee', value: `${r.staffName} (${r.staffCode})` },
    { label: 'Arrangement', value: `${r.type}${r.duration ? ` · ${r.duration}` : ''}` },
    { label: 'Period', value: flexPeriodLabel(r) },
    { label: 'Reason', value: r.wfh.reason },
  ];

  return (
    <BottomSheet isOpen={Boolean(request)} onClose={onClose} maxHeight="max-h-[94%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Signed Agreement</h2>
          <p className="text-[11px] text-slate-400">Document No. {docNo}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Document page */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-slate-100/80 p-4">
        <article className="relative bg-white rounded-xl shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)] px-5 py-6 text-[#1E293B] select-text">
          {/* Approval stamp */}
          <span className="absolute top-5 right-4 -rotate-12 px-2.5 py-1 rounded-md border-2 border-emerald-500/70 text-emerald-600 text-[10px] font-extrabold uppercase tracking-wider">
            Approved
          </span>

          <BrandLogoHorizontal className="h-4" />
          <h3 className="mt-4 text-[15px] font-extrabold tracking-tight">Work Flexibility Agreement</h3>
          <p className="text-[10.5px] text-slate-400">
            {docNo} · Signed {r.wfh.acknowledgedOn ? formatFlexDate(r.wfh.acknowledgedOn) : '—'}
          </p>

          <dl className="mt-4 rounded-lg border border-slate-100 divide-y divide-slate-100 text-[11px]">
            {summary.map(({ label, value }) => (
              <div key={label} className="flex gap-3 px-3 py-2">
                <dt className="w-20 shrink-0 text-slate-400 font-medium">{label}</dt>
                <dd className="font-semibold text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>

          <h4 className="mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Terms and Conditions</h4>
          <ol className="mt-2 space-y-2 text-[11.5px] text-slate-600 leading-relaxed list-decimal pl-4">
            {FLEX_AGREEMENT_TERMS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            I hereby agree that all Terms and Conditions of the Company remain active as per my Appointment Letter.
          </p>

          {/* Signatures */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <span className="block text-2xl leading-none text-[#1E1B4B]" style={{ fontFamily: "'Caveat', cursive" }}>
                {r.wfh.acknowledgedBy}
              </span>
              <span className="mt-1.5 block border-t border-slate-200 pt-1 text-[10px] text-slate-400">
                Employee · {r.wfh.acknowledgedOn ? formatFlexDate(r.wfh.acknowledgedOn) : ''}
              </span>
            </div>
            <div>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 h-6">
                <BadgeCheck className="w-4 h-4" />
                {r.reviewedBy ?? 'Reporting Manager'}
              </span>
              <span className="mt-1.5 block border-t border-slate-200 pt-1 text-[10px] text-slate-400">
                Approved · {r.reviewedAt ?? ''}
              </span>
            </div>
          </div>
        </article>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => onDownload(r)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
    </BottomSheet>
  );
};
