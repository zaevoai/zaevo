/* Read at the moment it matters rather than cached at module load, so a visitor
   who changes the OS setting mid-visit is honoured on their next interaction. */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default prefersReducedMotion
