import { createRoot } from 'react-dom/client'
import { RouterProvider } from '../src/lib/router.jsx'
import TripsSection, { PER_VIEW_DESKTOP } from '../src/components/TripsSection.jsx'

globalThis.__tripsConstants = { PER_VIEW_DESKTOP }

globalThis.__mountTrips = () => {
  const container = document.getElementById('root')
  const root = createRoot(container)
  /* The section links out to the /trips collection page, so the mount needs
     the same router context as the real app shell. */
  root.render(
    <RouterProvider>
      <TripsSection discovery={null} onBook={() => {}} />
    </RouterProvider>,
  )
  return root
}
