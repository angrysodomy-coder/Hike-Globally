import { useCallback, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { usePageMeta } from '../lib/router'
import PageProgress from '../components/destinations/PageProgress'
import DestinationsHero from '../components/destinations/DestinationsHero'
import DestinationsMarquee from '../components/destinations/DestinationsMarquee'
import RegionRail from '../components/destinations/RegionRail'
import StatsBand from '../components/destinations/StatsBand'
import RegionExplorer from '../components/destinations/RegionExplorer'
import CraftSection from '../components/destinations/CraftSection'
import SeasonGuide from '../components/destinations/SeasonGuide'
import VoicesSection from '../components/destinations/VoicesSection'
import FaqSection from '../components/destinations/FaqSection'
import DestinationsCta from '../components/destinations/DestinationsCta'

export default function DestinationsPage({ onBook }) {
  const [selected, setSelected] = useState(null)

  usePageMeta({
    title: 'Destinations — Hike Globally',
    description: 'Explore Nepal by region: the Khumbu, Annapurna, Manaslu, Mustang, Langtang and the untrampled west. Small-group, locally led Himalayan journeys.',
  })

  const handleExplore = useCallback((regionId) => {
    setSelected(regionId)
    requestAnimationFrame(() => {
      document.getElementById('dp-explorer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <PageProgress />
      <main id="main-content">
        <DestinationsHero onBook={onBook} />
        <DestinationsMarquee />
        <RegionRail onExplore={handleExplore} onBook={onBook} />
        <StatsBand />
        <RegionExplorer selected={selected} onSelect={setSelected} onBook={onBook} />
        <CraftSection />
        <SeasonGuide />
        <VoicesSection />
        <FaqSection />
        <DestinationsCta onBook={onBook} />
      </main>
    </MotionConfig>
  )
}
