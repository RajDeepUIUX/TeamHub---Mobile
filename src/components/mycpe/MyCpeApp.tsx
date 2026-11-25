import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { MYCPE_USER_TYPES, MyCpeUserType } from '../../types/mycpe';
import { ProductSwitcher } from '../product/ProductSwitcher';
import { McSplash } from './auth/McSplash';
import { McOnboarding } from './auth/McOnboarding';
import { McSignIn } from './auth/McSignIn';
import { McSignUp } from './auth/McSignUp';
import { McSubscribe } from './subscription/McSubscribe';
import { McMain } from './home/McMain';
import { McPending } from './common/McPage';
import { DEFAULT_ACCOUNT, McAccount, McHomeState, NEW_HOME, RETURNING_HOME } from './data/mycpeHomeData';

/** 'forgot' and the Subscriber's 'home' are stand-ins until their designs are added */
type McStage = 'splash' | 'onboarding' | 'signin' | 'signup' | 'plans' | 'forgot' | 'home';
const STAGES: McStage[] = ['splash', 'onboarding', 'signin', 'signup', 'plans', 'forgot', 'home'];

/** ?screen=signup opens a MyCPE screen directly; home / profile / certificates take &new=1 for a new account */
const params = () => new URLSearchParams(window.location.search);
const initialPage = () => {
  const s = params().get('screen');
  return s === 'profile' || s === 'certificates' || s === 'ai-upload' ? s : undefined;
};
const initialStage = (): McStage => (initialPage() ? 'home' : STAGES.find((x) => x === params().get('screen')) ?? 'splash');

interface MyCpeAppProps {
  userType: MyCpeUserType;
  onUserTypeChange: (type: MyCpeUserType) => void;
  /** Real phone: no studio toolbar, so its switches show in the app */
  isPhone?: boolean;
}

/**
 * MyCPE experience: completely separate from HRMS (Staff / Manager / Client). No shared screens, navigation,
 * theme or data. Everything for MyCPE lives under components/mycpe; screens are added here as they're specified.
 */
export const MyCpeApp: React.FC<MyCpeAppProps> = ({ userType, onUserTypeChange, isPhone = false }) => {
  const { onSwitchProduct } = useProduct();
  const [stage, setStage] = useState<McStage>(initialStage);
  const [account, setAccount] = useState<McAccount>(DEFAULT_ACCOUNT);
  const [home, setHome] = useState<McHomeState>(() => (params().has('new') ? NEW_HOME : RETURNING_HOME));

  // Plans are only for Non Subscribers
  useEffect(() => {
    if (userType === 'Subscriber' && stage === 'plans') setStage('home');
  }, [userType, stage]);

  const signIn = () => {
    setHome(RETURNING_HOME);
    setStage('home');
  };

  /** Prototype switches for phones: Subscriber / Non Subscriber and HRMS / MyCPE */
  const switches = (
    <div className="space-y-2">
      <div role="radiogroup" aria-label="MyCPE user" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-mc-line">
        {MYCPE_USER_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={t === userType}
            onClick={() => onUserTypeChange(t)}
            className={`h-9 rounded-lg text-xs font-semibold cursor-pointer ${t === userType ? 'bg-white text-mc-primary shadow-2xs' : 'text-mc-text'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <ProductSwitcher />
    </div>
  );

  const screen = () => {
    switch (stage) {
      case 'splash':
        return <McSplash onDone={() => setStage('onboarding')} />;
      case 'onboarding':
        return <McOnboarding onGetStarted={() => setStage('signup')} onHaveAccount={() => setStage('signin')} />;
      case 'signin':
        return <McSignIn onSignIn={signIn} onForgot={() => setStage('forgot')} onSignUp={() => setStage('signup')} />;
      case 'signup':
        return (
          <McSignUp
            onSignIn={() => setStage('signin')}
            onCreated={(created) => {
              // A new account has no plan yet and starts on the first-time Home
              setAccount(created);
              setHome(NEW_HOME);
              onUserTypeChange('Non Subscriber');
              setStage('plans');
            }}
          />
        );
      case 'plans':
        return (
          <McSubscribe
            onClose={() => setStage('home')}
            onSubscribe={() => {
              onUserTypeChange('Subscriber');
              setStage('home');
            }}
          />
        );
      case 'home':
        return userType === 'Non Subscriber' ? (
          <McMain
            account={account}
            home={home}
            onHomeChange={(patch) => setHome((h) => ({ ...h, ...patch }))}
            onSubscribed={() => onUserTypeChange('Subscriber')}
            onLogout={() => setStage('signin')}
            initialPage={initialPage()}
            switches={isPhone ? switches : undefined}
          />
        ) : (
          <McPending title="Home" note="Subscriber" />
        );
      default:
        return <McPending title="Forgot Password" />;
    }
  };

  const canGoBack = stage === 'forgot';
  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-white font-mc text-mc-ink select-none">
      {screen()}

      {(canGoBack || (isPhone && ['onboarding', 'signin', 'signup'].includes(stage))) && (
        <button
          type="button"
          onClick={() => (canGoBack ? setStage('signin') : onSwitchProduct(null))}
          className="absolute left-2 z-10 w-10 h-10 flex items-center justify-center text-mc-ink-2 cursor-pointer"
          style={{ top: 'calc(var(--safe-top) + 6px)' }}
          aria-label={canGoBack ? 'Back to Sign In' : 'Back to HRMS / MyCPE selection'}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {isPhone && stage === 'home' && userType === 'Subscriber' && (
        <div className="shrink-0 px-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}>
          {switches}
        </div>
      )}
    </div>
  );
};
