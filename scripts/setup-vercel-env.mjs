#!/usr/bin/env node
/**
 * Cutover Cchic → Winston en Vercel. Lee .env.local / .insforge (no imprime secrets).
 * Exige que el link CLI sea g4ta4bfg.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, '.insforge/project.json'), 'utf8'))

if (!String(cfg.oss_host || '').includes('g4ta4bfg')) {
  console.error('✗ .insforge no apunta a Winston. Corre: node scripts/setup-insforge-env.mjs')
  process.exit(1)
}

const anonKey = execSync('npx -y @insforge/cli secrets get ANON_KEY', {
  cwd: ROOT,
  encoding: 'utf8',
})
  .trim()
  .replace(/^ANON_KEY\s*=\s*/i, '')

const vars = {
  NEXT_PUBLIC_INSFORGE_URL: cfg.oss_host,
  NEXT_PUBLIC_INSFORGE_ANON_KEY: anonKey,
  INSFORGE_API_KEY: cfg.api_key,
}

const environments = process.argv.includes('--dev-only')
  ? ['development']
  : ['production', 'preview', 'development']

function run(cmd, input) {
  execSync(cmd, {
    cwd: ROOT,
    input: input ?? undefined,
    stdio: input !== undefined ? ['pipe', 'pipe', 'pipe'] : ['inherit', 'pipe', 'pipe'],
    encoding: 'utf8',
  })
}

if (!fs.existsSync(path.join(ROOT, '.vercel/project.json'))) {
  run('npx -y vercel link --yes --project cchic')
  console.log('✓ Enlazado a Vercel project cchic')
}

let ok = 0
let fail = 0
for (const [name, value] of Object.entries(vars)) {
  for (const env of environments) {
    const sensitive = name.includes('KEY') ? ' --sensitive' : ''
    try {
      run(`npx -y vercel env add ${name} ${env} --yes --force${sensitive}`, value)
      console.log(`✓ ${name} → ${env}`)
      ok++
    } catch (err) {
      const msg = err.stderr || err.message || String(err)
      console.error(`✗ ${name} → ${env}: ${String(msg).slice(0, 200)}`)
      fail++
    }
  }
}

console.log(`\nHecho: ${ok} ok, ${fail} fail`)
if (fail) process.exitCode = 1

try {
  run('npx -y vercel --prod --yes')
  console.log('✓ Deploy producción disparado')
} catch (err) {
  console.error('✗ Deploy:', String(err.stderr || err.message || err).slice(0, 300))
  process.exitCode = 1
}
