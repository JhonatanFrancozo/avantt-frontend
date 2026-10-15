import type { ReactNode } from 'react'

interface Props {
  onClick?: () => void
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'link'
  type?: 'button' | 'submit'
  fullWidth?: boolean
  disabled?: boolean
  ariaLabel?: string
  compact?: boolean
}

const variants = {
  primary: 'bg-blue text-white shadow-lg shadow-blue/20 hover:bg-blue/90',
  secondary: 'border border-border bg-surface text-text-primary hover:bg-blue-light',
  ghost: 'text-text-secondary hover:bg-blue-light hover:text-blue',
  link: 'text-blue hover:text-blue/80',
}

export default function BtnPrimary({
  onClick,
  children,
  variant = 'primary',
  type = 'button',
  fullWidth,
  disabled,
  ariaLabel,
  compact,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:cursor-not-allowed disabled:opacity-50 ${compact ? 'rounded-full p-0' : 'px-4 py-2.5'} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  )
}
