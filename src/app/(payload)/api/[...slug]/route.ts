import config from '@payload-config'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'
import { allowSameOriginPayloadRequest } from '@/lib/allowSameOriginPayloadRequest'

type RouteArgs = { params: Promise<{ slug?: string[] }> }
type PayloadHandler = (request: Request, args: RouteArgs) => Promise<Response>

/**
 * Preserve Payload's CSRF protection while allowing authenticated admin writes
 * from the deployment's actual host (including custom-domain aliases).
 */
const sameOrigin = (handler: PayloadHandler): PayloadHandler => (request, args) =>
  handler(allowSameOriginPayloadRequest(request), args)

export const GET = sameOrigin(REST_GET(config))
export const POST = sameOrigin(REST_POST(config))
export const DELETE = sameOrigin(REST_DELETE(config))
export const PATCH = sameOrigin(REST_PATCH(config))
export const PUT = sameOrigin(REST_PUT(config))
export const OPTIONS = sameOrigin(REST_OPTIONS(config))
