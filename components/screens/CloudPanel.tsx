"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { listCloudSlots, loadCloudSlot, saveCloudSlot, deleteCloudSlot, type SlotSummary } from "../../lib/supabase/saves";
import type { GameState } from "../../lib/game";
import Login from "./Login";

export default function CloudPanel({
  game,
  onLoadGame,
  toast,
}: {
  game: GameState | null;
  onLoadGame: (state: GameState) => void;
  toast: (msg: string) => void;
}) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined); // undefined = pas encore vérifié
  const [showLogin, setShowLogin] = useState(false);
  const [slots, setSlots] = useState<Array<SlotSummary | null>>([null, null, null]);
  const [busySlot, setBusySlot] = useState<number | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setUserId(null);
      return;
    }
    client.auth.getSession().then(({ data }: { data: { session: Session | null } }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = client.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUserId(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) listCloudSlots(userId).then(setSlots);
  }, [userId]);

  async function refresh() {
    if (userId) setSlots(await listCloudSlots(userId));
  }

  async function handleSave(slot: number) {
    if (!userId || !game) return;
    setBusySlot(slot);
    const ok = await saveCloudSlot(userId, slot, game);
    setBusySlot(null);
    toast(ok ? `Monde sauvegardé dans l'emplacement ${slot}.` : "Échec de la sauvegarde en ligne.");
    if (ok) refresh();
  }

  async function handleLoad(slot: number) {
    if (!userId) return;
    setBusySlot(slot);
    const state = await loadCloudSlot(userId, slot);
    setBusySlot(null);
    if (state) {
      onLoadGame(state);
      toast(`Monde de l'emplacement ${slot} chargé.`);
    } else {
      toast("Impossible de charger cet emplacement.");
    }
  }

  async function handleDelete(slot: number) {
    if (!userId) return;
    setBusySlot(slot);
    await deleteCloudSlot(userId, slot);
    setBusySlot(null);
    refresh();
  }

  async function logout() {
    await getSupabaseBrowserClient()?.auth.signOut();
  }

  if (userId === undefined) {
    return (
      <div className="panel">
        <h3>Sauvegarde en ligne</h3>
        <p style={{ fontSize: ".78rem", color: "var(--text-dim)", margin: 0 }}>Vérification de la connexion…</p>
      </div>
    );
  }

  if (!userId) {
    if (showLogin) {
      return <Login onLoggedIn={() => setShowLogin(false)} onCancel={() => setShowLogin(false)} />;
    }
    return (
      <div className="panel">
        <h3>Sauvegarde en ligne</h3>
        <p style={{ fontSize: ".78rem", color: "var(--text-dim)", marginBottom: 12 }}>
          Connectez-vous avec votre compte Trounis pour sauvegarder jusqu'à 3 mondes en ligne et les
          reprendre sur n'importe quel appareil.
        </p>
        <button className="btn btn--ghost" onClick={() => setShowLogin(true)}>Se connecter</button>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="row" style={{ marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}>Sauvegarde en ligne</h3>
        <button className="btn btn--ghost btn--sm" onClick={logout}>Se déconnecter</button>
      </div>
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
            <div style={{ display: "flex", gap: 6 }}>
              {game && (
                <button className="btn btn--ghost btn--sm" disabled={busySlot === slot} onClick={() => handleSave(slot)}>
                  Sauvegarder
                </button>
              )}
              {info && (
                <button className="btn btn--ghost btn--sm" disabled={busySlot === slot} onClick={() => handleLoad(slot)}>
                  Charger
                </button>
              )}
              {info && (
                <button className="btn btn--ghost btn--sm" disabled={busySlot === slot} onClick={() => handleDelete(slot)}>
                  Suppr.
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
