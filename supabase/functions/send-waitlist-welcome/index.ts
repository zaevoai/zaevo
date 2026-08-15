import "jsr:@supabase/functions-js/edge-runtime.d.ts"

/* Called only by the waitlist_signups trigger (see the
   after_waitlist_signup_insert migration) — never by a browser, so this does
   not verify a Supabase JWT (verify_jwt: false). Instead it checks a shared
   secret the trigger sends in a header, which is the only thing standing
   between this function and anyone who finds its URL and starts sending mail
   through your Resend account on your dime. */
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
/* shared with unsubscribe-waitlist, which is the only other place this
   value needs to live — Supabase Edge Function secrets are project-scoped,
   so setting it once makes it available to both functions */
const UNSUBSCRIBE_SECRET = Deno.env.get("UNSUBSCRIBE_SECRET")
const FUNCTIONS_BASE_URL = "https://nncnehffigdmuglsbkjw.supabase.co/functions/v1"

/* Resend's shared sandbox sender — works with no domain setup, but only
   delivers to the email address on the Resend account itself. Swap for a
   verified domain address once one exists; nothing else here changes. */
const FROM_ADDRESS = "Zaevo <onboarding@resend.dev>"

/* The address reaches us through a CHECK constraint that only forbids
   whitespace and requires an @ and a dot — `<` and `>` sail straight through,
   and a tag needs no spaces (`<img/src=x/onerror=…>`). Escaping here is what
   keeps a signup from writing markup into a message we send out. */
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;"
      case "<": return "&lt;"
      case ">": return "&gt;"
      case '"': return "&quot;"
      default:  return "&#39;"
    }
  })

/* Compares in time that does not depend on where the first difference falls,
   so the response latency cannot be used to recover the secret one byte at a
   time. Length is compared first because the loop needs a fixed bound. */
const secretMatches = (candidate: string | null, expected: string | undefined) => {
  if (!candidate || !expected || candidate.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

/* base64url HMAC-SHA256 over the (already-lowercased) email — stateless, so
   there is no token to store or leak. unsubscribe-waitlist recomputes the
   same signature from the link's own email param and compares. */
const toBase64Url = (buffer: ArrayBuffer) => {
  let binary = ""
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const signUnsubscribeToken = async (email: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(UNSUBSCRIBE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email))
  return toBase64Url(signature)
}

const emailHtml = (email: string, unsubscribeUrl: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
    <p style="font-size: 11px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: #666; margin: 0 0 12px;">Zaevo</p>
    <h1 style="font-size: 24px; font-weight: 600; letter-spacing: -0.02em; color: #111; margin: 0 0 12px;">You're on the list.</h1>
    <p style="font-size: 14px; line-height: 22px; color: #333; margin: 0 0 8px;">
      ${escapeHtml(email)}, thanks for joining the Zaevo waitlist. We'll email you the moment early access opens.
    </p>
    <p style="font-size: 13px; line-height: 20px; color: #888; margin: 24px 0 0;">
      Didn't sign up for this? You can ignore this email, or
      <a href="${unsubscribeUrl}" style="color: #888;">unsubscribe</a>.
    </p>
  </div>
`

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  /* fail closed: an unset WEBHOOK_SECRET must not turn into "no secret
     required", which is what a bare !== comparison against undefined would do
     the first time someone redeploys without the env var set */
  if (!WEBHOOK_SECRET || !RESEND_API_KEY || !UNSUBSCRIBE_SECRET) {
    console.error("send-waitlist-welcome: missing WEBHOOK_SECRET, RESEND_API_KEY, or UNSUBSCRIBE_SECRET")
    return new Response("Server misconfigured", { status: 500 })
  }

  if (!secretMatches(req.headers.get("x-webhook-secret"), WEBHOOK_SECRET)) {
    return new Response("Unauthorized", { status: 401 })
  }

  let email: unknown
  try {
    ;({ email } = await req.json())
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  if (!email || typeof email !== "string" || email.length > 254) {
    return new Response("Missing or invalid email", { status: 400 })
  }

  const unsubscribeToken = await signUnsubscribeToken(email)
  const unsubscribeUrl = `${FUNCTIONS_BASE_URL}/unsubscribe-waitlist?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [email],
      subject: "You're on the Zaevo waitlist",
      html: emailHtml(email, unsubscribeUrl),
    }),
  })

  /* Resend's body can name the recipient and echo our key's account details,
     so it goes to the function log — which only the project owner reads —
     rather than back down the wire to whoever called this. */
  const resendBody = await resendResponse.text()
  if (!resendResponse.ok) {
    console.error("send-waitlist-welcome: Resend rejected the send", resendResponse.status, resendBody)
  }

  return new Response(
    JSON.stringify({ ok: resendResponse.ok }),
    { status: resendResponse.ok ? 200 : 502, headers: { "Content-Type": "application/json" } },
  )
})
