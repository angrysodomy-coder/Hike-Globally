/**
 * Throwaway PostgreSQL for local verification.
 *
 * Not part of the app and not referenced by any npm script — it exists so the
 * integration steps can be checked against a REAL database (schema push,
 * enum creation, index creation, table-name limits) rather than only a
 * typecheck. Step 3 used the same approach.
 *
 *   node scripts/dev-postgres.mjs        # starts on 55432 and stays up
 */
import EmbeddedPostgres from 'embedded-postgres'

const pg = new EmbeddedPostgres({
  databaseDir: './.tmp-pgdata',
  user: 'postgres',
  password: 'postgres',
  port: 55432,
  persistent: true,
})

const exists = await import('node:fs').then(({ existsSync }) => existsSync('./.tmp-pgdata'))

if (!exists) {
  console.log('initialising cluster…')
  await pg.initialise()
}

await pg.start()
console.log('postgres up on 55432')

try {
  await pg.createDatabase('hikeglobally')
  console.log('created database hikeglobally')
} catch {
  console.log('database hikeglobally already exists')
}

const shutdown = async () => {
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Keep the process alive.
setInterval(() => {}, 1 << 30)
