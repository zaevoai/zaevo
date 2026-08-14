import { useCallback, useEffect, useState } from 'react'
import { ReactLenis } from 'lenis/react'
import Landing from './components/Landing.jsx'
import ThankYou from './components/ThankYou.jsx'
import NotFound from './components/NotFound.jsx'
import LegalPage from './components/LegalPage.jsx'
import Contact from './components/Contact.jsx'
import Preloader from './components/Preloader.jsx'
import { LEGAL_PAGES } from './content/legal.js'
import prefersReducedMotion from './lib/prefersReducedMotion.js'
import { SmoothCursor } from '@/components/ui/smooth-cursor'

const HOME_PATHS = new Set(['/', '/index.html'])

/* the wheel drives a target that the page eases toward rather than jumping to.
   Two separate knobs, and they do different things: wheelMultiplier is how far
   one notch of the wheel asks to travel, lerp is how lazily the page chases
   that target. Both are turned down from Lenis's defaults (1 and 0.1) for a
   heavier, slower descent. Anyone who asked their OS for less motion is handed
   plain native scrolling instead — see the guard on smoothWheel below. */
const LENIS_OPTIONS = {
  lerp: 0.048,
  wheelMultiplier: 0.5,
  /* phones and tablets keep their native scrolling: the OS momentum there is
     better than anything layered on top, and smoothing a drag gesture reads as
     lag. Trackpads are unaffected by this — they emit wheel events, so they run
     through smoothWheel like a mouse does. */
  syncTouch: false,
}

/* "/terms/" and "/terms" are the same page */
const normalise = (pathname) => pathname.replace(/(.)\/+$/, '$1')

/* the splash greets a fresh arrival, not every reload — sessionStorage survives
   a refresh but not a new tab or a new browser session, so the site opens with
   the splash once and then stays out of the way for the rest of the visit */
const PRELOADED_KEY = 'zaevo-preloaded'
const hasPreloaded = () => {
  try {
    return sessionStorage.getItem(PRELOADED_KEY) === '1'
  } catch {
    return false
  }
}
const markPreloaded = () => {
  try {
    sessionStorage.setItem(PRELOADED_KEY, '1')
  } catch {
    /* storage unavailable (private mode, etc.) — the splash just replays */
  }
}

const App = () => {
  const [path, setPath] = useState(() => normalise(window.location.pathname))
  const [joinedEmail, setJoinedEmail] = useState(null)
  const [isLoading, setIsLoading] = useState(() => !hasPreloaded())
  /* every page now animates its own entrance unconditionally on mount, so a
     page mounted underneath an opaque splash would finish that entrance
     off-screen and just sit there once revealed. Content is held unmounted
     until the splash starts to fade, so the entrance fires at the moment it
     is first seen. When there is no splash this is already true at mount,
     and the page's entrance plays on its own first paint as normal. */
  const [contentArmed, setContentArmed] = useState(() => !isLoading)
  const armContent = useCallback(() => setContentArmed(true), [])
  /* set only by CTAs that mean "go home AND take me to the field"; Landing reads
     it once as it mounts, so a plain trip home never hijacks the email input */
  const [pendingWaitlist, setPendingWaitlist] = useState(false)

  useEffect(() => {
    const syncPath = () => setPath(normalise(window.location.pathname))
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  const navigateHome = useCallback((event, wantsWaitlist) => {
    event?.preventDefault()
    if (!HOME_PATHS.has(window.location.pathname)) {
      window.history.pushState(null, '', '/')
      setPath('/')
    }
    setJoinedEmail(null)
    setPendingWaitlist(wantsWaitlist)
  }, [])

  const goHome = useCallback((event) => navigateHome(event, false), [navigateHome])
  const goHomeToWaitlist = useCallback((event) => navigateHome(event, true), [navigateHome])

  const renderRoute = () => {
    if (path === '/contact') {
      return <Contact onHome={goHome} onHomeToWaitlist={goHomeToWaitlist} />
    }

    const legalDocument = LEGAL_PAGES[path]
    if (legalDocument) {
      return (
        <LegalPage
          document={legalDocument}
          onHome={goHome}
          onHomeToWaitlist={goHomeToWaitlist}
        />
      )
    }
    if (!HOME_PATHS.has(path)) {
      return <NotFound onHome={goHome} onHomeToWaitlist={goHomeToWaitlist} />
    }
    if (joinedEmail) {
      return <ThankYou email={joinedEmail} onHome={goHome} />
    }
    return <Landing onJoined={setJoinedEmail} focusWaitlistOnMount={pendingWaitlist} />
  }

  return (
    <ReactLenis root options={{ ...LENIS_OPTIONS, smoothWheel: !prefersReducedMotion() }}>
      <div className="relative w-full overflow-x-hidden">
        <div className="[@media(pointer:coarse)]:hidden">
          <SmoothCursor />
        </div>

        {contentArmed && renderRoute()}

        {isLoading && (
          <Preloader
            onExitStart={armContent}
            onDone={() => {
              markPreloaded()
              setIsLoading(false)
            }}
          />
        )}
      </div>
    </ReactLenis>
  )
}

export default App
