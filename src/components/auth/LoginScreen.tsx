import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

export function LoginScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const { unlock } = useAuthStore();
  const [key, setKey]       = useState('');
  const [show, setShow]     = useState(false);
  const [error, setError]   = useState('');
  const [shake, setShake]   = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 600);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!key.trim()) return;
    setLoading(true);
    setError('');

    // Small delay for perceived security
    await new Promise(r => setTimeout(r, 500));

    const ok = await unlock(key);
    setLoading(false);

    if (ok) {
      onUnlocked();
    } else {
      setShake(true);
      setError('Incorrect secret key. Please try again.');
      setKey('');
      setTimeout(() => { setShake(false); inputRef.current?.focus(); }, 500);
    }
  }, [key, unlock, onUnlocked]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #1a0a14 0%, #2d1228 40%, #1a0a14 100%)',
      }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{
          top: '-200px', left: '-200px',
          background: 'radial-gradient(circle, #f1b5da 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
        style={{
          bottom: '-150px', right: '-150px',
          background: 'radial-gradient(circle, #7b4b6b 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Floating petals */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-10 pointer-events-none"
          style={{
            width: 6 + i * 4,
            height: 6 + i * 4,
            background: '#f1b5da',
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 8, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 3 + i * 0.7,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.15 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo area */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #7b4b6b, #613453)' }}
          >
            <span className="material-symbols-outlined fill text-white" style={{ fontSize: 40 }}>spa</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-white mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Mann Beauty Studio
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-medium"
            style={{ color: '#f1b5da' }}
          >
            Admin Portal — Attendance Management
          </motion.p>
        </div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255,247,249,0.06)',
            border: '1px solid rgba(241,181,218,0.15)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(241,181,218,0.12)', border: '1px solid rgba(241,181,218,0.2)' }}
            >
              <span className="material-symbols-outlined fill" style={{ fontSize: 24, color: '#f1b5da' }}>
                lock
              </span>
            </div>
          </div>

          <h2
            className="text-center text-xl font-bold text-white mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Admin Access
          </h2>
          <p className="text-center text-sm mb-6" style={{ color: 'rgba(241,181,218,0.6)' }}>
            Enter your secret key to continue
          </p>

          {/* Input */}
          <motion.div
            animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.45 }}
            className="relative mb-4"
          >
            <div
              className="relative rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: `1px solid ${error ? 'rgba(186,26,26,0.6)' : 'rgba(241,181,218,0.2)'}`,
                boxShadow: error ? '0 0 0 3px rgba(186,26,26,0.15)' : undefined,
              }}
            >
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ fontSize: 20, color: error ? '#f87171' : 'rgba(241,181,218,0.5)' }}
              >
                key
              </span>
              <input
                ref={inputRef}
                type={show ? 'text' : 'password'}
                value={key}
                onChange={e => { setKey(e.target.value); setError(''); }}
                onKeyDown={handleKey}
                placeholder="Enter secret key…"
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-transparent pl-12 pr-12 py-4 text-white text-sm font-medium placeholder-white/30 outline-none"
                style={{ caretColor: '#f1b5da' }}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                style={{ color: 'rgba(241,181,218,0.5)' }}
                tabIndex={-1}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {show ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 mt-2 text-xs font-medium px-1"
                  style={{ color: '#f87171' }}
                >
                  <span className="material-symbols-outlined fill" style={{ fontSize: 14 }}>error</span>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Unlock button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !key.trim()}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: loading
                ? 'rgba(123,75,107,0.6)'
                : 'linear-gradient(135deg, #7b4b6b 0%, #613453 100%)',
              color: '#ffd8ee',
              boxShadow: '0 4px 24px rgba(97,52,83,0.4)',
            }}
          >
            {loading ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                  className="material-symbols-outlined"
                  style={{ fontSize: 18 }}
                >
                  progress_activity
                </motion.span>
                Verifying…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_open</span>
                Unlock Dashboard
              </>
            )}
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs mt-4"
          style={{ color: 'rgba(241,181,218,0.3)' }}
        >
          Authorized personnel only
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
