import { createContext, useContext } from 'react';

/** Text box look, for comparing designs: 'floating' = MyCPE design, 'icon' = like HRMS */
export type McFieldStyle = 'floating' | 'icon';

export const MC_FIELD_STYLES: { id: McFieldStyle; label: string }[] = [
  { id: 'floating', label: 'Previous (MyCPE design)' },
  { id: 'icon', label: 'Current (like HRMS)' },
];

const McFieldStyleContext = createContext<McFieldStyle>('icon');

export const McFieldStyleProvider = McFieldStyleContext.Provider;

export const useMcFieldStyle = () => useContext(McFieldStyleContext);
