import { Link } from "react-router-dom";

const ProjectCard = ({ project, index = 0 }) => {
  const progress = project.goalAmount
    ? Math.min((parseFloat(project.raisedAmount) / parseFloat(project.goalAmount)) * 100, 100)
    : 0;

  const daysLeft = project.deadline
    ? Math.max(0, Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const statusColors = {
    active: "badge-active", pending: "badge-pending",
    completed: "badge-completed", suspended: "badge-suspended",
  };

  const categoryIcons = {
    Education: "📚", Health: "🏥", Environment: "🌿",
    Poverty: "🤝", Disaster: "🆘", Other: "💡",
  };

  return (
    <Link to={`/projects/${project._id || project.id}`} style={{ textDecoration: "none" }}>
      <div
        className="card"
        style={{
          overflow: "hidden", cursor: "pointer", height: "100%",
          display: "flex", flexDirection: "column",
          animation: `fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) ${index * 0.05}s both`,
        }}
      >
        {/* Image */}
        <div style={{
          height: 200, background: `linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%)`,
          position: "relative", overflow: "hidden", flexShrink: 0,
        }}>
          {project.images?.[0] ? (
            <img src={project.images[0]} alt={project.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{
              height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 56, opacity: 0.4,
            }}>
              {categoryIcons[project.category] || "💡"}
            </div>
          )}
          <div style={{
            position: "absolute", top: 12, left: 12,
            display: "flex", gap: 8,
          }}>
            <span className={`badge ${statusColors[project.status] || "badge-pending"}`}>
              {project.status}
            </span>
            <span className="badge" style={{
              background: "rgba(0,0,0,0.6)", color: "var(--text-dim)",
              border: "1px solid var(--border)",
            }}>
              {project.category}
            </span>
          </div>
          {project.ngoId?.verified && (
            <div style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(16,185,129,0.2)", border: "1px solid var(--emerald)",
              borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "var(--emerald)",
            }}>✓ Verified NGO</div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          {/* NGO Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "var(--surface3)", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13,
            }}>🏛</div>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
              {project.ngoId?.name || "NGO Organization"}
            </span>
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily: "Cormorant Garamond", fontSize: 20, fontWeight: 600,
            lineHeight: 1.3, color: "var(--text)", flex: 1,
          }}>
            {project.title}
          </h3>

          {/* Description */}
          <p style={{
            fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {project.description}
          </p>

          {/* Progress */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--emerald)" }}>
                  {parseFloat(project.raisedAmount || 0).toFixed(3)} ETH
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>
                  of {parseFloat(project.goalAmount || 0).toFixed(3)} ETH
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)" }}>
                {progress.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Footer Stats */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            borderTop: "1px solid var(--border)", paddingTop: 14,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {project.donorCount || 0}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Donors</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: daysLeft < 7 ? "var(--danger)" : "var(--text)" }}>
                {daysLeft}d
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Left</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {project.ngoId?.reputationScore || 50}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Rep Score</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
