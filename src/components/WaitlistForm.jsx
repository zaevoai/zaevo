import { useCallback, useEffect, useRef, useState } from 'react'
import { useLenis } from 'lenis/react'
import { ShinyButton } from './ui/shiny-button.jsx'
import TicketReveal from './TicketReveal.jsx'
import prefersReducedMotion from '../lib/prefersReducedMotion.js'
import { supabase } from '../lib/supabaseClient.js'
import { validateEmail, MAX_EMAIL_LENGTH } from '../lib/validateEmail.js'
import { domainAcceptsMail } from '../lib/checkDomain.js'

/* Postgres unique_violation — thrown when this email already has a row */
const UNIQUE_VIOLATION = '23505'
/* raised by the ratelimit.enforce() trigger; PostgREST turns a PT-prefixed
   SQLSTATE into the matching HTTP status, so this arrives as a 429 */
const RATE_LIMITED = 'PT429'

const WaitlistForm = ({ onJoined, highlightToken = 0 }) => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  /* set once submission succeeds; the ticket takes over from here, and only
     tearing it (not the form) hands off to the parent's onJoined */
  const [ticketEmail, setTicketEmail] = useState(null)
  const fieldRef = useRef(null)
  const inputRef = useRef(null)
  /* honeypot: hidden from people, irresistible to the form-filling bots that
     crawl for input elements. It only stops that crowd — a script posting
     straight to PostgREST never renders this — which is why the real ceiling
     is the rate-limit trigger in the database. */
  const trapRef = useRef(null)

  /* shares one entry point so every failure path gets the same cue: the
     field kicks once to pull the eye down to the message that just appeared */
  const raiseError = useCallback((message) => {
    setError(message)
    setIsShaking(true)
  }, [])

  /* held in a ref so the effect below can reach the live instance without
     taking it as a dependency — a re-fire there would scroll the page for no
     reason the visitor asked for */
  const lenis = useLenis()
  const lenisRef = useRef(lenis)
  lenisRef.current = lenis

  /* every CTA on the page raises the token; the field brings itself into view,
     takes focus, and flashes so the eye lands where the cursor already is */
  useEffect(() => {
    if (!highlightToken) return

    const reduced = prefersReducedMotion()
    const field = fieldRef.current

    if (field) {
      /* Lenis owns the scroll position once it is running, so a native
         scrollIntoView would be overwritten on its very next frame */
      if (lenisRef.current && !reduced) {
        lenisRef.current.scrollTo(field, {
          offset: -(window.innerHeight - field.offsetHeight) / 2,
        })
      } else {
        field.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
      }
    }
    inputRef.current?.focus({ preventScroll: true })

    setIsHighlighted(true)

    /* toggling the class off and on again would not replay anything — React
       re-adds it in the same frame, so the browser never sees it leave. Rewind
       the running animation instead, which is what a second click should do. */
    const frame = requestAnimationFrame(() => {
      for (const animation of fieldRef.current?.getAnimations() ?? []) {
        animation.currentTime = 0
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [highlightToken])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      /* a filled trap is a bot: let it reach the same success state it would
         have got, so it has no signal to retry against, and never touch the
         database. The email is falsy when the bot left it blank, so fall back
         to a placeholder rather than rendering nothing and looking broken. */
      if (trapRef.current?.value) {
        setError('')
        setStatus('idle')
        setTicketEmail(email.trim().toLowerCase() || 'you@example.com')
        return
      }

      const validationError = validateEmail(email)
      if (validationError) {
        raiseError(validationError)
        return
      }
      const normalisedEmail = email.trim().toLowerCase()
      const domain = normalisedEmail.slice(normalisedEmail.lastIndexOf('@') + 1)
      setError('')
      setStatus('checking')

      /* the address is well-formed but the domain itself may not exist, or
         may not accept mail at all — a person mashing the keyboard into the
         field types exactly this, and no amount of regex catches it */
      if (!(await domainAcceptsMail(domain))) {
        setStatus('idle')
        raiseError("That domain doesn't look like it can receive mail — check for a typo.")
        return
      }

      setStatus('submitting')

      const { error: insertError } = await supabase
        .from('waitlist_signups')
        .insert({ email: normalisedEmail })

      if (insertError?.code === RATE_LIMITED) {
        setStatus('idle')
        raiseError('Too many attempts — please wait a minute and try again.')
        return
      }

      /* surfaced on request even though it lets the form double as an
         enumeration check for whether an address is on the list — accepted
         tradeoff, not an oversight */
      if (insertError?.code === UNIQUE_VIOLATION) {
        setStatus('idle')
        raiseError("You're already on the waitlist — we'll be in touch.")
        return
      }

      if (insertError) {
        setStatus('idle')
        raiseError('Something went wrong — please try again in a moment.')
        return
      }

      setStatus('idle')
      setTicketEmail(normalisedEmail)
    },
    [email, raiseError],
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="w-[460px] max-w-full">
      {/* off-screen rather than display:none — hidden inputs are the first
          thing a bot learns to skip. aria-hidden and tabIndex keep it out of
          the way of anyone using a screen reader or the keyboard. */}
      {/* the name is deliberately meaningless: Chrome's address autofill acts
          on names like "company" or "organization" and ignores
          autocomplete="off" on address-shaped forms, which would fill the trap
          for a real person and silently drop their signup */}
      <input
        ref={trapRef}
        type="text"
        name="hp_ref"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-px w-px opacity-0"
      />
      <div
        ref={fieldRef}
        onAnimationEnd={(event) => {
          if (event.target !== event.currentTarget) return
          setIsHighlighted(false)
          setIsShaking(false)
        }}
        className={`flex h-[61px] items-center rounded-[20px] border pl-[14px] pr-[5px] transition-colors duration-200 sm:pl-[19px] ${
          error ? 'border-[#e2483a]' : 'border-white'
        } ${isHighlighted ? 'field-flash' : ''} ${isShaking ? 'field-shake' : ''}`}
      >
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          ref={inputRef}
          type="email"
          name="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (error) setError('')
          }}
          placeholder="you@example.com"
          autoComplete="email"
          maxLength={MAX_EMAIL_LENGTH}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'waitlist-error' : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-medium text-[#0d0d10] outline-none placeholder:text-[#0d0d10] sm:text-[13.2px]"
        />
        <ShinyButton
          type="submit"
          disabled={status !== 'idle'}
          className="shiny-cta--waitlist shrink-0"
        >
          {status === 'checking' ? 'Checking…' : status === 'submitting' ? 'Joining…' : 'Join waitlist'}
        </ShinyButton>
      </div>
      {error && (
        <p
          id="waitlist-error"
          role="alert"
          className="error-in mt-[9px] flex items-center gap-[6px] text-[13px] font-medium text-[#e2483a]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
            <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7.5v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1.15" fill="currentColor" />
          </svg>
          {error}
        </p>
      )}

      {ticketEmail && (
        <TicketReveal
          email={ticketEmail}
          onTorn={() => onJoined(ticketEmail)}
          onClose={() => setTicketEmail(null)}
        />
      )}
    </form>
  )
}

export default WaitlistForm
