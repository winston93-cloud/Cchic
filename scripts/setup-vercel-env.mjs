#!/usr/bin/env node
/** Configura variables InsForge en Vercel (proyecto cchic) sin imprimir secretos. */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, '.insforge/project.json'), 'utf8'))

const anonKey = execSync('npx @insforge/cli secrets get ANON_KEY', {
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

const removeLegacy = process.argv.includes('--remove-supabase')

function run(cmd, input) {
  execSync(cmd, {
    cwd: ROOT,
    input: input ?? undefined,
    stdio: input !== undefined ? ['pipe', 'pipe', 'pipe'] : ['inherit', 'pipe', 'pipe'],
    encoding: 'utf8',
  })
}

// Enlazar proyecto si hace falta
if (!fs.existsSync(path.join(ROOT, '.vercel/project.json'))) {
  run('npx vercel link --yes --project cchic')
  console.log('✓ Proyecto enlazado a cchic en Vercel')
}

for (const [name, value] of Object.entries(vars)) {
  for (const env of environments) {
    const sensitive = name.includes('KEY') ? ' --sensitive' : ''
    try {
      run(`npx vercel env add ${name} ${env} --yes --force${sensitive}`, value)
      console.log(`✓ ${name} → ${env}`)
    } catch (err) {
      const msg = err.stderr || err.message || String(err)
      console.error(`✗ ${name} → ${env}: ${msg.slice(0, 200)}`)
      process.exitCode = 1
    }
  }
}

console.log('\n✓ Variables InsForge configuradas en Vercel (cchic)')

if (removeLegacy) {
  for (const legacy of [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  ]) {
    for (const env of ['production', 'preview', 'development']) {
      try {
        run(`npx vercel env rm ${legacy} ${env} --yes`)
        console.log(`✓ Eliminada ${legacy} (${env})`)
      } catch {
        /* ya no existe en ese entorno */
      }
    }
  }
}
