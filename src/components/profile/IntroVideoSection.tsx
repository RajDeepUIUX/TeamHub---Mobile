import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  PlayCircle,
  Upload,
  Link2,
  CloudUpload,
  CheckCircle2,
  FileVideo,
  CalendarDays,
  RefreshCw,
  Trash2,
  X,
  ExternalLink,
  Video,
  FileText,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { ProfileValue, ProfileValues } from '../../data/profileData';

/* Values kept in the profile (session-only for uploads: the file lives as an object URL) */
const K = {
  type: 'introVideoType', // 'upload' | 'link'
  name: 'introVideoName',
  url: 'introVideoUrl',
  addedOn: 'introVideoAddedOn',
} as const;

type VideoKind = 'upload' | 'link';

const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const VIDEO_HOSTS = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|loom\.com)$/i;

const GUIDELINES_URL =
  'https://user.my-cpe.com/index.php?controller=assets_data&u=uploads/live_assets/policy/269/20260910174757_0_Profile_introduction_Video_on_resume.pdf';
const SAMPLE_VIDEO_URL = 'https://user.my-cpe.com/webroot/images/1.Self%20Introduction%20Video%202.mp4';

const formatBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const todayLabel = () => new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

const SheetHeader: React.FC<{ title: string; subtitle?: string; onClose: () => void }> = ({ title, subtitle, onClose }) => (
  <>
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 shrink-0">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-[#1E293B]">{title}</h2>
        {subtitle && <p className="text-[11.5px] text-slate-500 mt-0.5">{subtitle}</p>}
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
  </>
);

/* ------------------------------ Add video sheet ----------------------------- */

const AddVideoSheet: React.FC<{
  open: VideoKind | null;
  replacing: boolean;
  onClose: () => void;
  onDone: (video: { type: VideoKind; name: string; url: string }) => void;
}> = ({ open, replacing, onClose, onDone }) => {
  const [kind, setKind] = useState<VideoKind>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    setKind(open);
    setFile(null);
    setLink('');
    setError('');
    setProgress(null);
  }, [open]);

  useEffect(() => () => window.clearInterval(timer.current), []);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!/^video\/(mp4|quicktime)$/.test(f.type) && !/\.(mp4|mov)$/i.test(f.name)) {
      setError('Please choose an MP4 or MOV video.');
      return;
    }
    if (f.size > MAX_VIDEO_BYTES) {
      setError('This video is larger than 200 MB. Try trimming or compressing it.');
      return;
    }
    setError('');
    setFile(f);
  };

  const submit = () => {
    if (kind === 'link') {
      let host = '';
      try {
        const u = new URL(link.trim());
        host = u.protocol.startsWith('http') ? u.hostname.replace(/^www\./, '') : '';
      } catch {
        host = '';
      }
      if (!link.trim()) return setError('Paste your video link.');
      if (!host) return setError('Enter a full link starting with https://');
      if (!VIDEO_HOSTS.test(host)) return setError('Use a YouTube, Vimeo or Loom link.');
      onDone({ type: 'link', name: host, url: link.trim() });
      return;
    }
    if (!file) return setError('Choose a video to upload.');
    // Simulated upload progress for the prototype
    setProgress(0);
    timer.current = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, (p ?? 0) + 8 + Math.random() * 14);
        if (next >= 100) {
          window.clearInterval(timer.current);
          window.setTimeout(() => onDone({ type: 'upload', name: file.name, url: URL.createObjectURL(file) }), 250);
        }
        return next;
      });
    }, 120);
  };

  const uploading = progress !== null;

  return (
    <BottomSheet isOpen={Boolean(open)} onClose={uploading ? () => {} : onClose} maxHeight="max-h-[88%]">
      <SheetHeader
        title={replacing ? 'Replace Introduction Video' : 'Add Introduction Video'}
        subtitle="Upload a file or share a link to your video."
        onClose={onClose}
      />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-4 space-y-4">
        {/* Video type */}
        <div role="radiogroup" aria-label="Video type" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100">
          {(
            [
              ['upload', 'Upload Video', Upload],
              ['link', 'Paste Link', Link2],
            ] as const
          ).map(([id, label, Icon]) => {
            const on = kind === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={uploading}
                onClick={() => {
                  setKind(id);
                  setError('');
                }}
                className={`h-10 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
                  on ? 'bg-white text-[#2F68FE] shadow-[0_1px_3px_rgba(15,23,42,0.12)]' : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>

        {kind === 'upload' ? (
          <div className="space-y-2">
            <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,.mp4,.mov" className="hidden" onChange={pickFile} />
            {file ? (
              <div className="rounded-2xl border border-slate-200 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
                    <FileVideo className="w-5 h-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-[#1E293B] truncate">{file.name}</span>
                    <span className="block text-[11px] text-slate-400">
                      {formatBytes(file.size)}
                      {uploading ? ` · Uploading ${Math.round(progress!)}%` : ' · Ready to upload'}
                    </span>
                  </span>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="text-[11.5px] font-bold text-[#2F68FE] shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  )}
                </div>
                {uploading && (
                  <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#2F68FE] transition-[width] duration-150" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={`w-full py-7 rounded-2xl border-2 border-dashed flex flex-col items-center text-center active:bg-blue-50/40 cursor-pointer ${
                  error ? 'border-rose-200 bg-rose-50/30' : 'border-blue-200 bg-blue-50/30'
                }`}
              >
                <span className="w-11 h-11 rounded-2xl bg-white text-[#2F68FE] shadow-2xs flex items-center justify-center">
                  <CloudUpload className="w-5.5 h-5.5" />
                </span>
                <span className="mt-2.5 text-[13px] font-bold text-[#2F68FE]">Tap to choose a video</span>
                <span className="mt-0.5 text-[11px] text-slate-400">MP4 or MOV, up to 200 MB</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <label htmlFor="intro-video-url" className="block text-[11px] font-semibold text-slate-600">
              Video URL (YouTube, Vimeo, Loom) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="intro-video-url"
                type="url"
                inputMode="url"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  if (error) setError('');
                }}
                placeholder="https://"
                className={`w-full h-11 pl-10 pr-3.5 bg-white border rounded-xl text-[13px] font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text ${
                  error ? 'border-rose-300' : 'border-slate-200'
                }`}
              />
            </div>
            <p className="text-[10.5px] text-slate-400">Make sure the link is public or unlisted so your manager can watch it.</p>
          </div>
        )}

        {error && <p className="px-0.5 text-[11px] font-medium text-rose-500">{error}</p>}
      </div>

      <div className="grid grid-cols-[1fr_2fr] gap-2.5 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={uploading}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={uploading}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
        >
          {kind === 'upload' ? <Upload className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          {uploading ? `Uploading… ${Math.round(progress!)}%` : kind === 'upload' ? 'Upload' : 'Save Link'}
        </button>
      </div>
    </BottomSheet>
  );
};

/* --------------------------------- Section --------------------------------- */

interface IntroVideoSectionProps {
  values: ProfileValues;
  editing: boolean;
  onChange: (key: string, value: ProfileValue) => void;
  onNotify?: (message: string) => void;
}

export const IntroVideoSection: React.FC<IntroVideoSectionProps> = ({ values, editing, onChange }) => {
  const [adding, setAdding] = useState<VideoKind | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const type = values[K.type] as VideoKind | '';
  const url = (values[K.url] as string) ?? '';
  const hasVideo = Boolean(type && url);

  // Videos open outside the app (browser / hosting site); no in-app player or preview
  const play = () => window.open(url, '_blank', 'noopener,noreferrer');

  const setVideo = (v: { type: VideoKind; name: string; url: string } | null) => {
    onChange(K.type, v?.type ?? '');
    onChange(K.name, v?.name ?? '');
    onChange(K.url, v?.url ?? '');
    onChange(K.addedOn, v ? todayLabel() : '');
  };

  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4 space-y-3.5">
        <h3 className="pb-2.5 border-b border-slate-100 text-[13px] font-bold text-[#1E293B]">Profile Introduction Video</h3>

        {/* Guidelines */}
        <div className="rounded-2xl bg-linear-to-br from-[#EEF2FF] to-[#F5F3FF] border border-indigo-100 p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-white text-[#4F46E5] flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-bold text-[#1E1B4B]">Make a strong first impression</span>
              <span className="block text-[11px] text-slate-500 leading-snug mt-0.5">Tips, best practices and a sample to follow.</span>
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={GUIDELINES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 rounded-xl bg-white border border-indigo-100 text-[#4F46E5] text-[11.5px] font-bold flex items-center justify-center gap-1.5 active:bg-indigo-50 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guidelines
            </a>
            <a
              href={SAMPLE_VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 rounded-xl bg-white border border-indigo-100 text-[#4F46E5] text-[11.5px] font-bold flex items-center justify-center gap-1.5 active:bg-indigo-50 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Watch Sample
            </a>
          </div>
        </div>

        {hasVideo ? (
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-3.5 flex items-center gap-3 border-b border-slate-100">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
                {type === 'link' ? <Link2 className="w-5 h-5" /> : <FileVideo className="w-5 h-5" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-[#1E293B]">Your intro video</span>
                <span className="block text-[11px] text-slate-500 truncate">{values[K.name] as string}</span>
              </span>
              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10.5px] font-bold flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Added
              </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
              {[
                { icon: type === 'link' ? Link2 : FileText, label: 'Video type', value: type === 'link' ? 'Video link' : 'Uploaded video' },
                { icon: CalendarDays, label: 'Added on', value: (values[K.addedOn] as string) || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="px-3.5 py-3 flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[10.5px] text-slate-400">{label}</span>
                    <span className="block text-[12.5px] font-bold text-[#1E293B] truncate">{value}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className={`p-3.5 pt-3 grid gap-2 ${editing ? 'grid-cols-3' : 'grid-cols-1'}`}>
              <button
                type="button"
                onClick={play}
                className="h-10 rounded-xl bg-[#2F68FE] text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Play
              </button>
              {editing && (
                <>
                  <button
                    type="button"
                    onClick={() => setAdding(type || 'upload')}
                    className="h-10 rounded-xl border border-[#2F68FE]/30 bg-blue-50/60 text-[#2F68FE] text-[11.5px] font-bold flex items-center justify-center gap-1.5 active:bg-blue-100 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    className="h-10 rounded-xl border border-rose-200 text-rose-600 text-[11.5px] font-bold flex items-center justify-center gap-1.5 active:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="py-7 px-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 flex flex-col items-center text-center">
            <span className="w-12 h-12 rounded-2xl bg-white text-[#2F68FE] shadow-2xs flex items-center justify-center">
              <Video className="w-5.5 h-5.5" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">No intro video added yet</p>
            <p className="mt-1 text-[11.5px] text-slate-500 leading-relaxed max-w-[260px]">
              A 60–90 second video helps clients get to know you and connects you with opportunities faster.
            </p>
            {editing ? (
              <div className="mt-4 w-full grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdding('link')}
                  className="h-11 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 active:bg-slate-50 cursor-pointer"
                >
                  <Link2 className="w-4 h-4" />
                  Add Link
                </button>
                <button
                  type="button"
                  onClick={() => setAdding('upload')}
                  className="h-11 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Upload Video
                </button>
              </div>
            ) : (
              <p className="mt-3 text-[11px] font-semibold text-[#2F68FE]">Tap Edit to add or update your video.</p>
            )}
          </div>
        )}
      </section>

      {/* Staffhub resumes (web table → list) */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4">
        <h3 className="pb-2.5 mb-3 border-b border-slate-100 text-[13px] font-bold text-[#1E293B]">Staffhub Resumes</h3>
        <div className="py-5 flex flex-col items-center text-center">
          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </span>
          <p className="mt-2 text-xs font-semibold text-slate-600">No resumes added yet</p>
          <p className="text-[11px] text-slate-400">Resumes shared on Staffhub will show here with their video status.</p>
        </div>
      </section>

      <AddVideoSheet
        open={adding}
        replacing={hasVideo}
        onClose={() => setAdding(null)}
        onDone={(v) => {
          setVideo(v);
          setAdding(null);
        }}
      />

      {/* Remove confirmation */}
      <BottomSheet isOpen={confirmRemove} onClose={() => setConfirmRemove(false)} maxHeight="max-h-[50%]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="px-5 pt-2 pb-4">
          <h2 className="text-base font-bold text-[#1E293B]">Remove your intro video?</h2>
          <p className="mt-1 text-xs text-slate-500">It's removed when you save your changes. You can add a new one any time.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          <button
            type="button"
            onClick={() => setConfirmRemove(false)}
            className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
          >
            Keep video
          </button>
          <button
            type="button"
            onClick={() => {
              setVideo(null);
              setConfirmRemove(false);
            }}
            className="h-12 rounded-xl bg-rose-600 text-white text-xs font-bold active:bg-rose-700 cursor-pointer"
          >
            Remove
          </button>
        </div>
      </BottomSheet>
    </>
  );
};
