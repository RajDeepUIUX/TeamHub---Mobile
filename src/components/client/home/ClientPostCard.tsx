import React, { useState } from 'react';
import { Briefcase, CalendarDays, Check, Lightbulb, LucideIcon, PartyPopper, Play, Rocket, Settings2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ClientFeedPost, ClientFeedTab, ClientPost, ClientReaction, ClientVideo } from '../data/clientDashboardData';
import { ClientVideoModal, youtubeThumbUrl } from './ClientVideoModal';

/** One icon per feed category (one tile colour; categories differ by icon) */
export const FEED_TAB_ICON: Record<ClientFeedTab, LucideIcon> = {
  'HRMS Feature Updates': Rocket,
  'Operational Updates': Settings2,
  'Best Practices & Insights': Lightbulb,
  'Services & Solutions': Briefcase,
  'Events & Celebrations': PartyPopper,
};

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
  <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
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

const Reactions: React.FC<{ reaction: ClientReaction; onReact: (r: ClientReaction) => void }> = ({ reaction, onReact }) => (
  <div className="w-full grid grid-cols-2 gap-2">
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
          className={`h-9 rounded-xl border flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
            on
              ? `font-bold ${r === 'like' ? 'bg-blue-50 border-blue-200 text-[#2F68FE]' : 'bg-rose-50 border-rose-200 text-rose-600'}`
              : 'bg-white border-slate-200 font-semibold text-slate-500 active:bg-slate-50'
          }`}
        >
          <Icon className={`w-3.5 h-3.5 ${on ? 'fill-current/15' : ''}`} />
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
              <span className={`flex items-center gap-1.5 text-xs ${mine ? 'font-bold text-[#2F68FE]' : 'font-semibold text-slate-700'}`}>
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
      <p className="text-[10px] font-medium text-slate-400">
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
        className="mt-3 relative block w-full aspect-video rounded-xl overflow-hidden bg-slate-700 text-left cursor-pointer active:scale-[0.99] transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
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
          <span className="block text-[10px] text-white/75">{video.channel}</span>
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-14 h-10 rounded-xl bg-[#FF0000] flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-white fill-white" />
          </span>
        </span>
        <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/60 text-[10px] font-semibold text-white">
          Watch on YouTube
        </span>
      </button>
      <ClientVideoModal video={playing ? video : null} onClose={() => setPlaying(false)} />
    </>
  );
};

interface ClientPostCardProps {
  post: ClientFeedPost;
  unread?: boolean;
  onUpdate: (patch: Partial<ClientPost>) => void;
}

/** Feed post (record card): date / title, expandable text, YouTube card, poll, like / dislike */
export const ClientPostCard: React.FC<ClientPostCardProps> = ({ post, unread, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const long = isLongPost(post);

  return (
    <article className="relative bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] overflow-hidden">
      <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md bg-slate-50 text-[11px] font-medium text-slate-500 tabular-nums">
        <CalendarDays className="w-3 h-3" aria-hidden="true" />
        {formatPostDate(post.publishDate)}
      </span>
      <h3 className={`mt-2.5 text-[15px] leading-snug ${unread ? 'font-bold text-[#1E293B]' : 'font-semibold text-slate-700'}`}>{post.title}</h3>

      <div className="mt-2">
        <div className={long && !expanded ? 'relative max-h-[132px] overflow-hidden' : ''}>
          <PostBody text={post.description} />
          {long && !expanded && <span className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-white to-transparent" aria-hidden="true" />}
        </div>
        {long && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-[11px] font-bold text-[#2F68FE] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {post.video && <PostVideo video={post.video} />}

      {post.poll && <Poll poll={post.poll} onVote={(optionId) => onUpdate(votePatch(post, optionId))} />}

      <div className="mt-4 pt-3 border-t border-slate-100">
        <Reactions reaction={post.reaction} onReact={(reaction) => onUpdate({ reaction })} />
      </div>
    </article>
  );
};
