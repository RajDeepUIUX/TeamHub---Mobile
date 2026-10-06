import React from 'react';
import { Bell } from 'lucide-react';
import { BrandLogoHorizontal } from '../auth/BrandLogo';
import { ProfileAvatar } from '../profile/ProfileAvatar';

interface AppHeaderProps {
  fullName: string;
  profilePhoto?: string | null;
  unreadNotifications: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onGoHome: () => void;
}

/** Brand bar pinned to the top of every signed-in screen */
export const AppHeader: React.FC<AppHeaderProps> = ({
  fullName,
  profilePhoto,
  unreadNotifications,
  onOpenNotifications,
  onOpenProfile,
  onGoHome,
}) => (
  <header className="shrink-0 bg-white/95 backdrop-blur-md px-4 h-14 flex items-center justify-between border-b border-[#EBF0F7] z-10">
    <button type="button" onClick={onGoHome} className="flex items-center cursor-pointer" aria-label="Go to dashboard">
      <BrandLogoHorizontal className="h-5" />
    </button>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onOpenNotifications}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-600 active:bg-slate-100 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadNotifications > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onOpenProfile}
        className="w-8 h-8 rounded-full ring-2 ring-white shadow-xs active:ring-[#C7D2FE] transition cursor-pointer"
        aria-label="My profile"
      >
        <ProfileAvatar name={fullName} photoUrl={profilePhoto} className="w-8 h-8 rounded-full" textClassName="text-[11px]" />
      </button>
    </div>
  </header>
);
