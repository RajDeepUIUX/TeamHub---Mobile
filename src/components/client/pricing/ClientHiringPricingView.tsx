import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  GraduationCap,
  Headset,
  Info,
  Plus,
  Rocket,
  ShieldCheck,
  Timer,
  UserRound,
} from 'lucide-react';
import { Card, ChipRow, EmptyCard } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import {
  CANCELLATION_POLICY,
  CATEGORY_INTRO,
  CURRENCY_LABEL,
  HIRING_MODELS,
  HIRING_MODEL_NOTES,
  HIRING_TERM_GROUPS,
  PRICING_TABS,
  PricingCategory,
  PricingRow,
  currencyForCountry,
  pricingRowsFor,
} from '../data/clientHiringPricingData';

interface Props {
  companyName: string;
  /** Firm country (Company Profile); decides the currency and which rates apply */
  country: string;
  onContactManager: () => void;
  /** Opens Hire New Staff › Staff Requirements when the role can add a requirement */
  onAddRequirement?: () => void;
}

const LOAD_MS = 500;
const ROLES_PREVIEW = 3;
const ALL_LEVELS = 'All levels';

/** Experience band per level: drives the badge colour and the label on each card */
const BANDS = [
  { max: 2, label: 'Junior', badge: 'from-[#34D399] to-[#059669]', soft: 'bg-[#E8F8F0] text-[#059669]' },
  { max: 4, label: 'Mid-level', badge: 'from-[#60A5FA] to-[#2F68FE]', soft: 'bg-[#EFF6FF] text-[#1D4ED8]' },
  { max: 6, label: 'Senior', badge: 'from-[#818CF8] to-[#4F46E5]', soft: 'bg-[#EEF2FF] text-[#4F46E5]' },
  { max: 8, label: 'Leadership', badge: 'from-[#A78BFA] to-[#7C3AED]', soft: 'bg-[#F5F3FF] text-[#7C3AED]' },
];
const bandOf = (level: number) => BANDS.find((b) => level <= b.max) ?? BANDS[BANDS.length - 1];

const PageSkeleton: React.FC = () => (
  <div className="px-4 mt-4 space-y-3" aria-busy="true" aria-label="Loading pricing">
    <StaffSkeleton className="w-full h-32 rounded-3xl" />
    <div className="bg-white border border-[#EBF0F7] rounded-2xl divide-y divide-slate-100">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="p-3.5 space-y-2.5">
          <div className="flex items-center gap-3">
            <StaffSkeleton className="w-11 h-11 rounded-2xl" />
            <div className="flex-1 space-y-1.5">
              <StaffSkeleton className="w-24 h-3.5" />
              <StaffSkeleton className="w-16 h-3" />
            </div>
            <StaffSkeleton className="w-16 h-5" />
          </div>
          <StaffSkeleton className="w-full h-6 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="px-1">
    <h2 className="text-sm font-extrabold text-[#1E293B]">{title}</h2>
    {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
  </div>
);

const Hero: React.FC<{ eyebrow: string; title: string; text: string; stats: { label: string; value: string }[] }> = ({
  eyebrow,
  title,
  text,
  stats,
}) => (
  <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#1D4ED8] via-[#2F68FE] to-[#6366F1] p-4 text-white">
    <span className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-white/10" aria-hidden="true" />
    <span className="absolute right-10 -bottom-12 w-28 h-28 rounded-full bg-white/10" aria-hidden="true" />
    <div className="relative">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/70">{eyebrow}</p>
      <h2 className="mt-0.5 text-xl font-extrabold leading-tight">{title}</h2>
      <p className="mt-1 text-[11.5px] text-white/80 leading-snug max-w-[290px]">{text}</p>
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/15 px-2.5 py-2 backdrop-blur-sm">
            <p className="text-[15px] font-extrabold tabular-nums leading-tight truncate">{s.value}</p>
            <p className="text-[10px] font-semibold text-white/70 truncate">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const RoleChips: React.FC<{ roles: string[]; tone: string }> = ({ roles, tone }) => {
  const [open, setOpen] = useState(false);
  const shown = open ? roles : roles.slice(0, ROLES_PREVIEW);
  const hidden = roles.length - ROLES_PREVIEW;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((r) => (
        <span key={r} className={`px-2.5 h-6 rounded-full text-[10.5px] font-semibold flex items-center ${tone}`}>
          {r}
        </span>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="px-2.5 h-6 rounded-full border border-dashed border-slate-300 text-slate-500 text-[10.5px] font-bold flex items-center gap-0.5 active:bg-slate-100 cursor-pointer"
        >
          {open ? 'Show less' : `+${hidden} more`}
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
};

const PricingRowItem: React.FC<{ row: PricingRow }> = ({ row }) => {
  const band = bandOf(row.level);
  return (
    <li className="p-3.5">
      <div className="flex items-center gap-3">
        <span
          className={`w-11 h-11 rounded-2xl bg-linear-to-br ${band.badge} text-white flex flex-col items-center justify-center shrink-0 shadow-sm`}
        >
          <span className="text-[8.5px] font-bold uppercase leading-none opacity-80">Lvl</span>
          <span className="text-[16px] font-extrabold leading-none mt-0.5">{row.level}</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold text-[#1E293B] truncate">{row.designation}</span>
          <span className={`mt-0.5 inline-flex px-1.5 h-4.5 items-center rounded-md text-[9.5px] font-bold ${band.soft}`}>{band.label}</span>
        </span>
        <span className="text-right shrink-0">
          <span className="block text-[17px] font-extrabold text-[#1E293B] tabular-nums leading-tight">{row.rate}</span>
          <span className="block text-[10px] font-semibold text-slate-400">per hour</span>
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
        <RoleChips roles={row.roles} tone="bg-slate-100 text-slate-600" />
      </div>
    </li>
  );
};

/* ------------------------------ Role price tables ------------------------------ */

const RoleTable: React.FC<{ category: Exclude<PricingCategory, 'additional'>; label: string; rows: PricingRow[]; currencyLabel: string }> = ({
  category,
  label,
  rows,
  currencyLabel,
}) => {
  const levelOptions = useMemo(() => [ALL_LEVELS, ...Array.from(new Set(rows.map((r) => `Level ${r.level}`)))], [rows]);
  const [level, setLevel] = useState(ALL_LEVELS);
  const intro = CATEGORY_INTRO[category];
  const [areasOpen, setAreasOpen] = useState(false);
  const visible = level === ALL_LEVELS ? rows : rows.filter((r) => `Level ${r.level}` === level);

  const levels = Array.from(new Set(rows.map((r) => r.level)));
  const roleCount = new Set(rows.flatMap((r) => r.roles)).size;
  const first = rows[0].rate;
  const last = rows[rows.length - 1].rate;

  return (
    <div className="space-y-4">
      <Hero
        eyebrow={label}
        title={`${first} to ${last}`}
        text={intro?.text ?? `Hourly rates grow with each level, from ${levels.length > 1 ? 'entry level to practice lead' : 'the listed level'}.`}
        stats={[
          { label: 'Levels', value: `${levels[0]}–${levels[levels.length - 1]}` },
          { label: 'Roles', value: String(roleCount) },
          { label: 'Billing', value: currencyLabel },
        ]}
      />

      {intro && (
        <Card className="p-4">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-[#1E293B]">
            <BadgeCheck className="w-4 h-4 text-[#10B981]" /> Roles covered
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {(areasOpen ? intro.areas : intro.areas.slice(0, 6)).map((a) => (
              <span key={a} className="px-2.5 h-6 rounded-full bg-[#E8F8F0] text-[#059669] text-[10.5px] font-semibold flex items-center">
                {a}
              </span>
            ))}
            <button
              type="button"
              aria-expanded={areasOpen}
              onClick={() => setAreasOpen((v) => !v)}
              className="px-2.5 h-6 rounded-full border border-dashed border-slate-300 text-slate-500 text-[10.5px] font-bold flex items-center active:bg-slate-100 cursor-pointer"
            >
              {areasOpen ? 'Show less' : `+${intro.areas.length - 6} more`}
            </button>
          </div>
        </Card>
      )}

      <section className="space-y-2.5">
        <SectionTitle title="Rates by level" subtitle={`${visible.length} ${visible.length === 1 ? 'row' : 'rows'} · hourly rate per staff member`} />
        {levelOptions.length > 2 && <ChipRow options={levelOptions} value={level} onChange={setLevel} label="Level" />}
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {visible.map((r) => (
              <PricingRowItem key={r.id} row={r} />
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
};

/* ---------------------------- Additional Information ---------------------------- */

const MODEL_STYLE: Record<string, { icon: React.ElementType; badge: string; soft: string }> = {
  full: { icon: UserRound, badge: 'from-[#60A5FA] to-[#2F68FE]', soft: 'bg-[#EFF6FF] text-[#1D4ED8]' },
  part: { icon: Clock3, badge: 'from-[#34D399] to-[#059669]', soft: 'bg-[#E8F8F0] text-[#059669]' },
  demand: { icon: Timer, badge: 'from-[#A78BFA] to-[#7C3AED]', soft: 'bg-[#F5F3FF] text-[#7C3AED]' },
};

const GROUP_ICON: Record<string, React.ElementType> = {
  billing: CreditCard,
  certification: GraduationCap,
  onboarding: Rocket,
};

const AdditionalTab: React.FC = () => {
  const [openGroup, setOpenGroup] = useState<string | null>(HIRING_TERM_GROUPS[0].id);
  return (
    <div className="space-y-4">
      <Hero
        eyebrow="Hiring models"
        title="Pick how you want to hire"
        text="Same staff, three ways to engage. Rates are billed weekly in USD with no set-up fees."
        stats={[
          { label: 'Models', value: String(HIRING_MODELS.length) },
          { label: 'Notice', value: '9 weeks' },
          { label: 'Set-up fee', value: 'None' },
        ]}
      />

      <section className="space-y-2.5">
        <SectionTitle title="Hiring Models and Pricing" subtitle="Hiring tenure: round the year" />
        <div className="space-y-2.5">
          {HIRING_MODELS.map((m) => {
            const s = MODEL_STYLE[m.id];
            const Icon = s.icon;
            return (
              <Card key={m.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className={`w-11 h-11 rounded-2xl bg-linear-to-br ${s.badge} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-extrabold text-[#1E293B]">{m.name}</p>
                    <p className="text-[11px] text-slate-500">Available for {m.availableUpto.toLowerCase()}</p>
                  </div>
                  <span className={`px-2.5 h-6 rounded-full text-[10.5px] font-bold flex items-center whitespace-nowrap ${m.rateAdjusted ? 'bg-[#E8F8F0] text-[#059669]' : 'bg-slate-100 text-slate-500'}`}>
                    {m.rate}
                  </span>
                </div>
                <div className="mt-3.5 grid grid-cols-2 gap-2">
                  <div className={`rounded-xl px-3 py-2 ${s.soft.split(' ')[0]}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Minimum weekly billing</p>
                    <p className="mt-0.5 text-[14px] font-extrabold text-[#1E293B] tabular-nums">{m.minWeeklyBilling}</p>
                  </div>
                  <div className="rounded-xl px-3 py-2 bg-slate-50">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Available upto</p>
                    <p className="mt-0.5 text-[14px] font-extrabold text-[#1E293B]">{m.availableUpto}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <Card className="p-4 space-y-2.5">
          {HIRING_MODEL_NOTES.map((n) => (
            <div key={n.title} className="flex items-start gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </span>
              <p className="text-[11.5px] text-slate-600 leading-relaxed">
                <span className="font-bold text-[#1E293B]">{n.title}: </span>
                {n.text}
              </p>
            </div>
          ))}
        </Card>
      </section>

      <section className="space-y-2.5">
        <SectionTitle title="Good to know" subtitle="Terms that apply to every hire" />
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {HIRING_TERM_GROUPS.map((g) => {
              const open = openGroup === g.id;
              const Icon = GROUP_ICON[g.id] ?? CalendarCheck;
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenGroup(open ? null : g.id)}
                    className="w-full p-3.5 flex items-center gap-3 text-left active:bg-slate-50 cursor-pointer"
                  >
                    <span className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-bold text-[#1E293B]">{g.title}</span>
                      <span className="block text-[10.5px] text-slate-400">{g.items.length} points</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <ul className="px-3.5 pb-3.5 space-y-2 animate-in fade-in duration-200">
                      {g.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11.5px] text-slate-600 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-px" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <Card className="p-4 border-[#BBF7D0] bg-[#F0FDF4] flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-white text-[#059669] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold text-[#166534]">Cancellation Policy</h2>
          <p className="mt-1 text-[11.5px] text-[#166534] leading-relaxed">{CANCELLATION_POLICY}</p>
        </div>
      </Card>
    </div>
  );
};

const ContactCard: React.FC<{ onContact: () => void }> = ({ onContact }) => (
  <Card className="p-4 flex items-center gap-3">
    <span className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
      <Headset className="w-5 h-5" />
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-bold text-[#1E293B]">Need a custom quote?</p>
      <p className="text-[11px] text-slate-500">Your Account Manager can help you pick a model.</p>
    </div>
    <button
      type="button"
      onClick={onContact}
      className="h-9 px-3.5 rounded-xl bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold active:bg-[#DBEAFE] shrink-0 cursor-pointer"
    >
      Contact
    </button>
  </Card>
);

/* ---------------------------------- View ---------------------------------- */

/**
 * Hire New Staff › Pricing & Hiring (desktop `hiringpricing`): read-only rate tables per role category, hiring models and terms.
 * Rates follow the firm's country (currency comes from Company Profile).
 */
export const ClientHiringPricingView: React.FC<Props> = ({ companyName, country, onContactManager, onAddRequirement }) => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PricingCategory>('accounting');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const currency = currencyForCountry(country);
  const labels = PRICING_TABS.map((t) => t.label);
  const activeLabel = PRICING_TABS.find((t) => t.id === tab)?.label ?? labels[0];
  const rows = useMemo(() => (tab === 'additional' ? [] : pricingRowsFor(tab, currency)), [tab, currency]);

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Hire New Staff <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Pricing & Hiring</span>
          </p>
          <div className="mt-0.5 flex items-start justify-between gap-3 mb-1.5">
            <h1 className="text-xl font-extrabold leading-tight">Pricing & Hiring</h1>
            {onAddRequirement && (
              <button
                type="button"
                onClick={onAddRequirement}
                className="mt-0.5 h-9 pl-2.5 pr-3.5 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1 shadow-sm active:bg-[#1D4ED8] shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Requirement
              </button>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <CircleDollarSign className="w-3.5 h-3.5 text-slate-400" />
            {companyName} <span className="text-slate-300">·</span> Rates in {CURRENCY_LABEL[currency]}
          </p>
        </div>

        <div className="sticky top-0 z-10 mt-3 px-4 pt-1 pb-2 bg-[#F8FAFC]/95 backdrop-blur border-b border-slate-200/60">
          <ChipRow
            options={labels}
            value={activeLabel}
            onChange={(l) => setTab(PRICING_TABS.find((t) => t.label === l)?.id ?? 'accounting')}
            label="Pricing category"
          />
        </div>

        {loading ? (
          <PageSkeleton />
        ) : (
          <div key={tab} className="px-4 mt-4 space-y-4 animate-in fade-in duration-200">
            {tab === 'additional' ? (
              <AdditionalTab />
            ) : rows.length > 0 ? (
              <RoleTable category={tab} label={activeLabel} rows={rows} currencyLabel={currency} />
            ) : (
              <EmptyCard icon={Info} title="No Data Found" text="Pricing for this category isn't available yet." />
            )}
            <ContactCard onContact={onContactManager} />
          </div>
        )}
      </div>
    </div>
  );
};
