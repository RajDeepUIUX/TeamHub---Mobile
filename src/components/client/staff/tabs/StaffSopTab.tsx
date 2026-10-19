import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Eye, FileText, Loader2, MessageSquare, Pencil, Send, Sparkles, Trash2, UploadCloud, Video } from 'lucide-react';
import { BottomSheet } from '../../../common/BottomSheet';
import { CommentThreadSheet } from '../../../common/CommentThreadSheet';
import { SegmentedTabs } from '../../../../design-system/components/SegmentedTabs';
import { formatStaffDate } from '../../data/clientStaffData';
import { SOP_DECISIONS, SOP_DOC_FORMATS, SOP_VIDEO_FORMATS, SopRecord, SopStatus } from '../../data/clientStaffProfileData';
import { Card, ConfirmSheet, EmptyCard, FieldGrid, Pill, SheetHeader, TabTitle, TextField, Tone, useNotice } from './StaffTabParts';
import { useClientPermission } from '../../context/ClientPermissionContext';

interface StaffSopTabProps {
  staffName: string;
  clientName: string;
  sops: SopRecord[];
  onChange: (next: SopRecord[]) => void;
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

/** Desktop "SOP" tab (sop_tab.tpl): Generate AI Powered SOP, status decision, feedback, view, delete, publish */
export const StaffSopTab: React.FC<StaffSopTabProps> = ({ staffName, clientName, sops, onChange }) => {
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
  const fileInput = useRef<HTMLInputElement>(null);

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
    if (fileInput.current) fileInput.current.value = '';
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
  const valid = !errors.name && !errors.file;

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
  const busy = stage === 'uploading' || stage === 'processing';

  return (
    <>
      {notice}
      <TabTitle
        title="SOP"
        action={
          perm.add && (
          <button
            type="button"
            onClick={() => setGenOpen(true)}
            className="h-9 px-3 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Generate SOP
          </button>
          )
        }
      />

      <div className="mt-2.5 space-y-2.5">
        {sops.length === 0 ? (
          <EmptyCard icon={FileText} title="No SOPs yet." text={`Upload a document or generate an AI Powered SOP for ${staffName}.`} />
        ) : (
          sops.map((s) => {
            const canDelete = perm.delete && s.createdByMe && !s.published;
            const canPublish = perm.edit && s.kind === 'ai' && s.createdByMe && !s.published;
            // Desktop `can_edit`: own, unpublished, not Approved AI SOP → editor in the staff user panel
            const canEdit = canPublish && s.status !== 'Approved';
            return (
              <Card key={s.id} className="p-3.5">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.kind === 'ai' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#FEF2F2] text-rose-500'}`}
                  >
                    {s.kind === 'ai' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1E293B] leading-snug">{s.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {s.kind === 'ai' ? `AI Powered SOP${s.aiSteps ? ` · ${s.aiSteps} steps` : ''}` : s.fileName}
                    </p>
                  </div>
                  <Pill tone={STATUS_TONE[s.status]}>{s.status}</Pill>
                </div>

                <FieldGrid
                  compact
                  fields={[
                    { label: 'Approved/Rejected On', value: s.decidedOn ? formatStaffDate(s.decidedOn) : '-' },
                    { label: 'Approved/Rejected By', value: s.decidedBy ?? '-' },
                    { label: 'Created By', value: s.createdBy },
                  ]}
                />

                {perm.edit && s.status === 'Pending' && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {SOP_DECISIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setConfirm({ kind: 'status', sop: s, status: d })}
                        className={`h-9 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          d === 'Approved'
                            ? 'border-[#A7F3D0] bg-[#E8F8F0] text-emerald-700 active:bg-emerald-100'
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

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showNotice(`Opening ${s.name}.`)}
                    aria-label={`View ${s.name}`}
                    className="w-9 h-9 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center active:bg-blue-100 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => showNotice(`Opening ${s.name} in the SOP editor.`)}
                      aria-label={`Edit ${s.name}`}
                      className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center active:bg-slate-50 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFeedbackFor(s.id)}
                    aria-label={`Feedback on ${s.name}`}
                    className="relative w-9 h-9 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center active:bg-slate-50 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {s.feedback.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        {s.feedback.length}
                      </span>
                    )}
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirm({ kind: 'delete', sop: s })}
                      aria-label={`Delete ${s.name}`}
                      className="w-9 h-9 rounded-xl border border-slate-200 text-rose-500 flex items-center justify-center active:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <span className="flex-1" />
                  {s.published ? (
                    <span className="h-9 px-3 rounded-xl bg-[#E8F8F0] border border-[#A7F3D0] text-emerald-700 text-[11.5px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Published
                    </span>
                  ) : (
                    canPublish && (
                      <button
                        type="button"
                        onClick={() => setConfirm({ kind: 'publish', sop: s })}
                        className="h-9 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-[11.5px] font-bold flex items-center gap-1.5 active:bg-slate-50 cursor-pointer"
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
                <input
                  ref={fileInput}
                  type="file"
                  className="sr-only"
                  accept={formats.map((f) => `.${f}`).join(',')}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className={`mt-1.5 w-full border-2 border-dashed rounded-2xl p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                    touched && errors.file ? 'border-rose-300 bg-rose-50/40' : 'border-blue-200 bg-blue-50/20 active:bg-blue-50/60'
                  }`}
                >
                  <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2F68FE] shrink-0">
                    {mode === 'ai' ? <Video className="w-4.5 h-4.5" /> : <UploadCloud className="w-4.5 h-4.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-[#2F68FE] break-all">{file ? file.name : mode === 'ai' ? 'Add video' : 'Add file'}</span>
                    <span className="block text-[11px] text-slate-400">
                      {mode === 'document' ? 'PDF, DOC, DOCX, XLS, XLSX, CSV' : `MP4, WebM, MOV, AVI (max ${MAX_VIDEO_MB}MB)`}
                    </span>
                  </span>
                </button>
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
