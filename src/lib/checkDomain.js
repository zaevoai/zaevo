/* A domain can be shaped exactly like an email and still not exist —
   "ghdl.com" passes every syntax rule validateEmail.js can write. The only
   way to catch that is to ask the DNS system whether the domain can
   actually receive mail. Cloudflare's DNS-over-HTTPS resolver answers that
   over plain fetch, with CORS enabled, and needs no API key.

   Known limit, accepted deliberately: this confirms the DOMAIN can receive
   mail, not that any particular MAILBOX on it exists — a parked or
   catch-all domain (which "ghdl.com" itself is) will pass with a made-up
   local part like "dnifiniwnfnd@". Closing that gap needs a real SMTP/API
   mailbox check (e.g. ZeroBounce) run server-side, or a confirm-your-email
   step; neither is in place yet. */

const DNS_ENDPOINT = 'https://cloudflare-dns.com/dns-query'
const TIMEOUT_MS = 3000

const queryRecord = async (domain, type, signal) => {
  const url = `${DNS_ENDPOINT}?name=${encodeURIComponent(domain)}&type=${type}`
  const response = await fetch(url, { headers: { Accept: 'application/dns-json' }, signal })
  if (!response.ok) throw new Error(`DNS lookup failed: ${response.status}`)
  const data = await response.json()
  return Array.isArray(data.Answer) && data.Answer.length > 0
}

/* MX first, since that's what mail actually routes on; A as the fallback a
   few small providers still lean on instead. Any network failure — timeout,
   offline, resolver hiccup — fails OPEN: nobody should be blocked from
   signing up because a DNS lookup didn't come back in time. */
export const domainAcceptsMail = async (domain) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    if (await queryRecord(domain, 'MX', controller.signal)) return true
    return await queryRecord(domain, 'A', controller.signal)
  } catch {
    return true
  } finally {
    clearTimeout(timer)
  }
}

export default domainAcceptsMail
