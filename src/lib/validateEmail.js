/* Shared by both forms so the browser and the database agree on what an
   address is. The CHECK constraints in Postgres are the ones that actually
   hold — anyone can skip this file by posting straight to PostgREST — so this
   exists to give a person a useful message, not to be a security boundary. */

/* RFC 5321: 254 for the whole address, 64 for the part before the @ */
export const MAX_EMAIL_LENGTH = 254
const MAX_LOCAL_LENGTH = 64

const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* Returns an error string, or '' when the address is usable. */
export const validateEmail = (raw) => {
  const email = raw.trim()

  if (!email) return 'Enter your email address.'
  if (email.length > MAX_EMAIL_LENGTH) return 'That email address is too long.'
  if (!SHAPE.test(email)) return 'Enter a valid email address.'

  const atIndex = email.lastIndexOf('@')
  const local = email.slice(0, atIndex)
  const domain = email.slice(atIndex + 1)

  if (local.length > MAX_LOCAL_LENGTH) return 'That email address is too long.'

  /* the shape test above allows these through: a dot on either end of a label,
     or two in a row, is not a real domain and the mail would simply bounce */
  if (domain.startsWith('.') || domain.endsWith('.')) return 'Enter a valid email address.'
  if (email.includes('..')) return 'Enter a valid email address.'

  /* a trailing single-character TLD is always a typo (…@gmail.c) */
  if (domain.split('.').pop().length < 2) return 'Enter a valid email address.'

  return ''
}

export default validateEmail
