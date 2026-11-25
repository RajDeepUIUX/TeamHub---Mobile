import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, FileText, Minus, Plus, X } from 'lucide-react';
import { CertFile, formatDate, formatSize } from './certModel';
import { sampleSummary } from './certService';

/** Thumbnail of an image, or the file type */
export const FileBadge: React.FC<{ file: CertFile }> = ({ file }) => {
  // An image that can't be shown falls back to its type
  const [broken, setBroken] = useState(false);
  if (file.url && !broken && (file.kind === 'JPG' || file.kind === 'PNG'))
    return <img src={file.url} alt="" onError={() => setBroken(true)} className="w-10 h-10 rounded-lg object-cover border border-mc-line shrink-0" />;
  return (
    <span className="w-10 h-10 rounded-lg bg-mc-primary-tint text-mc-primary flex flex-col items-center justify-center shrink-0" aria-hidden="true">
      <FileText className="w-4 h-4 stroke-[1.8]" />
      <span className="text-[9px] leading-3 font-bold">{file.kind}</span>
    </span>
  );
};

const MIN = 1;
const MAX = 4;

/** Drawn for demo samples: clearly a sample, not a document */
const SamplePage: React.FC<{ sample: number }> = ({ sample }) => {
  const s = sampleSummary(sample);
  return (
    <div className="relative w-full aspect-[4/3] bg-white border-[6px] border-double border-mc-primary-soft flex flex-col items-center justify-center text-center px-[6%] overflow-hidden @container">
      <span className="absolute inset-0 flex items-center justify-center text-[20cqw] font-semibold tracking-widest text-mc-primary/8 -rotate-[24deg]" aria-hidden="true">
        SAMPLE
      </span>
      <span className="text-[3.2cqw] font-semibold tracking-[0.2em] text-mc-indigo">SAMPLE CERTIFICATE</span>
      <span className="mt-[3cqw] text-[5.4cqw] leading-[1.25] font-semibold text-mc-ink">{s?.title}</span>
      <span className="mt-[3cqw] text-[3.4cqw] text-mc-text">{s?.provider}</span>
      <span className="mt-[1cqw] text-[3.4cqw] text-mc-text">{formatDate(s?.date ?? '')}</span>
    </div>
  );
};

/** Full-screen document viewer over the form (which stays as it was underneath) */
export const CertificateViewer: React.FC<{ file: CertFile; onClose: () => void }> = ({ file, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => closeRef.current?.focus(), []);

  const set = (z: number) => setZoom(Math.min(MAX, Math.max(MIN, Math.round(z * 100) / 100)));
  const gap = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const isPdf = file.kind === 'PDF' && Boolean(file.url);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Certificate: ${file.name}`} className="absolute inset-0 z-20 flex flex-col bg-mc-ink sheet-in">
      <header className="shrink-0 bg-white" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="min-h-14 pl-4 pr-1 flex items-center gap-2">
          <div className="flex-1 min-w-0 py-1.5">
            <h2 className="text-sm leading-5 font-semibold text-mc-ink-2 truncate">{file.name}</h2>
            <p className="text-xs text-mc-muted">
              {file.kind} · {formatSize(file.size)}
            </p>
          </div>
          {isPdf && (
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center text-mc-text" aria-label="Open in a new tab">
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
          <button ref={closeRef} type="button" onClick={onClose} className="w-12 h-12 flex items-center justify-center text-mc-ink-2 cursor-pointer" aria-label="Close certificate">
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {isPdf ? (
        // The browser's own PDF view scrolls and zooms
        <iframe src={file.url} title={file.name} className="flex-1 min-h-0 w-full bg-white" />
      ) : (
        <div
          className="flex-1 min-h-0 overflow-auto no-scrollbar"
          style={{ touchAction: 'pan-x pan-y' }}
          onTouchStart={(e) => {
            if (e.touches.length === 2) pinch.current = { distance: gap(e.touches), zoom };
          }}
          onTouchMove={(e) => {
            if (pinch.current && e.touches.length === 2) set((pinch.current.zoom * gap(e.touches)) / pinch.current.distance);
          }}
          onTouchEnd={() => {
            pinch.current = null;
          }}
          onDoubleClick={() => set(zoom > 1 ? 1 : 2)}
        >
          <div className="min-h-full flex items-center p-4" style={{ width: `${zoom * 100}%` }}>
            {file.url ? (
              <img src={file.url} alt={`Certificate ${file.name}`} className="w-full" draggable={false} />
            ) : (
              <SamplePage sample={file.sample ?? -1} />
            )}
          </div>
        </div>
      )}

      {!isPdf && (
        <footer className="shrink-0 bg-mc-ink flex items-center justify-center gap-2 pt-2" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          <button type="button" disabled={zoom <= MIN} onClick={() => set(zoom - 0.5)} className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-35 cursor-pointer" aria-label="Zoom out">
            <Minus className="w-5 h-5" />
          </button>
          <span className="w-16 text-center text-sm font-medium text-white tabular-nums" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" disabled={zoom >= MAX} onClick={() => set(zoom + 0.5)} className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-35 cursor-pointer" aria-label="Zoom in">
            <Plus className="w-5 h-5" />
          </button>
        </footer>
      )}
    </div>
  );
};
