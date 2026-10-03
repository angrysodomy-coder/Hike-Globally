#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Local development Postgres
   ---------------------------------------------------------------------------
   Payload is configured with the node-postgres adapter, which needs a real
   Postgres server. This script boots a throwaway one from the
   `embedded-postgres` npm package (binaries ship in the package, so there is
   nothing to install system-wide) and keeps it running in the foreground.

       npm run db:dev        # terminal 1
       npm run dev           # terminal 2

   Data lives in `.pgdata/` (git-ignored). Delete that folder for a clean slate.
   Production is unaffected: point POSTGRES_URL at Neon/Vercel Postgres and the
   same adapter is used.
--------------------------------------------------------------------------- */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import EmbeddedPostgres from 'embedded-postgres'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const databaseDir = path.join(root, '.pgdata')

const user = process.env.DEV_PG_USER || 'payload'
const password = process.env.DEV_PG_PASSWORD || 'payload'
const port = Number(process.env.DEV_PG_PORT || 5433)
const database = process.env.DEV_PG_DATABASE || 'hike_globally'

const pg = new EmbeddedPostgres({
  databaseDir,
  user,
  password,
  port,
  persistent: true,
  onError: (message) => process.stderr.write(String(message)),
  onLog: () => {},
})

const firstRun = !existsSync(databaseDir)
if (firstRun) {
  console.log('[db] initialising a fresh cluster in .pgdata …')
  await pg.initialise()
}

await pg.start()

try {
  await pg.createDatabase(database)
  console.log(`[db] created database "${database}"`)
} catch {
  /* already exists — fine */
}

const url = `postgres://${user}:${password}@127.0.0.1:${port}/${database}`
console.log(`[db] ready → ${url}`)
console.log('[db] .env.example defaults to this URL — if you have not yet, run:')
console.log('[db]   cp .env.example .env.local')

const shutdown = async (signal) => {
  console.log(`\n[db] ${signal} — stopping Postgres …`)
  try {
    await pg.stop()
  } finally {
    process.exit(0)
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

// Keep the process alive.
setInterval(() => {}, 1 << 30)
