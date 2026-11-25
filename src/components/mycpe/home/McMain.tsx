import React, { useState } from 'react';
import { McBottomNav, McTab } from './McBottomNav';
import { McHome } from './McHome';
import { McPageHeader, McPending } from '../common/McPage';
import { McProfile } from '../profile/McProfile';
import { McCreditCertificates } from '../profile/McCreditCertificates';
import { McSubscribe } from '../subscription/McSubscribe';
import { McAccount, McHomeState } from '../data/mycpeHomeData';
import { MyCpePlanId } from '../data/mycpeAuthData';

/** Screens opened over the tabs; the last one is showing */
type McPageId = { kind: 'profile' } | { kind: 'certificates' } | { kind: 'plans'; plan?: MyCpePlanId } | { kind: 'pending'; title: string };

interface McMainProps {
  account: McAccount;
  home: McHomeState;
  onHomeChange: (patch: Partial<McHomeState>) => void;
  onSubscribed: (plan: MyCpePlanId) => void;
  onLogout: () => void;
  /** ?screen=profile / certificates opens there */
  initialPage?: 'profile' | 'certificates';
  /** Real phone: prototype switches */
  switches?: React.ReactNode;
}

/** Signed-in Non Subscriber: bottom tabs, Home, Profile and the screens they open */
export const McMain: React.FC<McMainProps> = ({ account, home, onHomeChange, onSubscribed, onLogout, initialPage, switches }) => {
  const [tab, setTab] = useState<McTab>('Home');
  const [pages, setPages] = useState<McPageId[]>(
    initialPage === 'certificates' ? [{ kind: 'profile' }, { kind: 'certificates' }] : initialPage ? [{ kind: initialPage }] : []
  );
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const push = (p: McPageId) => setPages((prev) => [...prev, p]);
  const back = () => setPages((prev) => prev.slice(0, -1));
  const open = (title: string) => {
    if (title === 'Credit Certificates') push({ kind: 'certificates' });
    else if (title === 'Subscription Plan') push({ kind: 'plans' });
    else push({ kind: 'pending', title });
  };

  const renderPage = (p: McPageId) => {
    switch (p.kind) {
      case 'profile':
        return <McProfile account={account} showLicenses={home.complianceAdded} onClose={back} onOpen={open} onLogout={onLogout} footer={switches} />;
      case 'certificates':
        return <McCreditCertificates onBack={back} onOpen={open} />;
      case 'plans':
        return <McSubscribe initialPlan={p.plan} onClose={back} onSubscribe={onSubscribed} />;
      default:
        return (
          <>
            <McPageHeader title={p.title} onBack={back} />
            <McPending title={p.title} />
          </>
        );
    }
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">
        {tab === 'Home' ? (
          <McHome
            firstName={account.firstName}
            home={home}
            bookmarks={bookmarks}
            onBookmark={(id) => setBookmarks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
            onHomeChange={onHomeChange}
            onSubscribe={() => push({ kind: 'plans', plan: 'Silver' })}
            onOpenProfile={() => push({ kind: 'profile' })}
            onOpen={open}
          />
        ) : (
          <McPending title={tab} />
        )}
      </div>
      <McBottomNav active={tab} onChange={(t) => (t === 'Plan' ? push({ kind: 'plans' }) : setTab(t))} />

      {/* Everything under the top page stays mounted, so going back keeps the scroll position */}
      {pages.map((p, i) => (
        <div key={i} className="absolute inset-0 z-10 flex flex-col bg-white animate-in fade-in duration-150">
          {renderPage(p)}
        </div>
      ))}
    </div>
  );
};
