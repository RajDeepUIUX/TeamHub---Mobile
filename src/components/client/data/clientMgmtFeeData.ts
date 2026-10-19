/** Mock data for Human Resources → Management Fee Structure (desktop `management_fee_structure`, read-only per-client tables) */

import { CURRENT_STAFF_STATUSES, MY_STAFF_SEED } from './clientStaffData';

/** "Staff Member As Per Team Size" columns */
export interface TeamSizeBracket {
  id: string;
  label: string;
  min: number;
  /** null = open-ended (76+) */
  max: number | null;
}

export interface LevelFeeRow {
  level: number;
  usExperience: string;
  /** Fee per staff member per month, one per bracket (same order as brackets) */
  fees: number[];
}

/** MOS: level-wise monthly fee per staff member, cheaper as the team grows */
export interface MosFeeStructure {
  brackets: TeamSizeBracket[];
  levels: LevelFeeRow[];
}

/** Other: fixed monthly fee per staff member by work mode */
export interface WorkModeFeeRow {
  mode: 'Work From Office' | 'Work From Home';
  monthlyFee: number;
}

/** Other: fixed fee per hour by number of staff */
export interface HourlyFeeRow {
  bracket: TeamSizeBracket;
  hourlyFee: number;
}

export interface OtherFeeStructure {
  workMode: WorkModeFeeRow[] | null;
  hourly: HourlyFeeRow[] | null;
}

/** Desktop shows exactly one table per client (level matrix OR work mode OR hourly); all null = "No Data Found" */
export interface ClientMgmtFeeStructure {
  mos: MosFeeStructure | null;
  other: OtherFeeStructure | null;
}

const bracket = (min: number, max: number | null): TeamSizeBracket => ({
  id: `${min}-${max ?? 'plus'}`,
  label: max === null ? `${min}+` : `${min}-${max}`,
  min,
  max,
});

const LEVEL_WISE_SEED: ClientMgmtFeeStructure = {
  other: null,
  mos: {
    brackets: [bracket(15, 25), bracket(26, 35), bracket(36, 50), bracket(51, 75), bracket(76, null)],
    levels: [
      { level: 1, usExperience: 'Fresh Talent', fees: [900, 860, 820, 780, 740] },
      { level: 2, usExperience: 'Fresh Talent', fees: [950, 910, 870, 830, 790] },
      { level: 3, usExperience: '1-2 Years', fees: [1100, 1050, 1000, 950, 900] },
      { level: 4, usExperience: '2-3 Years', fees: [1150, 1100, 1050, 1000, 950] },
      { level: 5, usExperience: '3-5 Years', fees: [1300, 1240, 1180, 1120, 1060] },
      { level: 6, usExperience: '5-8 Years', fees: [1350, 1290, 1230, 1170, 1110] },
      { level: 7, usExperience: '8-10 Years', fees: [1500, 1430, 1360, 1290, 1220] },
      { level: 8, usExperience: '10+ Years', fees: [1600, 1520, 1440, 1360, 1280] },
    ],
  },
};

const WORK_MODE_SEED: ClientMgmtFeeStructure = {
  mos: null,
  other: {
    workMode: [
      { mode: 'Work From Office', monthlyFee: 900 },
      { mode: 'Work From Home', monthlyFee: 650 },
    ],
    hourly: null,
  },
};

const HOURLY_SEED: ClientMgmtFeeStructure = {
  mos: null,
  other: {
    workMode: null,
    hourly: [
      { bracket: bracket(1, 40), hourlyFee: 6.25 },
      { bracket: bracket(41, 60), hourlyFee: 5.75 },
      { bracket: bracket(61, null), hourlyFee: 5.25 },
    ],
  },
};

/** One variant per desktop table; the logged-in client gets exactly one (swap `MGMT_FEE_SEED` to preview the others) */
export const MGMT_FEE_SEEDS = {
  levelWise: LEVEL_WISE_SEED,
  workMode: WORK_MODE_SEED,
  hourly: HOURLY_SEED,
  none: { mos: null, other: null } as ClientMgmtFeeStructure,
};

export const MGMT_FEE_SEED: ClientMgmtFeeStructure = MGMT_FEE_SEEDS.levelWise;

/** Team size used for "Your team" = current staff in My Staff (desktop default filter: everyone except Inactive) */
export const MGMT_FEE_CURRENT_STAFF = MY_STAFF_SEED.filter((s) => CURRENT_STAFF_STATUSES.includes(s.status));
export const MGMT_FEE_TEAM_SIZE = MGMT_FEE_CURRENT_STAFF.length;

/** Current staff count per level number (e.g. { 3: 9 }) */
export const MGMT_FEE_STAFF_BY_LEVEL: Record<number, number> = MGMT_FEE_CURRENT_STAFF.reduce<Record<number, number>>((acc, s) => {
  const n = Number(s.level.replace(/\D/g, ''));
  acc[n] = (acc[n] ?? 0) + 1;
  return acc;
}, {});

/** Bracket index a team size falls in; below the first bracket → first, above the last → last */
export const bracketIndexFor = (brackets: TeamSizeBracket[], size: number) => {
  const idx = brackets.findIndex((b) => size >= b.min && (b.max === null || size <= b.max));
  if (idx >= 0) return idx;
  return size < brackets[0].min ? 0 : brackets.length - 1;
};

export const formatFee = (v: number, decimals = 0) =>
  `$${v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
