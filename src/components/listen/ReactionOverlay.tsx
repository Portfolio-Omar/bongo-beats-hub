import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactionEvent } from '@/hooks/useListenSession';

interface ReactionOverlayProps {
  reactions: ReactionEvent[];
}

const ReactionOverlay: React.FC<ReactionOverlayProps> = ({ reactions }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
    <AnimatePresence>
      {reactions.map((r) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 20, scale: 0.5, x: (r.id % 7) * 44 - 120 }}
          animate={{ opacity: [0, 1, 1, 0], y: -260, scale: [0.5, 1.4, 1.2, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3.6, ease: 'easeOut' }}
          className="absolute bottom-16 flex flex-col items-center"
        >
          <span className="text-4xl drop-shadow-lg">{r.emoji}</span>
          <span className="text-[10px] font-semibold bg-background/80 rounded-full px-2 py-0.5 mt-1">
            {r.mine ? 'You' : r.user_name}
          </span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export default ReactionOverlay;
