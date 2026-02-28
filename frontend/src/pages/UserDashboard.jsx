import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { donationsAPI, projectsAPI } from "../utils/api";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  const { user, wallet } = useAuth();
  const [donatedProjects, setDonatedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wallet.address) {
      donationsAPI.getByUser(wallet.address)
        .then(res => {
          const ids = res.data.projectIds || [];
          return Promise.all(ids.map(id => projectsAPI.getById(id).then(r => r.data)));
        })
        .then(setDonatedProjects)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [wallet.address]);

  return (
    <div style={{ paddingTop: 100, minHeight: "100vh" }}>
      <div className="container">
        <div style={{ paddingBottom: 40, borderBottom: "1px solid var(--border)", marginBottom: 40 }}>
          <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: 56, fontWeight: 700 }}>
            My Dashboard
          </h1>
          <p style={{ color: "var(--text-dim)", marginTop: 8 }}>
            Welcome back, <strong>{user?.name}</strong>
          </p>
        </div>

        {/* Wallet Info */}
        {wallet.connected ? (
          <div className="card" style={{ padding: 24, marginBottom: 32, display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: "var(--emerald-glow)", border: "2px solid var(--emerald)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>⬡</div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Connected Wallet</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 500 }}>{wallet.address}</div>
              <div style={{ fontSize: 13, color: "var(--emerald)", marginTop: 2 }}>{parseFloat(wallet.balance).toFixed(6)} ETH</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 24, marginBottom: 32, textAlign: "center", borderColor: "rgba(245,158,11,0.3)" }}>
            <p style={{ color: "var(--text-dim)", marginBottom: 16 }}>Connect your wallet to see your on-chain donation history</p>
            <button className="btn btn-ghost">Connect MetaMask</button>
          </div>
        )}

        {/* Donated Projects */}
        <div>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 36, marginBottom: 24 }}>My Donations</h2>
          {loading ? (
            <p style={{ color: "var(--text-dim)" }}>Loading your donations from blockchain...</p>
          ) : donatedProjects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>💝</div>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 32, marginBottom: 12 }}>No donations yet</h3>
              <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>Make your first impact on the blockchain</p>
              <Link to="/projects" className="btn btn-primary">Browse Projects →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {donatedProjects.map(project => {
                const progress = Math.min((parseFloat(project.raisedAmount || 0) / parseFloat(project.goalAmount || 1)) * 100, 100);
                return (
                  <div key={project._id} className="card" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <span className={`badge badge-${project.status}`} style={{ marginBottom: 8, display: "inline-block" }}>{project.status}</span>
                        <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 24 }}>{project.title}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>{project.ngoId?.name}</p>
                      </div>
                      <Link to={`/projects/${project._id}`} className="btn btn-ghost btn-sm">View Project →</Link>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 13, color: "var(--text-dim)" }}>
                      <span>{parseFloat(project.raisedAmount || 0).toFixed(4)} / {parseFloat(project.goalAmount).toFixed(4)} ETH</span>
                      <span style={{ color: "var(--gold)" }}>{progress.toFixed(1)}% funded</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
