import { createRoot } from 'react-dom/client'
import TripsSection from '../src/components/TripsSection.jsx'

globalThis.__mountTrips = () => {
  const container = document.getElementById('root')
  const root = createRoot(container)
  root.render(<TripsSection discovery={null} onBook={() => {}} />)
  return root
}
