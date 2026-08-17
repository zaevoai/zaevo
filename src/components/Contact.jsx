import { useCallback, useEffect, useRef, useState } from 'react'
import ZaevoMark from './ZaevoMark.jsx'
import HomeLink from './HomeLink.jsx'
import ArrowRight from './ArrowRight.jsx'
import Footer from './Footer.jsx'
import MaskedHeading from './MaskedHeading.jsx'
import Reveal from './Reveal.jsx'
import { SOCIALS } from './SocialLinks.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { validateEmail, MAX_EMAIL_LENGTH } from '../lib/validateEmail.js'
import { domainAcceptsMail } from '../lib/checkDomain.js'

const CONTACT_EMAIL = 'zaevocontact@gmail.com'
/* raised by the ratelimit.enforce() trigger on contact_messages */
const RATE_LIMITED = 'PT429'
/* mirrors the CHECK constraints on the table — the database is what actually
   enforces these, this just stops a person losing work to a silent rejection */
const MAX_NAME_LENGTH = 100
const MAX_MESSAGE_LENGTH = 5000

/* one inbox, so these route by a topic field rather than by address */
const TOPICS = [
  {
    subject: 'General',
    title: 'General',
    detail: 'Questions about Zaevo, Zae, or early access.',
  },
  {
    subject: 'Press',
    title: 'Press & media',
    detail: 'Interviews, briefings, and brand assets.',
  },
  {
    subject: 'Partnership',
    title: 'Partnerships',
    detail: 'Integrations, resellers, and collaborations.',
  },
]

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 12.5 10 17.5 19 7"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ExternalIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M8 16 16 8m0 0h-6m6 0v6"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/* shared with WaitlistForm's error message so a rejected field reads the
   same way everywhere on the site */
const ErrorIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
    <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7.5v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16.5" r="1.15" fill="currentColor" />
  </svg>
)

const RadioDot = ({ isChecked }) => (
  <span
    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
      isChecked ? 'border-black bg-black' : 'border-black/25'
    }`}
  >
    {isChecked && <span className="h-[6px] w-[6px] rounded-full bg-white" />}
  </span>
)

const TextField = ({ id, label, error, isTextarea, fieldRef, isShaking, onAnimationEnd, ...inputProps }) => {
  const Element = isTextarea ? 'textarea' : 'input'
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-semibold text-[#111111]">
        {label}
      </label>
      <Element
        id={id}
        ref={fieldRef}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onAnimationEnd={onAnimationEnd}
        className={`mt-[6px] w-full rounded-[10px] border px-[16px] text-[16px] font-medium text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30 sm:text-[14px] ${
          isTextarea ? 'py-[13px] leading-[21px]' : 'h-[48px]'
        } ${error ? 'border-[#e2483a]' : 'border-black/[0.09]'} ${error && isShaking ? 'field-shake' : ''}`}
        {...inputProps}
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="error-in mt-[6px] flex items-center gap-[6px] text-[13px] font-medium text-[#e2483a]"
        >
          <ErrorIcon />
          {error}
        </p>
      )}
    </div>
  )
}

const ContactForm = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState(TOPICS[0].subject)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [isShaking, setIsShaking] = useState(false)
  const [status, setStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  /* the entrance belongs to the page's first paint. Coming back from the sent
     state rebuilds this form, and replaying a staggered rise there would leave
     someone waiting most of a second to retype something they just sent. */
  const [isFresh, setIsFresh] = useState(true)
  const nameRef = useRef(null)
  const emailRef = useRef(null)
  const messageRef = useRef(null)
  const trapRef = useRef(null)

  const cue = (delay) => (isFresh ? { '--rise-delay': `${delay}ms` } : undefined)
  const enter = () => (isFresh ? 'rise' : '')

  const resetForm = useCallback(() => {
    setName('')
    setEmail('')
    setTopic(TOPICS[0].subject)
    setMessage('')
    setErrors({})
    setIsShaking(false)
    setStatus('idle')
    setIsFresh(false)
  }, [])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      /* see WaitlistForm — a filled trap gets the same success a person would,
         and never reaches the database */
      if (trapRef.current?.value) {
        setStatus('sent')
        return
      }

      const nextErrors = {
        name: name.trim() ? '' : 'Enter your name.',
        email: validateEmail(email),
        message: message.trim() ? '' : 'Add a message so we know what to reply to.',
      }
      setErrors(nextErrors)

      if (nextErrors.name || nextErrors.email || nextErrors.message) {
        setIsShaking(true)
        if (nextErrors.name) return nameRef.current?.focus()
        if (nextErrors.email) return emailRef.current?.focus()
        return messageRef.current?.focus()
      }

      const normalisedEmail = email.trim().toLowerCase()
      const domain = normalisedEmail.slice(normalisedEmail.lastIndexOf('@') + 1)
      setSubmitError('')
      setStatus('checking')

      /* see WaitlistForm.jsx — confirms the domain can receive mail at all,
         which a shape check alone can't tell you */
      if (!(await domainAcceptsMail(domain))) {
        setStatus('idle')
        setErrors({ ...nextErrors, email: "That domain doesn't look like it can receive mail — check for a typo." })
        setIsShaking(true)
        emailRef.current?.focus()
        return
      }

      setStatus('submitting')

      const { error: insertError } = await supabase.from('contact_messages').insert({
        name: name.trim(),
        email: normalisedEmail,
        topic,
        message: message.trim(),
      })

      if (insertError?.code === RATE_LIMITED) {
        setStatus('idle')
        setSubmitError('Too many messages — please wait a minute and try again.')
        return
      }

      if (insertError) {
        setStatus('idle')
        setSubmitError('Something went wrong sending your message — please try again in a moment.')
        return
      }

      setStatus('sent')
    },
    [name, email, topic, message],
  )

  if (status === 'sent') {
    return (
      <div className="seal-in rounded-[10px] border border-black/[0.09] bg-[#f5f5f6] p-[28px] text-center">
        <span className="mx-auto flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#0f0f0f] text-white">
          <CheckIcon />
        </span>
        <h3 className="mt-[14px] text-[17px] font-semibold tracking-[-0.02em] text-[#111111]">Message sent</h3>
        <p className="mt-[6px] text-[14px] leading-[21px] text-[#3a3a41]">
          Thanks{name.trim() ? `, ${name.trim().split(' ')[0]}` : ''} — we read every message and reply within a
          couple of days.
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="mt-[16px] cursor-pointer text-[13px] font-semibold text-[#111111] underline decoration-black/30 underline-offset-[3px] transition-colors duration-200 hover:decoration-black"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[28px]">
      {/* honeypot — see WaitlistForm for why it is off-screen, not hidden */}
      <input
        ref={trapRef}
        type="text"
        name="hp_ref"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-px w-px opacity-0"
      />
      <fieldset style={cue(640)} className={enter()}>
        <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">
          What are you writing about?
        </legend>
        <div role="radiogroup" aria-label="Topic" className="mt-[16px] flex flex-col gap-[10px]">
          {TOPICS.map((item) => {
            const isChecked = item.subject === topic
            return (
              <button
                key={item.subject}
                type="button"
                role="radio"
                aria-checked={isChecked}
                onClick={() => setTopic(item.subject)}
                className={`flex cursor-pointer items-center gap-4 rounded-[10px] border px-[18px] py-[15px] text-left transition-colors duration-200 ${
                  isChecked
                    ? 'border-black/25 bg-black/[0.02]'
                    : 'border-black/[0.09] hover:border-black/25 hover:bg-black/[0.02]'
                }`}
              >
                <RadioDot isChecked={isChecked} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-[#111111]">{item.title}</span>
                  <span className="mt-[3px] block text-[13px] leading-[19px] text-[#3a3a41]">{item.detail}</span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div style={cue(720)} className={`${enter()} grid gap-[16px] sm:grid-cols-2`}>
        <TextField
          id="contact-name"
          label="Name"
          fieldRef={nameRef}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (errors.name) setErrors((current) => ({ ...current, name: '' }))
          }}
          placeholder="Your name"
          autoComplete="name"
          maxLength={MAX_NAME_LENGTH}
          error={errors.name}
          isShaking={isShaking}
          onAnimationEnd={() => setIsShaking(false)}
        />
        <TextField
          id="contact-email"
          label="Email"
          type="email"
          fieldRef={emailRef}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (errors.email) setErrors((current) => ({ ...current, email: '' }))
          }}
          placeholder="you@example.com"
          autoComplete="email"
          maxLength={MAX_EMAIL_LENGTH}
          error={errors.email}
          isShaking={isShaking}
          onAnimationEnd={() => setIsShaking(false)}
        />
      </div>

      {/* TextField puts its own props on the input, so the entrance rides a
          wrapper — which is still one flex child, so the gap is unchanged */}
      <div style={cue(800)} className={enter()}>
        <TextField
          id="contact-message"
          label="Message"
          isTextarea
          rows={5}
          fieldRef={messageRef}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value)
            if (errors.message) setErrors((current) => ({ ...current, message: '' }))
          }}
          placeholder="What's on your mind?"
          maxLength={MAX_MESSAGE_LENGTH}
          error={errors.message}
          isShaking={isShaking}
          onAnimationEnd={() => setIsShaking(false)}
        />
      </div>

      <div style={cue(880)} className={enter()}>
        <button
          type="submit"
          disabled={status !== 'idle'}
          className="cta-lift cta-lift--dark flex h-[49px] w-fit cursor-pointer items-center gap-[7px] rounded-[14px] bg-[#0f0f0f] pr-[22px] pl-[26px] text-[15px] font-semibold text-white hover:bg-[#262626] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'checking' ? 'Checking…' : status === 'submitting' ? 'Sending…' : 'Send message'}
          <ArrowRight />
        </button>
        {submitError && (
          <p role="alert" className="error-in mt-[14px] flex items-center gap-[6px] text-[13px] font-medium text-[#e2483a]">
            <ErrorIcon />
            {submitError}
          </p>
        )}
        <p className="mt-[14px] text-[13px] leading-[19px] text-[#6a6a72]">
          Prefer email? Write to us directly at{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="cursor-pointer font-medium text-[#111111] underline decoration-black/30 underline-offset-[3px] transition-colors duration-200 hover:decoration-black"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </form>
  )
}

const Contact = ({ onHome, onHomeToWaitlist }) => {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Zaevo — Contact'
    window.scrollTo({ top: 0 })
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <>
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
        <div className="px-4 pt-[156px] pb-[72px]">
          <div className="mx-auto w-full max-w-[640px]">
            {/* same opening as the home hero: the lead element resolves out of
                blur, the headline unmasks a word at a time, the standfirst
                follows it up */}
            <span
              style={{ '--rise-delay': '180ms' }}
              className="lockup-in inline-flex h-[29px] items-center rounded-full bg-[#0f0f0f] px-[15px] text-[11px] font-semibold tracking-[0.09em] text-white uppercase"
            >
              Contact
            </span>

            <MaskedHeading
              text="Talk to us."
              delay={300}
              className="mt-[22px] text-[38px] leading-[1.1] font-semibold tracking-[-0.05em] text-black sm:text-[45px]"
            />

            <p
              style={{ '--rise-delay': '520ms' }}
              className="rise mt-[16px] max-w-[430px] text-[15px] leading-[23px] font-medium text-black"
            >
              Questions, press, and partnerships all land in the same inbox. Tell us what's on your mind below.
            </p>
          </div>
        </div>
      </div>

      <main className="bg-white px-4 pb-[96px]">
        <div className="mx-auto w-full max-w-[640px]">
          <section aria-labelledby="contact-form-heading">
            <h2 id="contact-form-heading" className="sr-only">
              Send us a message
            </h2>
            <ContactForm />
          </section>

          {/* past the fold, so these arrive on scroll rather than on a delay
              long enough to still be running when you get to them */}
          <Reveal as="section" aria-labelledby="socials-heading" className="mt-[52px]">
            <h2
              id="socials-heading"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40"
            >
              Find us elsewhere
            </h2>

            <div className="mt-[16px] grid gap-[10px] sm:grid-cols-2">
              {SOCIALS.map(({ name, href, handle, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex cursor-pointer items-center gap-[13px] rounded-[10px] border border-black/[0.09] px-[16px] py-[14px] transition-colors duration-200 hover:border-black/25 hover:bg-black/[0.02]"
                >
                  <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#0f0f0f] text-white">
                    <Icon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[#111111]">{name}</span>
                    <span className="mt-[2px] block truncate font-mono text-[12px] text-[#6a6a72]">
                      {handle}
                    </span>
                  </span>
                  <span className="shrink-0 text-black/25 transition-colors duration-200 group-hover:text-black">
                    <ExternalIcon />
                  </span>
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal
            as="section"
            aria-labelledby="waitlist-heading"
            className="mt-[52px] rounded-[10px] bg-[#f5f5f6] p-[24px]"
          >
            <h2
              id="waitlist-heading"
              className="text-[19px] leading-[1.3] font-semibold tracking-[-0.02em] text-[#111111]"
            >
              Looking for early access?
            </h2>
            <p className="mt-[8px] text-[15px] leading-[24px] text-[#3a3a41]">
              You don't need to email us for that — join the waitlist and we'll send your invite at
              launch. The{' '}
              <a
                href="/#faq"
                className="cursor-pointer font-medium text-[#111111] underline decoration-black/30 underline-offset-[3px] transition-colors duration-200 hover:decoration-black"
              >
                FAQ
              </a>{' '}
              covers the questions we get most.
            </p>
            <a
              href="/#waitlist"
              onClick={onHomeToWaitlist}
              className="cta-lift cta-lift--dark mt-[18px] flex h-[49px] w-fit cursor-pointer items-center gap-[7px] rounded-[14px] bg-[#0f0f0f] pr-[22px] pl-[26px] text-[15px] font-semibold text-white hover:bg-[#262626]"
            >
              Join the waitlist
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

export default Contact
