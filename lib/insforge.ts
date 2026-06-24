import { createClient, type InsForgeClient } from '@insforge/sdk';

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL ?? '';
const anonKey =
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ??
  process.env.NEXT_PUBLIC_INSFORGE_ADMIN_TOKEN ??
  '';

if (!baseUrl || !anonKey) {
  console.error(
    'Missing InsForge env: NEXT_PUBLIC_INSFORGE_URL y NEXT_PUBLIC_INSFORGE_ANON_KEY'
  );
}

export const insforgeBrowser: InsForgeClient = createClient({
  baseUrl: baseUrl || 'https://placeholder.insforge.app',
  anonKey: anonKey || 'placeholder-key',
});

export function insforgeDb() {
  return insforgeBrowser.database;
}
