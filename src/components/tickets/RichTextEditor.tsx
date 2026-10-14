import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Undo2, Redo2, Heading2, Pilcrow } from 'lucide-react';

interface RichTextEditorProps {
  /** Initial / externally-set HTML. Changing it replaces the editor content. */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  invalid?: boolean;
}

type FormatState = { bold: boolean; italic: boolean; ul: boolean; ol: boolean; heading: boolean };

const EMPTY_FORMAT: FormatState = { bold: false, italic: false, ul: false, ol: false, heading: false };

/**
 * Minimal contentEditable editor with a mobile-friendly toolbar.
 * Uses document.execCommand, which is sufficient for a prototype and supported by all major browsers.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder = 'Type...', invalid }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string>('');
  const [format, setFormat] = useState<FormatState>(EMPTY_FORMAT);
  const [isEmpty, setIsEmpty] = useState(!value);

  // Sync external value (e.g. Quick Fill / reset) without clobbering the caret while typing
  useEffect(() => {
    const el = editorRef.current;
    if (el && value !== lastEmitted.current) {
      el.innerHTML = value;
      lastEmitted.current = value;
      setIsEmpty(!el.textContent?.trim());
    }
  }, [value]);

  const refreshFormat = useCallback(() => {
    const el = editorRef.current;
    const sel = document.getSelection();
    if (!el || !sel || !sel.anchorNode || !el.contains(sel.anchorNode)) return;
    const block = String(document.queryCommandValue('formatBlock')).toLowerCase();
    setFormat({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList'),
      heading: block === 'h2' || block === 'h3',
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', refreshFormat);
    return () => document.removeEventListener('selectionchange', refreshFormat);
  }, [refreshFormat]);

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.textContent?.trim() ?? '';
    const html = text ? el.innerHTML : '';
    lastEmitted.current = html;
    setIsEmpty(!text);
    onChange(html);
  };

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emit();
    refreshFormat();
  };

  const tools: { key: string; label: string; icon: React.ElementType; active?: boolean; run: () => void }[] = [
    {
      key: 'block',
      label: format.heading ? 'Paragraph' : 'Heading',
      icon: format.heading ? Pilcrow : Heading2,
      active: format.heading,
      run: () => exec('formatBlock', format.heading ? 'p' : 'h3'),
    },
    { key: 'bold', label: 'Bold', icon: Bold, active: format.bold, run: () => exec('bold') },
    { key: 'italic', label: 'Italic', icon: Italic, active: format.italic, run: () => exec('italic') },
    { key: 'ul', label: 'Bulleted list', icon: List, active: format.ul, run: () => exec('insertUnorderedList') },
    { key: 'ol', label: 'Numbered list', icon: ListOrdered, active: format.ol, run: () => exec('insertOrderedList') },
  ];

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden shadow-2xs transition-all focus-within:ring-4 ${
        invalid ? 'border-rose-300 focus-within:ring-rose-50' : 'border-slate-200 focus-within:border-[#2F68FE] focus-within:ring-blue-50'
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-slate-100 bg-slate-50/70">
        {tools.map(({ key, label, icon: Icon, active, run }, idx) => (
          <React.Fragment key={key}>
            {(idx === 1 || idx === 3) && <span className="w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />}
            <button
              type="button"
              aria-label={label}
              aria-pressed={active}
              // Keep the text selection while tapping toolbar buttons
              onMouseDown={(e) => e.preventDefault()}
              onClick={run}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                active ? 'bg-white text-[#2F68FE] shadow-2xs' : 'text-slate-600 active:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          </React.Fragment>
        ))}
        <span className="ml-auto flex items-center gap-0.5">
          {[
            { key: 'undo', label: 'Undo', icon: Undo2 },
            { key: 'redo', label: 'Redo', icon: Redo2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-label={label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec(key)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </span>
      </div>

      {/* Editable area */}
      <div className="relative">
        {isEmpty && (
          <span className="absolute left-3.5 top-3 text-xs text-slate-400 pointer-events-none">{placeholder}</span>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label="Description"
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onKeyUp={refreshFormat}
          className="ticket-rich min-h-40 max-h-72 overflow-y-auto px-3.5 py-3 text-xs leading-relaxed text-[#1E293B] focus:outline-hidden select-text"
        />
      </div>
    </div>
  );
};
