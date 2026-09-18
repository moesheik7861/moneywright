import { defineConfig } from 'drizzle-kit'

const DATABASE_URL = process.env.DATABASE_URL
const isPostgres = !!DATABASE_URL

export default defineConfig(
  isPostgres
    ? {
        dialect: 'postgresql',
        schema: './src/db/schema.pg.ts',
        out: './drizzle/pg',
        dbCredentials: {
          url: DATABASE_URL!,
        },
      }
    : {
        dialect: 'sqlite',
        schema: './src/db/schema.sqlite.ts',
        out: './drizzle/sqlite',
        dbCredentials: {
          // drizzle-kit runs with apps/api as its working directory.
          // Keep dev SQLite aligned with the API's project-local database.
          url: process.env.SQLITE_PATH || '../../data/app.db',
        },
      }
)
