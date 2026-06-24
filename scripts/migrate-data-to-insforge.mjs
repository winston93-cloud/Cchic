#!/usr/bin/env node
/**
 * Copia datos de Supabase (cChic legacy) → InsForge Caja Chica.
 * Uso: node scripts/migrate-data-to-insforge.mjs
 */
import { createAdminClient } from '@insforge/sdk'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return out
}

const env = { ...loadEnvFile(path.join(ROOT, '.env.local')) }
const project = JSON.parse(fs.readFileSync(path.join(ROOT, '.insforge/project.json'), 'utf8'))

const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
const INSFORGE_URL = project.oss_host
const INSFORGE_KEY = project.api_key

if (!SUPA_URL || !SUPA_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const TABLES = [
  'categories',
  'persons',
  'executors',
  'subcategories',
  'funds',
  'custom_periods',
  'person_categories',
  'expenses',
]

async function countInsforge(table) {
  const { count, error } = await insforge.database
    .from(table)
    .select('id', { count: 'exact', head: true })
  if (error) return 0
  return count ?? 0
}

async function fetchSupabase(table) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?select=*&order=id`, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
    },
  })
  if (!res.ok) {
    throw new Error(`Supabase ${table}: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

const insforge = createAdminClient({
  baseUrl: INSFORGE_URL,
  apiKey: INSFORGE_KEY,
})

async function insertInsforge(table, rows) {
  if (!rows.length) {
    console.log(`  ${table}: 0 filas (omitido)`)
    return
  }
  const { error } = await insforge.database.from(table).insert(rows)
  if (error) {
    throw new Error(`InsForge ${table}: ${error.message ?? JSON.stringify(error)}`)
  }
  console.log(`  ${table}: ${rows.length} filas`)
}

function resetSequences() {
  const tables = [
    'categories',
    'persons',
    'executors',
    'subcategories',
    'funds',
    'custom_periods',
    'person_categories',
    'expenses',
  ]
  for (const table of tables) {
    const sql = `SELECT setval(pg_get_serial_sequence('public.${table}', 'id'), COALESCE((SELECT MAX(id) FROM public.${table}), 1));`
    execSync(`npx @insforge/cli db query ${JSON.stringify(sql)}`, {
      cwd: ROOT,
      stdio: 'pipe',
    })
  }
}

async function main() {
  console.log('Migrando datos Supabase → InsForge Caja Chica...\n')

  for (const table of TABLES) {
    const existing = await countInsforge(table)
    if (existing > 0) {
      console.log(`  ${table}: ${existing} filas ya en InsForge (omitido)`)
      continue
    }
    const rows = await fetchSupabase(table)
    await insertInsforge(table, rows)
  }

  console.log('\nAjustando secuencias SERIAL...')
  await resetSequences()

  console.log('\n✓ Migración de datos completada')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
