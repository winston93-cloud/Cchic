#!/usr/bin/env node
/**
 * Apunta Cchic (Monitoreo y Control) a Winston Servicios (g4ta4bfg).
 * Tras cutover Caja Chica NANO → Winston.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WINSTON_ID = '1a769c0a-ab1b-4500-bb6b-1e8bb131980b'
const envPath = path.join(ROOT, '.env.local')

execSync(`npx -y @insforge/cli link --project-id ${WINSTON_ID} -y`, {
  cwd: ROOT,
  stdio: 'inherit',
})

const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, '.insforge/project.json'), 'utf8'))
if (!String(cfg.oss_host || '').includes('g4ta4bfg')) {
  console.error('✗ Link no quedó en Winston (g4ta4bfg)')
  process.exit(1)
}

const anonKey = execSync('npx -y @insforge/cli secrets get ANON_KEY', {
  cwd: ROOT,
  encoding: 'utf8',
})
  .trim()
  .replace(/^ANON_KEY\s*=\s*/i, '')

const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split('\n') : []
const map = new Map()
for (const line of lines) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  map.set(t.slice(0, i).trim(), t.slice(i + 1).trim())
}

map.set('NEXT_PUBLIC_INSFORGE_URL', cfg.oss_host)
map.set('NEXT_PUBLIC_INSFORGE_ANON_KEY', anonKey)
map.set('INSFORGE_API_KEY', cfg.api_key)

const out = [
  '# Winston Servicios — Caja Chica / Monitoreo y Control (cutover 2026-09-18)',
  `NEXT_PUBLIC_INSFORGE_URL=${map.get('NEXT_PUBLIC_INSFORGE_URL')}`,
  `NEXT_PUBLIC_INSFORGE_ANON_KEY=${map.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')}`,
  `INSFORGE_API_KEY=${map.get('INSFORGE_API_KEY')}`,
  '',
]

if (map.has('NEXT_PUBLIC_SUPABASE_URL')) {
  out.push('# Supabase legacy (opcional)')
  out.push(`NEXT_PUBLIC_SUPABASE_URL=${map.get('NEXT_PUBLIC_SUPABASE_URL')}`)
}
if (map.has('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY')) {
  out.push(`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=${map.get('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY')}`)
}

fs.writeFileSync(envPath, out.join('\n') + '\n')
console.log('✓ Cchic .env.local → Winston Servicios (g4ta4bfg)')
