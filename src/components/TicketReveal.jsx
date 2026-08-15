import { useEffect, useMemo, useState } from 'react'
import { motion, useAnimationControls } from 'motion/react'
import AdmitOneTicket, { TICKET_GEOMETRY, playShutterSound } from './ui/admit-one-ticket.jsx'
import ArrowRight from './ArrowRight.jsx'

const REF_WIDTH = 460
const TEAR_THRESHOLD = 84

/* the ticket art is laid out in fixed pixels (it's a WebGL canvas), so on
   narrow phones we shrink the whole thing with a CSS scale rather than
   reflowing it — the drag math below still happens in the unscaled frame */
const useResponsiveScale = (naturalWidth) => {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      const available = window.innerWidth - 48
      setScale(Math.min(1, available / naturalWidth))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [naturalWidth])
  return scale
}

const TicketReveal = ({ email, onTorn, onClose }) => {
  const [torn, setTorn] = useState(false)
  const stubControls = useAnimationControls()
  const scale = useResponsiveScale(REF_WIDTH)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const height = REF_WIDTH / TICKET_GEOMETRY.aspect
  const bodyWidth = TICKET_GEOMETRY.perforation * REF_WIDTH
  const stubWidth = REF_WIDTH - bodyWidth

  const ticketProps = useMemo(
    () => ({
      name: email,
      presenter: 'Zaevo presents',
      event: 'Early access pass',
      venue: 'zaevoai.com',
      dates: 'Oct 23, 2026',
      stubText: 'Admit one',
      watermark: '2026',
      width: REF_WIDTH,
      tilt: false,
    }),
    [email],
  )

  const handleDragEnd = async (_event, info) => {
    if (torn) return
    if (info.offset.x > TEAR_THRESHOLD) {
      setTorn(true)
      try {
        playShutterSound({ volume: 0.22 })
      } catch {
        /* audio isn't essential to the interaction */
      }
      await stubControls.start({
        x: 320,
        y: -30,
        rotate: 16,
        opacity: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      })
      onTorn()
    } else {
      stubControls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 420, damping: 26 },
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-[26px] bg-black/78 px-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-[16px] right-[16px] flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <div className="text-center">
        <p className="text-[13px] font-semibold tracking-[0.09em] text-white/60 uppercase">You're on the list</p>
        <h2 className="mt-[6px] text-[24px] leading-[1.2] font-semibold tracking-[-0.02em] text-white">
          Tear off your stub to confirm
        </h2>
      </div>

      <div style={{ width: REF_WIDTH * scale, height: height * scale }}>
        <div
          className="relative"
          style={{ width: REF_WIDTH, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {/* main body: a fixed window onto the left portion of the ticket art */}
          <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: bodyWidth }}>
            <AdmitOneTicket {...ticketProps} />
          </div>

          {/* stub: a draggable window onto the right portion; dragging it far
              enough plays the tear-away animation and hands off to onTorn */}
          <motion.div
            className="absolute inset-y-0 overflow-hidden"
            style={{ left: bodyWidth, width: stubWidth, touchAction: 'none', cursor: torn ? 'default' : 'grab' }}
            drag={!torn && 'x'}
            dragDirectionLock
            dragElastic={0.12}
            dragMomentum={false}
            animate={stubControls}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: 'grabbing' }}
          >
            <div className="absolute inset-y-0" style={{ left: -bodyWidth, width: REF_WIDTH }}>
              <AdmitOneTicket {...ticketProps} />
            </div>
          </motion.div>
        </div>
      </div>

      {!torn && (
        <div className="flex items-center gap-[6px] text-[13px] font-medium text-white/60">
          Drag the stub to tear
          <ArrowRight />
        </div>
      )}
    </div>
  )
}

export default TicketReveal
