import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Pencil,
  User,
  Settings,
  Headphones,
  ChevronDown,
  ChevronRight,
  FileText,
  Ticket,
  MessageCircle,
  UtensilsCrossed,
  Coins,
  Phone,
  Laptop,
  Users,
  Car,
  LogOut,
  MapPin,
  BadgeCheck,
  Mail,
  ClipboardCheck,
  KeyRound,
  Camera,
  ImagePlus,
  Trash2,
  X,
} from 'lucide-react';
import { APP_VERSION } from '../auth/AuthFlow';
import { ChangePasswordSheet } from './ChangePasswordSheet';
import { ProfileAvatar } from './ProfileAvatar';
import { BottomSheet } from '../common/BottomSheet';

interface ProfileViewProps {
  name: string;
  email: string;
  role: string;
  branch: string;
  employeeId: string;
  onBack: () => void;
  onLogout: () => void;
  onOpenItem: (label: string) => void;
  onPasswordChanged: () => void;
  /** Uploaded profile photo (data URL); initials are shown when empty */
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

interface MenuItem {
  label: string;
  icon: React.ElementType;
  /** Tinted icon tile */
  tint: string;
  hint?: string;
  /** Small count shown before the chevron (e.g. pending actions) */
  badge?: number;
}

const ACCOUNT_ITEMS: MenuItem[] = [
  { label: 'Personal Information', icon: User, tint: 'bg-blue-50 text-blue-600', hint: 'Contact, address, emergency' },
  {
    label: 'Staff Review',
    icon: ClipboardCheck,
    tint: 'bg-amber-50 text-amber-600',
    hint: 'Form 180d open · Your action',
    badge: 1,
  },
];

const HELP_ITEMS: MenuItem[] = [
  { label: 'Change Password', icon: KeyRound, tint: 'bg-emerald-50 text-emerald-600', hint: 'Update your sign-in password' },
  { label: 'Account Settings', icon: Settings, tint: 'bg-slate-100 text-slate-600', hint: 'Notifications, preferences' },
];

const SUPPORT_ITEMS: MenuItem[] = [
  { label: 'Resignation', icon: FileText, tint: 'bg-rose-50 text-rose-500' },
  { label: 'Tickets', icon: Ticket, tint: 'bg-violet-50 text-violet-600' },
  { label: 'Feedback', icon: MessageCircle, tint: 'bg-sky-50 text-sky-600' },
  { label: 'Dinner', icon: UtensilsCrossed, tint: 'bg-orange-50 text-orange-500' },
  { label: 'Adv. Salary & EV Loan', icon: Coins, tint: 'bg-amber-50 text-amber-600' },
  { label: 'Relevant Contacts', icon: Phone, tint: 'bg-emerald-50 text-emerald-600' },
  { label: 'Asset', icon: Laptop, tint: 'bg-indigo-50 text-indigo-600' },
  { label: 'VOIP Directory', icon: Users, tint: 'bg-teal-50 text-teal-600' },
  { label: 'Cab Request', icon: Car, tint: 'bg-cyan-50 text-cyan-600' },
];

const MenuRow: React.FC<{ item: MenuItem; onClick: () => void; last?: boolean }> = ({ item, onClick, last }) => {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-3 pl-3.5 text-left hover:bg-slate-50/80 active:bg-slate-100/70 transition-colors cursor-pointer"
    >
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.tint}`}>
        <Icon className="w-4.5 h-4.5" />
      </span>
      {/* Divider is inset to start after the icon tile */}
      <span
        className={`flex-1 min-w-0 flex items-center gap-3 py-3 pr-3.5 ${last ? '' : 'border-b border-slate-100'}`}
      >
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-semibold text-[#1E293B] truncate">{item.label}</span>
          {item.hint && <span className="block text-[11px] text-slate-400 truncate">{item.hint}</span>}
        </span>
        {item.badge ? (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {item.badge}
          </span>
        ) : null}
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
      </span>
    </button>
  );
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  name,
  email,
  role,
  branch,
  employeeId,
  onBack,
  onLogout,
  onOpenItem,
  onPasswordChanged,
  photoUrl,
  onPhotoChange,
}) => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isPhotoSheetOpen, setIsPhotoSheetOpen] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickPhoto = () => {
    setIsPhotoSheetOpen(false);
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (JPG, PNG or WEBP).');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('Image is too large. Maximum size is 5 MB.');
      return;
    }
    setPhotoError('');
    const reader = new FileReader();
    reader.onload = () => onPhotoChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const openItem = (label: string) =>
    label === 'Change Password' ? setIsChangePasswordOpen(true) : onOpenItem(label);

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FB] text-[#1E293B] overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Gradient hero behind the header + profile card */}
        <div className="relative bg-linear-to-br from-[#4F6BFA] via-[#5B5EF5] to-[#8B5CF6] pb-16">
          {/* Decorative glows */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="absolute top-16 -left-12 w-36 h-36 rounded-full bg-cyan-300/20 blur-2xl" aria-hidden="true" />

          {/* Header */}
          <header className="relative flex items-center justify-between px-4 h-14">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-white">My Profile</h1>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer"
                aria-label="More options"
                aria-expanded={isMenuOpen}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 top-11 z-40 w-44 bg-white rounded-2xl p-1.5 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.35)] border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenItem('Edit Profile');
                      }}
                      className="w-full h-10 px-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-slate-400" />
                      Edit Profile
                    </button>
                    <div className="my-1 mx-2 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full h-10 px-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </header>
        </div>

        <div className="px-4 -mt-12 pb-6 space-y-3.5 relative">
          {/* Profile card */}
          <section className="bg-white rounded-3xl p-4 shadow-[0_12px_32px_-16px_rgba(79,70,229,0.35)] border border-white">
            <div className="flex items-start gap-3.5">
              {/* Avatar: tap to upload / change the profile photo */}
              <button
                type="button"
                onClick={() => (photoUrl ? setIsPhotoSheetOpen(true) : pickPhoto())}
                className="group relative shrink-0 cursor-pointer"
                aria-label={photoUrl ? 'Change profile photo' : 'Add profile photo'}
              >
                <span className="block w-16 h-16 rounded-2xl bg-linear-to-br from-amber-200 via-rose-200 to-violet-300 p-0.5">
                  <ProfileAvatar
                    name={name}
                    photoUrl={photoUrl}
                    className="w-full h-full rounded-[14px]"
                    textClassName="text-lg"
                  />
                </span>
                <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#2F68FE] text-white ring-[3px] ring-white flex items-center justify-center shadow-xs group-hover:bg-[#2558E6] transition-colors">
                  <Camera className="w-3 h-3" />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handlePhotoSelected}
              />
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-extrabold text-[#1E293B] leading-tight truncate">{name}</h2>
                  <BadgeCheck className="w-4.5 h-4.5 text-[#2F68FE] shrink-0" />
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{email}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenItem('Edit Profile')}
                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Edit profile"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {photoError && <p className="mt-2 text-[11px] font-medium text-rose-500">{photoError}</p>}

            {/* Quick facts */}
            <div className="mt-4 rounded-2xl bg-slate-50/80 border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-slate-200/70">
                {[
                  { label: 'Role', value: role },
                  { label: 'Emp. ID', value: employeeId },
                ].map(({ label, value }) => (
                  <div key={label} className="px-3 py-2.5 min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
                    <span className="block text-[13px] font-bold text-[#1E293B] truncate mt-0.5">{value}</span>
                  </div>
                ))}
              </div>
              <div className="px-3 py-2.5 border-t border-slate-200/70 flex items-center gap-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Branch</span>
                  <span className="block text-[13px] font-bold text-[#1E293B] truncate">{branch}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Account */}
          <section>
            <h3 className="px-1 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Account</h3>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
              {ACCOUNT_ITEMS.map((item, idx) => (
                <MenuRow
                  key={item.label}
                  item={item}
                  onClick={() => openItem(item.label)}
                  last={idx === ACCOUNT_ITEMS.length - 1}
                />
              ))}
            </div>
          </section>

          {/* Support (collapsible) */}
          <section>
            <h3 className="px-1 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Help</h3>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
              {HELP_ITEMS.map((item) => (
                <MenuRow key={item.label} item={item} onClick={() => openItem(item.label)} />
              ))}
              <button
                type="button"
                onClick={() => setIsSupportOpen((v) => !v)}
                aria-expanded={isSupportOpen}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors cursor-pointer ${
                  isSupportOpen ? 'bg-linear-to-r from-[#EEF2FF] to-[#F5F3FF]' : 'hover:bg-slate-50'
                }`}
              >
                <span className="w-9 h-9 rounded-xl bg-white text-[#4F46E5] shadow-2xs flex items-center justify-center shrink-0">
                  <Headphones className="w-4.5 h-4.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-bold text-[#1E293B]">Support</span>
                  <span className="block text-[11px] text-slate-500 truncate">Get help, raise requests and find resources.</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-white/80 text-[10px] font-bold text-[#4F46E5] shrink-0">
                  {SUPPORT_ITEMS.length}
                </span>
                <ChevronDown
                  className={`w-4.5 h-4.5 text-[#4F46E5] shrink-0 transition-transform duration-200 ${
                    isSupportOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isSupportOpen && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  {SUPPORT_ITEMS.map((item, idx) => (
                    <MenuRow
                      key={item.label}
                      item={item}
                      onClick={() => onOpenItem(item.label)}
                      last={idx === SUPPORT_ITEMS.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Log out */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full h-12 rounded-2xl bg-white border border-rose-100 text-rose-600 text-[13px] font-bold flex items-center justify-center gap-2 shadow-2xs hover:bg-rose-50 active:bg-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>

          <p className="text-center text-[11px] text-slate-400">MYCPE ONE · Team Hub Mobile · v{APP_VERSION}</p>
        </div>
      </div>

      <BottomSheet isOpen={isPhotoSheetOpen} onClose={() => setIsPhotoSheetOpen(false)} maxHeight="max-h-[60%]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1E293B]">Profile Photo</h2>
          <button
            type="button"
            onClick={() => setIsPhotoSheetOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 pb-8 space-y-1.5">
          <button
            type="button"
            onClick={pickPhoto}
            className="w-full h-12 px-4 rounded-xl flex items-center gap-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ImagePlus className="w-4.5 h-4.5 text-[#2F68FE]" />
            Choose a new photo
          </button>
          <button
            type="button"
            onClick={() => {
              onPhotoChange(null);
              setIsPhotoSheetOpen(false);
            }}
            className="w-full h-12 px-4 rounded-xl flex items-center gap-3 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="w-4.5 h-4.5" />
            Remove photo
          </button>
        </div>
      </BottomSheet>

      <ChangePasswordSheet
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onChanged={() => {
          setIsChangePasswordOpen(false);
          onPasswordChanged();
        }}
      />
    </div>
  );
};
