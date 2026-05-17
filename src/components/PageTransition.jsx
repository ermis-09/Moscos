import { motion } from 'framer-motion'

// Yön bazlı animasyon
const variants = {
  // Dikey geçişler (ana sayfalar arası)
  enterFromBottom: { y: '100%', opacity: 0 },
  enterFromTop:    { y: '-100%', opacity: 0 },
  // Yatay geçişler (akış içi)
  enterFromRight:  { x: '100%', opacity: 0 },
  enterFromLeft:   { x: '-100%', opacity: 0 },
  center:          { x: 0, y: 0, opacity: 1 },
  exitToLeft:      { x: '-100%', opacity: 0 },
  exitToRight:     { x: '100%', opacity: 0 },
  exitToBottom:    { y: '100%', opacity: 0 },
  exitToTop:       { y: '-100%', opacity: 0 },
}

const transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

export function SlideFromRight({ children }) {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={transition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}

export function SlideFromBottom({ children }) {
  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '-100%', opacity: 0 }}
      transition={transition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}

export function FadeSlide({ children, direction = 'right' }) {
  const enter = direction === 'right' ? { x: '100%' } : { x: '-100%' }
  const exit  = direction === 'right' ? { x: '-100%' } : { x: '100%' }
  return (
    <motion.div
      initial={{ ...enter, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ ...exit, opacity: 0 }}
      transition={transition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}
