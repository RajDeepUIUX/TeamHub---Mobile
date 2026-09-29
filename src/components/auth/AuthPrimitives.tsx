import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Wand2 } from 'lucide-react';

/** Soft lavender backdrop with a faint grid, floating squares and arcs */
export const AuthBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute inset-0 bg-linear-to-b from-[#F4F6FF] via-white to-[#F5F3FF]" />
    <div
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage:
          'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }}
    />
    {/* Arcs */}
    <div className="absolute -top-40 -left-44 w-96 h-96 rounded-full border border-indigo-200/60 bg-indigo-50/30" />
    <div className="absolute -bottom-36 -right-40 w-80 h-80 rounded-full border border-violet-200/60 bg-violet-50/30" />
    <div className="absolute -bottom-52 -right-20 w-80 h-80 rounded-full border border-indigo-200/50" />
    {/* Floating squares */}
    <div className="absolute top-16 left-8 w-16 h-16 rounded-xl bg-blue-100/40" />
    <div className="absolute top-10 left-24 w-9 h-9 rounded-lg bg-indigo-100/50" />
    <div className="absolute top-40 right-6 w-6 h-6 rounded-md bg-sky-100/60" />
    <div className="absolute top-48 right-14 w-10 h-10 rounded-lg bg-violet-100/50" />
    <div className="absolute bottom-28 left-0 w-10 h-14 rounded-r-xl bg-violet-100/50" />
    <div className="absolute bottom-10 left-10 w-12 h-12 rounded-xl bg-blue-100/40" />
    <div className="absolute bottom-8 right-8 w-8 h-8 rounded-lg bg-sky-100/50" />
  </div>
);

/** Full-screen auth layout: background + vertically scrollable centered column */
export const AuthScreen: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className="relative flex-1 flex flex-col overflow-hidden bg-white text-[#1E1B4B] select-none">
    <AuthBackground />
    <div className={`relative z-10 flex-1 overflow-y-auto no-scrollbar px-6 ${className}`}>{children}</div>
  </div>
);

interface AuthInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  icon: React.ReactNode;
  type?: 'text' | 'email' | 'password';
  error?: string;
}

/** Tall rounded input with a leading icon; password fields get a show/hide toggle */
export const AuthInput: React.FC<AuthInputProps> = ({ icon, type = 'text', error, className = '', ...rest }) => {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={className}>
      <div
        className={`group h-14 px-4 flex items-center gap-3 bg-white rounded-2xl border shadow-[0_4px_14px_-6px_rgba(79,70,229,0.12)] transition-all focus-within:ring-4 ${
          error
            ? 'border-rose-300 focus-within:ring-rose-50'
            : 'border-slate-200/80 focus-within:border-[#6366F1] focus-within:ring-indigo-50'
        }`}
      >
        <span className={`shrink-0 ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-[#6366F1]'}`}>
          {icon}
        </span>
        <input
          {...rest}
          type={isPassword && !visible ? 'password' : isPassword ? 'text' : type}
          className="flex-1 min-w-0 h-full bg-transparent text-sm font-medium text-[#1E1B4B] placeholder:text-slate-400 focus:outline-hidden"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="shrink-0 w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 px-1 text-[11px] font-medium text-rose-500">{error}</p>}
    </div>
  );
};

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({ loading, children, disabled, className = '', ...rest }) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={`w-full h-14 rounded-2xl bg-linear-to-r from-[#5B7BFA] to-[#7C5CFA] text-white text-[15px] font-bold shadow-[0_12px_24px_-10px_rgba(99,91,250,0.6)] hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer ${className}`}
  >
    {loading && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
    {children}
  </button>
);

export const TextLink: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...rest }) => (
  <button
    type="button"
    {...rest}
    className={`text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA] hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-default cursor-pointer ${className}`}
  >
    {children}
  </button>
);

/** Heading + subtitle block used under the logo on every auth screen */
export const AuthHeading: React.FC<{ title: string; subtitle: React.ReactNode }> = ({ title, subtitle }) => (
  <div className="text-center">
    <h1 className="text-[28px] font-extrabold tracking-tight text-[#1E1B4B] leading-tight">{title}</h1>
    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{subtitle}</p>
  </div>
);

/** Top row of an auth screen: optional left slot (e.g. back button) and a Quick Fill pill on the right */
export const AuthTopBar: React.FC<{ left?: React.ReactNode; onQuickFill?: () => void }> = ({ left, onQuickFill }) => (
  <div className="flex items-center justify-between pt-3 shrink-0 min-h-13">
    <div>{left}</div>
    {onQuickFill && (
      <button
        type="button"
        onClick={onQuickFill}
        className="h-8 px-3 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 text-[#4F46E5] text-xs font-semibold flex items-center gap-1.5 shadow-[0_4px_12px_-6px_rgba(79,70,229,0.3)] hover:bg-white active:scale-95 transition cursor-pointer"
      >
        <Wand2 className="w-3.5 h-3.5" />
        Quick Fill
      </button>
    )}
  </div>
);

/* ------------------------- Demo data for Quick Fill ------------------------- */

const DEMO_PEOPLE = [
  ['shanker', 'dey'],
  ['jhanvi', 'motwani'],
  ['arpan', 'shah'],
  ['nidhi', 'purohit'],
  ['husain', 'rasiwala'],
  ['krupali', 'shah'],
];

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const randomDigits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

export const demoEmail = () => {
  const [first, last] = pick(DEMO_PEOPLE);
  return `${first}.${last}@my-cpe.com`;
};

/** Always satisfies the "strong" rule: 8+ chars, mixed case, a digit and a symbol */
export const demoPassword = () => `${pick(['Team', 'Hub', 'Mycpe', 'Staff'])}@${randomDigits(4)}${pick(['Ax', 'Qz', 'Mr', 'Kp'])}`;

export const demoOtp = () => randomDigits(6);
