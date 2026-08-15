import "jsr:@supabase/functions-js/edge-runtime.d.ts"

/* Reached by a person clicking the unsubscribe link in their welcome email —
   a plain browser GET, never an app fetch — so this is public (verify_jwt:
   false) and authenticates the request itself: the token is an HMAC-SHA256
   over the lowercased email, so only someone holding that exact link (i.e.
   whoever received the email) can produce a token this function accepts. No
   token is ever stored; there is nothing here to leak. */
const UNSUBSCRIBE_SECRET = Deno.env.get("UNSUBSCRIBE_SECRET")
/* auto-provided by the Edge Functions runtime for every function in the
   project — not something to set by hand */
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const toBase64Url = (buffer: ArrayBuffer) => {
  let binary = ""
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const signToken = async (email: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email))
  return toBase64Url(signature)
}

/* fixed-time string compare — see send-waitlist-welcome for why */
const tokenMatches = (candidate: string, expected: string) => {
  if (candidate.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

const page = (title: string, body: string, status: number) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} — Zaevo</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#111;text-align:center;"><h1 style="font-size:22px;font-weight:600;letter-spacing:-0.02em;margin:0 0 12px;">${title}</h1><p style="font-size:15px;line-height:23px;color:#555;">${body}</p><p style="margin-top:28px;"><a href="https://zaevoai.com" style="color:#111;font-weight:600;">Back to Zaevo</a></p></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  )

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 })
  }

  if (!UNSUBSCRIBE_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("unsubscribe-waitlist: missing UNSUBSCRIBE_SECRET, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY")
    return page("Something went wrong", "Please try again in a moment, or contact us directly.", 500)
  }

  const url = new URL(req.url)
  const emailParam = url.searchParams.get("email")
  const token = url.searchParams.get("token")

  if (!emailParam || !token) {
    return page("Invalid link", "This unsubscribe link is missing information. Please use the link from your email exactly as sent.", 400)
  }

  /* mirrors the normalisation applied before the row was ever written
     (WaitlistForm.jsx: email.trim().toLowerCase()), so the signature the
     welcome email computed over that same string still matches here */
  const email = emailParam.trim().toLowerCase()

  const expected = await signToken(email, UNSUBSCRIBE_SECRET)
  if (!tokenMatches(token, expected)) {
    return page("Invalid or expired link", "This unsubscribe link isn't valid. If you didn't mean to unsubscribe, you can ignore this.", 400)
  }

  const deleteResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/waitlist_signups?email=eq.${encodeURIComponent(email)}`,
    {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
    },
  )

  if (!deleteResponse.ok) {
    console.error("unsubscribe-waitlist: delete failed", deleteResponse.status, await deleteResponse.text())
    return page("Something went wrong", "We couldn't process this request. Please try again in a moment, or contact us directly.", 500)
  }

  return page("You're unsubscribed", "You've been removed from the Zaevo waitlist and won't receive further emails from us.", 200)
})
