"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/app";

  useEffect(() => {
    const saved = localStorage.getItem("tablemate_dark");
    if (saved === "1") setDark(true);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("tablemate_dark", String(next ? "1" : "0"));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirectTo);
    }
  };

  const handleGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    });
  };

  const bg = dark ? "#1A1718" : "#FDFBF8";
  const card = dark ? "#2A2328" : "#FFFFFF";
  const border = dark ? "#3D3538" : "#EDE8E0";
  const textPrimary = dark ? "#F5F0EB" : "#2A2328";
  const textSecondary = dark ? "#A89FA6" : "#6B6068";
  const inputBg = dark ? "#1A1718" : "#FFFFFF";
  const inputBorder = dark ? "#4D4548" : "#DDD7D0";
  const dividerColor = dark ? "#3D3538" : "#EDE8E0";

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1rem", transition: "background 0.2s" }}>
      {/* Dark mode toggle */}
      <button onClick={toggleDark} style={{ position: "fixed", top: "1rem", right: "1rem", background: dark ? "#3D3538" : "#EDE8E0", border: "none", borderRadius: "50%", width: 38, height: 38, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {dark ? "☀️" : "🌙"}
      </button>

      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, textDecoration: "none" }}>
            <span style={{ color: "#C9956E", fontSize: 20 }}>♥</span>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 600, color: textPrimary }}>TableMate</span>
          </Link>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: textPrimary, margin: 0 }}>Welcome back</h1>
          <p style={{ color: textSecondary, fontSize: 14, marginTop: 4 }}>Sign in to continue planning</p>
        </div>

        <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <button onClick={handleGoogle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 0", border: `1px solid ${inputBorder}`, borderRadius: 8, fontSize: 14, fontWeight: 500, color: textPrimary, background: inputBg, cursor: "pointer", marginBottom: 24, transition: "background 0.2s" }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div style={{ position: "relative", marginBottom: 24, textAlign: "center" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: `1px solid ${dividerColor}` }} />
            <span style={{ position: "relative", background: card, padding: "0 12px", fontSize: 12, color: textSecondary }}>or</span>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <div style={{ padding: 12, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 14, color: "#b91c1c" }}>{error}</div>}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: textPrimary, marginBottom: 4 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                style={{ width: "100%", padding: "10px 12px", border: `1px solid ${inputBorder}`, borderRadius: 8, fontSize: 14, background: inputBg, color: textPrimary, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: textPrimary, marginBottom: 4 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                style={{ width: "100%", padding: "10px 12px", border: `1px solid ${inputBorder}`, borderRadius: 8, fontSize: 14, background: inputBg, color: textPrimary, outline: "none", boxSizing: "border-box" }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px 0", background: "#C9956E", color: "#fff", fontWeight: 600, fontSize: 14, border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "background 0.2s" }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 14, color: textSecondary, marginTop: 24, marginBottom: 0 }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "#C9956E", fontWeight: 500, textDecoration: "none" }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
