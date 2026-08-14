/* Source text supplied by the client. Anything bracketed is a placeholder that
   must be filled before publishing; LegalPage renders those visibly on purpose.
   The "Notes for Luca" section of the source is internal and is not held here. */

export const PRIVACY = {
  path: '/privacy',
  title: 'Privacy Policy',
  updated: '8/11/26',
  intro:
    'This Privacy Policy explains how Zaevo ("Zaevo," "we," "us," or "our") collects and uses information when you join the waitlist at zaevoai.com. It does not cover the Zae product itself, which will have its own Privacy Policy at launch.',
  sections: [
    {
      id: 'information-we-collect',
      heading: '1. Information We Collect',
      blocks: [
        { p: 'When you join the waitlist, we collect:' },
        {
          list: [
            {
              term: 'Email address',
              text: 'required to add you to the waitlist and notify you at launch',
            },
            { term: 'Name', text: 'if you provide one' },
            {
              term: 'Referral source',
              text: 'if you tell us how you heard about us, or if we track it via a referral link',
            },
            {
              term: 'Basic technical data',
              text: 'IP address, browser type, and device information, collected automatically for security and analytics purposes',
            },
          ],
        },
        {
          p: 'We do not collect payment information, business data, or any content processed by Zae at this stage — none of that exists yet for waitlist signups.',
        },
      ],
    },
    {
      id: 'how-we-use-your-information',
      heading: '2. How We Use Your Information',
      blocks: [
        { p: 'We use the information you provide to:' },
        {
          list: [
            'Add you to the waitlist and manage your position/priority (e.g., founding member tiers, referral-based access)',
            "Email you about Zaevo's launch, product updates, and early-access invitations",
            'Understand how people are finding the waitlist page (aggregated, anonymized analytics)',
          ],
        },
        {
          p: 'We will not use your email to send unrelated marketing or sell it to third parties.',
        },
      ],
    },
    {
      id: 'sharing-of-information',
      heading: '3. Sharing of Information',
      blocks: [
        { p: 'We do not sell your personal information. We may share it with:' },
        {
          list: [
            {
              term: 'Service providers',
              text: 'who help us run the waitlist — e.g., our database provider, Supabase, and our analytics provider, PostHog',
            },
            {
              term: 'Legal purposes',
              text: 'if required to comply with a law, regulation, or valid legal process',
            },
          ],
        },
      ],
    },
    {
      id: 'data-retention',
      heading: '4. Data Retention',
      blocks: [
        {
          p: "We retain waitlist information until you ask us to delete it, or until 12 months after launch, at which point active waitlist accounts are migrated to the Zae product database and Zae's Privacy Policy takes over.",
        },
      ],
    },
    {
      id: 'your-rights',
      heading: '5. Your Rights',
      blocks: [
        { p: 'You can:' },
        {
          list: [
            'Ask what information we have about you',
            'Ask us to correct or delete it',
            'Unsubscribe from waitlist emails at any time via the link in any email, or by contacting us directly',
          ],
        },
        { p: 'Contact: zaevocontact@gmail.com' },
      ],
    },
    {
      id: 'cookies-and-tracking',
      heading: '6. Cookies & Tracking',
      blocks: [
        {
          p: 'The waitlist page may use cookies or similar technology for basic analytics (page views, referral tracking). We use PostHog for product analytics. PostHog sets cookies to recognize returning visitors across sessions. If you sign up or log in, your anonymous activity is linked to your account.',
        },
      ],
    },
    {
      id: 'childrens-privacy',
      heading: "7. Children's Privacy",
      blocks: [
        {
          p: 'The waitlist is not directed to individuals under 18, and we do not knowingly collect information from children.',
        },
      ],
    },
    {
      id: 'changes-to-this-policy',
      heading: '8. Changes to This Policy',
      blocks: [
        {
          p: 'We may update this Policy as the waitlist evolves. Material changes will be reflected by updating the "Last Updated" date above.',
        },
      ],
    },
    {
      id: 'contact-us',
      heading: '9. Contact Us',
      blocks: [{ p: 'Questions about this Privacy Policy: zaevocontact@gmail.com' }],
    },
  ],
}

export const TERMS = {
  path: '/terms',
  title: 'Terms of Service',
  updated: '8/11/26',
  intro:
    'These Terms govern your use of the Zaevo waitlist page at zaevoai.com (the "Waitlist"). By submitting your email, you agree to these Terms.',
  sections: [
    {
      id: 'what-joining-means',
      heading: '1. What Joining the Waitlist Means',
      blocks: [
        {
          parts: [
            "Joining the Waitlist reserves your place in line for early access to Zae, Zaevo's AI automation platform, once it launches. ",
            { strong: 'It is not a purchase, a subscription, or a guarantee of access.' },
            ' Zaevo reserves the right to determine the pace, order, and criteria for granting access from the waitlist, including any founding-member or referral-based priority.',
          ],
        },
      ],
    },
    {
      id: 'no-guarantee',
      heading: '2. No Guarantee of Launch Date or Pricing',
      blocks: [
        {
          parts: [
            'Zaevo is pre-launch. Any launch dates, pricing, "founding member" discounts, or feature previews referenced on the waitlist page are ',
            { strong: 'subject to change' },
            " and not binding commitments. We'll do our best to honor stated intentions (e.g., locked-in founding pricing) but reserve the right to adjust based on how the product evolves.",
          ],
        },
      ],
    },
    {
      id: 'your-information',
      heading: '3. Your Information',
      blocks: [
        {
          parts: [
            'By joining the Waitlist, you consent to Zaevo collecting and using your information as described in our ',
            { link: 'Privacy Policy', href: '/privacy' },
            '. You confirm the information you provide (e.g., email address) is accurate and belongs to you.',
          ],
        },
      ],
    },
    {
      id: 'communications',
      heading: '4. Communications',
      blocks: [
        {
          p: 'By joining, you agree to receive emails from Zaevo related to the waitlist, product updates, and launch access. You can unsubscribe at any time; doing so may remove you from the waitlist.',
        },
      ],
    },
    {
      id: 'acceptable-use',
      heading: '5. Acceptable Use',
      blocks: [
        { p: 'You agree not to:' },
        {
          list: [
            'Submit false information to manipulate waitlist position (e.g., fake referrals)',
            'Use the waitlist form for spam, abuse, or any unlawful purpose',
            'Attempt to access, scrape, or disrupt the waitlist page or its underlying systems',
          ],
        },
      ],
    },
    {
      id: 'no-warranty',
      heading: '6. No Warranty',
      blocks: [
        {
          p: 'The Waitlist page and any information on it are provided "as is," without warranties of any kind. Zaevo is in active development, and product details described pre-launch may change before Zae is released.',
        },
      ],
    },
    {
      id: 'limitation-of-liability',
      heading: '7. Limitation of Liability',
      blocks: [
        {
          p: 'To the fullest extent permitted by law, Zaevo is not liable for any damages arising from your use of the Waitlist page, including reliance on any pre-launch information, pricing, or timelines stated on it.',
        },
      ],
    },
    {
      id: 'changes-to-these-terms',
      heading: '8. Changes to These Terms',
      blocks: [
        {
          p: 'We may update these Terms as the Waitlist evolves. Continued use of the Waitlist after changes means you accept the updated Terms.',
        },
      ],
    },
    {
      id: 'governing-law',
      heading: '9. Governing Law',
      blocks: [
        {
          p: 'These Terms are governed by the laws of the State of Florida, United States, without regard to conflict-of-law principles.',
        },
      ],
    },
    {
      id: 'contact-us',
      heading: '10. Contact Us',
      blocks: [{ p: 'Questions about these Terms: zaevocontact@gmail.com' }],
    },
  ],
}

export const LEGAL_PAGES = {
  [PRIVACY.path]: { ...PRIVACY, counterpart: TERMS },
  [TERMS.path]: { ...TERMS, counterpart: PRIVACY },
}
