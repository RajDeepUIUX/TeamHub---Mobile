import React, { useEffect, useRef, useState } from 'react';
import { FileText, GraduationCap, Award, Plus, Trash2, Upload, X } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { Dropdown } from '../../design-system/components/Dropdown';
import { AttachmentInput, AttachmentInputHandle } from '../common/AttachmentInput';

/* ---------------------------------- Model ---------------------------------- */

export interface Qualification {
  id: string;
  education: string | null;
  subject: string | null;
  school: string;
  board: string;
  country: string | null;
  state: string;
  city: string;
  year: string;
  file: string | null;
}

export interface Certification {
  id: string;
  name: string | null;
  type: string | null;
  file: string | null;
  percentage: string;
}

export interface QualificationData {
  qualifications: Qualification[];
  certifications: Certification[];
}

const EDUCATION = ['10th', '12th', 'Diploma', "Bachelor's Degree", "Master's Degree", 'Doctorate'];
const SUBJECTS = ['Commerce', 'Science', 'Arts', 'Accounting', 'Finance', 'Engineering', 'Computer Science', 'Management', 'Law', 'Other'];
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'United Arab Emirates', 'Other'];
const CERT_NAMES = ['CA', 'CPA', 'CMA', 'CS', 'ACCA', 'CFA', 'Other'];
const CERT_TYPES = ['Professional', 'Academic', 'Online Course', 'Other'];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const emptyQualification = (): Qualification => ({
  id: uid(),
  education: null,
  subject: null,
  school: '',
  board: '',
  country: null,
  state: '',
  city: '',
  year: '',
  file: null,
});
const emptyCertification = (): Certification => ({ id: uid(), name: null, type: null, file: null, percentage: '' });

/** Stored in the profile draft as a JSON string (so it saves / discards with the rest of Edit Details) */
export const parseQualificationData = (raw: unknown): QualificationData => {
  try {
    const d = typeof raw === 'string' && raw ? (JSON.parse(raw) as QualificationData) : null;
    return { qualifications: d?.qualifications ?? [], certifications: d?.certifications ?? [] };
  } catch {
    return { qualifications: [], certifications: [] };
  }
};

/* --------------------------------- Pieces --------------------------------- */

const inputCls = (bad?: boolean) =>
  `w-full h-11 px-3.5 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text ${
    bad ? 'border-rose-300' : 'border-slate-200'
  }`;

const Label: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
  <span className="block text-[11px] font-semibold text-slate-600 mb-1">
    {text}
    {required && <span className="text-rose-500"> *</span>}
  </span>
);

const Err: React.FC<{ m?: string }> = ({ m }) => (m ? <p className="mt-1 px-0.5 text-[11px] font-medium text-rose-500">{m}</p> : null);

/** Choose File / chosen file row */
const FilePick: React.FC<{ name: string | null; title: string; onPick: (name: string | null) => void }> = ({ name, title, onPick }) => {
  const ref = useRef<AttachmentInputHandle>(null);
  return (
    <>
      {name ? (
        <div className="flex items-center gap-2.5 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50">
          <FileText className="w-4 h-4 text-[#2F68FE] shrink-0" />
          <span className="flex-1 min-w-0 text-xs font-semibold text-[#1E293B] truncate">{name}</span>
          <button
            type="button"
            onClick={() => onPick(null)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-200 cursor-pointer"
            aria-label="Remove file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full h-11 px-3.5 rounded-xl border border-dashed border-blue-200 bg-blue-50/30 flex items-center justify-center gap-2 text-xs font-semibold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Choose File
        </button>
      )}
      <AttachmentInput
        ref={ref}
        title={title}
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f.name);
          e.target.value = '';
        }}
      />
    </>
  );
};

const ItemCard: React.FC<{ id: string; title: string; onDelete: () => void; children: React.ReactNode }> = ({ id, title, onDelete, children }) => (
  <div data-entry={id} className="rounded-xl border border-slate-200 bg-white overflow-hidden scroll-mt-2 animate-in fade-in duration-200">
    <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200">
      <span className="text-xs font-bold text-[#2F68FE]">{title}</span>
      <button
        type="button"
        onClick={onDelete}
        className="h-7 -mr-1 px-2 rounded-lg flex items-center gap-1 text-[11px] font-semibold text-rose-500 active:bg-rose-50 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    </div>
    <div className="p-3.5 space-y-3">{children}</div>
  </div>
);

/** One section (Academic Qualification / Certifications): header, its entries or an empty state, and the add button */
const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  hint: string;
  count: number;
  addLabel: string;
  emptyText: string;
  onAdd: () => void;
  children: React.ReactNode;
}> = ({ icon, title, hint, count, addLabel, emptyText, onAdd, children }) => (
  <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
    <div className="flex items-center gap-3 px-3.5 py-3">
      <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
          {title}
          {count > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-50 text-[#2F68FE] text-[10.5px] font-bold flex items-center justify-center tabular-nums">
              {count}
            </span>
          )}
        </h3>
        <p className="text-[11px] text-slate-500 truncate">{hint}</p>
      </div>
    </div>
    <div className="px-3.5 pb-3.5 space-y-2.5">
      {count === 0 && <p className="py-2 text-center text-[11px] text-slate-400">{emptyText}</p>}
      {children}
      <button
        type="button"
        onClick={onAdd}
        className="w-full h-11 rounded-xl border border-dashed border-[#2F68FE]/50 bg-blue-50/40 flex items-center justify-center gap-1.5 text-xs font-bold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        {addLabel}
      </button>
    </div>
  </section>
);

/* ---------------------------------- Sheet ---------------------------------- */

type Errors = Record<string, string>;

export const QualificationSheet: React.FC<{
  isOpen: boolean;
  /** e.g. "Father · Robert Smith" */
  subtitle: string;
  initial: QualificationData;
  onClose: () => void;
  onSave: (data: QualificationData) => void;
}> = ({ isOpen, subtitle, initial, onClose, onSave }) => {
  const [quals, setQuals] = useState<Qualification[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  // Adding scrolls the new entry into view so its fields are ready to fill
  const reveal = (id: string) =>
    requestAnimationFrame(() => bodyRef.current?.querySelector(`[data-entry="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  const addQual = () => {
    const q = emptyQualification();
    setQuals((prev) => [...prev, q]);
    reveal(q.id);
  };
  const addCert = () => {
    const c = emptyCertification();
    setCerts((prev) => [...prev, c]);
    reveal(c.id);
  };

  // Start from what's saved, or one empty card of each
  useEffect(() => {
    if (!isOpen) return;
    // Nothing to fill until "Add Qualification" / "Add More" is tapped
    setQuals(initial.qualifications.map((q) => ({ ...q })));
    setCerts(initial.certifications.map((c) => ({ ...c })));
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const clearErr = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  const patchQ = (id: string, p: Partial<Qualification>) => {
    setQuals((prev) => prev.map((q) => (q.id === id ? { ...q, ...p } : q)));
    Object.keys(p).forEach((k) => clearErr(`${id}.${k}`));
  };
  const patchC = (id: string, p: Partial<Certification>) => {
    setCerts((prev) => prev.map((c) => (c.id === id ? { ...c, ...p } : c)));
    Object.keys(p).forEach((k) => clearErr(`${id}.${k}`));
  };

  // A card left completely blank is ignored; a started one needs its required fields
  const qStarted = (q: Qualification) =>
    Boolean(q.education || q.subject || q.school || q.board || q.country || q.state || q.city || q.year || q.file);
  const cStarted = (c: Certification) => Boolean(c.name || c.type || c.file || c.percentage);

  const save = () => {
    const e: Errors = {};
    quals.filter(qStarted).forEach((q) => {
      if (!q.education) e[`${q.id}.education`] = 'Select the education.';
      if (!q.subject) e[`${q.id}.subject`] = 'Select the subject.';
      if (q.year && !/^\d{4}$/.test(q.year)) e[`${q.id}.year`] = 'Enter a 4-digit year.';
    });
    certs.filter(cStarted).forEach((c) => {
      if (!c.name) e[`${c.id}.name`] = 'Select the certificate.';
      if (!c.type) e[`${c.id}.type`] = 'Select the type.';
    });
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() =>
        bodyRef.current?.querySelector('p.text-rose-500')?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      );
      return;
    }
    onSave({ qualifications: quals.filter(qStarted), certifications: certs.filter(cStarted) });
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[94%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1E293B]">Qualification &amp; Certificate</h2>
          <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
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

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4 space-y-5 bg-[#F8FAFC]">
        {/* 1. Academic Qualification */}
        <SectionCard
          icon={<GraduationCap className="w-5 h-5" />}
          title="Academic Qualification"
          hint="Schooling, degrees and diplomas"
          count={quals.length}
          addLabel="Add Qualification"
          emptyText="No qualifications added yet"
          onAdd={addQual}
        >
          {quals.map((q, i) => (
            <ItemCard key={q.id} id={q.id} title={`Qualification ${i + 1}`} onDelete={() => setQuals((prev) => prev.filter((x) => x.id !== q.id))}>
              <div>
                <Label text="Education" required />
                <Dropdown size="md" forceSheet ariaLabel="Education" value={q.education} placeholder="— Select —" options={EDUCATION} onChange={(v) => patchQ(q.id, { education: v })} />
                <Err m={errors[`${q.id}.education`]} />
              </div>
              <div>
                <Label text="Subject/Specialization" required />
                <Dropdown size="md" forceSheet ariaLabel="Subject/Specialization" value={q.subject} placeholder="— Select —" options={SUBJECTS} onChange={(v) => patchQ(q.id, { subject: v })} />
                <Err m={errors[`${q.id}.subject`]} />
              </div>
              <div>
                <Label text="School/College Name" />
                <input value={q.school} onChange={(e) => patchQ(q.id, { school: e.target.value })} className={inputCls()} />
              </div>
              <div>
                <Label text="University Board" />
                <input value={q.board} onChange={(e) => patchQ(q.id, { board: e.target.value })} className={inputCls()} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="min-w-0">
                  <Label text="Country" />
                  <Dropdown size="md" forceSheet ariaLabel="Country" value={q.country} placeholder="— Select —" options={COUNTRIES} onChange={(v) => patchQ(q.id, { country: v })} />
                </div>
                <div className="min-w-0">
                  <Label text="State" />
                  <input value={q.state} onChange={(e) => patchQ(q.id, { state: e.target.value })} className={inputCls()} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="min-w-0">
                  <Label text="City" />
                  <input value={q.city} onChange={(e) => patchQ(q.id, { city: e.target.value })} className={inputCls()} />
                </div>
                <div className="min-w-0">
                  <Label text="Year of completion" />
                  <input
                    inputMode="numeric"
                    maxLength={4}
                    value={q.year}
                    onChange={(e) => patchQ(q.id, { year: e.target.value.replace(/\D/g, '') })}
                    className={inputCls(Boolean(errors[`${q.id}.year`]))}
                  />
                  <Err m={errors[`${q.id}.year`]} />
                </div>
              </div>
              <div>
                <Label text="Education Certificates And Qualification" />
                <FilePick name={q.file} title="Education Certificate" onPick={(file) => patchQ(q.id, { file })} />
              </div>
            </ItemCard>
          ))}
        </SectionCard>

        {/* 2. Certifications */}
        <SectionCard
          icon={<Award className="w-5 h-5" />}
          title="Certifications"
          hint="Professional certificates like CA, CPA or CMA"
          count={certs.length}
          addLabel="Add More"
          emptyText="No certifications added yet"
          onAdd={addCert}
        >
          {certs.map((c, i) => (
            <ItemCard key={c.id} id={c.id} title={`Certificate ${i + 1}`} onDelete={() => setCerts((prev) => prev.filter((x) => x.id !== c.id))}>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="min-w-0">
                  <Label text="Certificate Name" required />
                  <Dropdown size="md" forceSheet ariaLabel="Certificate Name" value={c.name} placeholder="— Select —" options={CERT_NAMES} onChange={(v) => patchC(c.id, { name: v })} />
                  <Err m={errors[`${c.id}.name`]} />
                </div>
                <div className="min-w-0">
                  <Label text="Certificate Type" required />
                  <Dropdown size="md" forceSheet ariaLabel="Certificate Type" value={c.type} placeholder="— Select —" options={CERT_TYPES} onChange={(v) => patchC(c.id, { type: v })} />
                  <Err m={errors[`${c.id}.type`]} />
                </div>
              </div>
              <div>
                <Label text="Attachment" />
                <FilePick name={c.file} title="Certificate" onPick={(file) => patchC(c.id, { file })} />
              </div>
              <div>
                <Label text="Percentage" />
                <input
                  inputMode="decimal"
                  value={c.percentage}
                  placeholder="Enter Here"
                  onChange={(e) => patchC(c.id, { percentage: e.target.value.replace(/[^\d.]/g, '').slice(0, 6) })}
                  className={inputCls()}
                />
              </div>
            </ItemCard>
          ))}
        </SectionCard>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0 bg-white">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          Save Changes
        </button>
      </div>
    </BottomSheet>
  );
};
