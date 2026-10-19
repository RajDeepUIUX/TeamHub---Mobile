import React, { useEffect, useRef, useState } from 'react';
import { MessageSquareText, Send } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { TniNote, formatTniNoteDate } from '../data/clientTrainingNeedData';

/** Desktop "Software List" modal: the software ticked on a request, as tags */
export const TrainingNeedSoftwareSheet: React.FC<{ isOpen: boolean; staffName: string; software: string[]; onClose: () => void }> = ({
  isOpen,
  staffName,
  software,
  onClose,
}) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[60%]">
    <SheetHeader title="Software List" subtitle={staffName} onClose={onClose} />
    <div className="px-5 py-4 pb-8 flex flex-wrap gap-2">
      {software.length === 0 ? (
        <p className="text-xs text-slate-500">No software found</p>
      ) : (
        software.map((s) => (
          <span key={s} className="px-3 py-1.5 rounded-full bg-[#F2F4F7] text-[12.5px] text-[#475467]">
            {s}
          </span>
        ))
      )}
    </div>
  </BottomSheet>
);

interface NotesProps {
  isOpen: boolean;
  staffName: string;
  trainingLabel: string;
  notes: TniNote[];
  /** Sending needs the edit flag; without it Notes are read-only */
  canSend: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
}

/** Desktop "Notes" offcanvas (`tr_feedback`): conversation with the L&D team, newest first, Write + Cancel / Send */
export const TrainingNeedNotesSheet: React.FC<NotesProps> = ({ isOpen, staffName, trainingLabel, notes, canSend, onSend, onClose }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setError('');
    }
  }, [isOpen]);

  const send = () => {
    if (!text.trim()) {
      setError('This field is required.');
      return;
    }
    onSend(text.trim());
    setText('');
    setError('');
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Notes" subtitle={`${staffName} · ${trainingLabel}`} onClose={onClose} />
      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
        {notes.length === 0 ? (
          <div className="py-8 flex flex-col items-center text-center">
            <span className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <MessageSquareText className="w-5 h-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">No Notes Found</p>
            {canSend && <p className="mt-1 text-xs text-slate-500">Write to the L&amp;D team below.</p>}
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className={`flex ${n.mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${n.mine ? 'bg-[#EFF6FF] border border-[#BFDBFE] rounded-br-md' : 'bg-slate-50 border border-slate-100 rounded-bl-md'}`}>
                <p className="flex items-center justify-between gap-4 text-[11px]">
                  <span className="font-bold text-[#1E293B]">{n.mine ? 'You' : n.author}</span>
                  <span className="text-slate-400 tabular-nums">{formatTniNoteDate(n.createdAt)}</span>
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate-700 break-words">{n.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {canSend && (
        <div className="px-4 pt-3 pb-6 border-t border-slate-100 shrink-0 space-y-3">
          <div className="space-y-1">
            <textarea
              rows={3}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError('');
              }}
              placeholder="Write"
              aria-label="Write a note"
              aria-invalid={Boolean(error)}
              className={`w-full p-3.5 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 resize-none select-text ${
                error ? 'border-rose-300' : 'border-slate-200'
              }`}
            />
            {error && (
              <p className="px-0.5 text-[11px] font-medium text-rose-500" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
};
