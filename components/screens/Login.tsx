"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export default function Login({ onLoggedIn, onCancel }: { onLoggedIn: () => void; onCancel: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const client = getSupabaseBrowserClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!client) {
      setError("Connexion indisponible pour l'instant.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Identifiants incorrects.");
      return;
    }
    onLoggedIn();
  }

  return (
    <div className="panel">
      <h3>Connexion</h3>
      <p style={{ fontSize: ".78rem", color: "var(--text-dim)", marginBottom: 12 }}>
        Utilisez votre compte Trounis existant (le même que sur les pronos et Cavity Game).
      </p>

      <form onSubmit={submit}>
        <label className="field-label">E-mail</label>
        <input className="text-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="field-label">Mot de passe</label>
        <input className="text-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={{ fontSize: ".78rem", color: "var(--danger)", marginTop: -6, marginBottom: 14 }}>{error}</p>}
        <div className="sheet-actions">
          <button className="btn btn--primary btn--sm" type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
          <button className="btn btn--ghost btn--sm" type="button" onClick={onCancel}>Annuler</button>
        </div>
      </form>

      <p style={{ fontSize: ".72rem", color: "var(--text-dim)", marginTop: 14, marginBottom: 0 }}>
        Pas encore de compte ? Les comptes se créent via une invitation sur trounis.fr.
      </p>
    </div>
  );
}
