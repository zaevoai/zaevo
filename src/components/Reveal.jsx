import { useEffect, useRef, useState } from 'react'

/* Lifts its children into place the first time they cross into view, on the
   same curve as the hero's opening so the whole page moves as one system.
   It reveals once and then stays put — re-animating on every pass reads as a
   gimmick, and it fights you when you scroll back up to re-read something. */
const Reveal = ({ children, delay = 0, className = '', as: Tag = 'div' }) => {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    /* the resting style is hidden, so anything that stops the observer from
       firing has to end with the content shown, never with a blank section */
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    /* Wait until a third of the element is showing, so the motion plays where
       the eye already is rather than in the sliver just clearing the fold.

       Deliberately a threshold and NOT a negative bottom rootMargin: a margin
       carves a dead strip off the bottom of the viewport, and anything that
       comes to rest inside that strip at the very end of the page — the
       footer's last row does, at ~100px up — can never satisfy it and stays
       invisible forever. A ratio of the element itself has no such trap.

       The clamp covers the mirror-image case: for an element too tall for a
       third of it to be on screen at once, a third is unreachable, so ask for
       half a viewport of it instead. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setIsVisible(true)
        observer.disconnect()
      },
      { threshold: Math.min(0.3, (window.innerHeight * 0.5) / (node.offsetHeight || 1)) },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      style={delay ? { '--reveal-delay': `${delay}ms` } : undefined}
      className={`reveal ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}

export default Reveal
