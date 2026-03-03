const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { db } = require("./db");
const { router: authRouter, authMiddleware } = require("./routes/auth");
const valoresRouter = require("./routes/valores");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));
// API abaixo

app.use("/api/auth", authRouter);
app.use("/api/valores", valoresRouter);

const metasPath = path.join(__dirname, "..", "metas.json");
app.get("/api/metas", (req, res) => {
  if (!fs.existsSync(metasPath)) {
    return res.status(404).json({ error: "metas.json não encontrado." });
  }
  const data = JSON.parse(fs.readFileSync(metasPath, "utf-8"));
  res.json(data);
});

// Rota temporária: criar primeiro usuário (ex.: no Render sem Shell). Remover após uso.
// Uso: GET /setup-admin?segredo=SEU_JWT_SECRET&usuario=admin&senha=SenhaForte123
app.get("/setup-admin", (req, res) => {
  if (req.query.segredo !== process.env.JWT_SECRET) {
    return res.status(403).json({ erro: "Acesso negado." });
  }
  const usuario = (req.query.usuario || "admin").trim();
  const senha = req.query.senha;
  if (!senha) {
    return res.status(400).json({ erro: "Informe senha na query (ex.: senha=MinhaSenha)." });
  }
  const hash = bcrypt.hashSync(senha, 10);
  if (db.getUserByUsername(usuario)) {
    db.updateUserPassword(usuario, hash);
    return res.json({ ok: true, mensagem: "Senha do usuário atualizada." });
  }
  db.addUser(usuario, hash, usuario);
  res.json({ ok: true, mensagem: "Usuário criado. Remova ou desative esta rota depois." });
});

app.listen(PORT, () => {
  console.log(`API OKR/KPI rodando em http://localhost:${PORT}`);
});
