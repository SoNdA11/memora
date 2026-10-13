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
        <path d="M19 69 V33 L35 54 L51 33 V69" stroke="white" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="60" y="53" width="7" height="16" rx="3.5" fill="white" opacity="0.55" />
        <rect x="70" y="44" width="7" height="25" rx="3.5" fill="white" opacity="0.8" />
        <rect x="80" y="34" width="7" height="35" rx="3.5" fill="white" />
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
      </svg>
      {showText && <span className="text-base font-semibold text-apple-text">Memora</span>}
    </div>
  )
}
