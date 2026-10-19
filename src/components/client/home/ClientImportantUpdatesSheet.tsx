import React, { useState } from 'react';
import { CheckCheck, CirclePlay, Megaphone, ThumbsDown, ThumbsUp, Vote, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { ClientImportantUpdate, ClientReaction } from '../data/clientDashboardData';
import { formatPostDate, isLongPost, PostBody, PostVideo, votePatch, votesLabel } from './ClientPostCard';

const KIND = {
  announcement: { label: 'Announcement', Icon: Megaphone, chip: 'bg-amber-50 text-[#D97706]' },
  poll: { label: 'Poll', Icon: Vote, chip: 'bg-violet-50 text-violet-600' },
  video: { label: 'Video', Icon: CirclePlay, chip: 'bg-rose-50 text-rose-600' },
} as const;

/** Poll with radio rows; after voting (or once closed) each row fills with its share */
const UpdatePoll: React.FC<{ poll: NonNullable<ClientImportantUpdate['poll']>; onVote: (optionId: string) => void }> = ({ poll, onVote }) => {
  const closed = new Date(`${poll.validTill}T23:59:59`) < new Date();
  const voted = Boolean(poll.selectedOptionId);
  const showResults = closed || voted;
  const total = poll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="mt-3 rounded-xl bg-[#F6F8FC] p-1.5 space-y-1.5">
      {poll.options.map((o) => {
        const pct = total ? Math.round((o.votes / total) * 100) : 0;
        const mine = o.id === poll.selectedOptionId;
        return (
          <button
            key={o.id}
            type="button"
            disabled={showResults}
            aria-pressed={mine}
            onClick={() => onVote(o.id)}
            className={`relative w-full min-h-11 px-3 py-2 rounded-lg bg-white border text-left overflow-hidden transition-colors ${
              mine ? 'border-[#2F68FE]' : 'border-transparent'
            } ${showResults ? 'cursor-default' : 'cursor-pointer active:border-slate-200'}`}
          >
            {showResults && (
              <span
                className={`absolute inset-y-0 left-0 transition-[width] duration-500 ${mine ? 'bg-blue-50' : 'bg-slate-100'}`}
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
            )}
            <span className="relative flex items-center gap-2.5">
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${mine ? 'border-[#2F68FE]' : 'border-slate-300'}`}
                aria-hidden="true"
              >
                {mine && <span className="w-1.5 h-1.5 rounded-full bg-[#2F68FE]" />}
              </span>
              <span className={`flex-1 text-[12.5px] ${mine ? 'font-bold text-[#2F68FE]' : 'font-semibold text-slate-700'}`}>{o.label}</span>
              {showResults && <span className="shrink-0 text-[11px] font-bold text-[#1E293B] tabular-nums">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <div className="flex items-center justify-between px-1.5 pt-0.5 pb-0.5 text-[10.5px] text-slate-400">
        <span>{closed ? 'Poll closed' : voted ? 'Thanks for voting' : 'Tap an option to vote'}</span>
        <span className="tabular-nums">{votesLabel(total)}</span>
      </div>
    </div>
  );
};

const Feedback: React.FC<{ reaction: ClientReaction; onReact: (r: ClientReaction) => void }> = ({ reaction, onReact }) => (
  <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between gap-3">
    <span className="text-[11px] font-medium text-slate-400">{reaction ? 'Thanks for your feedback' : 'Was this helpful?'}</span>
    <div className="flex items-center gap-1.5">
      {(['like', 'dislike'] as const).map((r) => {
        const on = reaction === r;
        const Icon = r === 'like' ? ThumbsUp : ThumbsDown;
        return (
          <button
            key={r}
            type="button"
            aria-pressed={on}
            aria-label={r === 'like' ? 'Like' : 'Dislike'}
            onClick={() => onReact(on ? null : r)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              on ? (r === 'like' ? 'bg-[#2F68FE] text-white' : 'bg-rose-500 text-white') : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  </div>
);

const UpdateCard: React.FC<{ update: ClientImportantUpdate; unread: boolean; onUpdate: (patch: Partial<ClientImportantUpdate>) => void }> = ({
  update,
  unread,
  onUpdate,
}) => {
  const [expanded, setExpanded] = useState(false);
  const long = isLongPost(update);
  const kind = KIND[update.poll ? 'poll' : update.video ? 'video' : 'announcement'];

  return (
    <article className="relative bg-white rounded-2xl border border-[#E6ECF5] p-4 shadow-2xs overflow-hidden">
      {unread && <span className="absolute left-0 top-4 h-6 w-[3px] rounded-r-full bg-[#2F68FE]" aria-label="Unread" />}
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10.5px] font-bold ${kind.chip}`}>
          <kind.Icon className="w-3 h-3" />
          {kind.label}
        </span>
        <span className="text-[10.5px] text-slate-400">{formatPostDate(update.publishDate)}</span>
      </div>

      <h3 className={`mt-2.5 text-[14.5px] leading-snug ${unread ? 'font-extrabold text-[#1E293B]' : 'font-bold text-slate-700'}`}>{update.title}</h3>

      <div className="mt-1.5">
        <div className={long && !expanded ? 'relative max-h-[132px] overflow-hidden' : ''}>
          <PostBody text={update.description} />
          {long && !expanded && <span className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-white to-transparent" aria-hidden="true" />}
        </div>
        {long && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-[11.5px] font-semibold text-[#2F68FE] cursor-pointer">
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {update.video && <PostVideo video={update.video} />}
      {update.poll && <UpdatePoll poll={update.poll} onVote={(optionId) => onUpdate(votePatch(update, optionId))} />}

      <Feedback reaction={update.reaction} onReact={(reaction) => onUpdate({ reaction })} />
    </article>
  );
};

interface ClientImportantUpdatesSheetProps {
  isOpen: boolean;
  updates: ClientImportantUpdate[];
  /** All updates were marked as read (desktop action 2); Skip keeps them for the next login (action 1) */
  allRead: boolean;
  onUpdate: (id: string, patch: Partial<ClientImportantUpdate>) => void;
  onMarkAllRead: () => void;
  onSkip: () => void;
}

/** Desktop "Important Updates" popup → bottom sheet: posts with like / dislike and polls, Skip or Mark As Read */
export const ClientImportantUpdatesSheet: React.FC<ClientImportantUpdatesSheetProps> = ({
  isOpen,
  updates,
  allRead,
  onUpdate,
  onMarkAllRead,
  onSkip,
}) => (
  <BottomSheet isOpen={isOpen} onClose={onSkip} maxHeight="max-h-[88%]">
    <div className="rounded-t-[28px] bg-linear-to-b from-[#FFF7E6] to-white shrink-0">
      <div className="pt-3 pb-1 flex justify-center">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start gap-3 px-5 pt-2 pb-4">
        <span className="w-11 h-11 rounded-2xl bg-linear-to-br from-[#FBBF24] to-[#F59E0B] text-white flex items-center justify-center shadow-md shadow-amber-200/70 shrink-0">
          <Megaphone className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-extrabold text-[#1E293B] leading-tight">Important Updates</h2>
            {!allRead && updates.length > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#2F68FE] text-white text-[10.5px] font-bold flex items-center justify-center">
                {updates.length}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            {allRead ? "You're all caught up" : `${updates.length} new ${updates.length === 1 ? 'update' : 'updates'} for you`}
          </p>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="w-8 h-8 rounded-full bg-white/80 border border-slate-200 flex items-center justify-center text-slate-500 active:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-[#F5F7FB] px-4 py-4 space-y-3">
      {updates.map((u) => (
        <UpdateCard key={u.id} update={u} unread={!allRead} onUpdate={(patch) => onUpdate(u.id, patch)} />
      ))}
      {updates.length === 0 && (
        <div className="py-12 flex flex-col items-center text-center">
          <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Megaphone className="w-6 h-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#1E293B]">No updates yet.</p>
          <p className="mt-1 text-xs text-slate-500">Important announcements will show up here.</p>
        </div>
      )}
    </div>

    <div className="px-4 pt-3 pb-6 bg-white shadow-[0_-6px_16px_rgba(15,23,42,0.05)] shrink-0">
      {allRead || updates.length === 0 ? (
        <button
          type="button"
          onClick={onSkip}
          className="w-full h-12 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 flex items-center justify-center gap-2 active:bg-slate-50 cursor-pointer"
        >
          <CheckCheck className="w-4 h-4 text-[#059669]" />
          Close
        </button>
      ) : (
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onSkip}
            className="h-12 px-6 rounded-xl text-xs font-bold text-slate-500 active:bg-slate-100 cursor-pointer"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onMarkAllRead}
            className="flex-1 h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-200 active:bg-[#2558E6] transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Mark As Read
          </button>
        </div>
      )}
    </div>
  </BottomSheet>
);
