import { motion, AnimatePresence } from 'framer-motion'

export default function Modal({ acik, onKapat, baslik, mesaj, butonlar, t }) {
  if (!t) return null
  return (
    <AnimatePresence>
      {acik && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="w-full max-w-[320px] rounded-2xl flex flex-col overflow-hidden"
            style={{ background: t.bg2, border: `1px solid ${t.border}` }}
          >
            {/* Başlık */}
            <div className="px-6 pt-6 pb-4 text-center">
              <p className="font-display text-lg font-bold mb-2" style={{ color: t.text }}>
                {baslik}
              </p>
              {mesaj && (
                <p className="text-sm leading-relaxed" style={{ color: t.dim }}>
                  {mesaj}
                </p>
              )}
            </div>

            {/* Butonlar */}
            <div className="px-5 pb-5 flex flex-col gap-2">
              {butonlar.map((btn, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.98 }}
                  onClick={btn.onClick}
                  className="w-full py-3.5 rounded-xl font-display text-sm font-semibold"
                  style={{
                    background: btn.stil === 'primary'
                      ? `linear-gradient(135deg, ${t.accent}, ${t.accent}90)`
                      : btn.stil === 'danger'
                      ? 'linear-gradient(135deg, #8B3A3A, #6B2A2A)'
                      : t.bg3,
                    border: btn.stil === 'ghost'
                      ? `1px solid ${t.border}`
                      : 'none',
                    color: btn.stil === 'danger'
                      ? '#FFD0D0'
                      : btn.stil === 'primary'
                      ? '#FAF0D0'
                      : t.dim,
                  }}>
                  {btn.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
