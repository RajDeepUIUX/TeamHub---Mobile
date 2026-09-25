import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface BottomSheetContextType {
  isAnySheetOpen: boolean;
  registerSheet: (id: string, isOpen: boolean, onClose?: () => void) => void;
  unregisterSheet: (id: string) => void;
  closeActiveSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextType>({
  isAnySheetOpen: false,
  registerSheet: () => {},
  unregisterSheet: () => {},
  closeActiveSheet: () => {},
});

export const BottomSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sheets, setSheets] = useState<Record<string, { isOpen: boolean; onClose?: () => void }>>({});

  const registerSheet = useCallback((id: string, isOpen: boolean, onClose?: () => void) => {
    setSheets((prev) => {
      if (prev[id]?.isOpen === isOpen && prev[id]?.onClose === onClose) return prev;
      return { ...prev, [id]: { isOpen, onClose } };
    });
  }, []);

  const unregisterSheet = useCallback((id: string) => {
    setSheets((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const isAnySheetOpen = useMemo(() => {
    return Object.values(sheets).some((s) => s.isOpen);
  }, [sheets]);

  const closeActiveSheet = useCallback(() => {
    const active = Object.values(sheets).find((s) => s.isOpen && s.onClose);
    if (active && active.onClose) {
      active.onClose();
    }
  }, [sheets]);

  return (
    <BottomSheetContext.Provider value={{ isAnySheetOpen, registerSheet, unregisterSheet, closeActiveSheet }}>
      {children}
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheetContext = () => useContext(BottomSheetContext);
