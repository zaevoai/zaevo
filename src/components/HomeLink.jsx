/* the wordmark is an anchor on the landing page, where home is already on screen,
   and a real control on the thank-you page, where it has to swap the view back */
const HomeLink = ({ onHome, className = '', children }) =>
  onHome ? (
    <button type="button" onClick={onHome} className={`cursor-pointer ${className}`}>
      {children}
    </button>
  ) : (
    <a href="#top" className={className}>
      {children}
    </a>
  )

export default HomeLink
