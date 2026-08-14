import { useEffect, useRef } from 'react'
import ZaevoMark from './ZaevoMark.jsx'
import HomeLink from './HomeLink.jsx'
import ArrowRight from './ArrowRight.jsx'
import Countdown from './Countdown.jsx'
import SocialLinks, { SOCIALS } from './SocialLinks.jsx'
import Footer from './Footer.jsx'

const DISCORD = SOCIALS.find((social) => social.name === 'Discord')

/* the one moment on this page: the seal lands, the check draws, the beacon carries out */
const Seal = () => (
  <div className="relative h-[92px] w-[92px]">
    <span aria-hidden="true" className="seal-ring" style={{ '--ring-delay': '900ms' }} />
    <span aria-hidden="true" className="seal-ring" style={{ '--ring-delay': '2700ms' }} />

    <div className="seal-in relative flex h-full w-full items-center justify-center rounded-full bg-white shadow-[0_14px_40px_rgba(16,32,84,0.22)]">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 12.4 10.1 16.5 18 7.4"
          pathLength="1"
          className="seal-draw"
          stroke="#000000"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
)

const ThankYou = ({ email, onHome }) => {
  const headingRef = useRef(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <>
      {/* the nav is absolute, so this centres the confirmation block on its own */}
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
              href={DISCORD.href}
              target="_blank"
              rel="noreferrer noopener"
              className="flex h-[39px] cursor-pointer items-center gap-[7px] rounded-[14px] bg-white pr-[19px] pl-[22px] text-[15px] font-semibold text-black transition-[background-color,transform] duration-200 hover:-translate-y-[2px] hover:bg-white/90"
            >
              Join Discord
              <ArrowRight />
            </a>
          </nav>
        </header>

        <main
          id="top"
          className="flex flex-col items-center px-4 pt-[150px] pb-[110px] text-center"
        >
          <Seal />

          <h1
            ref={headingRef}
            tabIndex={-1}
            style={{ '--rise-delay': '620ms' }}
            className="rise mt-[48px] text-[38px] leading-[1.1] font-semibold tracking-[-0.05em] text-black outline-none sm:text-[56px]"
          >
            You're on the list.
          </h1>

          <p
            style={{ '--rise-delay': '720ms' }}
            className="rise mt-[16px] max-w-[430px] text-[15px] leading-[23px] font-medium text-black"
          >
            Your invite goes to <span className="font-mono break-all">{email}</span> the moment early
            access opens. Nothing else lands in your inbox.
          </p>

          <div style={{ '--rise-delay': '820ms' }} className="rise">
            <Countdown />
          </div>

          <p
            style={{ '--rise-delay': '940ms' }}
            className="rise mt-[46px] font-mono text-[13px] leading-none text-black/55"
          >
            Follow along until launch
          </p>

          <SocialLinks className="mt-[12px]" revealDelay={1020} />
        </main>
      </div>

      <Footer action={{ label: 'Join Discord', href: DISCORD.href }} onHome={onHome} />
    </>
  )
}

export default ThankYou
