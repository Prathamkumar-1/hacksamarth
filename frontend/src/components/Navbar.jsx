import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatAddress } from "../utils/web3";

const Navbar = () => {
  const { user, wallet, logout, connectWallet } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { to: "/projects", label: "Projects" },
    { to: "/ngos", label: "NGOs" },
    { to: "/how-it-works", label: "How It Works" },
    ...(user && user.address ? [{ to: "/donation-tracker", label: "🔍 My Donations" }] : []),
  ];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      transition: "all 0.3s",
      background: scrolled ? "rgba(10,12,15,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
        
        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, var(--emerald), var(--gold))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#000",
          }}>◈</div>
          <span style={{ fontFamily: "Cormorant Garamond", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Chain<span className="text-gradient">Give</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: location.pathname === to ? "var(--text)" : "var(--text-dim)",
              background: location.pathname === to ? "var(--surface2)" : "transparent",
              transition: "all 0.2s",
            }}>{label}</Link>
          ))}
        </div>

        {/* Right Side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {wallet.connected ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "8px 14px",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--emerald)", boxShadow: "0 0 8px var(--emerald)",
                animation: "pulse-glow 2s infinite",
              }} />
              <span className="mono" style={{ fontSize: 13, color: "var(--text-dim)" }}>
                {formatAddress(wallet.address)}
              </span>
              <span style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 600 }}>
                {parseFloat(wallet.balance).toFixed(3)} ETH
              </span>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={connectWallet}>
              <span>⬡</span> Connect Wallet
            </button>
          )}

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                to={user.role === "ngo" ? "/ngo-dashboard" : "/dashboard"}
                className="btn btn-primary btn-sm"
              >Dashboard</Link>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-gold btn-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
