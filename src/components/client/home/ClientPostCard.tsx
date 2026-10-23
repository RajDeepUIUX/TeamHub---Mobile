import React, { useState } from 'react';
import { CalendarDays, Check, Play, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ClientPost, ClientReaction, ClientVideo } from '../data/clientDashboardData';
import { ClientVideoModal, youtubeThumbUrl } from './ClientVideoModal';

/** "1 vote" / "12 votes" */
export const votesLabel = (n: number) => `${n} ${n === 1 ? 'vote' : 'votes'}`;

export const formatPostDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

/** Applies a vote to a post's poll (one vote per poll) */
export const votePatch = (post: ClientPost, optionId: string): Partial<ClientPost> =>
  post.poll
    ? {
        poll: {
          ...post.poll,
          selectedOptionId: optionId,
          options: post.poll.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)),
        },
      }
    : {};

/** Inline markup: **bold**, *italic*, [label](url) */
const Inline: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text
      .split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g)
      .filter(Boolean)
      .map((part, i) => {
        if (part.startsWith('**')) return <strong key={i} className="font-semibold text-[#1E293B]">{part.slice(2, -2)}</strong>;
        if (part.startsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          return (
            <a key={i} href={link[2]} target="_blank" rel="noreferrer" className="font-medium text-[#2F68FE] underline underline-offset-2">
              {link[1]}
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
  </>
);

/** Long posts (desktop shows them in full) start collapsed with a fade */
export const isLongPost = (post: ClientPost) => post.description.length > 220 || post.description.split(/\n\s*\n/).length > 3;

/** Desktop post body: paragraphs (blank line), "- " bullets, line breaks kept */
export const PostBody: React.FC<{ text: string }> = ({ text }) => (
  <div className="space-y-2.5 text-[12.5px] text-slate-600 leading-relaxed">
    {text.split(/\n\s*\n/).map((block, bi) => {
      // A block can mix bullets and plain lines (e.g. a list followed by one closing line)
      const groups: { list: boolean; lines: string[] }[] = [];
      block.split('\n').forEach((line) => {
        const list = line.startsWith('- ');
        const last = groups[groups.length - 1];
        if (last && last.list === list) last.lines.push(list ? line.slice(2) : line);
        else groups.push({ list, lines: [list ? line.slice(2) : line] });
      });
      return (
        <div key={bi}>
          {groups.map((g, gi) =>
            g.list ? (
              <ul key={gi} className="space-y-1 pl-4 list-disc marker:text-slate-300">
                {g.lines.map((l, li) => (
                  <li key={li}>
                    <Inline text={l} />
                  </li>
                ))}
              </ul>
            ) : (
              <p key={gi}>
                {g.lines.map((l, li) => (
                  <React.Fragment key={li}>
                    {li > 0 && <br />}
                    <Inline text={l} />
                  </React.Fragment>
                ))}
              </p>
            )
          )}
        </div>
      );
    })}
  </div>
);

const Reactions: React.FC<{ reaction: ClientReaction; onReact: (r: ClientReaction) => void; full?: boolean }> = ({ reaction, onReact, full }) => (
  <div className={`flex items-center gap-2 ${full ? 'w-full' : ''}`}>
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
          className={`${full ? 'flex-1 h-9 rounded-xl justify-center' : 'h-8 px-2.5 rounded-full'} border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
            on
              ? r === 'like'
                ? 'border-[#2F68FE] bg-blue-50 text-[#2F68FE]'
                : 'border-rose-300 bg-rose-50 text-rose-600'
              : 'border-slate-200 bg-white text-slate-500'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {r === 'like' ? 'Like' : 'Dislike'}
        </button>
      );
    })}
  </div>
);

const Poll: React.FC<{ poll: NonNullable<ClientPost['poll']>; onVote: (optionId: string) => void }> = ({ poll, onVote }) => {
  const closed = new Date(`${poll.validTill}T23:59:59`) < new Date();
  const voted = Boolean(poll.selectedOptionId);
  const showResults = closed || voted;
  const total = poll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="mt-3 space-y-2">
      {poll.options.map((o) => {
        const pct = total ? Math.round((o.votes / total) * 100) : 0;
        const mine = o.id === poll.selectedOptionId;
        return (
          <button
            key={o.id}
            type="button"
            disabled={showResults}
            onClick={() => onVote(o.id)}
            className={`relative w-full min-h-11 px-3 py-2 rounded-xl border text-left overflow-hidden transition-colors ${
              mine ? 'border-[#2F68FE]' : 'border-slate-200'
            } ${showResults ? 'cursor-default' : 'cursor-pointer active:bg-slate-50'}`}
          >
            {showResults && (
              <span
                className={`absolute inset-y-0 left-0 transition-[width] duration-500 ${mine ? 'bg-blue-50' : 'bg-slate-100/80'}`}
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
            )}
            <span className="relative flex items-center justify-between gap-3">
              <span className={`flex items-center gap-1.5 text-[12.5px] ${mine ? 'font-bold text-[#2F68FE]' : 'font-semibold text-slate-700'}`}>
                {mine && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                {o.label}
              </span>
              {showResults && (
                <span className="shrink-0 text-[11px] text-slate-500 tabular-nums">
                  {votesLabel(o.votes)} · <span className="font-bold text-[#1E293B]">{pct}%</span>
                </span>
              )}
            </span>
          </button>
        );
      })}
      <p className="text-[10.5px] text-slate-400">
        {closed ? 'Poll closed' : voted ? 'Thanks for voting' : 'Tap an option to vote'} · {votesLabel(total)}
      </p>
    </div>
  );
};

/** YouTube card (real thumbnail, gradient fallback) that plays in a modal */
export const PostVideo: React.FC<{ video: ClientVideo }> = ({ video }) => {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="mt-3 relative block w-full aspect-video rounded-xl overflow-hidden bg-linear-to-br from-[#0F172A] via-[#334155] to-[#64748B] text-left cursor-pointer active:scale-[0.99] transition-transform"
        aria-label={`Play video: ${video.title}`}
      >
        {thumbFailed ? (
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.25),transparent_55%)]" aria-hidden="true" />
        ) : (
          <img
            src={youtubeThumbUrl(video.youtubeId)}
            alt=""
            loading="lazy"
            onError={() => setThumbFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        )}
        <span className="absolute top-0 inset-x-0 p-3 bg-linear-to-b from-black/60 to-transparent">
          <span className="block text-[13px] font-bold text-white leading-tight">{video.title}</span>
          <span className="block text-[10.5px] text-white/75">{video.channel}</span>
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-14 h-10 rounded-xl bg-[#FF0000] flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-white fill-white" />
          </span>
        </span>
        <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/60 text-[10.5px] font-semibold text-white">
          Watch on YouTube
        </span>
      </button>
      <ClientVideoModal video={playing ? video : null} onClose={() => setPlaying(false)} />
    </>
  );
};

interface ClientPostCardProps {
  post: ClientPost;
  unread?: boolean;
  /** Dashboard design version (V2 = date chip, accent stripe, full-width reactions) */
  variant?: 'V1' | 'V2';
  onUpdate: (patch: Partial<ClientPost>) => void;
}

/** Dashboard post: title + date, expandable text, YouTube card, poll, like / dislike */
export const ClientPostCard: React.FC<ClientPostCardProps> = ({ post, unread, variant = 'V1', onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const long = isLongPost(post);

  const body = (
    <>
      <div className={long && !expanded ? 'relative max-h-[132px] overflow-hidden' : ''}>
        <PostBody text={post.description} />
        {long && !expanded && <span className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-white to-transparent" aria-hidden="true" />}
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[11.5px] font-semibold text-[#2F68FE] cursor-pointer"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </>
  );

  if (variant === 'V2') {
    return (
      <article
        className={`relative overflow-hidden bg-white border rounded-3xl p-4 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] ${unread ? 'border-[#C7D7FE]' : 'border-[#EBF0F7]'}`}
      >
        {unread && <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-linear-to-b from-[#2F68FE] to-[#4F46E5]" aria-hidden="true" />}
        <div className="flex items-center justify-between gap-2">
          <span className="h-6 px-2 rounded-full bg-[#EEF2FF] text-[10.5px] font-semibold text-[#2F68FE] flex items-center gap-1">
            <CalendarDays className="w-3 h-3" aria-hidden="true" />
            {formatPostDate(post.publishDate)}
          </span>
          {unread && <span className="w-2 h-2 rounded-full bg-[#2F68FE] shrink-0" aria-label="Unread" />}
        </div>
        <h3 className={`mt-2.5 text-[14.5px] leading-snug ${unread ? 'font-extrabold text-[#1E293B]' : 'font-bold text-slate-700'}`}>{post.title}</h3>

        <div className="mt-2">{body}</div>

        {post.video && <PostVideo video={post.video} />}

        {post.poll && <Poll poll={post.poll} onVote={(optionId) => onUpdate(votePatch(post, optionId))} />}

        <div className="mt-3 pt-3 border-t border-slate-100">
          <Reactions reaction={post.reaction} onReact={(reaction) => onUpdate({ reaction })} full />
        </div>
      </article>
    );
  }

  return (
    <article className={`bg-white border rounded-2xl p-4 shadow-2xs ${unread ? 'border-blue-100' : 'border-[#EBF0F7]'}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className={`text-[14px] leading-snug ${unread ? 'font-extrabold text-[#1E293B]' : 'font-bold text-slate-700'}`}>{post.title}</h3>
        <span className="flex items-center gap-1.5 pt-0.5 text-[10.5px] text-slate-400 shrink-0">
          {unread && <span className="w-1.5 h-1.5 rounded-full bg-[#2F68FE]" aria-label="Unread" />}
          {formatPostDate(post.publishDate)}
        </span>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100">{body}</div>

      {post.video && <PostVideo video={post.video} />}

      {post.poll && <Poll poll={post.poll} onVote={(optionId) => onUpdate(votePatch(post, optionId))} />}

      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
        <Reactions reaction={post.reaction} onReact={(reaction) => onUpdate({ reaction })} />
      </div>
    </article>
  );
};
