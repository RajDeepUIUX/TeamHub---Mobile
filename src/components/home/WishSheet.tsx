import React, { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { TeamCelebration } from '../../data/dashboardData';
import { avatarTint, initialsOf } from './celebrationUtils';

interface WishSheetProps {
  person: TeamCelebration | null;
  kind: 'birthday' | 'anniversary';
  onClose: () => void;
  onSend: (person: TeamCelebration, message: string) => void;
}

const QUICK_WISHES = {
  birthday: ['Happy Birthday! 🎉', 'Have an amazing year ahead! 🎂', 'Wishing you a fantastic day! 🥳'],
  anniversary: ['Happy Work Anniversary! 🎉', 'Congrats on the milestone! ✨', 'Thanks for everything you do! 🙌'],
};

export const WishSheet: React.FC<WishSheetProps> = ({ person, kind, onClose, onSend }) => {
  const [cached, setCached] = useState<TeamCelebration | null>(person);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (person) {
      setCached(person);
      setMessage(QUICK_WISHES[kind][0]);
    }
  }, [person, kind]);

  const active = person || cached;
  if (!active) return null;

  const idx = Number(active.id.replace(/\D/g, '')) || 0;
  const occasion =
    kind === 'birthday'
      ? active.inDays === 0
        ? 'Birthday today'
        : active.inDays === 1
          ? 'Birthday tomorrow'
          : `Birthday in ${active.inDays} days`
      : `${active.years}-year work anniversary`;

  return (
    <BottomSheet isOpen={Boolean(person)} onClose={onClose} maxHeight="max-h-[85%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
        <h2 className="text-base font-bold text-[#1E293B]">Send Wishes</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-2 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${avatarTint(idx)}`}>
            {initialsOf(active.name)}
          </span>
          <div className="min-w-0">
            <span className="block text-sm font-bold text-[#1E293B]">{active.name}</span>
            <span className="block text-[11px] text-slate-500">
              {active.department} · {occasion}
            </span>
          </div>
          <span className="ml-auto text-2xl" aria-hidden="true">
            {kind === 'birthday' ? '🎂' : '✨'}
          </span>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-bold text-[#1E293B]">Quick wishes</span>
          <div className="flex flex-wrap gap-2">
            {QUICK_WISHES[kind].map((wish) => (
              <button
                key={wish}
                type="button"
                onClick={() => setMessage(wish)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  message === wish
                    ? 'border-[#2F68FE] bg-blue-50 text-[#2F68FE]'
                    : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
                }`}
              >
                {wish}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-xs font-bold text-[#1E293B]">Your message</span>
          <textarea
            rows={3}
            value={message}
            maxLength={200}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none"
            placeholder="Write something nice..."
          />
        </div>
      </div>

      <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          disabled={!message.trim()}
          onClick={() => onSend(active, message.trim())}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-bold text-xs flex items-center justify-center gap-2 active:bg-[#2558E6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Send Wish
        </button>
      </div>
    </BottomSheet>
  );
};
