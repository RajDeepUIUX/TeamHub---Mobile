import React from 'react';

export const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
};

interface ProfileAvatarProps {
  name: string;
  photoUrl?: string | null;
  /** Tailwind size + radius classes, e.g. "w-16 h-16 rounded-2xl" */
  className?: string;
  textClassName?: string;
}

/** Shows the uploaded photo, or first + last name initials as a fallback */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  photoUrl,
  className = 'w-8 h-8 rounded-full',
  textClassName = 'text-xs',
}) =>
  photoUrl ? (
    <img src={photoUrl} alt={name} className={`${className} object-cover`} draggable={false} />
  ) : (
    <span
      className={`${className} ${textClassName} bg-linear-to-br from-[#FFF7ED] via-[#FDE7F3] to-[#EDE9FE] text-[#7C2D12] font-extrabold flex items-center justify-center`}
      aria-label={name}
    >
      {initialsOf(name)}
    </span>
  );
