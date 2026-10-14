const AVATAR_TINTS = [
  'bg-rose-50 text-rose-600',
  'bg-blue-50 text-blue-600',
  'bg-violet-50 text-violet-600',
  'bg-emerald-50 text-emerald-600',
  'bg-amber-50 text-amber-700',
  'bg-sky-50 text-sky-600',
];

export const avatarTint = (index: number) => AVATAR_TINTS[index % AVATAR_TINTS.length];

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

export const formatDayLabel = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
