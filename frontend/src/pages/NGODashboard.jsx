import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ngoAPI, projectsAPI } from "../utils/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";

const StatBox = ({ icon, label, value, sub, color = "var(--emerald)" }) => (
  <div className="card" style={{ padding: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, fontSize: 20,
        background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
    </div>
    <div style={{ fontFamily: "Cormorant Garamond", fontSize: 36, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
  </div>
);

const NGODashboard = () => {
  const { user, wallet } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "Education",
    goalAmount: "", durationDays: 30,
  });
  const [milestones, setMilestones] = useState([{ title: "", description: "", targetAmount: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user?.ngoId) {
      ngoAPI.dashboard(user.ngoId)
        .then(res => setDashboard(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await projectsAPI.create({ ...form, milestones });
      toast.success("Project submitted for review!");
      setShowCreateForm(false);
      setForm({ title: "", description: "", category: "Education", goalAmount: "", durationDays: 30 });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const addMilestone = () => setMilestones([...milestones, { title: "", description: "", targetAmount: "" }]);

  const mockChartData = [
    { name: "Jan", raised: 0 }, { name: "Feb", raised: 0.5 },
    { name: "Mar", raised: 1.2 }, { name: "Apr", raised: 0.8 },
    { name: "May", raised: 2.1 }, { name: "Jun", raised: 1.5 },
  ];

  if (loading) return (
    <div style={{ paddingTop: 120, textAlign: "center", minHeight: "100vh" }}>
      <div style={{ fontSize: 32, animation: "float 2s ease infinite" }}>⛓</div>
    </div>
  );

  if (!user?.ngoId && !dashboard) return (
    <div style={{ paddingTop: 120, minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: 640, textAlign: "center", paddingTop: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🏛</div>
        <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: 48, marginBottom: 16 }}>Register Your NGO</h1>
        <p style={{ color: "var(--text-dim)", marginBottom: 32, lineHeight: 1.7 }}>
          Register your organization to start creating fundraising campaigns on the blockchain.
        </p>
        <a href="/register?role=ngo" className="btn btn-primary btn-lg">Get Started →</a>
      </div>
    </div>
  );

  const stats = dashboard?.stats;
  const projects = dashboard?.projects || [];
  const ngo = dashboard?.ngo;

  return (
    <div style={{ paddingTop: 100, minHeight: "100vh" }}>
      <div className="container">
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 40, paddingBottom: 32, borderBottom: "1px solid var(--border)",
        }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              NGO Dashboard
            </div>
            <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: 48, fontWeight: 700 }}>
              {ngo?.name || "My Organization"}
            </h1>
            <div style={{ display: "flex", gap: 16, marginTop: 12, alignItems: "center" }}>
              <span className="badge badge-active">✓ Verified</span>
              <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
                Reputation Score:{" "}
                <span style={{ color: "var(--gold)", fontWeight: 600 }}>
                  {ngo?.reputationScore || 50}/100
                </span>
              </span>
              {wallet.connected && (
                <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {wallet.address?.slice(0,8)}...{wallet.address?.slice(-4)}
                </span>
              )}
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Cancel" : "+ New Project"}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
          {["overview", "projects", "fund-requests"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? "var(--surface2)" : "none",
              border: `1px solid ${activeTab === tab ? "var(--border2)" : "transparent"}`,
              color: activeTab === tab ? "var(--text)" : "var(--text-dim)",
              borderRadius: 8, padding: "8px 20px", fontSize: 14, cursor: "pointer",
              textTransform: "capitalize", fontFamily: "DM Sans",
            }}>{tab.replace("-", " ")}</button>
          ))}
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <div className="card" style={{ padding: 32, marginBottom: 32, borderColor: "var(--emerald)" }}>
            <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 32, marginBottom: 24 }}>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Project Title *</label>
                  <input className="input-field" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Clean Water for Villages" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Category *</label>
                  <select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {["Education","Health","Environment","Poverty","Disaster","Other"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Description *</label>
                <textarea className="input-field" required rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the project, its goals, and the community it serves..." style={{ resize: "vertical" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Funding Goal (ETH) *</label>
                  <input className="input-field" type="number" step="0.001" required value={form.goalAmount} onChange={e => setForm({...form, goalAmount: e.target.value})} placeholder="0.000" style={{ fontFamily: "DM Mono" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Duration (days) *</label>
                  <input className="input-field" type="number" min={7} max={365} value={form.durationDays} onChange={e => setForm({...form, durationDays: e.target.value})} />
                </div>
              </div>

              {/* Milestones */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Milestones</label>
                  <button type="button" onClick={addMilestone} className="btn btn-ghost btn-sm">+ Add Milestone</button>
                </div>
                {milestones.map((m, i) => (
                  <div key={i} style={{
                    background: "var(--surface2)", borderRadius: 12, padding: 20,
                    marginBottom: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                  }}>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>MILESTONE {i+1} TITLE</label>
                      <input className="input-field" value={m.title} onChange={e => { const ms = [...milestones]; ms[i].title = e.target.value; setMilestones(ms); }} placeholder="e.g. Purchase Equipment" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>TARGET AMOUNT (ETH)</label>
                      <input className="input-field" type="number" step="0.001" value={m.targetAmount} onChange={e => { const ms = [...milestones]; ms[i].targetAmount = e.target.value; setMilestones(ms); }} placeholder="0.000" style={{ fontFamily: "DM Mono" }} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>DESCRIPTION</label>
                      <input className="input-field" value={m.description} onChange={e => { const ms = [...milestones]; ms[i].description = e.target.value; setMilestones(ms); }} placeholder="What will be achieved at this milestone?" />
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit for Review →"}
              </button>
            </form>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
              <StatBox icon="📁" label="Total Projects" value={stats?.totalProjects || 0} />
              <StatBox icon="⚡" label="Active Projects" value={stats?.activeProjects || 0} color="var(--emerald)" />
              <StatBox icon="💎" label="Total Raised" value={`${parseFloat(stats?.totalRaised || 0).toFixed(3)} ETH`} color="var(--gold)" />
              <StatBox icon="⭐" label="Reputation Score" value={`${ngo?.reputationScore || 50}/100`} color="var(--gold)" />
            </div>

            {/* Chart */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 24, marginBottom: 24 }}>Donation Activity</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ color: "var(--text)" }}
                  />
                  <Line type="monotone" dataKey="raised" stroke="var(--emerald)" strokeWidth={2} dot={{ fill: "var(--emerald)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {projects.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                <p style={{ color: "var(--text-dim)" }}>No projects yet. Create your first project!</p>
              </div>
            ) : projects.map(project => {
              const progress = Math.min((parseFloat(project.raisedAmount || 0) / parseFloat(project.goalAmount || 1)) * 100, 100);
              return (
                <div key={project._id} className="card" style={{ padding: 24, display: "flex", gap: 24, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                      <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 22 }}>{project.title}</h3>
                      <span className={`badge badge-${project.status}`}>{project.status}</span>
                    </div>
                    <div className="progress-bar" style={{ marginBottom: 8 }}>
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{ display: "flex", gap: 24, fontSize: 13, color: "var(--text-dim)" }}>
                      <span>{parseFloat(project.raisedAmount || 0).toFixed(4)} / {parseFloat(project.goalAmount).toFixed(4)} ETH</span>
                      <span>{project.donorCount || 0} donors</span>
                      <span>{project.category}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <a href={`/projects/${project._id}`} className="btn btn-ghost btn-sm">View →</a>
                    {project.status === "active" && (
                      <button className="btn btn-primary btn-sm" onClick={() => {}}>Request Funds</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Fund Requests Tab */}
        {activeTab === "fund-requests" && (
          <div>
            <div style={{
              background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)",
              borderRadius: 12, padding: 20, marginBottom: 24,
            }}>
              <h4 style={{ marginBottom: 8 }}>How Fund Releases Work</h4>
              <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>
                Submit a fund release request with proof of milestone completion (IPFS hash of receipts/reports). Two auditors must approve before funds are released to your wallet. This protects donors and maintains your reputation score.
              </p>
            </div>
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim)" }}>
              No pending fund requests.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NGODashboard;
