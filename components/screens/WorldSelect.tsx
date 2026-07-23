"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { listCloudSlots, loadCloudSlot, saveCloudSlot, deleteCloudSlot, type SlotSummary } from "../../lib/supabase/saves";
import { createNewGame, type GameState } from "../../lib/game";
import Onboarding from "./Onboarding";

export default function WorldSelect({ userId, onEnter }: { userId: string; onEnter: (slot: number, state: GameState) => void }) {
  const [slots, setSlots] = useState<Array<SlotSummary | null> | null>(null);
  const [creatingSlot, setCreatingSlot] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    listCloudSlots(userId).then(setSlots);
  }, [userId]);

  async function resume(slot: number) {
    setBusy(slot);
    const state = await loadCloudSlot(userId, slot);
    setBusy(null);
    if (state) onEnter(slot, state);
  }

  async function createWorld(slot: number, worldName: string, clubCode: string) {
    const seed = `${worldName}-${clubCode}-${Date.now()}`;
    const state = createNewGame(worldName, clubCode, seed);
    setBusy(slot);
    await saveCloudSlot(userId, slot, state);
    setBusy(null);
    onEnter(slot, state);
  }

  async function remove(slot: number) {
    setBusy(slot);
    await deleteCloudSlot(userId, slot);
    setSlots(await listCloudSlots(userId));
    setBusy(null);
    setConfirmDelete(null);
  }

  async function logout() {
    await getSupabaseBrowserClient()?.auth.signOut();
  }

  if (creatingSlot !== null) {
    return <Onboarding onStart={(worldName, clubCode) => createWorld(creatingSlot, worldName, clubCode)} />;
  }

  if (!slots) {
    return (
      <section className="screen">
        <span className="eyebrow-label">Bureau des Entraîneurs — F.I.S.T.</span>
        <h1 className="screen-title">Vos mondes</h1>
        <p className="screen-sub">Chargement de vos sauvegardes…</p>
      </section>
    );
  }

  return (
    <section className="screen">
      <span className="eyebrow-label">Bureau des Entraîneurs — F.I.S.T.</span>
      <h1 className="screen-title">Vos mondes</h1>
      <p className="screen-sub">3 emplacements de sauvegarde, synchronisés en ligne sur votre compte.</p>

      <div className="panel" style={{ padding: "4px 15px" }}>
        {[1, 2, 3].map((slot) => {
          const info = slots[slot - 1];
          return (
            <div className="list-row" key={slot} style={{ cursor: "default" }}>
              <span className="list-row__body">
                <span className="list-row__title">Emplacement {slot}</span>
                <span className="list-row__meta">
                  {info ? `${info.worldName} — J${Math.min(info.journee, 18)}/18` : "Vide"}
                </span>
              </span>
              {confirmDelete === slot ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn--primary btn--sm" disabled={busy === slot} onClick={() => remove(slot)}>Confirmer</button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(null)}>Annuler</button>
                </div>
              ) : info ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn--primary btn--sm" disabled={busy === slot} onClick={() => resume(slot)}>Reprendre</button>
                  <button className="btn btn--ghost btn--sm" disabled={busy === slot} onClick={() => setConfirmDelete(slot)}>Suppr.</button>
                </div>
              ) : (
                <button className="btn btn--primary btn--sm" disabled={busy === slot} onClick={() => setCreatingSlot(slot)}>Nouveau monde</button>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn btn--ghost" onClick={logout}>Se déconnecter</button>
    </section>
  );
}
