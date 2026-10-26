import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, FileText, Loader2, MessageSquare, Pencil, Send, Sparkles, Trash2, Video } from 'lucide-react';
import { BottomSheet } from '../../../common/BottomSheet';
import { CommentThreadSheet } from '../../../common/CommentThreadSheet';
import { SegmentedTabs } from '../../../../design-system/components/SegmentedTabs';
import { formatStaffDate } from '../../data/clientStaffData';
import { SOP_DECISIONS, SOP_DOC_FORMATS, SOP_VIDEO_FORMATS, SopRecord, SopStatus } from '../../data/clientStaffProfileData';
import { ACCENT, AccentCard, Card, ConfirmSheet, EmptyCard, Pill, RowList, SheetHeader, TextField, Tone, useNotice } from './StaffTabParts';
import { useClientPermission } from '../../context/ClientPermissionContext';
import { FileUploadField } from '../../../common/FileUploadField';

interface StaffSopTabProps {
  staffName: string;
  clientName: string;
  sops: SopRecord[];
  onChange: (next: SopRecord[]) => void;
  v2?: boolean;
}

type Mode = 'document' | 'ai';
type Stage = 'form' | 'uploading' | 'processing' | 'done';
type Confirm =
  | { kind: 'delete'; sop: SopRecord }
  | { kind: 'publish'; sop: SopRecord }
  | { kind: 'status'; sop: SopRecord; status: Exclude<SopStatus, 'Pending'> }
  | null;

const STATUS_TONE: Record<SopStatus, Tone> = { Pending: 'amber', Approved: 'green', Rejected: 'rose', 'Not Required': 'slate' };
const MAX_VIDEO_MB = 500;
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

/** Desktop "SOP" tab (sop_tab.tpl): status decision, feedback, view, delete, publish */
export const StaffSopTab: React.FC<StaffSopTabProps> = ({ staffName, clientName, sops, onChange, v2 }) => {
  const [notice, showNotice] = useNotice();
  const perm = useClientPermission('my-staff');
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);

  // Generate SOP sheet
  const [genOpen, setGenOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('document');
  const [stage, setStage] = useState<Stage>('form');
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiSteps, setAiSteps] = useState(0);

  useEffect(() => {
    if (!genOpen) return;
    setStage('form');
    setFileName('');
    setFile(null);
    setTouched(false);
    setProgress(0);
  }, [genOpen]);

  useEffect(() => {
    setFile(null);
    setTouched(false);
  }, [mode]);

  // Mock upload → AI processing → success
  useEffect(() => {
    if (stage === 'uploading') {
      const t = setInterval(() => setProgress((p) => Math.min(100, p + 12)), 160);
      return () => clearInterval(t);
    }
    if (stage === 'processing') {
      const t = setTimeout(() => setStage('done'), 1600);
      return () => clearTimeout(t);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'uploading' && progress >= 100) setStage('processing');
  }, [stage, progress]);

  const formats = mode === 'document' ? SOP_DOC_FORMATS : SOP_VIDEO_FORMATS;
  const errors: { name?: string; file?: string } = {};
  if (!fileName.trim()) errors.name = 'File name is required';
  else if (sops.some((s) => s.name.toLowerCase() === fileName.trim().toLowerCase())) errors.name = 'An SOP with this name already exists';
  if (!file) errors.file = 'Please upload a file';
  else if (!formats.includes(extOf(file.name))) errors.file = `Unsupported format. Use ${formats.map((f) => f.toUpperCase()).join(', ')}`;
  else if (mode === 'ai' && file.size > MAX_VIDEO_MB * 1024 * 1024) errors.file = `Video is larger than ${MAX_VIDEO_MB}MB`;
  else if (mode === 'document' && file.size > 10 * 1024 * 1024) errors.file = 'File is larger than 10 MB';
  const valid = !errors.name && !errors.file;
  const busy = stage === 'uploading' || stage === 'processing';

  const addSop = (kind: Mode, steps?: number) => {
    const sop: SopRecord = {
      id: `sop-${Date.now()}`,
      name: fileName.trim(),
      kind,
      fileName: file?.name ?? '',
      status: 'Pending',
      decidedOn: null,
      decidedBy: null,
      createdBy: clientName,
      createdByMe: true,
      published: false,
      processing: 'completed',
      aiSteps: steps,
      feedback: [],
    };
    onChange([sop, ...sops]);
  };

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    if (mode === 'document') {
      addSop('document');
      setGenOpen(false);
      showNotice('SOP uploaded successfully.');
      return;
    }
    const steps = 6 + Math.floor(Math.random() * 8);
    setAiSteps(steps);
    addSop('ai', steps);
    setProgress(0);
    setStage('uploading');
  };

  const update = (id: string, patch: Partial<SopRecord>) => onChange(sops.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const runConfirm = () => {
    if (!confirm) return;
    const { sop } = confirm;
    if (confirm.kind === 'delete') {
      onChange(sops.filter((s) => s.id !== sop.id));
      showNotice('SOP deleted successfully.');
    } else if (confirm.kind === 'publish') {
      update(sop.id, { published: true });
      showNotice('SOP published successfully.');
    } else {
      update(sop.id, { status: confirm.status, decidedOn: todayIso(), decidedBy: clientName });
      showNotice(`SOP marked as ${confirm.status}.`);
    }
    setConfirm(null);
  };

  const feedbackSop = sops.find((s) => s.id === feedbackFor);

  return (
    <>
      {notice}
      <div className="mt-2.5 space-y-2.5">
        {sops.length === 0 ? (
          <EmptyCard icon={FileText} title="No Data Found" text={`SOPs for ${staffName} will show up here.`} />
        ) : (
          sops.map((s) => {
            const canDelete = perm.delete && s.createdByMe && !s.published;
            const canPublish = perm.edit && s.kind === 'ai' && s.createdByMe && !s.published;
            // Desktop `can_edit`: own, unpublished, not Approved AI SOP → editor in the staff user panel
            const canEdit = canPublish && s.status !== 'Approved';
            if (v2) {
              const actions: { key: string; label: string; icon: React.ElementType; onClick: () => void; cls: string; badge?: number }[] = [
                { key: 'view', label: 'View', icon: Eye, onClick: () => showNotice(`Opening ${s.name}.`), cls: 'text-[#2F68FE] active:bg-[#EFF6FF]' },
                ...(canEdit
                  ? [{ key: 'edit', label: 'Edit', icon: Pencil, onClick: () => showNotice(`Opening ${s.name} in the SOP editor.`), cls: 'text-slate-600 active:bg-slate-50' }]
                  : []),
                {
                  key: 'feedback',
                  label: 'Feedback',
                  icon: MessageSquare,
                  onClick: () => setFeedbackFor(s.id),
                  cls: 'text-slate-600 active:bg-slate-50',
                  badge: s.feedback.length || undefined,
                },
                ...(canDelete ? [{ key: 'delete', label: 'Delete', icon: Trash2, onClick: () => setConfirm({ kind: 'delete', sop: s }), cls: 'text-rose-500 active:bg-rose-50' }] : []),
              ];
              return (
                <AccentCard key={s.id} accent={ACCENT[STATUS_TONE[s.status]]}>
                  <div className="pl-4 pr-3.5 pt-3.5">
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${s.kind === 'ai' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#FEF2F2] text-rose-500'}`}
                      >
                        {s.kind === 'ai' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-400">SOP Name</p>
                        <p className="text-sm font-bold text-[#1E293B] leading-snug">{s.name}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Pill tone={STATUS_TONE[s.status]}>{s.status}</Pill>
                          {s.published && (
                            <Pill tone="green">
                              <CheckCircle2 className="w-3 h-3" /> Published
                            </Pill>
                          )}
                        </div>
                      </div>
                    </div>
                    <RowList
                      className="mt-2.5 border-t border-slate-100"
                      rows={[
                        { label: 'Approved/Rejected On', value: s.decidedOn ? formatStaffDate(s.decidedOn) : '-' },
                        { label: 'Approved/Rejected By', value: s.decidedBy ?? '-' },
                        { label: 'Created By', value: s.createdBy },
                      ]}
                    />
                    {perm.edit && s.status === 'Pending' && (
                      <div className="mt-1 mb-3 p-1 rounded-2xl bg-[#F8FAFC] border border-[#EBF0F7] grid grid-cols-3 gap-1">
                        {SOP_DECISIONS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setConfirm({ kind: 'status', sop: s, status: d })}
                            className={`h-9 rounded-xl text-[11px] font-bold cursor-pointer ${
                              d === 'Approved'
                                ? 'bg-[#10B981] text-white active:bg-emerald-600'
                                : d === 'Rejected'
                                  ? 'bg-white text-rose-600 border border-rose-200 active:bg-rose-50'
                                  : 'bg-white text-slate-600 border border-slate-200 active:bg-slate-50'
                            }`}
                          >
                            {d === 'Approved' ? 'Approve' : d === 'Rejected' ? 'Reject' : 'Not Required'}
                          </button>
                        ))}
                      </div>
                    )}
                    {!s.published && canPublish && (
                      <button
                        type="button"
                        onClick={() => setConfirm({ kind: 'publish', sop: s })}
                        className="mb-3 w-full h-10 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Publish SOP
                      </button>
                    )}
                  </div>
                  <div className="flex border-t border-slate-100 divide-x divide-slate-100" aria-label="Action">
                    {actions.map((a) => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={a.key}
                          type="button"
                          onClick={a.onClick}
                          aria-label={`${a.label} ${s.name}`}
                          className={`flex-1 h-11 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${a.cls}`}
                        >
                          <Icon className="w-4 h-4" />
                          {a.label}
                          {a.badge !== undefined && (
                            <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                              {a.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </AccentCard>
              );
            }
            return (
              <Card key={s.id} className="p-3.5">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.kind === 'ai' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#FEF2F2] text-rose-500'}`}
                  >
                    {s.kind === 'ai' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-400">SOP Name</p>
                    <p className="mt-0.5 text-[13px] font-bold text-[#1E293B] leading-snug">{s.name}</p>
                  </div>
                </div>

                {/* Approved/Rejected On | By, then Status | Created By (50 / 50) */}
                <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {(
                    [
                      ['Approved/Rejected On', s.decidedOn ? formatStaffDate(s.decidedOn) : '-'],
                      ['Approved/Rejected By', s.decidedBy ?? '-'],
                      ['Status', <Pill tone={STATUS_TONE[s.status]}>{s.status}</Pill>],
                      ['Created By', s.createdBy],
                    ] as [string, React.ReactNode][]
                  ).map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-[11px] text-slate-400">{label}</dt>
                      <dd className="mt-0.5 text-xs font-semibold text-[#1E293B] leading-snug break-words tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>

                {perm.edit && s.status === 'Pending' && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {SOP_DECISIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setConfirm({ kind: 'status', sop: s, status: d })}
                        className={`h-9 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          d === 'Approved'
                            ? 'border-emerald-200/50 bg-[#E8F8F0] text-emerald-700 active:bg-emerald-100'
                            : d === 'Rejected'
                              ? 'border-rose-200 bg-[#FEF2F2] text-rose-600 active:bg-rose-100'
                              : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
                        }`}
                      >
                        {d === 'Approved' ? 'Approve' : d === 'Rejected' ? 'Reject' : 'Not Required'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  {/* All four actions don't fit one row: 2 × 2 */}
                  <div className={canEdit && canDelete ? 'grid grid-cols-2 gap-2' : 'flex items-center gap-2'}>
                    <button
                      type="button"
                      onClick={() => showNotice(`Opening ${s.name}.`)}
                      aria-label={`View ${s.name}`}
                      className="flex-1 min-w-0 h-9 px-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-100 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 shrink-0" /> View
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => showNotice(`Opening ${s.name} in the SOP editor.`)}
                        aria-label={`Edit ${s.name}`}
                        className="flex-1 min-w-0 h-9 px-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 active:bg-slate-50 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 shrink-0" /> Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFeedbackFor(s.id)}
                      aria-label={`Feedback on ${s.name}`}
                      className="flex-1 min-w-0 h-9 px-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 active:bg-slate-50 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" /> Feedback
                      {s.feedback.length > 0 && (
                        <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums shrink-0">
                          {s.feedback.length}
                        </span>
                      )}
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setConfirm({ kind: 'delete', sop: s })}
                        aria-label={`Delete ${s.name}`}
                        className="flex-1 min-w-0 h-9 px-2 rounded-xl border border-rose-200 text-rose-500 text-xs font-bold flex items-center justify-center gap-1.5 active:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" /> Delete
                      </button>
                    )}
                  </div>
                  {s.published ? (
                    <span className="h-9 px-3 rounded-xl bg-[#E8F8F0] border border-emerald-200/50 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Published
                    </span>
                  ) : (
                    canPublish && (
                      <button
                        type="button"
                        onClick={() => setConfirm({ kind: 'publish', sop: s })}
                        className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 active:bg-slate-50 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Publish SOP
                      </button>
                    )
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Generate AI Powered SOP */}
      <BottomSheet isOpen={genOpen} onClose={() => !busy && setGenOpen(false)} maxHeight="max-h-[90%]">
        <SheetHeader title="Generate AI Powered SOP" subtitle={staffName} onClose={() => !busy && setGenOpen(false)} />
        {stage === 'form' ? (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
              <SegmentedTabs<Mode>
                ariaLabel="SOP type"
                options={[
                  { id: 'document', label: 'Document Upload' },
                  { id: 'ai', label: 'AI Powered SOP' },
                ]}
                value={mode}
                onChange={setMode}
              />
              <TextField label="File Name" required value={fileName} onChange={setFileName} error={touched ? errors.name : undefined} placeholder="e.g. Month-end close checklist" />
              <div>
                <span className="text-xs font-bold text-[#1E293B]">
                  Upload File<span className="text-rose-500"> *</span>
                </span>
                {/* Same upload UI as the rest of the app; format / size are checked by the form */}
                <div className="mt-1.5">
                  <FileUploadField
                    fileName={file?.name ?? null}
                    onChange={(name) => !name && setFile(null)}
                    onFile={setFile}
                    label={mode === 'ai' ? 'Add video' : 'Add file'}
                    types={mode === 'document' ? 'PDF, DOC, DOCX, XLS, XLSX, CSV' : 'MP4, WebM, MOV, AVI'}
                    maxSizeMB={mode === 'ai' ? MAX_VIDEO_MB : 10}
                    accept={formats.map((x) => `.${x}`).join(',')}
                    sheetTitle="Upload File"
                    invalid={touched && Boolean(errors.file)}
                  />
                </div>
                {touched && errors.file && <p className="mt-1.5 px-0.5 text-[11px] font-medium text-rose-500">{errors.file}</p>}
                {mode === 'ai' && (
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-[#4F46E5] shrink-0 mt-0.5" />
                    AI will automatically detect UI elements and actions from your video timeline.
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
              <button type="button" onClick={() => setGenOpen(false)} className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={touched && !valid}
                className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {mode === 'document' ? 'Upload SOP' : 'Generate SOP'}
              </button>
            </div>
          </>
        ) : stage === 'done' ? (
          <div className="px-6 py-8 flex flex-col items-center text-center">
            <span className="w-16 h-16 rounded-full bg-[#E8F8F0] text-[#10B981] flex items-center justify-center success-pop">
              <CheckCircle2 className="w-8 h-8" />
            </span>
            <p className="mt-4 text-base font-extrabold text-[#1E293B]">SOP Generated Successfully!</p>
            <p className="mt-1 text-xs text-slate-500">
              AI detected <strong className="text-[#1E293B]">{aiSteps}</strong> steps from your video.
            </p>
            <button
              type="button"
              onClick={() => {
                setGenOpen(false);
                showNotice(`Opening ${fileName.trim()}.`);
              }}
              className="mt-6 w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
            >
              View SOP
            </button>
          </div>
        ) : (
          <div className="px-6 py-10 flex flex-col items-center text-center" aria-live="polite">
            <Loader2 className="w-9 h-9 text-[#2F68FE] animate-spin" />
            <p className="mt-4 text-sm font-bold text-[#1E293B]">{stage === 'uploading' ? 'Uploading video...' : 'Processing...'}</p>
            <p className="mt-1 text-xs text-slate-500">
              {stage === 'uploading' ? 'Please wait while your video is being uploaded.' : 'AI is detecting steps from your video.'}
            </p>
            {stage === 'uploading' && (
              <div className="mt-5 w-full">
                <span className="block h-2 rounded-full bg-slate-100 overflow-hidden">
                  <span className="block h-full rounded-full bg-[#2F68FE] transition-all" style={{ width: `${progress}%` }} />
                </span>
                <span className="mt-1.5 block text-[11px] font-semibold text-slate-500 tabular-nums">{progress}%</span>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <ConfirmSheet
        isOpen={confirm !== null}
        title={confirm?.kind === 'delete' ? 'Delete File' : confirm?.kind === 'publish' ? 'Publish SOP' : 'Update SOP Status'}
        message={
          confirm?.kind === 'delete'
            ? 'Are you sure you want to delete this file?'
            : confirm?.kind === 'publish'
              ? 'Are you sure you want to publish this SOP?'
              : confirm
                ? `Mark "${confirm.sop.name}" as ${confirm.status}?`
                : ''
        }
        note={
          confirm?.kind === 'publish'
            ? 'Once published, the SOP will be locked and you will not be able to edit/delete it.'
            : confirm?.kind === 'status'
              ? 'The status cannot be changed again after this.'
              : undefined
        }
        confirmLabel="Yes"
        danger={confirm?.kind === 'delete' || (confirm?.kind === 'status' && confirm.status === 'Rejected')}
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      />

      <CommentThreadSheet
        isOpen={Boolean(feedbackSop)}
        title="Feedback"
        subtitle={feedbackSop?.name ?? ''}
        comments={feedbackSop?.feedback ?? []}
        currentUser={clientName}
        placeholder="Write your feedback..."
        onClose={() => setFeedbackFor(null)}
        onSend={(text) =>
          feedbackSop &&
          update(feedbackSop.id, {
            feedback: [...feedbackSop.feedback, { id: `fb-${Date.now()}`, author: clientName, role: 'Manager', text, createdAt: new Date().toISOString() }],
          })
        }
      />
    </>
  );
};
