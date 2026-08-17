import ZaevoMark from './ZaevoMark.jsx'
import ArrowRight from './ArrowRight.jsx'
import HomeLink from './HomeLink.jsx'
import Reveal from './Reveal.jsx'
import { SOCIALS } from './SocialLinks.jsx'

const SITE_LINKS = [
  { name: 'Contact', href: '/contact' },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Terms', href: '/terms' },
]

const DEFAULT_ACTION = { label: 'Join waitlist', href: '#waitlist' }

const Footer = ({ action = DEFAULT_ACTION, onHome }) => (
  <footer className="bg-black px-4 pt-[64px] pb-[38px] text-white">
    <div className="mx-auto w-full max-w-[960px]">
      <Reveal className="flex flex-col gap-[28px] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <HomeLink onHome={onHome} className="flex items-center gap-[9px] text-white">
            <ZaevoMark width={25} height={22} className="block shrink-0" />
            <span className="text-[23px] leading-none font-semibold tracking-[-0.052em]">Zaevo</span>
          </HomeLink>
          <p className="mt-[13px] font-mono text-[13px] leading-[20px] text-white/45">
            Early access opens{' '}
            <time dateTime="2026-10-11" className="text-white/70">
              October 11, 2026
            </time>
          </p>
        </div>

        <a
          href={action.href}
          onClick={action.onClick}
          target={action.href.startsWith('http') ? '_blank' : undefined}
          rel={action.href.startsWith('http') ? 'noreferrer noopener' : undefined}
          className="cta-lift flex h-[44px] w-fit shrink-0 cursor-pointer items-center gap-[7px] rounded-[14px] bg-white pr-[19px] pl-[22px] text-[15px] font-semibold text-black hover:bg-white/90"
        >
          {action.label}
          <ArrowRight />
        </a>
      </Reveal>

      <Reveal
        delay={120}
        className="mt-[40px] flex flex-col-reverse items-center gap-[22px] border-t border-white/10 pt-[26px] sm:flex-row sm:justify-between sm:gap-4"
      >
        <div className="flex flex-col items-center gap-[6px] sm:flex-row sm:gap-[18px]">
          <p className="text-[13px] text-white/40">© 2026 Zaevo. All rights reserved.</p>
          <nav aria-label="Site" className="flex items-center gap-[18px]">
            {SITE_LINKS.map(({ name, href }) => (
              <a
                key={name}
                href={href}
                className="cursor-pointer text-[13px] text-white/40 transition-colors duration-200 hover:text-white"
              >
                {name}
              </a>
            ))}
          </nav>
        </div>

        <nav aria-label="Zaevo on social media" className="flex items-center gap-[4px]">
          {SOCIALS.map(({ name, href, Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={name}
              title={name}
              className="flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full text-white/45 transition-[color,background-color,transform] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:bg-white/[0.08] hover:text-white"
            >
              <Icon />
            </a>
          ))}
        </nav>
      </Reveal>
    </div>
  </footer>
)

export default Footer
