import React, { useEffect, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { useBottomSheetContext } from '../../context/BottomSheetContext';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  maxHeight = 'max-h-[92%]',
  className = '',
}) => {
  const sheetId = useId();
  const { registerSheet, unregisterSheet } = useBottomSheetContext();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById('mobile-sheet-portal');
    if (el) {
      setPortalTarget(el);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let animFrame: number;

    if (isOpen) {
      setMounted(true);
      registerSheet(sheetId, true, onClose);
      animFrame = requestAnimationFrame(() => {
        timer = setTimeout(() => {
          setVisible(true);
        }, 15);
      });
    } else {
      setVisible(false);
      timer = setTimeout(() => {
        setMounted(false);
        registerSheet(sheetId, false);
      }, 300);
    }

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrame);
    };
  }, [isOpen, sheetId, registerSheet, onClose]);

  useEffect(() => {
    return () => {
      unregisterSheet(sheetId);
    };
  }, [sheetId, unregisterSheet]);

  if (!mounted) return null;

  const handleBackdropClick = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const sheetElement = (
    <div
      className="absolute inset-0 z-40 flex flex-col justify-end select-none overflow-hidden pointer-events-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop covering the entire phone screen: top notch, header, tabs, and content */}
      <div
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer ${
          visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Sheet Container contained strictly within mobile screen */}
      <div
        className={`relative z-10 w-full bg-white rounded-t-[28px] shadow-2xl flex flex-col ${maxHeight} transition-transform duration-300 ease-out transform ${
          visible ? 'translate-y-0' : 'translate-y-full'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );

  const target = portalTarget || (typeof document !== 'undefined' ? document.getElementById('mobile-sheet-portal') : null);

  if (target) {
    return createPortal(sheetElement, target);
  }

  return sheetElement;
};
