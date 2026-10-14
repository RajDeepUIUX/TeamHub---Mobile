import React, { useEffect, useRef, useState } from 'react';
import { X, Send, RotateCcw, MessageSquare } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { Ticket, TicketComment } from '../../types/tickets';
import { formatTicketDateTime } from '../../data/ticketsData';
import { initialsOf } from '../home/celebrationUtils';

/** Keeps showing the last ticket while a sheet animates closed */
const useCachedTicket = (ticket: Ticket | null) => {
  const [cached, setCached] = useState<Ticket | null>(ticket);
  useEffect(() => {
    if (ticket) setCached(ticket);
  }, [ticket]);
  return ticket || cached;
};

const ROLE_TINT: Record<TicketComment['role'], string> = {
  Staff: 'bg-blue-50 text-[#2F68FE]',
  Manager: 'bg-violet-50 text-violet-600',
  Support: 'bg-emerald-50 text-emerald-600',
  System: 'bg-slate-100 text-slate-500',
};

/* ------------------------------- Comments ------------------------------- */

interface TicketCommentsSheetProps {
  ticket: Ticket | null;
  currentUser: string;
  onClose: () => void;
  onSend: (ticketId: string, text: string) => void;
}

export const TicketCommentsSheet: React.FC<TicketCommentsSheetProps> = ({ ticket, currentUser, onClose, onSend }) => {
  const t = useCachedTicket(ticket);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket) setText('');
  }, [ticket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the newest message in view
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [t?.comments.length]);

  if (!t) return null;

  const send = () => {
    if (!text.trim()) return;
    onSend(t.id, text.trim());
    setText('');
  };

  return (
    <BottomSheet isOpen={Boolean(ticket)} onClose={onClose} maxHeight="max-h-[88%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1E293B]">Comments</h2>
          <p className="text-[11px] text-slate-400 truncate">
            #{t.id} · {t.subject}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Thread */}
      <div ref={listRef} className="flex-1 min-h-40 overflow-y-auto no-scrollbar px-4 py-4 space-y-3 bg-slate-50/60">
        {t.comments.length === 0 && (
          <div className="py-10 flex flex-col items-center text-center">
            <span className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">No comments yet</p>
            <p className="text-xs text-slate-500">Start the conversation below.</p>
          </div>
        )}
        {t.comments.map((c) => {
          if (c.role === 'System') {
            return (
              <div key={c.id} className="flex justify-center">
                <span className="px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[10.5px] text-slate-500 text-center">
                  {c.text} · {formatTicketDateTime(c.createdAt)}
                </span>
              </div>
            );
          }
          const mine = c.author === currentUser;
          return (
            <div key={c.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              {!mine && (
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${ROLE_TINT[c.role]}`}
                >
                  {initialsOf(c.author)}
                </span>
              )}
              <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                {!mine && (
                  <span className="text-[10px] font-semibold text-slate-500 mb-0.5 px-1">
                    {c.author}
                    <span className="font-medium text-slate-400"> · {c.role}</span>
                  </span>
                )}
                <p
                  className={`px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                    mine
                      ? 'bg-[#2F68FE] text-white rounded-2xl rounded-br-md'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-bl-md'
                  }`}
                >
                  {c.text}
                </p>
                <span className="text-[9.5px] text-slate-400 mt-0.5 px-1">{formatTicketDateTime(c.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="p-3 pb-5 border-t border-slate-100 bg-white shrink-0 flex items-end gap-2">
        <textarea
          rows={1}
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Write a comment..."
          className="flex-1 max-h-28 min-h-11 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text"
        />
        <button
          type="button"
          onClick={send}
          disabled={!text.trim()}
          className="w-11 h-11 rounded-full bg-[#2F68FE] text-white flex items-center justify-center shrink-0 disabled:bg-slate-200 disabled:text-slate-400 active:bg-[#1D4ED8] transition-colors cursor-pointer"
          aria-label="Send comment"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </BottomSheet>
  );
};

/* -------------------------------- Reopen -------------------------------- */

interface ReopenTicketSheetProps {
  ticket: Ticket | null;
  onClose: () => void;
  onReopen: (ticketId: string, reason: string) => void;
}

export const ReopenTicketSheet: React.FC<ReopenTicketSheetProps> = ({ ticket, onClose, onReopen }) => {
  const t = useCachedTicket(ticket);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ticket) {
      setReason('');
      setError('');
      setSaving(false);
    }
  }, [ticket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!t) return null;

  const confirm = () => {
    if (!reason.trim()) {
      setError('Let the team know why you are reopening this ticket.');
      return;
    }
    setSaving(true);
    setTimeout(() => onReopen(t.id, reason.trim()), 500);
  };

  return (
    <BottomSheet isOpen={Boolean(ticket)} onClose={onClose} maxHeight="max-h-[80%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1E293B]">Reopen Ticket</h2>
            <p className="text-[11px] text-slate-400 truncate">
              #{t.id} · {t.subject}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="px-5 py-4 space-y-1.5">
        <label className="block text-xs font-bold text-[#1E293B]">
          Reason <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={3}
          value={reason}
          maxLength={300}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError('');
          }}
          placeholder="What still needs attention?"
          className={`w-full p-3.5 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text ${
            error ? 'border-rose-300' : 'border-slate-200'
          }`}
        />
        {error && <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
        <p className="text-[11px] text-slate-400">The ticket will move back to Open and the team will be notified.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={saving}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          {saving ? 'Reopening…' : 'Reopen'}
        </button>
      </div>
    </BottomSheet>
  );
};
