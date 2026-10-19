import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, X } from 'lucide-react';
import type { ClientVideo } from '../data/clientDashboardData';

export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeThumbUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

interface ClientVideoModalProps {
  video: ClientVideo | null;
  onClose: () => void;
}

/** Plays a feed video in place (desktop embeds the YouTube iframe in the post); backdrop / X / Esc close it */
export const ClientVideoModal: React.FC<ClientVideoModalProps> = ({ video, onClose }) => {
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  useEffect(() => setPortal(document.getElementById('mobile-sheet-portal')), []);

  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [video, onClose]);

  if (!video || !portal) return null;

  const src = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;

  return createPortal(
    <div
      className="absolute inset-0 z-50 pointer-events-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center px-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onClick={onClose}
    >
      <div className="w-full animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-snug">{video.title}</p>
            <p className="text-[11px] text-white/60">{video.channel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="w-9 h-9 -mr-1 rounded-full bg-white/10 text-white flex items-center justify-center active:bg-white/20 shrink-0 cursor-pointer"
            aria-label="Close video"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-xl">
          <iframe
            src={src}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <a
          href={youtubeWatchUrl(video.youtubeId)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 mx-auto w-fit h-9 px-3.5 rounded-full bg-white/10 text-white text-[11.5px] font-semibold flex items-center gap-1.5 active:bg-white/20"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Watch on YouTube
        </a>
      </div>
    </div>,
    portal
  );
};
