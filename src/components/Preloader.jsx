import { useEffect, useState } from 'react'
import { useLenis } from 'lenis/react'
import ZaevoMark from './ZaevoMark.jsx'
import prefersReducedMotion from '../lib/prefersReducedMotion.js'

/* keep in step with the .preloader-bar fill duration in index.css, plus a
   short beat so the bar visibly finishes before the screen fades away */
const FILL_MS = 3300
const HOLD_MS = 150

const Preloader = ({ onDone, onExitStart }) => {
  const [leaving, setLeaving] = useState(false)
  const lenis = useLenis()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  /* without this the wheel keeps feeding Lenis a scroll target from behind the
     splash, which then unwinds in one lurch the moment the splash lifts */
  useEffect(() => {
    if (!lenis) return
    lenis.stop()
    return () => lenis.start()
  }, [lenis])

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setLeaving(true)
        /* the page behind starts arriving now rather than after the fade, so
           the handoff reads as one motion instead of two separate events */
        onExitStart?.()
      },
      prefersReducedMotion() ? 0 : FILL_MS + HOLD_MS,
    )
    return () => clearTimeout(timer)
  }, [onExitStart])

  return (
    <div
      aria-hidden="true"
      onTransitionEnd={(event) => {
        if (leaving && event.propertyName === 'opacity') onDone()
      }}
      className={`sky fixed inset-0 z-[999] flex flex-col items-center justify-center gap-[22px] transition-opacity duration-500 ease-out ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex items-center gap-[12px] text-white">
        <ZaevoMark width={40} height={35} className="block shrink-0" />
        <span className="text-[32px] leading-none font-semibold tracking-[-0.052em]">Zaevo</span>
      </div>

      <div className="h-[2px] w-[160px] overflow-hidden rounded-full bg-white/15">
        <div className="preloader-bar h-full rounded-full bg-white" />
      </div>
    </div>
  )
}

export default Preloader
