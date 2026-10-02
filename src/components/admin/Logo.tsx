import React from 'react'

/**
 * Full Hike Globally lockup, shown on the admin login screen.
 * Mirrors `src/components/Logo.jsx` (the public site mark) — same ridgeline
 * geometry, same HIKE / Globally pairing, in the brand's ocean teal.
 */
export const AdminLogo: React.FC = () => (
  <span className="hg-admin-logo" aria-label="Hike Globally">
    <svg className="hg-admin-logo__mark" viewBox="0 0 42 42" aria-hidden="true">
      <circle cx="21" cy="21" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
      <path
        d="M7.5 27.5 17.2 13l5.2 7.8 3.9-5.6 8.3 12.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.4 29.6h21.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity=".68"
      />
    </svg>
    <span className="hg-admin-logo__type">
      <span className="hg-admin-logo__hike">HIKE</span>
      <span className="hg-admin-logo__globally">Globally</span>
    </span>
  </span>
)

export default AdminLogo
