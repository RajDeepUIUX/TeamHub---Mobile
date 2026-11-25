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

/** 'forgot' and 'home' are stand-ins until their designs are added */
type McStage = 'splash' | 'onboarding' | 'signin' | 'signup' | 'plans' | 'forgot' | 'home';
const STAGES: McStage[] = ['splash', 'onboarding', 'signin', 'signup', 'plans', 'forgot', 'home'];

/** ?screen=signup opens a MyCPE screen directly */
const initialStage = (): McStage => {
  const s = new URLSearchParams(window.location.search).get('screen');
  return STAGES.find((x) => x === s) ?? 'splash';
};

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

  // Plans are only for Non Subscribers
  useEffect(() => {
    if (userType === 'Subscriber' && stage === 'plans') setStage('home');
  }, [userType, stage]);

  const screen = () => {
    switch (stage) {
      case 'splash':
        return <McSplash onDone={() => setStage('onboarding')} />;
      case 'onboarding':
        return <McOnboarding onGetStarted={() => setStage('signup')} onHaveAccount={() => setStage('signin')} />;
      case 'signin':
        return <McSignIn onSignIn={() => setStage('home')} onForgot={() => setStage('forgot')} onSignUp={() => setStage('signup')} />;
      case 'signup':
        return (
          <McSignUp
            onSignIn={() => setStage('signin')}
            onCreated={() => {
              // A new account has no plan yet
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
      default:
        return <Pending title={stage === 'forgot' ? 'Forgot Password' : 'Home'} note={stage === 'home' ? userType : undefined} />;
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

      {isPhone && stage === 'home' && (
        <div className="shrink-0 px-4 space-y-2" style={{ paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}>
          <div role="radiogroup" aria-label="MyCPE user" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-mc-page">
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
      )}
    </div>
  );
};

/** Stand-in for a screen whose design hasn't been provided yet */
const Pending: React.FC<{ title: string; note?: string }> = ({ title, note }) => (
  <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
    <img src="/brand/Icon.png" alt="" className="w-14 h-16 object-contain" draggable={false} />
    <h1 className="mt-5 text-2xl font-semibold text-mc-ink">{title}</h1>
    {note && <span className="mt-2 px-3 h-7 rounded-full bg-mc-primary-soft text-mc-indigo text-xs font-semibold flex items-center">{note}</span>}
    <p className="mt-2 text-sm text-mc-muted">This screen's design isn't added yet.</p>
  </div>
);
