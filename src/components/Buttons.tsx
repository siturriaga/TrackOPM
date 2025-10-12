import React from 'react'


type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
variant?: 'solid' | 'outline'
}


export const Button: React.FC<Props> = ({ variant = 'solid', className = '', ...rest }) => {
const base = 'px-4 py-2 rounded-2xl font-medium transition shadow-soft'
const solid = 'bg-brandBlue text-white hover:opacity-90'
const outline = 'border border-brandBlue text-brandBlue hover:bg-brandBlue/5'
const cls = `${base} ${variant === 'solid' ? solid : outline} ${className}`
return <button {...rest} className={cls} />
}
