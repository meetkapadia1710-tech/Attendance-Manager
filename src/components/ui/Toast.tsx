import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import type { ToastItem } from '../../lib/types';

const ICONS: Record<ToastItem['variant'], string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};
const COLORS: Record<ToastItem['variant'], string> = {
  success: 'text-[#b5f0a0]',
  error:   'text-[#ffb4ab]',
  info:    'text-[#f1b5da]',
};

export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none"
      style={{ width: 'max-content', maxWidth: '90vw' }}
    >
      <AnimatePresence mode="sync">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={() => removeToast(t.id)}
            className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full shadow-lg cursor-pointer select-none"
            style={{
              background: '#342f32',
              color: '#f8eef2',
              fontFamily: '"Roboto Flex", sans-serif',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: 0.1,
            }}
          >
            <span className={`material-symbols-outlined fill text-[18px] ${COLORS[t.variant]}`}>
              {t.icon ?? ICONS[t.variant]}
            </span>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
