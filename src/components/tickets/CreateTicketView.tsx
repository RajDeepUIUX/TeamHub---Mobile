import React, { useState } from 'react';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { Dropdown } from '../../design-system/components/Dropdown';
import { RichTextEditor } from './RichTextEditor';
import { TicketPriority } from '../../types/tickets';
import { PRIORITY_STYLES, TICKET_DEPARTMENTS, TICKET_PRIORITIES, sanitizeTicketHtml } from '../../data/ticketsData';

export interface NewTicketData {
  subject: string;
  department: string;
  priority: TicketPriority;
  descriptionHtml: string;
}

interface CreateTicketViewProps {
  onBack: () => void;
  onSubmit: (data: NewTicketData) => void;
}

const MAX_SUBJECT = 120;

const QUICK_FILL_SAMPLES: (NewTicketData & { descriptionHtml: string })[] = [
  {
    subject: 'Laptop not connecting to office Wi-Fi',
    department: 'IT & Networking',
    priority: 'High',
    descriptionHtml:
      '<p>My laptop stopped connecting to the <b>Gota-Office</b> network since this morning.</p><ul><li>Other devices connect fine</li><li>Restarted the laptop twice</li></ul><p>Please help — I have client calls today.</p>',
  },
  {
    subject: 'Salary slip for August not received',
    department: 'HR/Finance',
    priority: 'Medium',
    descriptionHtml: '<p>I have not received my <b>August 2026</b> salary slip on email. Could you please share it?</p>',
  },
  {
    subject: 'Request for an ergonomic chair',
    department: 'HR/Admin',
    priority: 'Low',
    descriptionHtml: '<p>Requesting an ergonomic chair for my desk due to back pain.</p><ol><li>Desk: 3rd floor, Bay B</li><li>Preferred: adjustable lumbar support</li></ol>',
  },
];

export const CreateTicketView: React.FC<CreateTicketViewProps> = ({ onBack, onSubmit }) => {
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState<string | null>(null);
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [errors, setErrors] = useState<{ subject?: string; department?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const quickFill = () => {
    const sample = QUICK_FILL_SAMPLES[Math.floor(Math.random() * QUICK_FILL_SAMPLES.length)];
    setSubject(sample.subject);
    setDepartment(sample.department);
    setPriority(sample.priority);
    setDescriptionHtml(sample.descriptionHtml);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!subject.trim()) next.subject = 'Enter a subject for your ticket.';
    if (!department) next.department = 'Select the department that should handle this.';
    setErrors(next);
    if (Object.keys(next).length || !department) return;

    setSubmitting(true);
    setTimeout(
      () =>
        onSubmit({
          subject: subject.trim(),
          department,
          priority,
          descriptionHtml: descriptionHtml ? sanitizeTicketHtml(descriptionHtml) : '',
        }),
      600
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold ml-2">New Ticket</h1>
          </div>
          <button
            type="button"
            onClick={quickFill}
            className="h-8 px-2.5 rounded-full bg-indigo-50 text-[#4F46E5] text-[11px] font-semibold flex items-center gap-1 active:bg-indigo-100 cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Quick Fill
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col" noValidate>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {/* Subject */}
          <div className="space-y-1.5">
            <label htmlFor="ticket-subject" className="block text-xs font-bold text-[#1E293B]">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              id="ticket-subject"
              type="text"
              value={subject}
              maxLength={MAX_SUBJECT}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors((p) => ({ ...p, subject: undefined }));
              }}
              placeholder="Briefly describe the issue"
              className={`w-full h-12 px-3.5 bg-white border rounded-xl text-[13px] font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 shadow-2xs select-text ${
                errors.subject ? 'border-rose-300' : 'border-slate-200'
              }`}
            />
            <div className="flex items-center justify-between px-0.5">
              {errors.subject ? (
                <p className="text-[11px] font-medium text-rose-500">{errors.subject}</p>
              ) : (
                <span />
              )}
              <span className="text-[10px] text-slate-400 tabular-nums">
                {subject.length}/{MAX_SUBJECT}
              </span>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E293B]">
              Department <span className="text-rose-500">*</span>
            </label>
            <Dropdown
              ariaLabel="Department"
              value={department}
              placeholder="Select Department"
              options={TICKET_DEPARTMENTS}
              onChange={(d) => {
                setDepartment(d);
                if (errors.department) setErrors((p) => ({ ...p, department: undefined }));
              }}
            />
            {errors.department && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.department}</p>}
          </div>

          {/* Priority: segmented control (3 options fit better than a dropdown on mobile) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E293B]">Priority</label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Priority">
              {TICKET_PRIORITIES.map((p) => {
                const isOn = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={isOn}
                    onClick={() => setPriority(p)}
                    className={`h-11 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isOn ? 'border-[#2F68FE] bg-blue-50 text-[#1E293B] font-bold' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_STYLES[p].dot}`} />
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E293B]">
              Description <span className="font-medium text-slate-400">(Optional)</span>
            </label>
            <RichTextEditor
              value={descriptionHtml}
              onChange={setDescriptionHtml}
              placeholder="Add details — what happened, when, and anything you've tried..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 grid grid-cols-2 gap-3 p-4 pb-5 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={onBack}
            className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? 'Creating…' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};
