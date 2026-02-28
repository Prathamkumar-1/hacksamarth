import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const { login, register, connectWallet } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "login");
  const [role, setRole] = useState(params.get("role") || "user");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", walletAddress: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "register" && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const user = await login(form.email, form.password);
        navigate(user.role === "ngo" ? "/ngo-dashboard" : "/dashboard");
      } else {
        const user = await register({ ...form, role });
        navigate(user.role === "ngo" ? "/ngo-dashboard" : "/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAndSign = async () => {
    try {
      const address = await connectWallet();
      setForm(f => ({ ...f, walletAddress: address }));
      toast.success("Wallet connected!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "120px 24px 40px", position: "relative", overflow: "hidden",
    }}>
      {/* Background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse at 30% 50%, rgba(16,185,129,0.05) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(212,168,67,0.04) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: 480, position: "relative", zIndex: 1,
        animation: "fadeUp 0.5s ease both",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: "linear-gradient(135deg, var(--emerald), var(--gold))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, color: "#000",
            }}>◈</div>
            <span style={{ fontFamily: "Cormorant Garamond", fontSize: 26, fontWeight: 700 }}>
              Chain<span className="text-gradient">Give</span>
            </span>
          </Link>
        </div>

        <div className="card" style={{ padding: 40 }}>
          {/* Mode toggle */}
          <div style={{
            display: "flex", background: "var(--surface2)", borderRadius: 12,
            padding: 4, marginBottom: 32,
          }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "10px 0", borderRadius: 9,
                background: mode === m ? "var(--surface3)" : "transparent",
                border: "none", color: mode === m ? "var(--text)" : "var(--text-dim)",
                fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                fontFamily: "DM Sans", textTransform: "capitalize",
              }}>{m}</button>
            ))}
          </div>

          {/* Role selector (register only) */}
          {mode === "register" && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                I am a...
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { value: "user", label: "🤝 Donor", desc: "I want to donate" },
                  { value: "ngo", label: "🏛 NGO", desc: "I represent an NGO" },
                ].map(r => (
                  <button key={r.value} onClick={() => setRole(r.value)} style={{
                    padding: "14px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                    background: role === r.value ? "var(--emerald-glow)" : "var(--surface2)",
                    border: `1px solid ${role === r.value ? "var(--emerald)" : "var(--border)"}`,
                    transition: "all 0.2s",
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <div>
                <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Name</label>
                <input className="input-field" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your full name" />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
              <input className="input-field" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
              <input className="input-field" type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirm Password</label>
                  <input className="input-field" type="password" required value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} placeholder="••••••••" />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Wallet Address</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input className="input-field" value={form.walletAddress} onChange={e => setForm({...form, walletAddress: e.target.value})} placeholder="0x..." style={{ fontFamily: "DM Mono", fontSize: 13, flex: 1 }} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={handleConnectAndSign} style={{ whiteSpace: "nowrap" }}>
                      Connect ⬡
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", marginTop: 8 }}
              disabled={loading}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0", color: "var(--text-muted)", fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            OR
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={handleConnectAndSign}>
            <span style={{ fontSize: 18 }}>⬡</span> Continue with MetaMask
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "var(--text-muted)" }}>
          🔒 Your private key never leaves your device
        </div>
      </div>
    </div>
  );
};

export default Login;
