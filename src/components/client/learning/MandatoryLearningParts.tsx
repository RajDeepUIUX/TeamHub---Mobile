import React from 'react';
import { MlStatus } from '../data/clientMandatoryLearningData';
import { Pill, Tone } from '../staff/tabs/StaffTabParts';

/** Desktop badges: Completed green, In-Progress amber, Not Started purple */
const STATUS_TONE: Record<MlStatus, Tone> = {
  Completed: 'green',
  'In-Progress': 'amber',
  'Not Started': 'indigo',
};

export const MlStatusPill: React.FC<{ status: MlStatus }> = ({ status }) => <Pill tone={STATUS_TONE[status]}>{status}</Pill>;
