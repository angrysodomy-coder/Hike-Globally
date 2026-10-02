import React from 'react'

/** Compact brand mark used in the admin sidebar / nav header. */
export const AdminIcon: React.FC = () => (
  <svg className="hg-admin-icon" viewBox="0 0 42 42" aria-label="Hike Globally" role="img">
    <circle cx="21" cy="21" r="20" fill="none" stroke="currentColor" strokeWidth="1.1" />
    <path
      d="M7.5 27.5 17.2 13l5.2 7.8 3.9-5.6 8.3 12.3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.4 29.6h21.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      opacity=".68"
    />
  </svg>
)

export default AdminIcon
