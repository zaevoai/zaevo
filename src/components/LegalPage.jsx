import { useEffect } from 'react'
import ZaevoMark from './ZaevoMark.jsx'
import HomeLink from './HomeLink.jsx'
import ArrowRight from './ArrowRight.jsx'
import Footer from './Footer.jsx'
import MaskedHeading from './MaskedHeading.jsx'
import Reveal from './Reveal.jsx'

/* matches a bracketed placeholder, tolerating one nested pair so that
   "[insert email, e.g., privacy@zaevo.[tld]]" is captured whole */
const PLACEHOLDER = /(\[(?:[^[\]]|\[[^\]]*\])*\])/g

/* unfilled placeholders are marked rather than hidden — they have to be
   impossible to miss while this document is still a draft. box-decoration-clone
   keeps the highlight tidy when a long one wraps across lines. */
const withPlaceholders = (text) =>
  text.split(PLACEHOLDER).map((chunk, index) =>
    chunk.startsWith('[') && chunk.endsWith(']') ? (
      <mark
        key={index}
        className="box-decoration-clone rounded-[4px] bg-[#ffe08a] px-[5px] py-[1px] font-mono text-[13px] text-[#4a3a00]"
      >
        {chunk}
      </mark>
    ) : (
      chunk
    ),
  )

const Inline = ({ parts }) =>
  parts.map((part, index) => {
    if (typeof part === 'string') return <span key={index}>{withPlaceholders(part)}</span>
    if (part.strong)
      return (
        <strong key={index} className="font-semibold text-[#111111]">
          {part.strong}
        </strong>
      )
    return (
      <a
        key={index}
        href={part.href}
        className="cursor-pointer font-medium text-[#111111] underline decoration-black/30 underline-offset-[3px] transition-colors duration-200 hover:decoration-black"
      >
        {part.link}
      </a>
    )
  })

const Block = ({ block }) => {
  if (block.parts) {
    return (
      <p className="mt-[14px] text-[15px] leading-[26px] text-[#3a3a41]">
        <Inline parts={block.parts} />
      </p>
    )
  }

  if (block.list) {
    return (
      <ul className="mt-[14px] flex flex-col gap-[10px]">
        {block.list.map((item, index) => (
          <li
            key={index}
            className="relative pl-[20px] text-[15px] leading-[26px] text-[#3a3a41] before:absolute before:left-[2px] before:top-[11px] before:h-[5px] before:w-[5px] before:rounded-full before:bg-black/25"
          >
            {typeof item === 'string' ? (
              withPlaceholders(item)
            ) : (
              <>
                <span className="font-semibold text-[#111111]">{item.term}</span>
                {' — '}
                {withPlaceholders(item.text)}
              </>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return <p className="mt-[14px] text-[15px] leading-[26px] text-[#3a3a41]">{withPlaceholders(block.p)}</p>
}

const LegalPage = ({ document: doc, onHome, onHomeToWaitlist }) => {
  useEffect(() => {
    const previousTitle = window.document.title
    window.document.title = `Zaevo — ${doc.title}`
    window.scrollTo({ top: 0 })
    return () => {
      window.document.title = previousTitle
    }
  }, [doc.title])

  return (
    <>
      {/* a short sky band instead of the full hero: brand continuity, then straight
          into the reading surface the FAQ section already established */}
      <div className="sky relative">
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
              className="cta-lift flex h-[44px] cursor-pointer items-center gap-[7px] rounded-[14px] bg-white pr-[19px] pl-[22px] text-[15px] font-semibold text-black hover:bg-white/90"
            >
              Back to home
              <ArrowRight />
            </a>
          </nav>
        </header>

        {/* px-4 sits outside the measure here so this band's left edge lines up
            with the white section below, which pads the same way */}
        <div className="px-4 pt-[156px] pb-[64px]">
          <div className="mx-auto w-full max-w-[640px]">
            {/* same opening as the home hero: the lead element resolves out of
                blur, the headline unmasks a word at a time, the timestamp
                follows it up */}
            <span
              style={{ '--rise-delay': '180ms' }}
              className="lockup-in inline-flex h-[29px] items-center rounded-full bg-[#0f0f0f] px-[15px] text-[11px] font-semibold tracking-[0.09em] text-white uppercase"
            >
              Legal
            </span>

            <MaskedHeading
              text={doc.title}
              delay={300}
              className="mt-[22px] text-[38px] leading-[1.1] font-semibold tracking-[-0.05em] text-black sm:text-[45px]"
            />

            <p
              style={{ '--rise-delay': '520ms' }}
              className="rise mt-[16px] font-mono text-[13px] leading-none text-black/55"
            >
              Last updated {withPlaceholders(doc.updated)}
            </p>
          </div>
        </div>
      </div>

      <main className="bg-white px-4 pb-[96px]">
        <div className="mx-auto w-full max-w-[640px]">
          {/* still in the first view, so these carry on the hero's stagger */}
          <p
            style={{ '--rise-delay': '640ms' }}
            className="rise text-[15px] leading-[26px] text-[#3a3a41]"
          >
            {withPlaceholders(doc.intro)}
          </p>

          <nav
            aria-label={`${doc.title} sections`}
            style={{ '--rise-delay': '740ms' }}
            className="rise mt-[36px] rounded-[10px] bg-[#f5f5f6] p-[20px]"
          >
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">
              On this page
            </h2>
            <ol className="mt-[14px] flex flex-col gap-[8px]">
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="cursor-pointer text-[14px] leading-[20px] text-[#3a3a41] transition-colors duration-200 hover:text-black"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* a long document, so each clause arrives as you reach it rather
              than on a fixed delay that would expire long before you scroll */}
          {doc.sections.map((section) => (
            <Reveal
              as="section"
              key={section.id}
              id={section.id}
              className="mt-[44px] scroll-mt-[28px]"
            >
              <h2 className="text-[19px] leading-[1.3] font-semibold tracking-[-0.02em] text-[#111111]">
                {section.heading}
              </h2>
              {section.blocks.map((block, index) => (
                <Block key={index} block={block} />
              ))}
            </Reveal>
          ))}

          {/* the reveal rides a wrapper, not the link: settling on
              `transform: none` would tie with the link's own hover lift on
              specificity and could win, pinning it flat */}
          <Reveal className="mt-[56px]">
            <a
              href={doc.counterpart.path}
              className="cta-lift flex h-[49px] w-fit cursor-pointer items-center gap-[7px] rounded-[14px] border border-black/15 pr-[22px] pl-[26px] text-[15px] font-semibold text-black hover:bg-black/[0.04]"
            >
              Read the {doc.counterpart.title}
              <ArrowRight />
            </a>
          </Reveal>
        </div>
      </main>

      <Footer
        action={{ label: 'Join waitlist', href: '/#waitlist', onClick: onHomeToWaitlist }}
        onHome={onHome}
      />
    </>
  )
}

export default LegalPage
