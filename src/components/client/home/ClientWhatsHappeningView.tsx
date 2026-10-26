import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Newspaper } from 'lucide-react';
import { CLIENT_FEED_PAGE_SIZE, CLIENT_FEED_TABS, ClientFeedPost, ClientFeedTab } from '../data/clientDashboardData';
import { ClientPostCard, FEED_TAB_ICON } from './ClientPostCard';
import { ScreenHeader } from '../staff/tabs/StaffTabParts';

interface ClientWhatsHappeningViewProps {
  posts: ClientFeedPost[];
  /** Feed tabs already opened (their unread counts are cleared — desktop `notification_update`) */
  seenTabs: ClientFeedTab[];
  onSeeTab: (tab: ClientFeedTab) => void;
  onUpdatePost: (id: string, patch: Partial<ClientFeedPost>) => void;
  onBack: () => void;
}

/** Desktop shows a loader while AJAX reloads a block */
const LOAD_MS = 600;

const Skeleton: React.FC<{ className: string }> = ({ className }) => <span className={`block rounded-lg bg-slate-200/70 animate-pulse ${className}`} />;

/** What's Happening Around! — the Dashboard feed (category tabs, posts, Show More) opened from its Dashboard card */
export const ClientWhatsHappeningView: React.FC<ClientWhatsHappeningViewProps> = ({ posts, seenTabs, onSeeTab, onUpdatePost, onBack }) => {
  const [tab, setTab] = useState<ClientFeedTab>(CLIENT_FEED_TABS[0]);
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [tab]);

  // Each block reloads on its own (desktop AJAX: tab, Show More)
  const withLoader = (set: (v: boolean) => void, after?: () => void) => {
    set(true);
    setTimeout(() => {
      after?.();
      set(false);
    }, LOAD_MS);
  };

  const selectTab = (t: ClientFeedTab) => {
    if (t === tab) return;
    setTab(t);
    setPages(1);
    withLoader(setTabLoading, () => onSeeTab(t));
  };

  const tabPosts = posts.filter((p) => p.tab === tab);
  const visiblePosts = tabPosts.slice(0, pages * CLIENT_FEED_PAGE_SIZE);
  const unreadIn = (t: ClientFeedTab) => (seenTabs.includes(t) ? 0 : posts.filter((p) => p.tab === t && p.unread).length);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in duration-200">
      <ScreenHeader title="What's Happening Around!" onBack={onBack} />

      <div
        ref={tabsRef}
        className="shrink-0 flex gap-1 overflow-x-auto no-scrollbar px-2 bg-white border-b border-slate-200/80"
        role="tablist"
        aria-label="Update categories"
      >
        {CLIENT_FEED_TABS.map((t) => {
          const on = t === tab;
          const unread = unreadIn(t);
          const Icon = FEED_TAB_ICON[t];
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => selectTab(t)}
              className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE] ${
                on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t}
              {unread > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unread}
                </span>
              )}
              <span
                className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${
                  on ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div key={tab} className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-6 space-y-3 animate-in fade-in duration-200" role="tabpanel" aria-label={tab}>
        <div className="flex items-center gap-2 px-1">
          <h2 className="min-w-0 text-sm font-bold text-[#1E293B] truncate">{tab}</h2>
        </div>

        {tabLoading &&
          [0, 1].map((i) => (
            <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs space-y-3" aria-busy="true">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-3/4 h-4" />
                  <Skeleton className="w-20 h-3" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <Skeleton className="w-full h-3" />
                <Skeleton className="w-5/6 h-3" />
              </div>
              <Skeleton className="w-full h-10 rounded-xl" />
            </div>
          ))}

        {!tabLoading &&
          visiblePosts.map((p) => <ClientPostCard key={p.id} post={p} unread={p.unread} onUpdate={(patch) => onUpdatePost(p.id, patch)} />)}

        {!tabLoading && tabPosts.length === 0 && (
          <div className="p-8 flex flex-col items-center text-center bg-white border border-slate-200/80 rounded-2xl">
            <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Newspaper className="w-6 h-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">No updates yet.</p>
            <p className="mt-1 text-xs text-slate-500">New posts in {tab} will show up here.</p>
          </div>
        )}

        {!tabLoading && visiblePosts.length < tabPosts.length && (
          <button
            type="button"
            disabled={moreLoading}
            onClick={() => withLoader(setMoreLoading, () => setPages((n) => n + 1))}
            className="w-full h-11 rounded-xl border border-[#2F68FE] bg-white text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-blue-50 disabled:opacity-60 disabled:cursor-wait transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
          >
            {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {moreLoading ? 'Loading…' : 'Show More'}
          </button>
        )}
      </div>
    </div>
  );
};
