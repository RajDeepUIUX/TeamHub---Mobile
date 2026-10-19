import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Minus, Plus, Trash2 } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { PROFILE_PHOTO_SIZE } from '../data/clientUserProfileData';

/** Same action list as the Staff profile photo sheet */
export const PhotoActionSheet: React.FC<{
  isOpen: boolean;
  hasPhoto: boolean;
  onChoose: () => void;
  onRemove: () => void;
  onClose: () => void;
}> = ({ isOpen, hasPhoto, onChoose, onRemove, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[60%]">
    <SheetHeader title="Profile Photo" subtitle="JPG or PNG · shown across the Client Hub and MyCPE ONE" onClose={onClose} />
    <div className="p-4 pb-8 space-y-1.5">
      <button
        type="button"
        onClick={onChoose}
        className="w-full h-12 px-4 rounded-xl flex items-center gap-3 text-[13px] font-semibold text-slate-700 active:bg-slate-50 cursor-pointer"
      >
        <ImagePlus className="w-4.5 h-4.5 text-[#2F68FE]" />
        {hasPhoto ? 'Choose a new photo' : 'Upload a photo'}
      </button>
      {hasPhoto && (
        <button
          type="button"
          onClick={onRemove}
          className="w-full h-12 px-4 rounded-xl flex items-center gap-3 text-[13px] font-semibold text-rose-600 active:bg-rose-50 cursor-pointer"
        >
          <Trash2 className="w-4.5 h-4.5" />
          Remove photo
        </button>
      )}
    </div>
  </BottomSheet>
);

/** Crop window size (px); the saved photo is always PROFILE_PHOTO_SIZE square like desktop's 400 × 400 cropper */
const VIEW = 240;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

type Offset = { x: number; y: number };

/** Desktop Cropper.js (aspect 1, fixed box) → drag to move, slider / buttons to zoom, circle preview */
export const PhotoCropSheet: React.FC<{
  src: string | null;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}> = ({ src, onClose, onSave }) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [error, setError] = useState('');
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    setImg(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setError('');
    if (!src) return;
    const el = new Image();
    el.onload = () => setImg(el);
    el.onerror = () => setError("This image couldn't be opened. Please choose another photo.");
    el.src = src;
  }, [src]);

  const scaleFor = (z: number) => (img ? (VIEW / Math.min(img.naturalWidth, img.naturalHeight)) * z : 1);

  /** Keep the image covering the whole crop window */
  const clamp = (o: Offset, z: number): Offset => {
    if (!img) return o;
    const s = scaleFor(z);
    const maxX = Math.max(0, (img.naturalWidth * s - VIEW) / 2);
    const maxY = Math.max(0, (img.naturalHeight * s - VIEW) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, o.x)), y: Math.min(maxY, Math.max(-maxY, o.y)) };
  };

  const applyZoom = (z: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    setZoom(next);
    setOffset((o) => clamp(o, next));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    drag.current = { id: d.id, x: e.clientX, y: e.clientY };
    setOffset((o) => clamp({ x: o.x + dx, y: o.y + dy }, zoom));
  };
  const endDrag = () => {
    drag.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, Offset> = { ArrowLeft: { x: 8, y: 0 }, ArrowRight: { x: -8, y: 0 }, ArrowUp: { x: 0, y: 8 }, ArrowDown: { x: 0, y: -8 } };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    setOffset((o) => clamp({ x: o.x + m.x, y: o.y + m.y }, zoom));
  };

  const save = () => {
    if (!img) return;
    const s = scaleFor(zoom);
    const left = VIEW / 2 + offset.x - (img.naturalWidth * s) / 2;
    const top = VIEW / 2 + offset.y - (img.naturalHeight * s) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = PROFILE_PHOTO_SIZE;
    canvas.height = PROFILE_PHOTO_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return setError("Couldn't crop this photo. Please try again.");
    ctx.drawImage(img, -left / s, -top / s, VIEW / s, VIEW / s, 0, 0, PROFILE_PHOTO_SIZE, PROFILE_PHOTO_SIZE);
    onSave(canvas.toDataURL('image/jpeg', 0.9));
  };

  const s = scaleFor(zoom);

  return (
    <BottomSheet isOpen={Boolean(src)} onClose={onClose} maxHeight="max-h-[92%]">
      <SheetHeader title="Adjust Photo" subtitle="Drag to reposition · zoom to fit your face in the circle" onClose={onClose} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col items-center">
        <div
          role="application"
          aria-label="Crop area. Drag or use arrow keys to move the photo."
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          className="relative overflow-hidden rounded-2xl bg-slate-900 touch-none cursor-grab active:cursor-grabbing focus:outline-hidden focus-visible:ring-4 focus-visible:ring-blue-100"
          style={{ width: VIEW, height: VIEW }}
        >
          {img && (
            <img
              src={img.src}
              alt=""
              draggable={false}
              className="absolute max-w-none pointer-events-none select-none"
              style={{
                width: img.naturalWidth * s,
                height: img.naturalHeight * s,
                left: VIEW / 2 + offset.x - (img.naturalWidth * s) / 2,
                top: VIEW / 2 + offset.y - (img.naturalHeight * s) / 2,
              }}
            />
          )}
          {!img && !error && <span className="absolute inset-0 bg-slate-700 animate-pulse" />}
          <span className="absolute inset-0 rounded-full ring-2 ring-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] pointer-events-none" />
        </div>

        {error ? (
          <p className="mt-4 text-[11.5px] font-medium text-rose-500 text-center">{error}</p>
        ) : (
          <div className="mt-5 w-full max-w-[280px] flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyZoom(zoom - ZOOM_STEP)}
              disabled={zoom <= 1}
              className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 disabled:opacity-40 shrink-0 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Zoom out"
            >
              <Minus className="w-4.5 h-4.5" />
            </button>
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => applyZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="flex-1 min-w-0 accent-[#2F68FE] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => applyZoom(zoom + ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
              className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 disabled:opacity-40 shrink-0 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Zoom in"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
        <p className="mt-2 text-[10.5px] text-slate-400 text-center">Saved as a {PROFILE_PHOTO_SIZE} × {PROFILE_PHOTO_SIZE} px square</p>
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-2.5 p-4 pb-6 border-t border-slate-100 shrink-0">
        <button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!img}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          Save Photo
        </button>
      </div>
    </BottomSheet>
  );
};
