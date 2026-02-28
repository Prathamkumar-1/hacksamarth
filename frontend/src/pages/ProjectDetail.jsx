import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { projectsAPI, donationsAPI } from "../utils/api";
import DonateModal from "../components/DonateModal";

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonate, setShowDonate] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    Promise.all([
      projectsAPI.getById(id),
      donationsAPI.getByProject(project?.onChainId).catch(() => ({ data: [] })),
    ]).then(([projectRes]) => {
      setProject(projectRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ paddingTop: 120, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16, animation: "float 2s ease infinite" }}>⛓</div>
        <p style={{ color: "var(--text-dim)" }}>Loading from blockchain...</p>
      </div>
    </div>
  );

  if (!project) return (
    <div style={{ paddingTop: 120, textAlign: "center" }}>
      <h2>Project not found</h2>
    </div>
  );

  const progress = Math.min(
    (parseFloat(project.raisedAmount || 0) / parseFloat(project.goalAmount || 1)) * 100, 100
  );
  const daysLeft = Math.max(0, Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)));

  const tabs = [
    { id: "about", label: "About" },
    { id: "milestones", label: "Milestones" },
    { id: "transactions", label: "On-Chain Activity" },
    { id: "ngo", label: "About NGO" },
  ];

  return (
    <div style={{ paddingTop: 100, minHeight: "100vh" }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ marginBottom: 32, fontSize: 13, color: "var(--text-dim)" }}>
          Projects <span style={{ margin: "0 8px" }}>›</span>
          <span style={{ color: "var(--text)" }}>{project.title}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 40, alignItems: "start" }}>
          {/* Left */}
          <div>
            {/* Hero Image */}
            <div style={{
              height: 360, borderRadius: "var(--radius-lg)", overflow: "hidden",
              background: "var(--surface2)", marginBottom: 32, position: "relative",
            }}>
              {project.images?.[0] ? (
                <img src={project.images[0]} alt={project.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, opacity: 0.3 }}>
                  🌍
                </div>
              )}
              <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 8 }}>
                <span className="badge badge-active">{project.status}</span>
                <span className="badge" style={{ background: "rgba(0,0,0,0.7)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
                  {project.category}
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "Cormorant Garamond", fontSize: 52, fontWeight: 700,
              lineHeight: 1.1, marginBottom: 16,
            }}>
              {project.title}
            </h1>

            {/* NGO Info */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid var(--border)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>🏛</div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{project.ngoId?.name || "NGO"}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {project.ngoId?.verified ? "✓ Verified Organization" : "Pending Verification"} · {project.ngoId?.country}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 32, borderBottom: "1px solid var(--border)" }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "10px 20px", fontSize: 14, fontWeight: 500,
                    color: activeTab === tab.id ? "var(--emerald)" : "var(--text-dim)",
                    borderBottom: `2px solid ${activeTab === tab.id ? "var(--emerald)" : "transparent"}`,
                    transition: "all 0.2s", marginBottom: -1,
                  }}
                >{tab.label}</button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "about" && (
              <div style={{ lineHeight: 1.8, color: "var(--text-dim)", fontSize: 15 }}>
                {project.description}
              </div>
            )}

            {activeTab === "milestones" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {project.milestones?.length ? project.milestones.map((m, i) => (
                  <div key={i} className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Milestone {i + 1}
                        </div>
                        <h4 style={{ fontFamily: "Cormorant Garamond", fontSize: 20 }}>{m.title}</h4>
                      </div>
                      <span className={`badge ${m.completed ? "badge-active" : "badge-pending"}`}>
                        {m.completed ? "✓ Completed" : "In Progress"}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>{m.description}</p>
                    {m.targetAmount && (
                      <div style={{ marginTop: 12, fontSize: 13, color: "var(--emerald)" }}>
                        Target: {m.targetAmount} ETH
                      </div>
                    )}
                    {m.proofIPFS && (
                      <a href={`https://ipfs.io/ipfs/${m.proofIPFS}`} target="_blank" rel="noreferrer"
                        style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "var(--emerald)" }}>
                        View Proof on IPFS ↗
                      </a>
                    )}
                  </div>
                )) : (
                  <p style={{ color: "var(--text-dim)" }}>No milestones defined yet.</p>
                )}
              </div>
            )}

            {activeTab === "transactions" && (
              <div>
                <div style={{
                  background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)",
                  borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13, color: "var(--text-dim)",
                }}>
                  ⛓ All transactions are publicly verifiable on the Ethereum blockchain. Contract:{" "}
                  <span className="mono" style={{ color: "var(--emerald)", fontSize: 12 }}>
                    {process.env.REACT_APP_CONTRACT_ADDRESS || "0x..."}
                  </span>
                </div>
                {donations.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-dim)" }}>
                    No transactions yet. Be the first to donate!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {donations.map((d, i) => (
                      <div key={i} className="card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
                          <div>
                            <div className="mono" style={{ fontSize: 13 }}>{d.donor?.slice(0,8)}...{d.donor?.slice(-4)}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(d.timestamp * 1000).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--emerald)" }}>
                            +{(parseFloat(d.amount) / 1e18).toFixed(4)} ETH
                          </div>
                          {d.message && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.message}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "ngo" && project.ngoId && (
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 28, marginBottom: 16 }}>{project.ngoId.name}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>COUNTRY</div>
                    <div style={{ fontSize: 14 }}>{project.ngoId.country || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>REPUTATION</div>
                    <div style={{ fontSize: 14, color: "var(--gold)" }}>{project.ngoId.reputationScore || 50}/100</div>
                  </div>
                </div>
                {project.ngoId.website && (
                  <a href={project.ngoId.website} target="_blank" rel="noreferrer"
                    className="btn btn-ghost btn-sm">Visit Website ↗</a>
                )}
              </div>
            )}
          </div>

          {/* Right: Sticky Sidebar */}
          <div style={{ position: "sticky", top: 100 }}>
            <div className="card" style={{ padding: 28, marginBottom: 16 }}>
              {/* Progress */}
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontFamily: "Cormorant Garamond", fontSize: 40, fontWeight: 700,
                  color: "var(--emerald)", marginBottom: 4,
                }}>
                  {parseFloat(project.raisedAmount || 0).toFixed(4)} ETH
                </div>
                <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 16 }}>
                  raised of {parseFloat(project.goalAmount || 0).toFixed(4)} ETH goal
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--text-dim)" }}>{progress.toFixed(1)}% funded</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)" }}>{daysLeft} days left</span>
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 12, marginBottom: 24,
                borderTop: "1px solid var(--border)", paddingTop: 20,
              }}>
                {[
                  { label: "Donors", value: project.donorCount || 0 },
                  { label: "Days Left", value: daysLeft },
                  { label: "Released", value: `${parseFloat(project.releasedAmount || 0).toFixed(3)} ETH` },
                  { label: "NGO Score", value: `${project.ngoId?.reputationScore || 50}/100` },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "var(--surface2)", borderRadius: 10, padding: "12px 14px",
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {project.status === "active" ? (
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "16px", fontSize: 16 }}
                  onClick={() => setShowDonate(true)}
                >
                  Donate Now →
                </button>
              ) : (
                <div style={{
                  textAlign: "center", padding: 16, borderRadius: 10,
                  background: "var(--surface2)", color: "var(--text-muted)", fontSize: 14,
                }}>
                  This project is {project.status}
                </div>
              )}

              <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
                🔒 Secured by Ethereum smart contract
              </div>
            </div>

            {/* Blockchain info */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                On-Chain Info
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Contract ID", value: `#${project.onChainId || "Pending"}` },
                  { label: "Network", value: "Ethereum Mainnet" },
                  { label: "Created", value: new Date(project.createdAt).toLocaleDateString() },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.label}</span>
                    <span className="mono" style={{ fontSize: 12, color: "var(--text)" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDonate && (
        <DonateModal
          project={project}
          onClose={() => setShowDonate(false)}
          onSuccess={() => setShowDonate(false)}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
