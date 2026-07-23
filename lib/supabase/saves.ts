import { getSupabaseBrowserClient } from "./client";
import type { GameState } from "../game";

const TABLE = "manager_saves";

export type SlotSummary = {
  slot: number;
  worldName: string;
  clubCode: string;
  journee: number;
  updatedAt: string;
};

/** Liste les 3 emplacements de sauvegarde du compte (§22) — null pour un emplacement vide. */
export async function listCloudSlots(userId: string): Promise<Array<SlotSummary | null>> {
  const client = getSupabaseBrowserClient();
  const slots: Array<SlotSummary | null> = [null, null, null];
  if (!client) return slots;
  const { data, error } = await client
    .from(TABLE)
    .select("slot, world_name, state, updated_at")
    .eq("user_id", userId);
  if (error || !data) return slots;
  for (const row of data) {
    const idx = row.slot - 1;
    if (idx < 0 || idx > 2) continue;
    const state = row.state as GameState;
    slots[idx] = {
      slot: row.slot,
      worldName: row.world_name,
      clubCode: state.clubCode,
      journee: state.journee,
      updatedAt: row.updated_at,
    };
  }
  return slots;
}

export async function loadCloudSlot(userId: string, slot: number): Promise<GameState | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data, error } = await client
    .from(TABLE)
    .select("state")
    .eq("user_id", userId)
    .eq("slot", slot)
    .maybeSingle();
  if (error || !data) return null;
  return data.state as GameState;
}

export async function saveCloudSlot(userId: string, slot: number, state: GameState): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;
  const { error } = await client.from(TABLE).upsert(
    {
      user_id: userId,
      slot,
      world_name: state.worldName,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,slot" }
  );
  return !error;
}

export async function deleteCloudSlot(userId: string, slot: number): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;
  const { error } = await client.from(TABLE).delete().eq("user_id", userId).eq("slot", slot);
  return !error;
}
