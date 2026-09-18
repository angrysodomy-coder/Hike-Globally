import EmbeddedPostgres from 'embedded-postgres'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../.pgdata')
const port = parseInt(process.env.PG_PORT || '54329', 10)

export async function ensurePostgresRunning() {
  // Check if PostgreSQL is already reachable on this port
  try {
    const testClient = new pg.Client({
      host: '127.0.0.1',
      port,
      user: 'postgres',
      password: 'password',
      database: 'postgres',
      connectionTimeoutMillis: 1000,
    })
    await testClient.connect()
    console.log(`PostgreSQL is already running on port ${port}.`)
    const res = await testClient.query("SELECT 1 FROM pg_database WHERE datname = 'hikeglobally'")
    if (res.rows.length === 0) {
      await testClient.query('CREATE DATABASE hikeglobally')
      console.log('Database "hikeglobally" created.')
    }
    await testClient.end()
    return null
  } catch {
    // Port not reachable, continue to launch embedded instance
  }

  const pgInstance = new EmbeddedPostgres({
    port,
    databaseDir: dataDir,
    user: 'postgres',
    password: 'password',
  })

  if (!fs.existsSync(dataDir)) {
    console.log(`Initializing embedded PostgreSQL cluster in ${dataDir}...`)
    await pgInstance.initialise()
  }

  console.log(`Starting embedded PostgreSQL on port ${port}...`)
  await pgInstance.start()

  const setupClient = new pg.Client({
    host: '127.0.0.1',
    port,
    user: 'postgres',
    password: 'password',
    database: 'postgres',
  })
  await setupClient.connect()
  const dbCheck = await setupClient.query("SELECT 1 FROM pg_database WHERE datname = 'hikeglobally'")
  if (dbCheck.rows.length === 0) {
    await setupClient.query('CREATE DATABASE hikeglobally')
    console.log('Database "hikeglobally" created successfully.')
  }
  await setupClient.end()

  console.log(`PostgreSQL is ready! Connection URL: postgresql://postgres:password@127.0.0.1:${port}/hikeglobally`)
  return pgInstance
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensurePostgresRunning().then((instance) => {
    if (!instance) {
      console.log('Postgres is running in background. Process exiting.')
      return
    }
    console.log('Postgres server active. Press Ctrl+C to stop.')
    process.on('SIGINT', async () => {
      console.log('\nStopping PostgreSQL...')
      await instance.stop()
      process.exit(0)
    })
    process.on('SIGTERM', async () => {
      await instance.stop()
      process.exit(0)
    })
  }).catch((err) => {
    console.error('Failed to start PostgreSQL:', err)
    process.exit(1)
  })
}
