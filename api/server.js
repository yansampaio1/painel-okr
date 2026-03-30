const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { db } = require("./db");
const { router: authRouter, authMiddleware } = require("./routes/auth");
const adminRouter = require("./routes/admin");
const valoresRouter = require("./routes/valores");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));
// API abaixo

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/valores", valoresRouter);

const metasPath = path.join(__dirname, "..", "metas.json");
app.get("/api/metas", (req, res) => {
  if (!fs.existsSync(metasPath)) {
    return res.status(404).json({ error: "metas.json não encontrado." });
  }
  const data = JSON.parse(fs.readFileSync(metasPath, "utf-8"));
  res.json(data);
});

// `/setup-admin` foi desativado. Use a Admin API em `/api/admin/*`.
app.all("/setup-admin", (req, res) => {
  res.status(410).json({ error: "Rota desativada. Use /api/admin/users." });
});

app.listen(PORT, () => {
  console.log(`API OKR/KPI rodando em http://localhost:${PORT}`);
});
