/* Shared by both forms so the browser and the database agree on what an
   address is. The CHECK constraints in Postgres are the ones that actually
   hold — anyone can skip this file by posting straight to PostgREST — so this
   exists to give a person a useful message, not to be a security boundary. */

/* RFC 5321: 254 for the whole address, 64 for the part before the @ */
export const MAX_EMAIL_LENGTH = 254
const MAX_LOCAL_LENGTH = 64

const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* the providers a mistyped domain is overwhelmingly likely to have meant —
   catches the single-character slips (gmial, gmai, gnail) that a person
   reading their own typo tends not to see */
const KNOWN_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
]

/* one-edit distance: a single insert, delete, substitution, or transposition
   away. Cheap enough to run against a handful of known domains per keystroke. */
const isOneEditAway = (a, b) => {
  if (a === b) return false
  if (Math.abs(a.length - b.length) > 1) return false

  if (a.length === b.length) {
    let diff = 0
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) diff += 1
      if (diff > 2) break
    }
    if (diff === 1) return true
    // transposed pair, e.g. gmali → gmail
    if (diff === 2) {
      for (let i = 0; i < a.length - 1; i += 1) {
        if (a[i] !== b[i]) {
          return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)
        }
      }
    }
    return false
  }

  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a]
  let i = 0
  let j = 0
  let skipped = false
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] !== longer[j]) {
      if (skipped) return false
      skipped = true
      j += 1
    } else {
      i += 1
      j += 1
    }
  }
  return true
}

const suggestDomain = (domain) => {
  const lower = domain.toLowerCase()
  if (KNOWN_DOMAINS.includes(lower)) return null
  return KNOWN_DOMAINS.find((known) => isOneEditAway(lower, known)) ?? null
}

/* Returns an error string, or '' when the address is usable. */
export const validateEmail = (raw) => {
  const email = raw.trim()

  if (!email) return 'Enter your email address.'
  if (email.length > MAX_EMAIL_LENGTH) return 'That email is too long.'

  if (!email.includes('@')) return "Missing the @ — try something like you@example.com."

  const atIndex = email.lastIndexOf('@')
  const local = email.slice(0, atIndex)
  const domain = email.slice(atIndex + 1)

  if (!local) return 'Enter the part before the @.'
  if (!domain) return "That email is missing a domain, like gmail.com."

  if (!SHAPE.test(email)) return "That doesn't look like a valid email."

  if (local.length > MAX_LOCAL_LENGTH) return 'That email is too long.'

  /* the shape test above allows these through: a dot on either end of a label,
     or two in a row, is not a real domain and the mail would simply bounce */
  if (domain.startsWith('.') || domain.endsWith('.')) return "That doesn't look like a valid email."
  if (email.includes('..')) return "That doesn't look like a valid email."

  if (!domain.includes('.')) return "That email is missing a domain, like gmail.com."

  /* a trailing single-character TLD is always a typo (…@gmail.c) */
  if (domain.split('.').pop().length < 2) return "That doesn't look like a valid email."

  const suggestion = suggestDomain(domain)
  if (suggestion) return `Did you mean ${local}@${suggestion}?`

  return ''
}

export default validateEmail
