/** Mock data for Human Resources → Management Fee Structure (desktop `management_fee_structure`, read-only per-client tables) */

/** "Staff Member As Per Team Size" columns */
export interface TeamSizeBracket {
  id: string;
  label: string;
  min: number;
  /** null = open-ended (75+) */
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
    brackets: [bracket(15, 25), bracket(26, 35), bracket(36, 50), bracket(51, 75), bracket(75, null)],
    levels: [
      { level: 1, usExperience: 'Fresh Talent', fees: [900, 840, 760, 660, 560] },
      { level: 2, usExperience: 'Fresh Talent', fees: [900, 840, 760, 660, 560] },
      { level: 3, usExperience: '1-2 Years', fees: [1100, 1000, 900, 840, 760] },
      { level: 4, usExperience: '2-3 Years', fees: [1100, 1000, 900, 840, 790] },
      { level: 5, usExperience: '3-5 Years', fees: [1250, 1180, 1100, 1000, 900] },
      { level: 6, usExperience: '5-8 Years', fees: [1250, 1180, 1100, 1000, 900] },
      { level: 7, usExperience: '8-10 Years', fees: [1450, 1350, 1250, 1180, 1100] },
      { level: 8, usExperience: '10+ Years', fees: [1450, 1350, 1250, 1180, 1100] },
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
      { bracket: bracket(60, null), hourlyFee: 5.25 },
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

/** One chart per client login (desktop hard-codes the table by client id); firms are fictional */
export interface MgmtFeeChart {
  id: 'level-wise' | 'per-hour' | 'work-mode';
  tabLabel: string;
  firmName: string;
  structure: ClientMgmtFeeStructure;
}

export const MGMT_FEE_CHARTS: MgmtFeeChart[] = [
  { id: 'level-wise', tabLabel: 'Level Wise', firmName: 'Northwind CPA', structure: LEVEL_WISE_SEED },
  { id: 'per-hour', tabLabel: 'Per Hour', firmName: 'Bluebay CPA', structure: HOURLY_SEED },
  { id: 'work-mode', tabLabel: 'Work Mode', firmName: 'Ridgeway & Company', structure: WORK_MODE_SEED },
];

export const formatFee = (v: number, decimals = 0) =>
  `$${v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
