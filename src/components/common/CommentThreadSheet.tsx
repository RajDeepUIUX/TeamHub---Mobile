import React, { useEffect, useRef, useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { ThreadComment } from '../../types/comments';
import { initialsOf } from '../home/celebrationUtils';

interface CommentThreadSheetProps {
  isOpen: boolean;
  title?: string;
  /** Short context line under the title (e.g. what the request is) */
  subtitle: string;
  comments: ThreadComment[];
  /** Messages by this author are shown on the right */
  currentUser: string;
  onClose: () => void;
  onSend: (text: string) => void;
  placeholder?: string;
}

const ROLE_TINT: Record<ThreadComment['role'], string> = {
  Staff: 'bg-blue-50 text-[#2F68FE]',
  Manager: 'bg-violet-50 text-violet-600',
  Support: 'bg-emerald-50 text-emerald-600',
  System: 'bg-slate-100 text-slate-500',
};

const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

/** Chat-style comment thread in a bottom sheet (shared by request modules) */
export const CommentThreadSheet: React.FC<CommentThreadSheetProps> = ({
  isOpen,
  title = 'Comments',
  subtitle,
  comments,
  currentUser,
  onClose,
  onSend,
  placeholder = 'Write a comment...',
}) => {
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setText('');
  }, [isOpen]);

  // Keep the newest message in view
  useEffect(() => {
    if (isOpen) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [isOpen, comments.length]);

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1E293B]">
            {title}
            {comments.length > 0 && <span className="ml-1.5 text-xs font-semibold text-slate-400">({comments.length})</span>}
          </h2>
          <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
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
      <div ref={listRef} className="flex-1 min-h-44 overflow-y-auto no-scrollbar px-4 py-4 space-y-3 bg-slate-50/60">
        {comments.length === 0 && (
          <div className="py-10 flex flex-col items-center text-center">
            <span className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">No comments yet</p>
            <p className="text-xs text-slate-500">Start the conversation below.</p>
          </div>
        )}
        {comments.map((c) => {
          if (c.role === 'System') {
            return (
              <div key={c.id} className="flex justify-center">
                <span className="max-w-[90%] px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[10.5px] text-slate-500 text-center">
                  {c.text} · {stamp(c.createdAt)}
                </span>
              </div>
            );
          }
          const mine = c.author === currentUser;
          return (
            <div key={c.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              {!mine && (
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${ROLE_TINT[c.role]}`}>
                  {initialsOf(c.author)}
                </span>
              )}
              <div className={`max-w-[78%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
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
                <span className="text-[9.5px] text-slate-400 mt-0.5 px-1">{stamp(c.createdAt)}</span>
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
          placeholder={placeholder}
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
