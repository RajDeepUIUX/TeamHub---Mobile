import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mail, Lock, ArrowLeft, Check } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import {
  AuthScreen,
  AuthBackground,
  AuthInput,
  GradientButton,
  TextLink,
  AuthHeading,
  AuthTopBar,
  demoEmail,
  demoPassword,
  demoOtp,
} from './AuthPrimitives';

export const APP_VERSION = '0.2.2';

type AuthStage = 'splash' | 'login' | 'forgot' | 'verify' | 'reset' | 'updated';

interface AuthFlowProps {
  onAuthenticated: (email: string) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const maskEmail = (email: string) => {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return `${user.slice(0, 1)}${'*'.repeat(Math.max(3, user.length - 1))}@${domain}`;
};

/* ---------------------------------- Splash ---------------------------------- */

const SplashScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="relative flex-1 flex flex-col items-center justify-center overflow-hidden bg-white cursor-pointer select-none"
      onClick={onDone}
      role="button"
      aria-label="Continue"
    >
      <AuthBackground />
      <div className="relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <BrandLogo size="lg" showTagline={false} />
      </div>
      <div className="absolute bottom-8 inset-x-0 z-10 flex flex-col items-center gap-3">
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#6366F1]/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 font-medium">Version {APP_VERSION}</p>
      </div>
    </div>
  );
};

/* ---------------------------------- Login ----------------------------------- */

const LoginScreen: React.FC<{
  initialEmail: string;
  onSignIn: (email: string) => void;
  onForgot: (email: string) => void;
}> = ({ initialEmail, onSignIn, onForgot }) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid company email.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    // Demo sign-in: any valid-looking credentials are accepted
    setTimeout(() => onSignIn(email.trim()), 900);
  };

  const quickFill = () => {
    setEmail(demoEmail());
    setPassword(demoPassword());
    setErrors({});
  };

  return (
    <AuthScreen className="flex flex-col">
      <AuthTopBar onQuickFill={quickFill} />
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center pb-8" noValidate>
        <BrandLogo size="sm" showTagline={false} />
        <div className="mt-8">
          <AuthHeading title="Welcome back" subtitle="Sign in to continue to Team Hub Mobile." />
        </div>

        <div className="mt-7 space-y-3.5">
          <AuthInput
            icon={<Mail className="w-5 h-5" />}
            type="email"
            placeholder="Company Email"
            autoComplete="email"
            value={email}
            error={errors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            }}
          />
          <AuthInput
            icon={<Lock className="w-5 h-5" />}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            error={errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            }}
          />
        </div>

        <div className="mt-3 flex justify-end">
          <TextLink onClick={() => onForgot(email.trim())}>Forgot Password?</TextLink>
        </div>

        <GradientButton type="submit" loading={loading} className="mt-6">
          {loading ? 'Signing In…' : 'Sign In'}
        </GradientButton>
      </form>
    </AuthScreen>
  );
};

/* ---------------------------- Forgot: enter email ---------------------------- */

const ForgotScreen: React.FC<{
  initialEmail: string;
  onSend: (email: string) => void;
  onBack: () => void;
}> = ({ initialEmail, onSend, onBack }) => {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid company email.');
      return;
    }
    setLoading(true);
    setTimeout(() => onSend(email.trim()), 800);
  };

  return (
    <AuthScreen className="flex flex-col">
      <AuthTopBar
        left={
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 w-10 h-10 rounded-full flex items-center justify-center text-[#1E1B4B] active:bg-white/70 cursor-pointer"
            aria-label="Back to log in"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
        onQuickFill={() => {
          setEmail(demoEmail());
          setError('');
        }}
      />
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center pb-16" noValidate>
        <BrandLogo size="sm" showTagline={false} />
        <div className="mt-8">
          <AuthHeading
            title="Forgot Password?"
            subtitle="Enter your company email and we'll send you a 6-digit code to reset your password."
          />
        </div>
        <AuthInput
          className="mt-7"
          icon={<Mail className="w-5 h-5" />}
          type="email"
          placeholder="Company Email"
          autoComplete="email"
          value={email}
          error={error}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
        />
        <GradientButton type="submit" loading={loading} className="mt-6">
          {loading ? 'Sending Code…' : 'Send Code'}
        </GradientButton>
        <div className="mt-6 text-center">
          <TextLink onClick={onBack}>Back to Log In</TextLink>
        </div>
      </form>
    </AuthScreen>
  );
};

/* ------------------------------- Verify code -------------------------------- */

const VerifyScreen: React.FC<{
  email: string;
  onVerified: () => void;
  onBack: () => void;
}> = ({ email, onVerified, onBack }) => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const setDigit = (index: number, value: string) => {
    setDigits((prev) => prev.map((d, i) => (i === index ? value : d)));
  };

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (clean.length > 1) {
      // Pasted or autofilled several digits
      const next = [...digits];
      clean
        .slice(0, OTP_LENGTH - index)
        .split('')
        .forEach((d, i) => (next[index + i] = d));
      setDigits(next);
      inputs.current[Math.min(index + clean.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    setDigit(index, clean);
    if (clean && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      setDigit(index - 1, '');
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const code = digits.join('');
  const complete = code.length === OTP_LENGTH;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete) return;
    setLoading(true);
    // Demo: any 6-digit code is accepted
    setTimeout(onVerified, 800);
  };

  const handleResend = () => {
    setSecondsLeft(RESEND_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(''));
    setNotice('A new code has been sent.');
    inputs.current[0]?.focus();
    setTimeout(() => setNotice(''), 2500);
  };

  const quickFill = () => {
    setDigits(demoOtp().split(''));
    inputs.current[OTP_LENGTH - 1]?.focus();
  };

  return (
    <AuthScreen className="flex flex-col">
      <AuthTopBar onQuickFill={quickFill} />
      <form onSubmit={handleVerify} className="flex-1 flex flex-col justify-center pb-8" noValidate>
        <BrandLogo size="sm" showTagline={false} />
        <div className="mt-8">
          <AuthHeading title="Verify Code" subtitle="Enter the 6-digit code sent to your company email." />
        </div>

        <div className="mt-5 mx-auto h-11 px-5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center gap-2.5 text-sm font-medium text-[#1E1B4B]">
          <Mail className="w-4.5 h-4.5 text-slate-500" />
          {maskEmail(email)}
        </div>

        <div className="mt-6 flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={OTP_LENGTH}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={`w-full aspect-[4/5] max-w-12 rounded-xl border bg-white text-center text-xl font-bold text-[#1E1B4B] shadow-[0_4px_12px_-6px_rgba(79,70,229,0.15)] focus:outline-hidden focus:border-[#6366F1] focus:ring-4 focus:ring-indigo-50 transition-all ${
                d ? 'border-[#A5B4FC]' : 'border-slate-200'
              }`}
            />
          ))}
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Didn't receive the code?{' '}
          {secondsLeft > 0 ? (
            <span className="font-semibold text-[#4F46E5] tabular-nums">
              Resend in 00:{String(secondsLeft).padStart(2, '0')}
            </span>
          ) : (
            <TextLink onClick={handleResend}>Resend Code</TextLink>
          )}
        </p>
        {notice && <p className="mt-1.5 text-center text-xs font-medium text-emerald-600">{notice}</p>}

        <GradientButton type="submit" loading={loading} disabled={!complete} className="mt-6">
          {loading ? 'Verifying…' : 'Verify Code'}
        </GradientButton>
        <div className="mt-6 text-center">
          <TextLink onClick={onBack}>Back to Log In</TextLink>
        </div>
      </form>
    </AuthScreen>
  );
};

/* ------------------------------ Reset password ------------------------------ */

export const strengthOf = (pw: string) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return pw.length < 8 ? Math.min(score, 1) : Math.max(score, 1);
};

export const STRENGTH_META = [
  { label: 'Use at least 8 characters.', bar: 'bg-slate-200', text: 'text-slate-500' },
  { label: 'Weak — add upper & lower case letters.', bar: 'bg-rose-400', text: 'text-rose-500' },
  { label: 'Medium — add a number and a symbol.', bar: 'bg-amber-400', text: 'text-amber-600' },
  { label: 'Strong password.', bar: 'bg-emerald-500', text: 'text-emerald-600' },
];

const ResetScreen: React.FC<{ onUpdated: () => void; onBack: () => void }> = ({ onUpdated, onBack }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);

  const strength = strengthOf(password);
  const meta = STRENGTH_META[strength];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setTimeout(onUpdated, 900);
  };

  const quickFill = () => {
    const pw = demoPassword();
    setPassword(pw);
    setConfirm(pw);
    setErrors({});
  };

  return (
    <AuthScreen className="flex flex-col">
      <AuthTopBar onQuickFill={quickFill} />
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center pb-8" noValidate>
        <BrandLogo size="sm" showTagline={false} />
        <div className="mt-8">
          <AuthHeading title="Reset Password" subtitle="Create a new password for your account." />
        </div>

        <AuthInput
          className="mt-7"
          icon={<Lock className="w-5 h-5" />}
          type="password"
          placeholder="New Password"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
        />
        {!errors.password && (
          <div className="mt-2 px-1">
            <p className={`text-xs font-medium ${meta.text}`}>{meta.label}</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5 w-2/3">
              {[1, 2, 3].map((seg) => (
                <span
                  key={seg}
                  className={`h-1.5 rounded-full transition-colors ${strength >= seg ? meta.bar : 'bg-slate-200'}`}
                />
              ))}
            </div>
          </div>
        )}

        <AuthInput
          className="mt-4"
          icon={<Lock className="w-5 h-5" />}
          type="password"
          placeholder="Confirm Password"
          autoComplete="new-password"
          value={confirm}
          error={errors.confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
          }}
        />
        {confirm && confirm === password && !errors.confirm && (
          <p className="mt-1.5 px-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <Check className="w-3.5 h-3.5" /> Passwords match
          </p>
        )}

        <GradientButton type="submit" loading={loading} className="mt-6">
          {loading ? 'Updating…' : 'Update Password'}
        </GradientButton>
        <div className="mt-6 text-center">
          <TextLink onClick={onBack}>Back to Log In</TextLink>
        </div>
      </form>
    </AuthScreen>
  );
};

/* ----------------------------- Password updated ----------------------------- */

/** Confetti pieces fired from the tick: angle (deg), travel distance, colour, shape */
const SUCCESS_BURST: [number, number, string, string][] = [
  [0, 58, 'bg-emerald-400', 'w-1.5 h-3.5 rounded-full'],
  [45, 62, 'bg-[#6366F1]', 'w-2 h-2 rounded-full'],
  [90, 58, 'bg-amber-400', 'w-1.5 h-3.5 rounded-full'],
  [135, 62, 'bg-emerald-300', 'w-2 h-2 rounded-sm'],
  [180, 56, 'bg-sky-400', 'w-1.5 h-3.5 rounded-full'],
  [225, 62, 'bg-violet-400', 'w-2 h-2 rounded-full'],
  [270, 58, 'bg-emerald-400', 'w-1.5 h-3.5 rounded-full'],
  [315, 62, 'bg-rose-400', 'w-2 h-2 rounded-sm'],
];

const UpdatedScreen: React.FC<{ onBackToLogin: () => void }> = ({ onBackToLogin }) => (
  <AuthScreen className="flex flex-col">
    <div className="flex-1 flex flex-col justify-center py-8">
      <BrandLogo size="sm" showTagline={false} />
      <div className="mt-8 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-3xl px-6 py-8 shadow-[0_20px_40px_-20px_rgba(79,70,229,0.25)] text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="success-float relative mx-auto w-28 h-28 flex items-center justify-center">
          <span className="success-pop absolute inset-0 rounded-full bg-emerald-50" style={{ animationDelay: '0.05s' }} />
          <span className="success-pop absolute inset-3 rounded-full bg-emerald-100/70" style={{ animationDelay: '0.15s' }} />
          {/* Ripple ring */}
          <span className="success-ripple absolute inset-7 rounded-full border-2 border-emerald-400/60" />
          {/* Confetti burst */}
          {SUCCESS_BURST.map(([angle, dist, color, shape]) => (
            <span
              key={angle}
              className={`success-burst absolute left-1/2 top-1/2 -ml-1 -mt-1.5 ${shape} ${color}`}
              style={{ '--angle': `${angle}deg`, '--dist': `-${dist}px` } as React.CSSProperties}
            />
          ))}
          <span
            className="success-pop relative w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(16,185,129,0.6)]"
            style={{ animationDelay: '0.25s' }}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                className="success-draw"
                stroke="white"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <h1
          className="success-rise mt-5 text-2xl font-extrabold tracking-tight text-[#1E1B4B]"
          style={{ animationDelay: '0.7s' }}
        >
          Password Updated
        </h1>
        <p className="success-rise mt-2 text-sm text-slate-500 leading-relaxed" style={{ animationDelay: '0.82s' }}>
          Your password has been changed successfully. You can now log in using your new password.
        </p>
        <div className="success-rise" style={{ animationDelay: '0.95s' }}>
          <GradientButton type="button" onClick={onBackToLogin} className="mt-6">
            Back to Log In
          </GradientButton>
        </div>
      </div>
    </div>
  </AuthScreen>
);

/* ---------------------------------- Flow ------------------------------------ */

export const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthenticated }) => {
  const [stage, setStage] = useState<AuthStage>('splash');
  const [email, setEmail] = useState('');

  const toLogin = useCallback(() => setStage('login'), []);

  return (
    <div key={stage} className="flex-1 min-h-0 flex flex-col animate-in fade-in duration-300">
      {stage === 'splash' && <SplashScreen onDone={toLogin} />}
      {stage === 'login' && (
        <LoginScreen
          initialEmail={email}
          onSignIn={onAuthenticated}
          onForgot={(typed) => {
            setEmail(typed);
            setStage('forgot');
          }}
        />
      )}
      {stage === 'forgot' && (
        <ForgotScreen
          initialEmail={email}
          onBack={toLogin}
          onSend={(sentTo) => {
            setEmail(sentTo);
            setStage('verify');
          }}
        />
      )}
      {stage === 'verify' && <VerifyScreen email={email} onVerified={() => setStage('reset')} onBack={toLogin} />}
      {stage === 'reset' && <ResetScreen onUpdated={() => setStage('updated')} onBack={toLogin} />}
      {stage === 'updated' && <UpdatedScreen onBackToLogin={toLogin} />}
    </div>
  );
};
