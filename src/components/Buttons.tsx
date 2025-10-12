import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'secondary',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: Variant
  disabled?: boolean
}) => {
  const base = "px-4 py-2 rounded-xl text-sm transition shadow-sm"
  const map: Record<Variant, string> = {
    primary: "bg-brandIndigo text-white hover:opacity-90",
    secondary: "bg-white/80 border border-gray-200 hover:bg-white",
    ghost: "bg-transparent hover:bg-white/50"
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${map[variant]} disabled:opacity-50`}>
      {children}
    </button>
  )
}
