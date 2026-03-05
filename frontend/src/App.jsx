import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Login from "./pages/Login";
import NGODashboard from "./pages/NGODashboard";
import UserDashboard from "./pages/UserDashboard";
import DonationTracker from "./pages/DonationTracker";
import "./index.css";

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/"           element={<Home />} />
      <Route path="/projects"   element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/login"      element={<Login />} />
      <Route path="/register"   element={<Login />} />
      <Route path="/dashboard"  element={
        <ProtectedRoute><UserDashboard /></ProtectedRoute>
      } />
      <Route path="/ngo-dashboard" element={
        <ProtectedRoute roles={["ngo","admin"]}><NGODashboard /></ProtectedRoute>
      } />
      <Route path="/donation-tracker" element={
        <ProtectedRoute><DonationTracker /></ProtectedRoute>
      } />
      <Route path="*" element={
        <div style={{ paddingTop: 120, textAlign: "center", minHeight: "100vh" }}>
          <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: 72, color: "var(--text-muted)" }}>404</h1>
          <p style={{ color: "var(--text-dim)" }}>Page not found</p>
        </div>
      } />
    </Routes>
  </>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--surface2)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            fontFamily: "DM Sans",
            fontSize: "14px",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#000" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#000" },
          },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
