import { useEffect, useState } from 'react'
import ZaevoMark from './ZaevoMark.jsx'
import HomeLink from './HomeLink.jsx'
import ArrowRight from './ArrowRight.jsx'
import Footer from './Footer.jsx'
import prefersReducedMotion from '../lib/prefersReducedMotion.js'

const CODE = ['4', '0', '4']
const LABELS = ['Page', 'Not', 'Found']

const TICK_MS = 55
const SETTLE_TICK = 11 /* first digit locks here, the next two follow in pairs */
const TOTAL_TICKS = 17

/* the countdown is this site's signature lockup, so the error speaks in it:
   a counter searching for a value that was never there, settling on 4-0-4 */
const useScrambledCode = () => {
  const [digits, setDigits] = useState(() => (prefersReducedMotion() ? CODE : ['0', '0', '0']))

  useEffect(() => {
    if (prefersReducedMotion()) return

    let tick = 0
    const id = setInterval(() => {
      tick += 1
      if (tick >= TOTAL_TICKS) {
        setDigits(CODE)
        clearInterval(id)
        return
      }
      setDigits(
        CODE.map((digit, index) =>
          tick >= SETTLE_TICK + index * 2 ? digit : String(Math.floor(Math.random() * 10)),
        ),
      )
    }, TICK_MS)

    return () => clearInterval(id)
  }, [])

  return digits
}

const Unit = ({ digit, label }) => (
  <div className="flex w-[68px] flex-col items-center sm:w-[92px]">
    <span className="flex h-[46px] items-center text-[46px] leading-none font-semibold tabular-nums tracking-[-0.05em] text-black sm:h-[64px] sm:text-[64px]">
      {digit}
    </span>
    <span className="mt-[12px] text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
      {label}
    </span>
  </div>
)

const Colon = () => (
  <span className="flex h-[46px] items-center text-[34px] leading-none font-semibold text-black/25 sm:h-[64px] sm:text-[44px]">
    :
  </span>
)

const NotFound = ({ onHome, onHomeToWaitlist }) => {
  const digits = useScrambledCode()

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Zaevo — Page not found'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <>
      {/* the nav is absolute, so this centres the short 404 block on its own */}
      <div className="sky relative flex min-h-screen flex-col justify-center">
        <header className="drop absolute inset-x-0 top-[18px] px-4">
          <nav className="glass mx-auto flex h-[64px] w-full max-w-[960px] items-center justify-between rounded-[20px] border border-white/30 pl-[24px] pr-[15px] sm:pl-[44px]">
            <HomeLink onHome={onHome} className="flex items-center gap-[10px] text-white">
              <ZaevoMark width={31} height={27} className="block shrink-0" />
              <span className="text-[26px] leading-none font-semibold tracking-[-0.052em]">
                Zaevo
              </span>
            </HomeLink>
            <a
              href="/"
              onClick={onHome}
              className="flex h-[39px] cursor-pointer items-center gap-[7px] rounded-[14px] bg-white pr-[19px] pl-[22px] text-[15px] font-semibold text-black transition-[background-color,transform] duration-200 hover:-translate-y-[2px] hover:bg-white/90"
            >
              Back to home
              <ArrowRight />
            </a>
          </nav>
        </header>

        <main
          id="top"
          className="flex flex-col items-center px-4 pt-[150px] pb-[110px] text-center"
        >
          {/* the page's lead element, so it takes the same blur-resolve as the
              home hero's wordmark — the digits are still scrambling as it
              sharpens, which is the effect doing the page's own job */}
          <div
            aria-hidden="true"
            style={{ '--rise-delay': '120ms' }}
            className="lockup-in flex items-start"
          >
            <Unit digit={digits[0]} label={LABELS[0]} />
            <Colon />
            <Unit digit={digits[1]} label={LABELS[1]} />
            <Colon />
            <Unit digit={digits[2]} label={LABELS[2]} />
          </div>

          <h1
            style={{ '--rise-delay': '640ms' }}
            className="rise mt-[52px] text-[38px] leading-[1.1] font-semibold tracking-[-0.05em] text-black sm:text-[56px]"
          >
            This page never launched.
          </h1>

          <p
            style={{ '--rise-delay': '740ms' }}
            className="rise mt-[16px] max-w-[430px] text-[15px] leading-[23px] font-medium text-black"
          >
            Nothing lives at this address. Everything we've announced is on the homepage, waitlist
            included.
          </p>

          <div
            style={{ '--rise-delay': '850ms' }}
            className="rise mt-[34px] flex flex-col items-center gap-[10px] sm:flex-row"
          >
            <a
              href="/"
              onClick={onHome}
              className="flex h-[49px] cursor-pointer items-center gap-[7px] rounded-[14px] bg-white pr-[22px] pl-[26px] text-[15px] font-semibold text-black transition-[background-color,transform] duration-200 hover:-translate-y-[2px] hover:bg-white/90"
            >
              Back to home
              <ArrowRight />
            </a>
            <a
              href="/#waitlist"
              onClick={onHomeToWaitlist}
              className="flex h-[49px] cursor-pointer items-center rounded-[14px] border border-white px-[26px] text-[15px] font-semibold text-black transition-[background-color,transform] duration-200 hover:-translate-y-[2px] hover:bg-white/35"
            >
              Join the waitlist
            </a>
          </div>

          <p className="sr-only">Error 404. The page you requested does not exist.</p>
        </main>
      </div>

      <Footer
        action={{ label: 'Join waitlist', href: '/#waitlist', onClick: onHomeToWaitlist }}
        onHome={onHome}
      />
    </>
  )
}

export default NotFound
