import React, { useId, useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';

/* ---------------------------------- Buttons ---------------------------------- */

export const McButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'soft'; size?: 'lg' | 'md' }> = ({
  tone = 'primary',
  size = 'lg',
  className = '',
  children,
  ...rest
}) => (
  <button
    type="button"
    {...rest}
    className={`w-full rounded-xl text-base font-semibold flex items-center justify-center gap-3 shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-mc-primary-soft disabled:text-[#9C91F0] ${
      size === 'lg' ? 'h-14' : 'h-12'
    } ${tone === 'soft' ? 'bg-mc-primary-soft text-mc-primary active:bg-[#D6D1F8]' : 'bg-mc-primary text-white active:bg-mc-primary-pressed'} ${className}`}
  >
    {children}
  </button>
);

/* ----------------------------------- Fields ----------------------------------- */

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="mt-1 px-1 text-xs text-mc-error">{message}</p> : null;

const boxCls = (error?: string) =>
  `relative h-13 rounded-[4px] bg-white border transition-colors focus-within:border-mc-primary ${error ? 'border-mc-error' : 'border-mc-line'}`;

/** Label: sits inside the empty field, moves onto the top border once it's focused or filled */
const floatCls = (floated: boolean) =>
  `absolute pointer-events-none transition-all duration-150 text-mc-muted ${
    floated ? 'left-[11px] -top-2.5 px-1 h-5 leading-[18px] rounded-t-[4px] bg-white text-xs' : 'left-[15px] top-1/2 -translate-y-1/2 text-sm'
  }`;

interface McFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  error?: string;
}

export const McField: React.FC<McFieldProps> = ({ label, value, onChange, type = 'text', autoComplete, error }) => {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="min-w-0">
      <div className={boxCls(error)}>
        <label htmlFor={id} className={floatCls(focused || value !== '')}>
          {label}
        </label>
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={Boolean(error)}
          className={`w-full h-full pl-[15px] bg-transparent text-sm text-mc-ink focus:outline-hidden select-text ${isPassword ? 'pr-12' : 'pr-[15px]'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-0 top-0 w-13 h-full flex items-center justify-center text-mc-muted cursor-pointer"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <Eye className="w-5 h-5 stroke-[1.5]" /> : <EyeOff className="w-5 h-5 stroke-[1.5]" />}
          </button>
        )}
      </div>
      <FieldError message={error} />
    </div>
  );
};

/** Field that opens a sheet (solid ▼ as in the design) */
export const McSelectField: React.FC<{ label: string; value: string; onOpen: () => void; error?: string }> = ({ label, value, onOpen, error }) => (
  <div>
    <button type="button" onClick={onOpen} className={`${boxCls(error)} w-full block text-left cursor-pointer`}>
      <span className={floatCls(value !== '')}>{label}</span>
      <span className="block pl-[15px] pr-12 text-sm text-mc-ink truncate">{value || ' '}</span>
      <svg viewBox="0 0 14 9" className="absolute right-[18px] top-1/2 -translate-y-1/2 w-3.5 h-[9px] text-mc-muted" aria-hidden="true">
        <path d="M0 0h14L7 9z" fill="currentColor" />
      </svg>
    </button>
    <FieldError message={error} />
  </div>
);

/* ---------------------------------- Checkbox ---------------------------------- */

/** Box only; the row around it is the button. Blue tick on Terms, purple tick in lists. */
export const McCheckBox: React.FC<{ checked: boolean; tone?: 'primary' | 'link' }> = ({ checked, tone = 'primary' }) => (
  <span
    className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
      !checked
        ? 'border-mc-line-strong bg-white'
        : tone === 'link'
          ? 'border-mc-link bg-[#EEF1FE] text-mc-link'
          : 'border-mc-primary bg-mc-primary-tint text-mc-primary'
    }`}
  >
    {checked && <Check className="w-3 h-3 stroke-[2.5]" />}
  </span>
);

/* --------------------------------- Background --------------------------------- */

const CELL = 39;
/** Where the design's status bar ends; background coordinates are measured from the top of the design */
const DESIGN_TOP = 63;

type Tile = [x: number, y: number];
const TOP_TILES: Tile[] = [
  [44, 24],
  [317, 24],
  [5, 63],
  [122, 63],
  [278, 63],
  [395, 63],
  [83, 141],
  [356, 141],
];
const SPLASH_TILES: Tile[] = [
  ...TOP_TILES,
  [122, 492],
  [395, 492],
  [5, 531],
  [83, 531],
  [278, 531],
  [356, 531],
  [83, 687],
  [356, 687],
];

/** Faint grid with tinted tiles, as drawn behind the splash, onboarding and sign-in screens */
export const McGrid: React.FC<{ variant?: 'top' | 'splash'; mask: string; height?: number | string }> = ({ variant = 'top', mask, height = '100%' }) => (
  <div
    className="absolute inset-x-0 pointer-events-none overflow-hidden"
    style={{ top: `calc(var(--safe-top) - ${DESIGN_TOP}px)`, height, maskImage: mask, WebkitMaskImage: mask }}
    aria-hidden="true"
  >
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: 'linear-gradient(rgba(91,116,247,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(91,116,247,0.1) 1px, transparent 1px)',
        backgroundSize: `${CELL}px ${CELL}px`,
        backgroundPosition: '5px 24px',
      }}
    />
    {(variant === 'splash' ? SPLASH_TILES : TOP_TILES).map(([x, y]) => (
      <span key={`${x}-${y}`} className="absolute bg-[rgba(91,116,247,0.085)]" style={{ left: x, top: y, width: CELL, height: CELL }} />
    ))}
  </div>
);

/** Page behind Sign In / Create account: grey page, grid header, logo with its shadow, title + subtitle, then the form */
export const McAuthPage: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="@container relative flex-1 min-h-0 overflow-y-auto no-scrollbar bg-mc-page">
    <McGrid height={240} mask="linear-gradient(to bottom, transparent 10px, #000 63px, #000 170px, transparent 238px)" />
    <div
      className="absolute inset-x-0 h-56 pointer-events-none"
      style={{
        top: 'var(--safe-top)',
        background: 'radial-gradient(145px 80px at 50% 84px, rgba(113,125,255,0.16), transparent 100%)',
      }}
      aria-hidden="true"
    />
    <div className="relative px-4" style={{ paddingTop: 'calc(var(--safe-top) + 10px)', paddingBottom: 'calc(var(--safe-bottom) + 24px)' }}>
      <div className="relative w-[74px] mx-auto">
        <img src="/brand/Icon.png" alt="MYCPE ONE" className="w-[74px] h-[88px] object-contain" draggable={false} />
        <span
          className="absolute -left-2 top-[88px] w-14 h-2.5"
          style={{ background: 'radial-gradient(closest-side, rgba(16,24,40,0.32), transparent)' }}
        />
      </div>
      <h1 className="mt-8 text-center text-[clamp(22px,7.46cqw,30px)] leading-[38px] font-semibold text-mc-ink whitespace-nowrap">{title}</h1>
      <p className="mt-2 text-center text-sm leading-5 text-mc-muted">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  </div>
);
