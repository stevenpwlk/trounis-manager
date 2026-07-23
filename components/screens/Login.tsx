"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export default function Login({ onLoggedIn }: { onLoggedIn: () => void }) {
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
    <section className="screen">
      <span className="eyebrow-label">Bureau des Entraîneurs — F.I.S.T.</span>
      <h1 className="screen-title">Connexion</h1>
      <p className="screen-sub">
        Trounis Manager vit désormais entièrement en ligne — connectez-vous avec votre compte
        Trounis existant (le même que sur les pronos et Cavity Game) pour accéder à vos mondes.
      </p>

      <form onSubmit={submit}>
        <label className="field-label">E-mail</label>
        <input className="text-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="field-label">Mot de passe</label>
        <input className="text-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={{ fontSize: ".78rem", color: "var(--danger)", marginTop: -6, marginBottom: 14 }}>{error}</p>}
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="panel" style={{ marginTop: 16 }}>
        <p style={{ fontSize: ".78rem", color: "var(--text-dim)", margin: 0 }}>
          Pas encore de compte ? Les comptes se créent via une invitation sur trounis.fr — Trounis
          Manager réutilise le même Bureau des identités que le reste de l'écosystème.
        </p>
      </div>
    </section>
  );
}
