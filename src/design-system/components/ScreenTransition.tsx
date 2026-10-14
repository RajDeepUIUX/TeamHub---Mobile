import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface ScreenTransitionProps {
  /** Changes whenever a different screen is shown */
  screenKey: string;
  /** Navigation depth: 0 = bottom-nav tabs, higher = pushed screens. Decides the slide direction. */
  depth: number;
  children: React.ReactNode;
}

/**
 * Native-style screen change: pushing a deeper screen slides it in from the right,
 * going back slides it in from the left. Switching between screens at the same depth
 * (e.g. bottom-nav tabs) is instant, like iOS/Android tab bars.
 */
export const ScreenTransition: React.FC<ScreenTransitionProps> = ({ screenKey, depth, children }) => {
  const reduceMotion = useReducedMotion();
  const last = useRef({ key: screenKey, depth, dir: 0 });
  if (last.current.key !== screenKey) {
    last.current = { key: screenKey, depth, dir: Math.sign(depth - last.current.depth) };
  }
  const dir = last.current.dir;
  const animate = dir !== 0 && !reduceMotion;

  return (
    <motion.div
      key={screenKey}
      className="flex-1 min-h-0 flex flex-col overflow-hidden"
      initial={animate ? { opacity: 0, x: dir * 36 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};
