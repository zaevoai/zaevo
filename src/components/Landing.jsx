import { useCallback, useState } from 'react'
import ZaevoMark from './ZaevoMark.jsx'
import MaskedHeading from './MaskedHeading.jsx'
import HomeLink from './HomeLink.jsx'
import WaitlistForm from './WaitlistForm.jsx'
import Countdown from './Countdown.jsx'
import SocialLinks from './SocialLinks.jsx'
import Faq from './Faq.jsx'
import Footer from './Footer.jsx'
import ArrowRight from './ArrowRight.jsx'

const BUILDERS = [
  { name: 'Amara', skin: '#e7b48e', hair: '#2f2a26', shirt: '#cfd6e0' },
  { name: 'Tomas', skin: '#f0c39c', hair: '#3a2f1c', shirt: '#f5b301' },
  { name: 'Priya', skin: '#c9825a', hair: '#241713', shirt: '#e08a4a' },
  { name: 'Ivan', skin: '#e8b189', hair: '#1b1512', shirt: '#2b3a55' },
  { name: 'Naomi', skin: '#d99a6c', hair: '#191110', shirt: '#0f80d4' },
]

const Avatar = ({ person }) => (
  <svg viewBox="0 0 40 40" className="h-[33px] w-[33px] shrink-0" role="img" aria-label={person.name}>
    <circle cx="20" cy="20" r="20" fill="#ffffff" />
    <clipPath id={`clip-${person.name}`}>
      <circle cx="20" cy="20" r="17.5" />
    </clipPath>
    <g clipPath={`url(#clip-${person.name})`}>
      <rect width="40" height="40" fill={person.shirt} />
      <path d="M20 23c8 0 13 5.5 13 12v5H7v-5c0-6.5 5-12 13-12Z" fill={person.skin} />
      <circle cx="20" cy="16" r="8" fill={person.skin} />
      <path d="M12 15a8 8 0 0 1 16 0c0-4-3.5-6-8-6s-8 2-8 6Z" fill={person.hair} />
    </g>
  </svg>
)

const Landing = ({ onJoined, focusWaitlistOnMount = false }) => {
  /* arriving from a "join the waitlist" CTA elsewhere starts the token at 1, so
     the form calls itself out as it mounts; every later raise is a click here */
  const [highlightToken, setHighlightToken] = useState(focusWaitlistOnMount ? 1 : 0)

  /* the opening plays whenever this page mounts — the one exception being a
     visitor who arrived asking to be taken straight to the waitlist field,
     because the scroll would measure a form that is still mid-rise and land
     short of it. Constant for the life of the mount, so no state is needed. */
  const intro = !focusWaitlistOnMount

  /* off, these return nothing at all, so the page's resting state is the
     visible one rather than a hidden one waiting to be switched on */
  const cue = (delay) => (intro ? { '--rise-delay': `${delay}ms` } : undefined)
  const enter = (animation = 'rise') => (intro ? animation : '')

  /* the anchor still points at #waitlist, so the CTA works without JS; when it
     runs, the form handles the scroll itself and flashes the field on arrival */
  const callOutWaitlist = useCallback((event) => {
    event.preventDefault()
    setHighlightToken((token) => token + 1)
  }, [])

  return (
    <>
      <div className="sky relative min-h-screen">
        <header className="absolute inset-x-0 top-[18px] px-4">
          <nav
            style={cue(240)}
            className={`glass mx-auto flex h-[64px] w-full max-w-[960px] items-center justify-between rounded-[20px] border border-white/30 pl-[18px] pr-[12px] sm:pl-[44px] sm:pr-[15px] ${enter('drop')}`}
          >
            <HomeLink className="flex shrink-0 items-center gap-[8px] text-white sm:gap-[10px]">
              <ZaevoMark width={31} height={27} className="block shrink-0" />
              <span className="text-[20px] leading-none font-semibold tracking-[-0.052em] sm:text-[26px]">Zaevo</span>
            </HomeLink>
            <a
              href="#waitlist"
              onClick={callOutWaitlist}
              className="cta-lift flex h-[44px] shrink-0 cursor-pointer items-center gap-[6px] rounded-[14px] bg-white pl-[16px] pr-[14px] text-[14px] font-semibold text-black hover:bg-white/90 sm:gap-[7px] sm:pl-[22px] sm:pr-[19px] sm:text-[15px]"
            >
              Join now
              <ArrowRight />
            </a>
          </nav>
        </header>

        <main id="top" className="flex flex-col items-center px-4 pt-[250px] pb-[90px] text-center">
          {/* the animation rides a wrapper: putting it on the lockup itself would
              end on transform: none and drop its 5px optical nudge */}
          <div style={cue(180)} className={enter('lockup-in')}>
            <div className="flex translate-x-[5px] items-center gap-[16px] text-white">
              <ZaevoMark width={55} height={47} />
              <span className="text-[49px] leading-[47px] font-semibold tracking-[-0.052em]">Zaevo</span>
            </div>
          </div>

          <MaskedHeading
            text="Meet Zae, your AI copartner."
            play={intro}
            delay={380}
            className="mt-[57px] translate-x-[4px] text-center text-[38px] leading-[1.1] font-semibold tracking-[-0.05em] text-black sm:text-[56px]"
          />

          <p
            style={cue(760)}
            className={`mt-[14px] text-[15px] leading-[23px] font-medium text-black ${enter()}`}
          >
            Inbox triage, forms, decks, and the busywork in between — handled, with you always in
            the loop.
          </p>

          <div id="waitlist" style={cue(850)} className={`mt-[37px] w-full max-w-[460px] ${enter()}`}>
            <WaitlistForm onJoined={onJoined} highlightToken={highlightToken} />
          </div>

          <div style={cue(940)} className={`mt-[19px] flex items-center gap-[21px] ${enter()}`}>
            <div className="flex">
              {BUILDERS.map((person, index) => (
                <div key={person.name} style={{ marginLeft: index === 0 ? 0 : -18.25 }}>
                  <Avatar person={person} />
                </div>
              ))}
            </div>
            <p className="translate-y-[1px] font-mono text-[14.7px] leading-none text-black">
              Be the first to try Zae
            </p>
          </div>

          {/* Countdown owns its spacing but takes no className, so it enters on a wrapper */}
          <div style={cue(1020)} className={enter()}>
            <Countdown />
          </div>

          <SocialLinks revealDelay={intro ? 1120 : undefined} />
        </main>
      </div>

      <Faq />

      <Footer action={{ label: 'Join waitlist', href: '#waitlist', onClick: callOutWaitlist }} />
    </>
  )
}

export default Landing
