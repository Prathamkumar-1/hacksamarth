import { useState, useEffect } from "react";
import { projectsAPI } from "../utils/api";
import ProjectCard from "../components/ProjectCard";

const CATEGORIES = ["All", "Education", "Health", "Environment", "Poverty", "Disaster", "Other"];

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("-createdAt");

  useEffect(() => {
    setLoading(true);
    const params = {
      page, limit: 12, sort,
      ...(category !== "All" && { category }),
      ...(search && { search }),
    };
    projectsAPI.getAll(params)
      .then(res => {
        setProjects(res.data.projects || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [page, category, sort, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div style={{ paddingTop: 100, minHeight: "100vh" }}>
      <div className="container">
        {/* Header */}
        <div style={{ paddingBottom: 48, borderBottom: "1px solid var(--border)", marginBottom: 48 }}>
          <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: 64, fontWeight: 700, marginBottom: 12 }}>
            Active Projects
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: 16 }}>
            {total} verified projects seeking your support
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: "flex", gap: 16, flexWrap: "wrap",
          alignItems: "center", marginBottom: 40,
        }}>
          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 200 }}>
            <input
              className="input-field"
              placeholder="Search projects..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </form>

          {/* Sort */}
          <select
            className="input-field"
            style={{ width: "auto" }}
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
          >
            <option value="-createdAt">Newest</option>
            <option value="-donorCount">Most Donors</option>
            <option value="-raisedAmount">Most Raised</option>
            <option value="deadline">Ending Soon</option>
          </select>
        </div>

        {/* Category filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 40 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              style={{
                background: category === cat ? "var(--emerald)" : "var(--surface)",
                color: category === cat ? "#000" : "var(--text-dim)",
                border: `1px solid ${category === cat ? "var(--emerald)" : "var(--border)"}`,
                borderRadius: 100, padding: "7px 18px", fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >{cat}</button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} style={{
                height: 420, borderRadius: "var(--radius-lg)",
                background: "linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%)",
                backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
              }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 32, marginBottom: 12 }}>No projects found</h3>
            <p style={{ color: "var(--text-dim)" }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {projects.map((p, i) => <ProjectCard key={p._id} project={p} index={i} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 48, paddingBottom: 48 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                  background: page === p ? "var(--emerald)" : "var(--surface)",
                  color: page === p ? "#000" : "var(--text-dim)",
                  border: `1px solid ${page === p ? "var(--emerald)" : "var(--border)"}`,
                  fontSize: 13, fontWeight: 500, transition: "all 0.2s",
                }}
              >{p}</button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
