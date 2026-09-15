import { createElement } from 'react'
import { useReveal } from '../hooks/useReveal'

export default function Reveal({ as = 'div', className = '', delay = 0, children, ...props }) {
  const ref = useReveal()
  return createElement(
    as,
    {
      ref,
      className: `reveal ${className}`.trim(),
      style: { '--reveal-delay': `${delay}ms` },
      ...props,
    },
    children,
  )
}
