require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { applySecurityMiddleware } = require("./middleware/security");
const { generalLimiter } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Security Middleware
applySecurityMiddleware(app);

// Body Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// Apply rate limiting globally
app.use(generalLimiter);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Routes
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/projects",  require("./routes/projects"));
app.use("/api/ngos",      require("./routes/ngo"));
app.use("/api/donations", require("./routes/donations"));
app.use("/api/proofs",    require("./routes/proofs"));

// 404
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`));

module.exports = app;
