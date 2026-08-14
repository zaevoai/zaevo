# Security audit — Zaevo waitlist

Audited 13 Aug 2026 against the live Supabase project `nncnehffigdmuglsbkjw`.

## The shape of this app changes the answer

This is a **static Vite + React SPA with no server**. There is no Express app,
no Next.js API route, no backend of any kind. The browser holds a Supabase
publishable key and talks directly to PostgREST.

That has one consequence worth stating before the findings, because it decides
which fixes are real and which are theatre:

> **Anything enforced in JavaScript is not enforced.** The publishable key is
> public by design — it ships in the bundle, and it must, for the form to work.
> Anyone can read it and post straight to
> `https://…supabase.co/rest/v1/waitlist_signups`, skipping every line of React
> in this repo. The browser is a convenience layer, not a security boundary.

So the checklist items that assume a server — CORS config, CSRF tokens, request
body-size middleware, stack-trace suppression — have **no implementation site
here**. Their real equivalents live in Postgres (RLS, grants, CHECK
constraints, trigger-based rate limiting) and in the host's response headers.
That is where the fixes below went.

---

## Priority list

### CRITICAL

**C1 · No rate limiting on either insert path — fixed**
Nothing bounded inserts into `waitlist_signups` or `contact_messages`. Every
waitlist row fires an `AFTER INSERT` trigger that makes a `pg_net` HTTP call,
which calls the Resend API. A loop against the public endpoint meant unbounded
row growth, unbounded outbound HTTP from the database, and unbounded Resend API
calls — quota and cost exhaustion with no ceiling and no alert.

Scoping this precisely: `FROM_ADDRESS` is currently Resend's sandbox sender
(`onboarding@resend.dev`), which only delivers to the account's own address, so
today the damage is quota/cost/DB growth rather than mail landing in strangers'
inboxes. **It becomes a genuine open relay — attacker-chosen recipients, your
domain's reputation — the moment a verified sending domain replaces the
sandbox**, which the function's own comment says is the plan. Fix it before
that swap, not after.

### HIGH

**H1 · Webhook secret hardcoded in a database function — NOT fixed, needs you**
`notify_waitlist_signup()` carries the shared secret as a plaintext literal in
its body. It is readable by anyone with database access, and it is captured in
migration history and every backup. **It was also displayed to the agent that
ran this audit, so treat it as disclosed and rotate it regardless.** See
[Actions for you](#actions-for-you) — this one cannot be safely half-done.

**H2 · `anon` held full table privileges — fixed**
`anon` and `authenticated` had `SELECT, INSERT, UPDATE, DELETE, TRUNCATE,
REFERENCES, TRIGGER` on both tables (Supabase's default blanket grant). RLS was
the *only* thing standing between the public internet and a full dump of the
email list — one future convenience policy would have opened it. Worse,
**`TRUNCATE` is never subject to RLS**: the privilege alone governs it.
Revoked down to `INSERT`, which is all the browser ever needs.

**H3 · `anon` can execute `net.http_post` — NOT fixable here; not exploitable**
*Downgraded after verification. My first attempt to fix this failed silently and
I nearly reported it as fixed — the correction matters more than the finding.*

`anon` holds `USAGE` on the `net` schema and `EXECUTE` on `net.http_post`,
`http_get` and `http_delete` — nominally a server-side request forgery
primitive inside the database.

Two verified facts defuse it:

- **Not reachable from the internet.** PostgREST exposes only the `public`
  schema. A live call to `/rest/v1/rpc/check_worker_is_up` with the real
  publishable key returned `404 PGRST202`. Reaching `net.*` needs a direct
  Postgres connection authenticated as `anon`, which requires database
  credentials the publishable key does not grant.
- **Not remediable at this access level.** The privilege is held via `PUBLIC`
  (`proacl` = `=X/supabase_admin`), and the `net` schema is owned by
  `supabase_admin`. This audit ran as `postgres`, which cannot act as
  `supabase_admin` — so `REVOKE` is accepted and does nothing. Postgres emits a
  warning rather than an error, which is exactly how a no-op fix gets mistaken
  for a real one.

The `revoke ... on schema net` lines in the `least_privilege_and_input_bounds`
migration are therefore **dead statements** — harmless, but do not read them as
protection. This is Supabase's managed default for `pg_net` and only Supabase
can change it. Nothing further to do; recorded so it is not rediscovered and
"fixed" again.

**H4 · No security headers at all — fixed**
No CSP, no HSTS, no `X-Frame-Options` (so the site was clickjackable), no
`nosniff`. Added for both likely hosts.

### MEDIUM

**M1 · Unescaped email interpolated into outgoing HTML — fixed, needs deploy**
`emailHtml()` dropped the address straight into markup. The CHECK constraint
only forbids whitespace and requires `@` and `.`, so `<` and `>` pass, and an
HTML tag needs no spaces (`<img/src=x/onerror=…>`). Now escaped. (The validator
test suite deliberately asserts such an address *passes* validation — proof the
escaping is what's carrying the weight, not the regex.)

**M2 · No length bound on any field — fixed**
No maximum on email, name, topic or message. With no server, CHECK constraints
are the only place "request size limit" can exist in this stack. Added: email
254, name 100, topic 120, message 5000.

**M3 · Secret compared with `!==`, and failed open — fixed, needs deploy**
Byte-by-byte comparison leaks position through timing. More seriously, if
`WEBHOOK_SECRET` were ever unset, `header !== undefined` made *every* request
unauthorized-but-shaped-wrong rather than failing closed on the config error.
Now a constant-time compare, and it 500s if either env var is missing.

**M4 · Provider responses echoed to the caller — fixed, needs deploy**
The function returned Resend's raw status and body. That reflects a third
party's error text — recipient details, account state — to whoever called it.
Now logged server-side; the caller gets `{ok: true|false}`.

**M5 · No bot protection — partially fixed**
Added an off-screen honeypot to both forms; a filled trap gets the same success
UI and never touches the database. The field is named `hp_ref`, deliberately
meaningless: a semantic name like `company` is one Chrome's address autofill
targets, and Chrome ignores `autocomplete="off"` on address-shaped forms — it
would have filled the trap for real visitors and silently discarded their
signups. **Be clear about its reach**: a honeypot only
stops form-filling crawlers that render the page. It does nothing against a
script posting directly to PostgREST — the rate-limit trigger is what covers
that. A real CAPTCHA (Turnstile) would need a server-side verify step, meaning
inserts route through an Edge Function; that's a refactor, not a patch, so I
did not do it unasked.

**M6 · Loose email validation — fixed**
Both forms used `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` and nothing else. Now a shared
validator also rejects over-length addresses (254 total / 64 local per RFC
5321), doubled dots, leading/trailing dots in the domain, and single-character
TLDs. 14 edge cases tested.

### LOW

**L1 · Legal page promises deletion that isn't implemented — NOT fixed**
`src/content/legal.js` offers unsubscribe and data deletion. No mechanism
exists, and with `anon` correctly limited to `INSERT` there is no self-service
path. Right now the promise is kept by hand, via the contact inbox. To make it
real: an Edge Function that takes an emailed signed token and deletes the row.
Flagging rather than silently building — it's a product decision.

**L2 · Not under version control — NOT fixed**
`git ls-files` in this directory returns nothing. No history, no rollback, no
review. `.env.local` is correctly ignored and untracked, so `git init` here is
safe — but note the repo currently sits inside a home-directory git repo, which
is worth untangling.

---

## Verified NOT vulnerable

Checked and found genuinely fine — recorded so nobody re-litigates them:

| Item | Evidence |
|---|---|
| RLS blocks reading the email list | Live API call with the real publishable key returns `[]` against a table that actually holds rows |
| SQL injection | No raw SQL anywhere; PostgREST parameterises. No string concatenation into queries |
| XSS in the React app | No `dangerouslySetInnerHTML`. The one `innerHTML` (`admit-one-ticket.jsx:199`) assigns a hardcoded constant, not user input |
| Publishable key in the bundle | Correct by design — it is the anon key, and RLS is what constrains it |
| `.env.local` committed | Ignored via `.gitignore:4` and untracked |
| Secrets in the built bundle | Scanned `dist/` — the one `sb_secret_` hit is supabase-js's own key-prefix detection code, not a key |
| Dependency CVEs | `npm audit` → **0 vulnerabilities** across 95 packages |
| Admin panel / debug routes | None exist — routes are `/`, `/contact`, legal pages, 404 |
| Supabase lint: "anon can execute SECURITY DEFINER function" ×2 | **False positives, proven.** Both are trigger functions; direct invocation raises `0A000 trigger functions can only be called as triggers` |
| HTTPS | Enforced by Supabase and by both candidate static hosts; HSTS now added |
| PII in logs | No `console.*` in app code — the only ones are inside the vendored WebGL shader component and log no user data |

---

## What changed

**Database** (applied live — two migrations):

- `least_privilege_and_input_bounds` — revoked blanket grants down to `INSERT`
  (verified: `anon` and `authenticated` now hold `INSERT` and nothing else on
  both tables); added five length CHECKs. It also contains two `revoke ... net`
  statements that turned out to be **no-ops** — see H3.
- `add_signup_rate_limiting` — a private `ratelimit` schema (never exposed to
  PostgREST) plus a `SECURITY DEFINER` `BEFORE INSERT` trigger on both tables.

Rate limits: **waitlist 5/min per IP, 60/min globally**; **contact 3/min per IP,
30/min globally**. Two layers on purpose — per-IP uses `cf-connecting-ip` with
`x-forwarded-for` as fallback, and since XFF is client-appendable that layer
raises the bar rather than sealing the door. **The global cap is the hard
control** that actually bounds the Resend bill. Rejections raise SQLSTATE
`PT429`, which PostgREST turns into a real HTTP 429.

**Verified twice — the second test is the one that counts:**

1. *Logic*, against a scratch table with simulated headers: 5 from one IP
   accepted, 6th and 7th rejected `PT429`, and a *different* IP still accepted —
   so one abuser cannot lock out real visitors.
2. *End-to-end in production*, four real HTTPS POSTs to
   `/rest/v1/contact_messages` with the publishable key: **3 accepted (201), the
   4th rejected with a genuine HTTP 429** and body `{"code":"PT429"}`.

The second test was necessary because the first proved only that the function
works *if* the client IP arrives. It confirmed three things the first could not:
PostgREST really does populate `request.headers` with the caller's IP (a real
address was recorded, not the `'unknown'` fallback); rejection happened at 3,
the per-IP threshold, not the global 30, so the per-IP branch is genuinely
live; and PostgREST maps the `PT429` SQLSTATE to HTTP 429 with `code` intact —
which is exactly what the `RATE_LIMITED` check in both forms keys off.

`contact_messages` was chosen as the target because it carries no `AFTER INSERT`
email trigger, so the test sent no mail. All probe rows and counters were
deleted afterwards; both tables are back to their pre-audit contents.

**Application code:**

- `src/lib/validateEmail.js` — new shared validator (M6).
- `src/components/WaitlistForm.jsx` — validator, honeypot, `maxLength`, and a
  distinct "too many attempts" message on `PT429` instead of the generic error.
- `src/components/Contact.jsx` — the same four changes.
- `supabase/functions/send-waitlist-welcome/index.ts` — escaping, constant-time
  secret compare, fail-closed config check, no provider echo (M1/M3/M4). **This
  file is new locally and is not yet deployed.**
- `vercel.json` + `public/_headers` — security headers (H4). Both are written
  because the deploy host isn't declared in the repo; each is inert on the
  other's platform.

The CSP allows `'unsafe-inline'` for **styles only** — the ticket shader injects
a `<style>` element at runtime and the page uses inline style props. `script-src`
stays strict `'self'`; the build emits no inline scripts. Verified in a real
headless browser against the built output with the CSP applied: both routes
render with **0 console errors and 0 failed requests**.

---

## Actions for you

1. **Rotate the webhook secret (H1) — do not half-do this.** The secret lives in
   two places that must change together: the literal in
   `notify_waitlist_signup()` and the Edge Function's `WEBHOOK_SECRET` env var.
   Change one without the other and every welcome email silently 401s. Set the
   new env var first, then apply a migration updating the function body. Better
   still, move it into Supabase Vault so it stops living in migration history.

2. **Deploy the hardened Edge Function** — the fixes for M1/M3/M4 are written to
   `supabase/functions/send-waitlist-welcome/index.ts` but the live function is
   unchanged. I did not deploy it, since that is an outward-facing change:
   `supabase functions deploy send-waitlist-welcome`.

3. **Decide on data deletion (L1)** — the legal copy promises it today.

4. **`git init`** — nothing here is version-controlled (L2).

5. **Watch the rate-limit thresholds.** They're set for a pre-launch waitlist. A
   launch spike or a corporate NAT sharing one IP could hit them; the numbers are
   trigger arguments, so raising them is a one-line migration.
