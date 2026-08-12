import { useState } from 'react'

export default function BlurredValue({ value, className = '', blurClass = 'blur-[5px]', onClick }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <span
      className={`inline-block cursor-pointer select-none ${revealed ? '' : blurClass} ${className}`}
      title={revealed ? 'Click to hide' : 'Click to reveal'}
      onClick={(e) => {
        e.stopPropagation()
        setRevealed(!revealed)
        onClick?.(e)
      }}
    >
      {value}
    </span>
  )
}
