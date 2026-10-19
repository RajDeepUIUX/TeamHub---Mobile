import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Download, FileArchive, FileSpreadsheet, Loader2 } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import type { InvoicePaymentStatus } from '../data/clientInvoicesData';

const STATUS_STYLE: Record<InvoicePaymentStatus, { pill: string; dot: string }> = {
  Paid: { pill: 'bg-[#E8F8F0] text-[#10B981]', dot: 'bg-[#10B981]' },
  Unpaid: { pill: 'bg-[#FEF8E7] text-[#D97706]', dot: 'bg-[#F59E0B]' },
  'Partially Paid': { pill: 'bg-[#EEF2FF] text-[#4F46E5]', dot: 'bg-[#4F46E5]' },
};

export const InvoiceStatusPill: React.FC<{ status: InvoicePaymentStatus }> = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap ${STATUS_STYLE[status].pill}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[status].dot}`} aria-hidden="true" />
    {status}
  </span>
);

/** Small labelled icon action on cards (Invoice PDF / Timesheets) with its own spinner */
export const FileAction: React.FC<{
  icon: React.ElementType;
  label: string;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel: string;
}> = ({ icon: Icon, label, busy, disabled, onClick, ariaLabel }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    disabled={disabled || busy}
    aria-label={ariaLabel}
    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600 flex items-center gap-1.5 active:bg-slate-50 disabled:opacity-60 disabled:cursor-wait transition-colors cursor-pointer"
  >
    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F68FE]" /> : <Icon className="w-3.5 h-3.5 text-[#2F68FE]" />}
    {label}
  </button>
);

export const InvoiceListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading invoices">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-28 h-3.5" />
            <StaffSkeleton className="w-40 h-3" />
          </div>
          <StaffSkeleton className="w-14 h-5" />
        </div>
        <div className="flex items-end justify-between">
          <StaffSkeleton className="w-24 h-6" />
          <StaffSkeleton className="w-20 h-3" />
        </div>
      </div>
    ))}
  </div>
);

export const InvoiceDetailSkeleton: React.FC = () => (
  <div className="px-4 pt-3 space-y-3" aria-busy="true" aria-label="Loading invoice details">
    <StaffSkeleton className="w-40 h-3" />
    <div className="bg-white border border-[#EBF0F7] rounded-2xl p-4 space-y-3">
      <StaffSkeleton className="w-24 h-4" />
      <StaffSkeleton className="w-40 h-8" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <StaffSkeleton key={i} className="w-full h-8" />
        ))}
      </div>
    </div>
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 flex items-center gap-3">
        <StaffSkeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <StaffSkeleton className="w-32 h-3.5" />
          <StaffSkeleton className="w-full h-1.5" />
        </div>
      </div>
    ))}
  </div>
);

type ZipStep = 'idle' | 'working' | 'ready';

const ZIP_STAGES = ['Collecting invoice PDFs', 'Adding staff timesheets', 'Compressing files'];

/**
 * MyCPE ONE Export dropdown: "Export as CSV" (instant) and "Export as Zip" (async: start → poll `check_url` → download).
 * Both use the current filters; disabled when the list is empty (desktop `setHrmsExportEnabled(false)`).
 */
export const InvoiceExportSheet: React.FC<{
  isOpen: boolean;
  invoiceCount: number;
  timesheetCount: number;
  scopeLabel: string;
  onClose: () => void;
  onCsv: () => void;
  onZip: () => void;
}> = ({ isOpen, invoiceCount, timesheetCount, scopeLabel, onClose, onCsv, onZip }) => {
  const [csvBusy, setCsvBusy] = useState(false);
  const [zip, setZip] = useState<ZipStep>('idle');
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
      clearInterval(timer.current);
      return;
    }
    setCsvBusy(false);
    setZip('idle');
    setProgress(0);
  }, [isOpen]);

  useEffect(() => () => clearInterval(timer.current), []);

  const startZip = () => {
    setZip('working');
    setProgress(4);
    // Mock of the HRMS polling loop ("still being generated" → ready)
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 8 + Math.round(Math.random() * 10));
        if (next >= 100) {
          clearInterval(timer.current);
          setTimeout(() => setZip('ready'), 250);
        }
        return next;
      });
    }, 260);
  };

  const empty = invoiceCount === 0;
  const stage = ZIP_STAGES[Math.min(ZIP_STAGES.length - 1, Math.floor((progress / 100) * ZIP_STAGES.length))];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[75%]">
      <SheetHeader title="Export Invoices" subtitle={scopeLabel} onClose={onClose} />
      <div className="px-5 py-4 pb-7 space-y-2.5">
        {empty && (
          <p className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#FEF8E7] border border-[#FDE68A] text-[11.5px] font-medium text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            No invoices found to export.
          </p>
        )}

        <button
          type="button"
          disabled={empty || csvBusy || zip === 'working'}
          onClick={() => {
            setCsvBusy(true);
            setTimeout(onCsv, 600);
          }}
          className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center gap-3 text-left active:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span className="w-11 h-11 rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-[#1E293B]">Export as CSV</span>
            <span className="block mt-0.5 text-[11px] text-slate-500 leading-snug">Invoice no., dates, period, staff count, amount and status</span>
            <span className="block mt-1 text-[10.5px] font-semibold text-slate-400 tabular-nums">
              CSV · {invoiceCount} {invoiceCount === 1 ? 'invoice' : 'invoices'}
            </span>
          </span>
          {csvBusy ? <Loader2 className="w-4.5 h-4.5 text-[#2F68FE] animate-spin shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <button
            type="button"
            disabled={empty || csvBusy || zip !== 'idle'}
            onClick={startZip}
            className="w-full p-3.5 flex items-center gap-3 text-left active:bg-slate-50 disabled:cursor-default transition-colors cursor-pointer disabled:active:bg-transparent"
          >
            <span className="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
              <FileArchive className="w-5 h-5" />
            </span>
            <span className={`flex-1 min-w-0 ${empty ? 'opacity-60' : ''}`}>
              <span className="block text-[13px] font-bold text-[#1E293B]">Export as ZIP</span>
              <span className="block mt-0.5 text-[11px] text-slate-500 leading-snug">Invoice PDFs with every staff timesheet PDF</span>
              <span className="block mt-1 text-[10.5px] font-semibold text-slate-400 tabular-nums">
                ZIP · {invoiceCount} {invoiceCount === 1 ? 'invoice' : 'invoices'} · {timesheetCount} {timesheetCount === 1 ? 'timesheet' : 'timesheets'}
              </span>
            </span>
            {zip === 'idle' && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
          </button>

          {zip === 'working' && (
            <div className="px-3.5 pb-3.5" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F68FE]" />
                  {stage}…
                </span>
                <span className="text-[#2F68FE] tabular-nums">{progress}%</span>
              </div>
              <span className="mt-2 block h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                <span className="block h-full bg-[#2F68FE] rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </span>
              <p className="mt-2 text-[10.5px] text-slate-400">Large exports can take a minute. Keep this sheet open.</p>
            </div>
          )}

          {zip === 'ready' && (
            <div className="px-3.5 pb-3.5">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Your ZIP is ready
              </p>
              <button
                type="button"
                onClick={onZip}
                className="mt-2.5 w-full h-11 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download ZIP
              </button>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
