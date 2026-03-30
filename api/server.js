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

// Bootstrap de admin via variáveis de ambiente (útil em produção).
// Defina ADMIN_BOOTSTRAP_PASSWORD para criar/atualizar o admin ao subir.
// Opcional: ADMIN_BOOTSTRAP_USERNAME (default: "admin")
try {
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (bootstrapPassword) {
    const bootstrapUsername = (process.env.ADMIN_BOOTSTRAP_USERNAME || "admin").trim();
    const hash = bcrypt.hashSync(String(bootstrapPassword), 10);
    if (db.getUserByUsername(bootstrapUsername)) {
      db.updateUserPassword(bootstrapUsername, hash);
    } else {
      db.addUser(bootstrapUsername, hash, bootstrapUsername);
    }
    db.updateUserAccess(bootstrapUsername, { role: "admin", allowed_indicator_ids: [] });
    console.log(`[bootstrap] admin pronto: ${bootstrapUsername}`);
  }
} catch (e) {
  console.warn("[bootstrap] falha ao preparar admin:", e && e.message ? e.message : e);
}

// `/setup-admin` foi desativado. Use a Admin API em `/api/admin/*`.
app.all("/setup-admin", (req, res) => {
  res.status(410).json({ error: "Rota desativada. Use /api/admin/users." });
});

app.listen(PORT, () => {
  console.log(`API OKR/KPI rodando em http://localhost:${PORT}`);
});
