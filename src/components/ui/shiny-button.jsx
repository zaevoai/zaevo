export function ShinyButton({ children, onClick, className = '', ...props }) {
  return (
    <button className={`shiny-cta ${className}`} onClick={onClick} {...props}>
      <span>{children}</span>
    </button>
  )
}
