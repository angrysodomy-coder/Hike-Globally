import { createRoot } from 'react-dom/client'
import { RouterProvider } from '../src/lib/router.jsx'
import App from './TestApp.jsx'

globalThis.__mountApp = () => {
  const container = document.getElementById('root')
  const root = createRoot(container)
  root.render(
    <RouterProvider>
      <App />
    </RouterProvider>,
  )
  return root
}
