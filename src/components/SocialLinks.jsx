const XIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
  </svg>
)

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5.2" stroke="currentColor" strokeWidth="1.9" />
    <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.9" />
    <circle cx="17.4" cy="6.6" r="1.25" fill="currentColor" />
  </svg>
)

const DiscordIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.891a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
  </svg>
)

const YouTubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
  </svg>
)

export const SOCIALS = [
  { name: 'X', href: 'https://x.com/zaevoai', handle: '@zaevoai', Icon: XIcon },
  { name: 'Instagram', href: 'https://instagram.com/zaevoai', handle: '@zaevoai', Icon: InstagramIcon },
  { name: 'Discord', href: 'https://discord.gg/xXDxDprCU', handle: 'Join the server', Icon: DiscordIcon },
  { name: 'YouTube', href: 'https://youtube.com/@zaevoai', handle: '@zaevoai', Icon: YouTubeIcon },
]

/* revealDelay opts the row into the staggered entrance used on the thank-you page */
const SocialLinks = ({ className = 'mt-[34px]', revealDelay }) => (
  <nav aria-label="Zaevo on social media" className={`flex items-center gap-[6px] ${className}`}>
    {SOCIALS.map(({ name, href, Icon }, index) => (
      <a
        key={name}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={name}
        title={name}
        style={
          revealDelay === undefined
            ? undefined
            : { '--rise-delay': `${revealDelay + index * 80}ms` }
        }
        className={`flex h-[44px] w-[44px] items-center justify-center rounded-full text-black/45 transition-[color,background-color,transform] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:bg-black/[0.05] hover:text-black ${
          revealDelay === undefined ? '' : 'rise'
        }`}
      >
        <Icon />
      </a>
    ))}
  </nav>
)

export default SocialLinks
