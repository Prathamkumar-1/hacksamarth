import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, Promise.reject);

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:        (data) => api.post("/auth/login", data),
  register:     (data) => api.post("/auth/register", data),
  walletAuth:   (data) => api.post("/auth/wallet-auth", data),
  getNonce:     (addr) => api.get(`/auth/nonce/${addr}`),
};

export const projectsAPI = {
  getAll:       (params) => api.get("/projects", { params }),
  getById:      (id)     => api.get(`/projects/${id}`),
  create:       (data)   => api.post("/projects", data),
  updateStatus: (id, status) => api.patch(`/projects/${id}/status`, { status }),
  getFeatured:  ()       => api.get("/projects/featured/list"),
};

export const ngoAPI = {
  getAll:     ()   => api.get("/ngos"),
  getById:    (id) => api.get(`/ngos/${id}`),
  register:   (data) => api.post("/ngos/register", data),
  verify:     (id) => api.patch(`/ngos/${id}/verify`),
  dashboard:  (id) => api.get(`/ngos/${id}/dashboard`),
};

export const donationsAPI = {
  getByProject: (id)     => api.get(`/donations/project/${id}`),
  getByUser:    (addr)   => api.get(`/donations/user/${addr}`),
  verifyTx:     (hash)   => api.get(`/donations/verify/${hash}`),
};

export default api;
