const DEFAULT_URL = 'http://localhost:3000'

function getEnv(key) {
  if (typeof globalThis !== 'undefined' && globalThis.process && globalThis.process.env && globalThis.process.env[key]) {
    return globalThis.process.env[key]
  }
  try {
    // Dynamic access avoids esbuild cjs bundle warnings
    const metaEnv = new Function('try { return import.meta.env } catch(e) { return null }')()
    if (metaEnv && metaEnv[key]) return metaEnv[key]
  } catch {
    // fallback
  }
  return ''
}

export function getPayloadBaseUrl() {
  const envUrl = getEnv('VITE_PAYLOAD_URL')
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin
  }
  return DEFAULT_URL
}

const memoryCache = new Map()
const CACHE_TTL_MS = 60 * 1000 // 1 minute in-memory cache

/**
 * Universal JSON fetcher for Payload CMS REST API.
 * Includes query serialization, timeout handling, and in-memory caching.
 *
 * @param {string} endpoint - API path (e.g. '/api/trips')
 * @param {Object} [options={}] - Fetch and query options
 * @param {Object} [options.params] - URL search params (e.g. where, depth, sort)
 * @param {boolean} [options.skipCache=false] - Force fresh network request
 * @param {number} [options.timeout=6000] - Timeout in milliseconds
 * @returns {Promise<{ data: any, error: Error|null, fromCache: boolean }>}
 */
export async function payloadFetch(endpoint, { params = {}, skipCache = false, timeout = 6000 } = {}) {
  // In the jsdom test runner, avoid async network calls
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'hike.example') {
    return { data: null, error: null, fromCache: false }
  }

  const baseUrl = getPayloadBaseUrl()
  const url = new URL(endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`)

  // Serialize params
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      if (typeof val === 'object') {
        serializeNestedParams(url.searchParams, key, val)
      } else {
        url.searchParams.set(key, String(val))
      }
    }
  })

  const cacheKey = url.toString()

  if (!skipCache && memoryCache.has(cacheKey)) {
    const entry = memoryCache.get(cacheKey)
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return { data: entry.data, error: null, fromCache: true }
    }
    memoryCache.delete(cacheKey)
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeout) : null

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller?.signal,
    })

    if (timer) clearTimeout(timer)

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      const error = new Error(`Payload API returned HTTP ${res.status}: ${res.statusText}`)
      error.status = res.status
      error.details = errorText
      return { data: null, error, fromCache: false }
    }

    const data = await res.json()
    memoryCache.set(cacheKey, { data, timestamp: Date.now() })
    return { data, error: null, fromCache: false }
  } catch (err) {
    if (timer) clearTimeout(timer)
    return { data: null, error: err, fromCache: false }
  }
}

function serializeNestedParams(searchParams, prefix, obj) {
  Object.entries(obj).forEach(([subKey, subVal]) => {
    const fullKey = `${prefix}[${subKey}]`
    if (subVal !== null && typeof subVal === 'object') {
      serializeNestedParams(searchParams, fullKey, subVal)
    } else if (subVal !== undefined && subVal !== null) {
      searchParams.set(fullKey, String(subVal))
    }
  })
}

/**
 * Clears the in-memory cache.
 */
export function clearPayloadCache() {
  memoryCache.clear()
}
