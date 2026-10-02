/** Tailwind is used only by the Payload-driven (CMS) surfaces of the site.
 *  Preflight is intentionally NOT imported — the hand-authored Hike Globally
 *  stylesheets already own the global reset, and Tailwind's would fight them. */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
