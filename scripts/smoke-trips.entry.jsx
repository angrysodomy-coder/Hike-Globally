import { createRoot } from 'react-dom/client'
import TripsSection, { PER_VIEW_DESKTOP } from '../src/components/TripsSection.jsx'

globalThis.__tripsConstants = { PER_VIEW_DESKTOP }

globalThis.__mountTrips = () => {
  const container = document.getElementById('root')
  const root = createRoot(container)
  root.render(<TripsSection discovery={null} onBook={() => {}} />)
  return root
}
