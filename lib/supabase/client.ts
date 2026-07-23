"use client";

import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Client Supabase navigateur — même projet que le reste de l'écosystème
 * (nvorxeszcugbzozkxibs), pour que les comptes Trounis Prono servent aussi
 * à se connecter à Trounis Manager (§10/§22 du plan : « même compte »).
 * Retourne null si les variables d'env ne sont pas configurées (dev sans
 * .env.local, ou build sans persistance) plutôt que de planter l'app.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  browserClient ??= createBrowserClient(url, key);
  return browserClient;
}
