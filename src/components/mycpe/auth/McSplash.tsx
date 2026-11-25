import React, { useEffect } from 'react';
import { McGrid } from '../common/McUi';
import { MYCPE_VERSION } from '../data/mycpeAuthData';

/** Moves on by itself; tap to skip */
export const McSplash: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden bg-white cursor-pointer" onClick={onDone} role="button" aria-label="Continue">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 25% at 14% 48%, #E6EBFD 0%, #EAEEFD 60%, transparent 100%), radial-gradient(95% 24% at 92% 50%, #E6EBFD 0%, #EAEEFD 60%, transparent 100%), radial-gradient(75% 20% at 55% 60%, #EAEEFD 0%, rgba(234,238,253,0.8) 50%, transparent 100%)',
        }}
      />
      <McGrid
        variant="splash"
        height="calc(100% + 63px)"
        mask="linear-gradient(to bottom, #000 62px, rgba(0,0,0,0.45) 64px, rgba(0,0,0,0.7) 170px, #000 45%, #000 72%, rgba(0,0,0,0.35) 100%)"
      />
      <div className="absolute inset-0 flex items-center justify-center pb-14">
        <img src="/brand/Logo.png" alt="MYCPE ONE" className="w-[270px] animate-in fade-in zoom-in-95 duration-700" draggable={false} />
      </div>
      <p className="absolute inset-x-0 text-center text-sm text-mc-muted" style={{ bottom: 'calc(var(--safe-bottom) + 36px)' }}>
        Version {MYCPE_VERSION}
      </p>
    </div>
  );
};
