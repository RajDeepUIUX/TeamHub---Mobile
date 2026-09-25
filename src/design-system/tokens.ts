/**
 * Team Hub Mobile Design System - Core Design Tokens
 * 
 * Strict enterprise SaaS guidelines:
 * - 60% Neutral canvas, 30% Structural surfaces, 10% High-intent accent
 * - Zero decorative fluff, high contrast, WCAG AA compliance
 * - Touch hitboxes >= 44px (CTAs 48px)
 * - Safe areas respected for iOS and Android
 */

export const DESIGN_TOKENS = {
  brand: {
    primary: '#0F172A', // Slate 900 for high-trust authority
    primaryHover: '#1E293B',
    accent: '#2563EB', // Blue 600 for focused interactive states and primary links
    accentSubtle: '#EFF6FF',
    accentBorder: '#BFDBFE',
  },
  neutrals: {
    canvas: '#F8FAFC', // Slate 50 dominant clean mobile background
    surface: '#FFFFFF', // Clean elevated cards
    surfaceMuted: '#F1F5F9', // Slate 100 for secondary grouped containers
    border: '#E2E8F0', // Slate 200 hairline borders
    borderSubtle: '#F1F5F9',
    textPrimary: '#0F172A', // Slate 900
    textSecondary: '#475569', // Slate 600 (WCAG AA 4.5:1+)
    textMuted: '#64748B', // Slate 500
    textDisabled: '#94A3B8', // Slate 400
  },
  semantic: {
    success: {
      text: '#15803D', // Green 700
      bg: '#F0FDF4',
      border: '#BBF7D0',
      label: 'Approved / Completed',
    },
    warning: {
      text: '#B45309', // Amber 700
      bg: '#FFFBEB',
      border: '#FDE68A',
      label: 'Pending / Action Needed',
    },
    danger: {
      text: '#B91C1C', // Red 700
      bg: '#FEF2F2',
      border: '#FECACA',
      label: 'Rejected / Overdue / Critical',
    },
    info: {
      text: '#1D4ED8', // Blue 700
      bg: '#EFF6FF',
      border: '#BFDBFE',
      label: 'Informational / Active',
    },
    neutral: {
      text: '#475569', // Slate 600
      bg: '#F1F5F9',
      border: '#E2E8F0',
      label: 'Draft / Inactive',
    },
  },
  spacing: {
    screenPadding: '16px',
    cardPadding: '16px',
    fieldGap: '12px',
    touchMinHeight: '44px',
    ctaHeight: '48px',
  },
  radius: {
    card: '16px', // rounded-2xl
    control: '10px',
    pill: '9999px',
    sheet: '24px',
  },
  typography: {
    headline: 'font-semibold text-lg tracking-tight text-slate-900',
    title: 'font-semibold text-base text-slate-900',
    body: 'text-sm text-slate-700 leading-relaxed',
    caption: 'text-xs text-slate-500',
    micro: 'text-[11px] font-medium text-slate-500',
  },
};
