import { useCallback, useState } from 'react'
import Reveal from './Reveal.jsx'

const faqLinkClass =
  'cursor-pointer font-semibold text-white underline decoration-white/30 underline-offset-[3px] transition-colors duration-200 hover:decoration-white'

const FAQ_ITEMS = [
  {
    id: 'what-is-zaevo',
    question: 'What is Zaevo?',
    answer:
      'Zaevo is your AI copartner for work. Zae — your agent — handles the repetitive stuff: inbox triage, form filling, pitch decks, and recurring workflows, so you can focus on what actually needs a human.',
  },
  {
    id: 'who-for',
    question: 'Who is Zae for?',
    answer:
      'Anyone drowning in busywork — SMB owners running lean, and professionals inside larger organizations who need an extra set of hands without an extra headcount.',
  },
  {
    id: 'vs-zapier',
    question: 'How is Zae different from tools like Zapier?',
    answer:
      "Zapier moves data. Zae does work — and shows you exactly what it did. Every action comes with a human-in-the-loop checkpoint and a full audit trail, so you're never wondering what happened behind the scenes.",
  },
  {
    id: 'autonomy',
    question: 'Does Zae work autonomously, or do I stay in control?',
    answer:
      "Both. Zae handles the heavy lifting, but nothing irreversible happens without your sign-off. You set the level of oversight — review everything, or let Zae run and check in after.",
  },
  {
    id: 'capabilities',
    question: 'What can Zae actually do at launch?',
    answer:
      'Inbox triage, form filling, pitch deck creation, and recurring workflow automation. More capabilities are on the roadmap — waitlist members get first access as we roll them out.',
  },
  {
    id: 'data-safety',
    question: 'Is my data safe with Zae?',
    answer: (
      <>
        Security and transparency are core to how we built Zae. Full details are in our{' '}
        <a href="/privacy" className={faqLinkClass}>
          Privacy Policy
        </a>
        .
      </>
    ),
  },
  {
    id: 'launch',
    question: 'When does Zaevo launch?',
    answer:
      "We're in active development. Join the waitlist and you'll be the first to know the moment we open access.",
  },
  {
    id: 'early-access',
    question: 'Will I get early access if I join the waitlist?',
    answer: 'Yes — waitlist members get priority access and early-bird perks when we launch.',
  },
  {
    id: 'pricing',
    question: 'How much will it cost?',
    answer: 'Pricing details are coming closer to launch. Waitlist members will hear first.',
  },
  {
    id: 'contact',
    question: 'How do I get in touch?',
    answer: (
      <>
        Write to us any time at{' '}
        <a href="mailto:zaevocontact@gmail.com" className={faqLinkClass}>
          zaevocontact@gmail.com
        </a>
        .
      </>
    ),
  },
]

const PlusIcon = ({ isOpen }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}
  >
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const FaqItem = ({ item, isOpen, onToggle }) => (
  <div className="rounded-[10px] bg-[#0f0f0f] p-[4px]">
    <h3>
      <button
        type="button"
        id={`faq-trigger-${item.id}`}
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${item.id}`}
        onClick={() => onToggle(item.id)}
        className="flex h-[48px] w-full cursor-pointer items-center justify-between gap-4 rounded-[6px] bg-[#1c1c1c] px-[14px] text-left text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#262626] focus-visible:outline-white"
      >
        {item.question}
        <PlusIcon isOpen={isOpen} />
      </button>
    </h3>
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
    >
      <div className={`overflow-hidden transition-[visibility] duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
        <p
          id={`faq-panel-${item.id}`}
          role="region"
          aria-labelledby={`faq-trigger-${item.id}`}
          className="px-[16px] pt-[15px] pb-[13px] text-[13px] leading-[19px] font-medium text-[#b8b8b8]"
        >
          {item.answer}
        </p>
      </div>
    </div>
  </div>
)

const Faq = () => {
  const [openId, setOpenId] = useState(FAQ_ITEMS[0].id)

  const toggle = useCallback((id) => {
    setOpenId((current) => (current === id ? null : id))
  }, [])

  return (
    <section id="faq" aria-labelledby="faq-heading" className="bg-white px-4 pt-[96px] pb-[96px]">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="flex flex-col items-center text-center">
          <Reveal as="span" className="inline-flex h-[29px] items-center rounded-full bg-[#0f0f0f] px-[15px] text-[11px] font-semibold tracking-[0.09em] text-white uppercase">
            FAQ
          </Reveal>
          <Reveal
            as="h2"
            delay={90}
            className="mt-[23px] text-[32px] leading-[1.1] font-semibold tracking-[-0.05em] text-[#111111] sm:text-[45px]"
          >
            Frequently asked questions.
          </Reveal>
          <Reveal
            as="p"
            delay={180}
            className="mt-[20px] text-[15px] leading-[21px] font-medium text-[#111111]"
          >
            Everything you need to know before joining the
            <br className="hidden sm:inline" /> waitlist. Still have questions? We're here to help.
          </Reveal>
        </div>

        <div className="mt-[52px] flex flex-col gap-[12px]">
          {FAQ_ITEMS.map((item, index) => (
            /* each row watches for itself, so the ones further down arrive on
               their own as you reach them; the stagger is capped because it
               only has to break up the handful that enter together */
            <Reveal key={item.id} delay={Math.min(index, 3) * 70}>
              <FaqItem item={item} isOpen={openId === item.id} onToggle={toggle} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Faq
