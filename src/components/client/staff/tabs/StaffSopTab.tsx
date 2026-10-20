import React, { useState } from 'react';
import { CheckCircle2, Eye, FileText, MessageSquare, Pencil, Send, Trash2, Video } from 'lucide-react';
import { CommentThreadSheet } from '../../../common/CommentThreadSheet';
import { formatStaffDate } from '../../data/clientStaffData';
import { SOP_DECISIONS, SopRecord, SopStatus } from '../../data/clientStaffProfileData';
import { Card, ConfirmSheet, EmptyCard, FieldGrid, Pill, Tone, useNotice } from './StaffTabParts';
import { useClientPermission } from '../../context/ClientPermissionContext';

interface StaffSopTabProps {
  staffName: string;
  clientName: string;
  sops: SopRecord[];
  onChange: (next: SopRecord[]) => void;
}

type Confirm =
  | { kind: 'delete'; sop: SopRecord }
  | { kind: 'publish'; sop: SopRecord }
  | { kind: 'status'; sop: SopRecord; status: Exclude<SopStatus, 'Pending'> }
  | null;

const STATUS_TONE: Record<SopStatus, Tone> = { Pending: 'amber', Approved: 'green', Rejected: 'rose', 'Not Required': 'slate' };
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Desktop "SOP" tab (sop_tab.tpl): status decision, feedback, view, delete, publish */
export const StaffSopTab: React.FC<StaffSopTabProps> = ({ staffName, clientName, sops, onChange }) => {
  const [notice, showNotice] = useNotice();
  const perm = useClientPermission('my-staff');
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);

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
            return (
              <Card key={s.id} className="p-3.5">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.kind === 'ai' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#FEF2F2] text-rose-500'}`}
                  >
                    {s.kind === 'ai' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10.5px] text-slate-400">SOP Name</p>
                    <p className="mt-0.5 text-[13px] font-bold text-[#1E293B] leading-snug">{s.name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10.5px] text-slate-400">Status</p>
                    <div className="mt-0.5">
                      <Pill tone={STATUS_TONE[s.status]}>{s.status}</Pill>
                    </div>
                  </div>
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

                <p className="mt-3 pt-3 border-t border-slate-100 text-[10.5px] text-slate-400">Action</p>
                <div className="mt-1.5 flex items-center gap-2">
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
