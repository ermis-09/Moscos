import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppShell, { themes } from '../components/AppShell'

const t = themes.sinav

export default function Sinav() {
  const navigate = useNavigate()

  return (
    <AppShell theme="sinav">
      <motion.div
  initial={{ x: '100%', opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: '-100%', opacity: 0 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  className="flex flex-col"
  style={{ height: '100dvh' }}
>

        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(58,124,200,0.1)', border: `1px solid ${t.border}`, color: t.accent2 }}
          >←</button>
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
            <span className="font-display text-xl font-bold leading-none tracking-tight" style={{ color: t.text }}>
              M<span style={{ color: t.accent2 }}>os</span>cos
            </span>
            <span className="text-[8px] font-bold tracking-[0.24em] uppercase" style={{ color: t.dim }}>Soru Bankası</span>
          </div>
          <span className="text-[10px] font-display font-semibold tracking-widest uppercase" style={{ color: t.accent }}>Sınav</span>
        </header>

        {/* İçerik */}
        <main className="flex-1 px-5 pb-6 flex flex-col gap-3 relative z-10 min-h-0">
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight mb-1.5" style={{ color: t.text, letterSpacing: '-0.025em' }}>
              Sınav Modu
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: t.dim }}>
              Dönem, kurul ve ders bazında sorularla kendini test et.
            </p>
          </div>

          {/* Son sınavlar */}
          <div className="rounded-2xl p-4 flex flex-col gap-2.5"
            style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
            <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
              Son Sınavlar
            </span>
            <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${t.border}, transparent)` }} />
            {[['D2K5 · Anatomi','%81'],['D2K5 · Fizyoloji','%68'],['D2K5 · Histoloji','%74']].map(([label, skor]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs" style={{ color: t.dim }}>{label}</span>
                <span className="font-display text-base font-semibold" style={{ color: t.accent2 }}>{skor}</span>
              </div>
            ))}
          </div>

          {/* Başla butonu */}
          <div className="mt-auto">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/sinav/filtre')}
              className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between"
              style={{
                background: `linear-gradient(135deg, ${t.accent}, #204878)`,
                color: '#E8F4FF',
                boxShadow: '0 6px 20px rgba(58,124,200,0.3)'
              }}
            >
              Sınava Başla <span>→</span>
            </motion.button>
          </div>
        </main>

        {/* Dekoratif sayı */}
        <div className="absolute bottom-4 right-4 font-display font-bold pointer-events-none select-none z-0"
          style={{ fontSize: 100, lineHeight: 1, color: 'rgba(58,124,200,0.05)', letterSpacing: '-0.05em' }}>
          02
        </div>

      </motion.div>
    </AppShell>
  )
}
