import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'
import { allowSameOriginPayloadRequest } from '@/lib/allowSameOriginPayloadRequest'

type RouteArgs = { params: Promise<{ slug?: string[] }> }
type PayloadHandler = (request: Request, args: RouteArgs) => Promise<Response>

const sameOrigin = (handler: PayloadHandler): PayloadHandler => (request, args) =>
  handler(allowSameOriginPayloadRequest(request), args)

export const POST = sameOrigin(GRAPHQL_POST(config))
export const OPTIONS = sameOrigin(REST_OPTIONS(config))
