import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { projectsAPI } from "../utils/api";
import ProjectCard from "../components/ProjectCard";

// Blockchain Network Background Animation
const BlockchainCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const nodes = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 150) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(16,185,129,${0.12 * (1 - d / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16,185,129,0.5)`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none",
    }} />
  );
};

const StatCard = ({ value, label, delay }) => (
  <div style={{
    textAlign: "center", animation: `fadeUp 0.6s ease ${delay}s both`,
  }}>
    <div style={{
      fontFamily: "Cormorant Garamond", fontSize: 48, fontWeight: 700,
      background: "linear-gradient(135deg, var(--emerald), var(--gold))",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      lineHeight: 1,
    }}>{value}</div>
    <div style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
      {label}
    </div>
  </div>
);

const FeatureCard = ({ icon, title, desc, index }) => (
  <div className="card" style={{
    padding: 28, animation: `fadeUp 0.6s ease ${0.1 * index}s both`,
    borderTop: "2px solid transparent",
    backgroundImage: "linear-gradient(var(--surface), var(--surface)), linear-gradient(135deg, var(--emerald), var(--gold))",
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 14,
      background: "var(--surface2)", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 22, marginBottom: 16,
    }}>{icon}</div>
    <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 22, marginBottom: 10 }}>{title}</h3>
    <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
  </div>
);

const Home = () => {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsAPI.getAll({ limit: 3, sort: "-donorCount" })
      .then(res => setFeaturedProjects(res.data.projects || []))
      .catch(() => setFeaturedProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const features = [
    { icon: "⛓", title: "Immutable on Blockchain", desc: "Every donation, transaction, and fund release is permanently recorded on-chain. No data can be altered or deleted." },
    { icon: "🔍", title: "Full Transparency", desc: "Track exactly where funds go. NGOs must submit milestone proof before any funds are released." },
    { icon: "🛡", title: "Multi-Sig Fund Control", desc: "Funds are held in smart contracts and only released after auditor approval — protecting donors from misuse." },
    { icon: "⭐", title: "NGO Reputation System", desc: "Each NGO builds a reputation score based on verified milestone completion and transparent reporting." },
    { icon: "↩", title: "Refund Protection", desc: "If a project is flagged or suspended, donors can automatically claim refunds directly from the smart contract." },
    { icon: "🔐", title: "Wallet Authentication", desc: "Sign in with your Ethereum wallet. Your private key never leaves your device." },
  ];

  const steps = [
    { n: "01", role: "NGO", title: "Register & Get Verified", desc: "NGOs submit official documents for on-chain verification before listing projects." },
    { n: "02", role: "NGO", title: "Create Project with Milestones", desc: "Detail how funds will be used with a clear milestone breakdown stored on IPFS." },
    { n: "03", role: "User", title: "Browse & Donate", desc: "Users explore verified projects and donate any amount via MetaMask or WalletConnect." },
    { n: "04", role: "NGO", title: "Submit Proof of Progress", desc: "As milestones are completed, NGOs upload proof (receipts, photos, reports) to IPFS." },
    { n: "05", role: "Auditor", title: "Review & Release Funds", desc: "Our multi-sig auditors verify the proof and approve fund releases to the NGO." },
  ];

  return (
    <div>
      {/* Hero */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        position: "relative", overflow: "hidden",
      }}>
        <BlockchainCanvas />

        {/* Gradient orbs */}
        <div style={{
          position: "absolute", width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          top: "20%", left: "-10%", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)",
          bottom: "10%", right: "5%", pointerEvents: "none",
        }} />

        <div className="container" style={{ position: "relative", zIndex: 1, paddingTop: 120, paddingBottom: 80 }}>
          <div style={{ maxWidth: 760 }}>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 100, padding: "6px 16px", marginBottom: 32,
              animation: "fadeUp 0.5s ease 0.1s both",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald)", animation: "pulse-glow 2s infinite" }} />
              <span style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Blockchain-Powered Donations
              </span>
            </div>

            <h1 style={{
              fontFamily: "Cormorant Garamond", fontSize: "clamp(52px, 7vw, 96px)",
              fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em",
              marginBottom: 24, animation: "fadeUp 0.6s ease 0.2s both",
            }}>
              Give With{" "}
              <span style={{
                background: "linear-gradient(135deg, var(--emerald) 0%, var(--gold) 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Certainty.
              </span>
              <br />Not Faith.
            </h1>

            <p style={{
              fontSize: 18, color: "var(--text-dim)", lineHeight: 1.8,
              maxWidth: 540, marginBottom: 40,
              animation: "fadeUp 0.6s ease 0.3s both",
            }}>
              Every donation tracked on-chain. Every rupee spent with proof. Powered by smart contracts that protect donors and hold NGOs accountable.
            </p>

            <div style={{
              display: "flex", gap: 16, flexWrap: "wrap",
              animation: "fadeUp 0.6s ease 0.4s both",
            }}>
              <Link to="/projects" className="btn btn-primary btn-lg">
                Explore Projects →
              </Link>
              <Link to="/register?role=ngo" className="btn btn-ghost btn-lg">
                Register as NGO
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32,
            marginTop: 80, paddingTop: 48,
            borderTop: "1px solid var(--border)",
            animation: "fadeUp 0.6s ease 0.5s both",
          }}>
            <StatCard value="₿ 142 ETH" label="Total Donated" delay={0.5} />
            <StatCard value="38" label="Active Projects" delay={0.6} />
            <StatCard value="1,240" label="Donors" delay={0.7} />
            <StatCard value="94%" label="Fund Utilization" delay={0.8} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ background: "var(--void)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 52, fontWeight: 700, marginBottom: 16 }}>
              Why ChainGive?
            </h2>
            <p style={{ color: "var(--text-dim)", maxWidth: 520, margin: "0 auto", fontSize: 15, lineHeight: 1.7 }}>
              We built the infrastructure for trustless philanthropy — where every commitment is code, not promises.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {features.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="section">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
            <div>
              <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 48, fontWeight: 700 }}>
                Active Projects
              </h2>
              <p style={{ color: "var(--text-dim)", marginTop: 8 }}>Verified causes making a real impact</p>
            </div>
            <Link to="/projects" className="btn btn-ghost">View All →</Link>
          </div>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {[1,2,3].map(i => (
                <div key={i} className="card" style={{ height: 420, background: "var(--surface2)" }}>
                  <div style={{
                    height: "100%", background: "linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%)",
                    backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
                    borderRadius: "var(--radius-lg)",
                  }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {featuredProjects.map((p, i) => <ProjectCard key={p._id} project={p} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="section" style={{ background: "var(--void)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 52, fontWeight: 700 }}>How It Works</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
            {/* vertical line */}
            <div style={{
              position: "absolute", left: 32, top: 40, bottom: 40, width: 1,
              background: "linear-gradient(to bottom, var(--emerald), var(--gold))",
              opacity: 0.3,
            }} />
            {steps.map((step, i) => (
              <div key={i} style={{
                display: "flex", gap: 32, alignItems: "flex-start",
                padding: "28px 0", animation: `fadeUp 0.5s ease ${i * 0.1}s both`,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
                  background: i % 2 === 0 ? "var(--emerald-glow)" : "var(--gold-glow)",
                  border: `2px solid ${i % 2 === 0 ? "var(--emerald)" : "var(--gold)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "DM Mono", fontSize: 13, fontWeight: 600,
                  color: i % 2 === 0 ? "var(--emerald)" : "var(--gold)",
                }}>
                  {step.n}
                </div>
                <div style={{ flex: 1, paddingTop: 12 }}>
                  <span className={`badge ${step.role === "NGO" ? "badge-active" : step.role === "Auditor" ? "badge-completed" : "badge-pending"}`} style={{ marginBottom: 10 }}>
                    {step.role}
                  </span>
                  <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
                    {step.title}
                  </h3>
                  <p style={{ color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 520 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "100px 0", position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(212,168,67,0.05) 100%)",
        borderTop: "1px solid var(--border)",
      }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{
            fontFamily: "Cormorant Garamond", fontSize: "clamp(40px, 5vw, 72px)",
            fontWeight: 700, marginBottom: 20,
            animation: "fadeUp 0.6s ease both",
          }}>
            Ready to Make an<br />
            <span className="text-gradient">Impact That Lasts?</span>
          </h2>
          <p style={{ color: "var(--text-dim)", fontSize: 16, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
            Join thousands of donors who trust blockchain to ensure their generosity reaches the right hands.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <Link to="/projects" className="btn btn-primary btn-lg">Start Donating</Link>
            <Link to="/register?role=ngo" className="btn btn-gold btn-lg">Register NGO</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)", padding: "40px 0",
        background: "var(--void)",
      }}>
        <div className="container" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontFamily: "Cormorant Garamond", fontSize: 20, fontWeight: 700 }}>
            Chain<span className="text-gradient">Give</span>
          </div>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Secured by Ethereum blockchain · Smart contract audited · Open source
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            {["GitHub", "Etherscan", "Whitepaper"].map(l => (
              <span key={l} style={{ fontSize: 13, color: "var(--text-dim)", cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
