import React, { useState } from 'react';
import { Wifi, Battery } from 'lucide-react';
import { useBottomSheetContext } from '../../context/BottomSheetContext';

export type DeviceModel = 'iphone16' | 'pixel8' | 'iphonese';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
  activeDevice?: DeviceModel;
  onDeviceChange?: (device: DeviceModel) => void;
  showThumbZoneOverlay?: boolean;
  onToggleThumbZone?: () => void;
  showTouchHitboxOverlay?: boolean;
  onToggleTouchHitbox?: () => void;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({
  children,
  activeDevice = 'iphone16',
  showThumbZoneOverlay = false,
  showTouchHitboxOverlay = false,
}) => {
  const [currentTime] = useState('9:41');
  const { isAnySheetOpen, closeActiveSheet } = useBottomSheetContext();

  // Device dimensions
  const deviceSpecs = {
    iphone16: {
      name: 'iPhone 16 Pro',
      width: 'w-[393px]',
      height: 'h-[844px]',
      radius: 'rounded-[50px]',
      padding: 'p-3',
      island: true,
    },
    pixel8: {
      name: 'Pixel 8',
      width: 'w-[412px]',
      height: 'h-[850px]',
      radius: 'rounded-[44px]',
      padding: 'p-3',
      island: false,
    },
    iphonese: {
      name: 'iPhone SE (Compact)',
      width: 'w-[375px]',
      height: 'h-[740px]',
      radius: 'rounded-[36px]',
      padding: 'p-3',
      island: false,
    },
  };

  const current = deviceSpecs[activeDevice];

  return (
    <div className="flex flex-col items-center">
      {/* Device Hardware Bezel */}
      <div
        className={`relative ${current.width} ${current.height} bg-slate-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_12px_#1e293b,0_0_0_14px_#334155] ${current.radius} flex flex-col overflow-hidden transition-all duration-300 border border-slate-800`}
      >
        {/* iOS Status Bar */}
        <div
          className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-7 pt-3.5 pb-2 text-xs font-semibold select-none pointer-events-none transition-colors duration-300 ${
            isAnySheetOpen ? 'bg-transparent text-slate-300/60' : 'bg-white text-[#1E293B]'
          }`}
        >
          <span className="tracking-tight text-[13px] font-bold">{currentTime}</span>

          {current.island && (
            <div
              className={`w-24 h-5.5 rounded-full flex items-center justify-between px-2 mx-auto transition-colors duration-300 ${
                isAnySheetOpen ? 'bg-black/50' : 'bg-black'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-slate-900" />
              <div className="w-2 h-2 rounded-full bg-slate-900" />
            </div>
          )}

          {!current.island && (
            <div className="w-3.5 h-3.5 rounded-full bg-black mx-auto ring-1 ring-slate-800" />
          )}

          <div className="flex items-center gap-1.5">
            <div className="flex items-end gap-0.5 h-3">
              <div className="w-0.75 h-1.5 bg-current rounded-xs" />
              <div className="w-0.75 h-2 bg-current rounded-xs" />
              <div className="w-0.75 h-2.5 bg-current rounded-xs" />
              <div className="w-0.75 h-3 bg-current rounded-xs" />
            </div>
            <Wifi className="w-3.5 h-3.5 text-current" />
            <Battery className="w-4 h-4 fill-current text-current" />
          </div>
        </div>

        {/* Top Notch Backdrop Blur Overlay when a bottom sheet is open */}
        <div
          className={`absolute top-0 left-0 right-0 h-12 z-35 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 cursor-pointer ${
            isAnySheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeActiveSheet}
        />

        {/* Screen Canvas Viewport */}
        <div className="relative flex-1 bg-[#F8FAFC] overflow-hidden flex flex-col pt-10">
          {children}

          {/* Ergonomic Thumb Zone Overlay (Inspection Tool) */}
          {showThumbZoneOverlay && (
            <div className="absolute inset-0 z-50 pointer-events-none flex flex-col opacity-85 select-none font-mono text-xs">
              <div className="h-[30%] bg-blue-500/15 border-b-2 border-dashed border-blue-500/50 p-2 flex items-start justify-between text-blue-800 font-semibold">
                <span>Hard Reach (Top 30%)</span>
                <span>Context & Search</span>
              </div>
              <div className="h-[32%] bg-amber-500/15 border-b-2 border-dashed border-amber-500/50 p-2 flex items-start justify-between text-amber-900 font-semibold">
                <span>Stretch Zone (Middle 32%)</span>
                <span>Content & Cards</span>
              </div>
              <div className="h-[38%] bg-emerald-500/15 p-2 flex items-start justify-between text-emerald-900 font-semibold">
                <span>Natural Thumb Zone (Bottom 38%)</span>
                <span>Primary CTAs & Tabs</span>
              </div>
            </div>
          )}

          {/* Touch Target 44px Hitbox Guide Overlay */}
          {showTouchHitboxOverlay && (
            <div className="absolute inset-0 z-50 pointer-events-none border-4 border-dashed border-indigo-500/40 bg-indigo-500/5 p-2 flex items-end justify-start">
              <div className="bg-indigo-900/90 text-white text-[10px] px-2 py-1 rounded font-mono">
                Hitbox Inspector: Min 44×44px Target Rule Active
              </div>
            </div>
          )}
        </div>

        {/* Portal Target for all Bottom Sheets - Covers Entire Device Screen */}
        <div
          id="mobile-sheet-portal"
          className="absolute inset-0 z-40 pointer-events-none overflow-hidden"
        />
      </div>
    </div>
  );
};
