import { useEffect, useState } from 'react'

const LAUNCH = new Date(2026, 9, 23, 0, 0, 0)

const getRemaining = () => {
  const ms = Math.max(0, LAUNCH.getTime() - Date.now())
  return {
    total: ms,
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  }
}

const pad = (value) => String(value).padStart(2, '0')

const Unit = ({ value, label }) => (
  <div className="flex w-[72px] flex-col items-center">
    <span className="flex h-[46px] items-center text-[44px] leading-none font-semibold tabular-nums tracking-[-0.05em] text-black">
      {pad(value)}
    </span>
    <span className="mt-[12px] text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
      {label}
    </span>
  </div>
)

const Colon = () => (
  <span
    aria-hidden="true"
    className="flex h-[46px] items-center text-[34px] leading-none font-semibold text-black/25"
  >
    :
  </span>
)

const Countdown = () => {
  const [remaining, setRemaining] = useState(getRemaining)

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining()), 1000)
    return () => clearInterval(id)
  }, [])

  const isLive = remaining.total === 0

  return (
    <div className="mt-[40px] flex flex-col items-center">
      <p className="text-[13px] font-medium tracking-[-0.01em] text-black/55">
        {isLive ? 'Early access is open' : 'Early access opens October 23, 2026'}
      </p>

      <div aria-hidden="true" className="mt-[18px] flex items-start">
        <Unit value={remaining.days} label="Days" />
        <Colon />
        <Unit value={remaining.hours} label="Hours" />
        <Colon />
        <Unit value={remaining.minutes} label="Minutes" />
        <Colon />
        <Unit value={remaining.seconds} label="Seconds" />
      </div>

      <p className="sr-only">
        Early access opens on <time dateTime="2026-10-23">October 23, 2026</time>.
      </p>
    </div>
  )
}

export default Countdown
