import { insforgeDb } from './insforge';

/**
 * Compatibilidad: mismo `.from()` que Supabase, ahora sobre InsForge.
 */
export const supabase = {
  from(table: string) {
    return insforgeDb().from(table);
  },
};

export type { Database } from './database-types';
