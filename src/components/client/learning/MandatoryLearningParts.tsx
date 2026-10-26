import React from 'react';
import { MlStatus } from '../data/clientMandatoryLearningData';
import { Pill, Tone } from '../staff/tabs/StaffTabParts';

/** Desktop badges: Completed green, In-Progress amber, Not Started neutral (redesign 2.5) */
const STATUS_TONE: Record<MlStatus, Tone> = {
  Completed: 'green',
  'In-Progress': 'amber',
  'Not Started': 'slate',
};

export const MlStatusPill: React.FC<{ status: MlStatus }> = ({ status }) => <Pill tone={STATUS_TONE[status]}>{status}</Pill>;
