import { motion, useScroll, useSpring } from 'framer-motion'

/* Hairline reading of scroll progress across the destinations page. */
export default function PageProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 })
  return <motion.div className="dp-progress" style={{ scaleX }} aria-hidden="true" />
}
