interface Props {
  size?: number
  showText?: boolean
  className?: string
}

export default function Logo({ size = 32, showText = true, className = '' }: Props) {
  const iconSize = Math.max(size * 0.5, 20)
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" rx="22" fill="url(#logo-gradient)" />
        <rect x="35" y="28" width="8" height="44" rx="4" fill="white" />
        <rect x="35" y="60" width="28" height="8" rx="4" fill="white" />
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="var(--apple-accent, #7c3aed)" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
      </svg>
      {showText && <span className="text-base font-semibold text-apple-text">Memora</span>}
    </div>
  )
}
