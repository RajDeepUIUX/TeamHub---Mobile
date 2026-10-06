import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Newspaper,
  Info,
  AlertTriangle,
  ShieldAlert,
  PlayCircle,
  FileText,
  CalendarDays,
  Clock3,
  Mic,
} from 'lucide-react';
import { FEED_CATEGORIES, FeedBlock, FeedCategory, FeedPost, FeedReaction } from '../../data/companyFeedData';

/* ------------------------------- Helpers ------------------------------- */

const formatFeedDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

const CATEGORY_TINT: Record<FeedCategory, string> = {
  General: 'bg-blue-50 text-[#2F68FE]',
  'HR & Admin': 'bg-rose-50 text-rose-600',
  'Learning & Growth': 'bg-emerald-50 text-emerald-600',
  'Best Practices': 'bg-amber-50 text-amber-700',
  'Employee Hub': 'bg-violet-50 text-violet-600',
  'Internal Jobs & Opportunities': 'bg-cyan-50 text-cyan-700',
};

/** Renders **bold** and [label](href); `app:profile` links call onOpenProfile */
const RichText: React.FC<{ text: string; onOpenProfile?: () => void }> = ({ text, onOpenProfile }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**')) return <strong key={i} className="font-semibold text-[#1E293B]">{part.slice(2, -2)}</strong>;
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const [, label, href] = link;
          if (href === 'app:profile') {
            return (
              <button key={i} type="button" onClick={onOpenProfile} className="font-semibold text-[#2F68FE] underline underline-offset-2 cursor-pointer">
                {label}
              </button>
            );
          }
          return (
            <a key={i} href={href} target="_blank" rel="noreferrer" className="font-medium text-[#2F68FE] underline underline-offset-2 break-all">
              {label}
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};

/** One content block of a post */
const Block: React.FC<{ block: FeedBlock; onOpenProfile?: () => void }> = ({ block: b, onOpenProfile }) => {
  const rt = (text: string) => <RichText text={text} onOpenProfile={onOpenProfile} />;
  switch (b.t) {
    case 'p':
      return <p>{rt(b.text)}</p>;
    case 'h':
      return (
        <h3 className="pt-1 text-[15px] font-bold text-[#1E293B] flex items-center gap-1.5">
          {b.emoji && <span aria-hidden="true">{b.emoji}</span>}
          {b.text}
        </h3>
      );
    case 'ul':
      return (
        <ul className="space-y-1.5 pl-4 list-disc marker:text-slate-300">
          {b.items.map((item) => (
            <li key={item}>{rt(item)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="space-y-2">
          {b.items.map((item, i) => (
            <li key={item.text} className="flex gap-2.5">
              <span className="w-5 h-5 mt-px rounded-full bg-blue-50 text-[#2F68FE] text-[10.5px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="min-w-0">
                {rt(item.text)}
                {item.sub && (
                  <ul className="mt-1.5 space-y-1 pl-4 list-[circle] marker:text-slate-300">
                    {item.sub.map((s) => (
                      <li key={s}>{rt(s)}</li>
                    ))}
                  </ul>
                )}
              </span>
            </li>
          ))}
        </ol>
      );
    case 'kv':
      return (
        <dl className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100">
          {b.rows.map(([k, v]) => (
            <div key={k} className="flex gap-3 px-3 py-2">
              <dt className="w-28 shrink-0 text-slate-400 text-[12px]">{k}</dt>
              <dd className="font-semibold text-[#1E293B]">{v}</dd>
            </div>
          ))}
        </dl>
      );
    case 'callout': {
      const tone = {
        info: { box: 'bg-blue-50/70 border-blue-100 text-[#1E3A8A]', icon: Info },
        warn: { box: 'bg-amber-50 border-amber-100 text-amber-900', icon: AlertTriangle },
        danger: { box: 'bg-rose-50 border-rose-100 text-rose-900', icon: ShieldAlert },
      }[b.tone];
      const Icon = tone.icon;
      return (
        <div className={`flex gap-2.5 p-3 rounded-xl border ${tone.box}`}>
          <Icon className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="min-w-0">
            {b.title && <p className="font-bold">{b.title}</p>}
            <p className={b.title ? 'mt-0.5' : ''}>{rt(b.text)}</p>
          </div>
        </div>
      );
    }
    case 'banner':
      return (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#1D4ED8] via-[#2F68FE] to-[#6366F1] p-4 text-white">
          <span className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" aria-hidden="true" />
          <span className="absolute right-6 bottom-[-30px] w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{b.eyebrow}</p>
          <p className="mt-1 text-lg font-extrabold leading-tight">{b.title}</p>
          <p className="mt-1 text-[12.5px] italic text-white/90">{b.subtitle}</p>
          <div className="relative mt-3 grid grid-cols-2 gap-2">
            {b.meta.map(([k, v], i) => (
              <div key={k} className="rounded-xl bg-white/15 px-2.5 py-2">
                <span className="flex items-center gap-1 text-[10px] text-white/70">
                  {i === 0 ? <CalendarDays className="w-3 h-3" /> : <Clock3 className="w-3 h-3" />}
                  {k}
                </span>
                <span className="block text-[11.5px] font-bold">{v}</span>
              </div>
            ))}
          </div>
          {b.speaker && (
            <p className="relative mt-3 flex items-center gap-1.5 text-[11.5px]">
              <Mic className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/75">Speaker</span>
              <span className="font-bold">{b.speaker}</span>
            </p>
          )}
        </div>
      );
    case 'attachment':
      return (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
          <span className="w-9 h-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            {b.kind === 'video' ? <PlayCircle className="w-4.5 h-4.5" /> : <FileText className="w-4.5 h-4.5" />}
          </span>
          <span className="min-w-0">
            <span className="block text-[12.5px] font-semibold text-[#1E293B] truncate">{b.name}</span>
            <span className="block text-[11px] text-slate-400">{b.kind === 'video' ? 'Video' : 'Document'} · Tap to open</span>
          </span>
        </div>
      );
    case 'sign':
      return (
        <p className="pt-1 text-slate-500">
          {b.lines.map((line, i) => (
            <span key={line} className={`block ${i === b.lines.length - 1 ? 'font-semibold text-[#1E293B]' : ''}`}>
              {line}
            </span>
          ))}
        </p>
      );
  }
};

/** 👍 / 👎 toggles with counts (the user's own reaction is included in the count) */
const Reactions: React.FC<{ post: FeedPost; reaction: FeedReaction; onReact: (r: FeedReaction) => void; compact?: boolean }> = ({
  post,
  reaction,
  onReact,
  compact,
}) => {
  const likes = post.likes + (reaction === 'like' ? 1 : 0);
  const dislikes = post.dislikes + (reaction === 'dislike' ? 1 : 0);
  const base = compact ? 'h-8 px-2.5 text-[11px]' : 'h-10 px-4 text-xs';
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={reaction === 'like'}
        onClick={(e) => {
          e.stopPropagation();
          onReact(reaction === 'like' ? null : 'like');
        }}
        className={`${base} rounded-full border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 ${
          reaction === 'like' ? 'border-[#2F68FE] bg-blue-50 text-[#2F68FE]' : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <ThumbsUp className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span className="tabular-nums">{likes}</span>
      </button>
      <button
        type="button"
        aria-pressed={reaction === 'dislike'}
        onClick={(e) => {
          e.stopPropagation();
          onReact(reaction === 'dislike' ? null : 'dislike');
        }}
        className={`${base} rounded-full border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 ${
          reaction === 'dislike' ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <ThumbsDown className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span className="tabular-nums">{dislikes}</span>
      </button>
    </div>
  );
};

/* -------------------------------- List -------------------------------- */

interface CompanyFeedViewProps {
  posts: FeedPost[];
  reactions: Record<string, FeedReaction>;
  category: FeedCategory;
  onCategoryChange: (c: FeedCategory) => void;
  onBack: () => void;
  onOpenPost: (post: FeedPost) => void;
  onReact: (postId: string, reaction: FeedReaction) => void;
}

/** "What's Happening Around!" — same for every role */
export const CompanyFeedView: React.FC<CompanyFeedViewProps> = ({
  posts,
  reactions,
  category,
  onCategoryChange,
  onBack,
  onOpenPost,
  onReact,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const tabsRef = useRef<HTMLDivElement>(null);

  // Keep the active tab in view when it changes
  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [category]);

  const q = query.trim().toLowerCase();
  const visible = posts
    .filter((p) => (q ? true : p.category === category))
    .filter((p) => !q || p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date));
  const unreadIn = (c: FeedCategory) => posts.filter((p) => p.category === c && p.unread).length;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center justify-between h-14 px-4 relative">
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div className="screen-title screen-title-tight">
              <h1 className="text-base font-bold leading-tight">Company Feed</h1>
              <p className="text-[10.5px] text-slate-400">What's happening around</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsSearching((s) => !s);
              setQuery('');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
              isSearching ? 'bg-blue-50 text-[#2F68FE]' : 'text-slate-600 active:bg-slate-100'
            }`}
            aria-label={isSearching ? 'Close search' : 'Search posts'}
          >
            {isSearching ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {isSearching && (
          <div className="px-4 pb-3 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search all posts..."
                className="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text"
              />
            </div>
          </div>
        )}

        {/* Category tabs (scroll sideways) */}
        {!q && (
          <div ref={tabsRef} className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-3" role="tablist" aria-label="Feed categories">
            {FEED_CATEGORIES.map((c) => {
              const on = c === category;
              const unread = unreadIn(c);
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => onCategoryChange(c)}
                  className={`shrink-0 h-8 pl-3 ${unread ? 'pr-1.5' : 'pr-3'} rounded-full text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                  }`}
                >
                  {c}
                  {unread > 0 && (
                    <span
                      className={`min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${
                        on ? 'bg-white text-[#2F68FE]' : 'bg-[#2F68FE] text-white'
                      }`}
                    >
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {q && (
          <p className="px-1 text-[11px] font-semibold text-slate-400">
            {visible.length} {visible.length === 1 ? 'result' : 'results'} for “{query.trim()}”
          </p>
        )}

        {visible.map((p) => (
          <article
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenPost(p)}
            onKeyDown={(e) => e.key === 'Enter' && onOpenPost(p)}
            className={`bg-white border rounded-2xl p-4 shadow-2xs active:scale-[0.99] transition-all cursor-pointer ${
              p.unread ? 'border-blue-100' : 'border-[#EBF0F7]'
            }`}
          >
            {/* The selected tab already names the category; search results mix categories, so they keep the chip */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[10.5px] text-slate-400 shrink-0">
                {p.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#2F68FE]" aria-label="Unread" />}
                {formatFeedDate(p.date)}
              </span>
              {q && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold truncate ${CATEGORY_TINT[p.category]}`}>{p.category}</span>
              )}
            </div>
            <h2 className={`mt-1.5 text-[14px] leading-snug ${p.unread ? 'font-extrabold text-[#1E293B]' : 'font-bold text-slate-700'}`}>{p.title}</h2>
            <p className="mt-1 text-[12px] text-slate-500 leading-relaxed line-clamp-2">{p.summary}</p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Reactions post={p} reaction={reactions[p.id] ?? null} onReact={(r) => onReact(p.id, r)} compact />
              <span className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-[#2F68FE] shrink-0">
                Read more
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </article>
        ))}

        {visible.length === 0 && (
          <div className="py-16 flex flex-col items-center text-center">
            <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Newspaper className="w-6 h-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">{q ? 'No posts match your search' : 'Nothing here yet'}</p>
            <p className="mt-1 text-xs text-slate-500">{q ? 'Try a different keyword.' : 'New announcements will show up here.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------- Detail -------------------------------- */

interface FeedPostViewProps {
  post: FeedPost;
  reaction: FeedReaction;
  onBack: () => void;
  onReact: (reaction: FeedReaction) => void;
  onOpenProfile: () => void;
}

export const FeedPostView: React.FC<FeedPostViewProps> = ({ post, reaction, onBack, onReact, onOpenProfile }) => (
  <div className="flex-1 flex flex-col bg-white text-[#1E293B] overflow-hidden">
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
        <h1 className="text-base font-bold screen-title">{post.category}</h1>
      </div>
    </header>

    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-5 pb-6">
        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${CATEGORY_TINT[post.category]}`}>{post.category}</span>
        <h2 className="mt-2.5 text-xl font-extrabold leading-snug tracking-tight">{post.title}</h2>
        <p className="mt-2 text-[11.5px] text-slate-400">
          {formatFeedDate(post.date)} · <span className="text-slate-500">{post.from}</span>
        </p>

        <div className="mt-5 space-y-3.5 text-[13px] text-slate-600 leading-relaxed select-text">
          {post.blocks.map((b, i) => (
            <Block key={i} block={b} onOpenProfile={onOpenProfile} />
          ))}
        </div>
      </div>
    </div>

    {/* Was this helpful? */}
    <div className="shrink-0 px-5 py-3 border-t border-[#EBF0F7] bg-white flex items-center justify-between gap-3">
      <span className="text-xs font-semibold text-slate-500">Was this helpful?</span>
      <Reactions post={post} reaction={reaction} onReact={onReact} />
    </div>
  </div>
);
