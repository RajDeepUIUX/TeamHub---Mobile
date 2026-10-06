import React, { useState } from 'react';
import { ArrowLeft, Clock3, Pencil } from 'lucide-react';
import { FlexRequest } from '../../types/workTiming';
import { CURRENT_SHIFT } from '../../data/workTimingData';
import { SegmentedTabs } from '../../design-system/components/SegmentedTabs';
import { FlexRequestCard } from './FlexRequestCard';
import { TeamWorkTimingView } from './TeamWorkTimingView';
import type { FlexDecision } from './FlexReviewSheet';
import { CommentThreadSheet } from '../common/CommentThreadSheet';
import { FlexRequestDetailView } from './FlexRequestDetailView';

interface WorkTimingViewProps {
  firstName: string;
  requests: FlexRequest[];
  onBack: () => void;
  onRequestFlexibility: () => void;
  /** Edit a pending request (not available once approved / rejected) */
  onEdit: (request: FlexRequest) => void;
  /** Signed-in user (their comments appear on the right) */
  currentUser: string;
  onComment: (id: string, text: string) => void;
  onDownloadAgreement: (request: FlexRequest) => void;
  /** Present for managers: enables the "Team's Work Timing" tab */
  team?: {
    requests: FlexRequest[];
    onReview: (ids: string[], decision: FlexDecision, comment: string) => void;
  };
}

/** Minimal themed illustration: a friendly clock with a coffee cup and sparkles */
const FlexClockIllustration: React.FC = () => (
  <svg viewBox="0 0 200 160" className="w-52 h-auto" role="img" aria-label="A clock and a coffee cup">
    <defs>
      <linearGradient id="wt-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#F5F3FF" />
      </linearGradient>
      <linearGradient id="wt-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5B7BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="84" rx="82" ry="64" fill="url(#wt-bg)" />
    <ellipse cx="100" cy="144" rx="60" ry="5" fill="#E0E7FF" />

    {/* Clock */}
    <circle cx="96" cy="78" r="44" fill="#FFFFFF" stroke="url(#wt-ring)" strokeWidth="6" />
    {[0, 90, 180, 270].map((deg) => (
      <rect key={deg} x="94.5" y="40" width="3" height="7" rx="1.5" fill="#C7D2FE" transform={`rotate(${deg} 96 78)`} />
    ))}
    {/* Hands at a relaxed 10:10 */}
    <line x1="96" y1="78" x2="80" y2="66" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" />
    <line x1="96" y1="78" x2="116" y2="60" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
    <circle cx="96" cy="78" r="4.5" fill="#1E1B4B" />
    {/* Flexible arc (shift window) */}
    <path d="M60 106a44 44 0 0 1-8-20" fill="none" stroke="#6EE7B7" strokeWidth="6" strokeLinecap="round" />

    {/* Coffee cup */}
    <path d="M140 110h26v14a10 10 0 0 1-10 10h-6a10 10 0 0 1-10-10v-14Z" fill="#FFFFFF" stroke="#E0E7FF" strokeWidth="2" />
    <path d="M166 114h4a6 6 0 0 1 0 12h-4" fill="none" stroke="#E0E7FF" strokeWidth="2" />
    <path d="M148 102c0-4 4-4 4-8M156 102c0-4 4-4 4-8" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />

    {/* Sparkles */}
    <path d="M40 44l1.8 4.2L46 50l-4.2 1.8L40 56l-1.8-4.2L34 50l4.2-1.8L40 44Z" fill="#A78BFA" opacity="0.75" />
    <path d="M160 48l1.5 3.5L165 53l-3.5 1.5L160 58l-1.5-3.5L155 53l3.5-1.5L160 48Z" fill="#7DD3FC" opacity="0.85" />
    <circle cx="34" cy="112" r="2.5" fill="#C4B5FD" />
  </svg>
);

export const WorkTimingView: React.FC<WorkTimingViewProps> = ({
  firstName,
  requests,
  onBack,
  onRequestFlexibility,
  onEdit,
  currentUser,
  onComment,
  onDownloadAgreement,
  team,
}) => {
  const [tab, setTab] = useState<'mine' | 'team'>(team ? 'team' : 'mine');
  const [commentId, setCommentId] = useState<string | null>(null);
  const commentRequest = commentId ? requests.find((r) => r.id === commentId) ?? null : null;
  // Full details screen (looked up live so edits, decisions and comments show immediately)
  const [detail, setDetail] = useState<{ id: string; viewer: 'manager' | 'staff' } | null>(null);
  const detailRequest = detail
    ? (detail.viewer === 'manager' ? team?.requests : requests)?.find((r) => r.id === detail.id) ?? null
    : null;

  if (detail && detailRequest) {
    return (
      <FlexRequestDetailView
        request={detailRequest}
        viewer={detail.viewer}
        currentUser={currentUser}
        onBack={() => setDetail(null)}
        onComment={onComment}
        onDownloadAgreement={onDownloadAgreement}
        onReview={detail.viewer === 'manager' ? team?.onReview : undefined}
        onEdit={
          detail.viewer === 'staff'
            ? (req) => {
                setDetail(null);
                onEdit(req);
              }
            : undefined
        }
      />
    );
  }
  const showTeam = Boolean(team) && tab === 'team';
  const pendingTeam = team ? team.requests.filter((r) => r.status === 'Pending').length : 0;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4 relative">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold screen-title">Work Timing</h1>
        </div>
        {team && (
          <div className="px-4 pb-3">
            <SegmentedTabs
              ariaLabel="Work timing view"
              value={tab}
              onChange={setTab}
              options={[
                { id: 'mine', label: 'My Work Timing' },
                { id: 'team', label: "Team's Requests", badge: pendingTeam },
              ]}
            />
          </div>
        )}
      </header>

      {showTeam && team ? (
        <TeamWorkTimingView
          requests={team.requests}
          onReview={team.onReview}
          currentUser={currentUser}
          onComment={onComment}
          onOpenDetails={(id) => setDetail({ id, viewer: 'manager' })}
        />
      ) : requests.length === 0 ? (
        <div className="flex-1 overflow-y-auto no-scrollbar px-6">
          <div className="min-h-full flex flex-col items-center justify-center text-center py-10">
            <FlexClockIllustration />
            <h2 className="mt-6 text-xl font-extrabold tracking-tight text-[#1E1B4B]">Your time, your rhythm, {firstName} ⏰</h2>
            <p className="mt-2 text-[13px] text-slate-500 leading-relaxed max-w-[290px]">
              No flexibility requests yet. Need a different shift, early logout, or a few hybrid days? Ask for what helps you
              do your best work.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[11px] font-semibold text-slate-500 shadow-2xs">
              <Clock3 className="w-3.5 h-3.5 text-[#2F68FE]" />
              Current shift: {CURRENT_SHIFT}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs text-xs">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
              <Clock3 className="w-4.5 h-4.5" />
            </span>
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Current shift</span>
              <span className="block font-bold text-[#1E293B]">{CURRENT_SHIFT}</span>
            </span>
          </div>

          <h3 className="px-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Your requests ({requests.length})
          </h3>
          {requests.map((r) => (
            <FlexRequestCard
              key={r.id}
              request={r}
              onOpenComments={() => setCommentId(r.id)}
              onOpen={() => setDetail({ id: r.id, viewer: 'staff' })}
              actions={
                r.status === 'Pending' ? (
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    className="ml-auto h-9 px-3.5 rounded-xl border border-[#2F68FE]/30 bg-blue-50/60 text-[#2F68FE] text-[11px] font-bold flex items-center gap-1.5 active:bg-blue-100 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Request
                  </button>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      <CommentThreadSheet
        isOpen={Boolean(commentRequest)}
        subtitle={commentRequest ? `${commentRequest.type}${commentRequest.duration ? ` · ${commentRequest.duration}` : ''} · with your manager` : ''}
        comments={commentRequest?.comments ?? []}
        currentUser={currentUser}
        onClose={() => setCommentId(null)}
        onSend={(text) => commentId && onComment(commentId, text)}
      />

      {!showTeam && (
        <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={onRequestFlexibility}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            <Clock3 className="w-4 h-4" />
            Request Work Flexibility
          </button>
        </div>
      )}
    </div>
  );
};
