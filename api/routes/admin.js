const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../db");
const { authMiddleware } = require("./auth");

const router = express.Router();

function sanitizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    nome: u.nome || u.username,
    role: u.role,
    allowed_indicator_ids: Array.isArray(u.allowed_indicator_ids) ? u.allowed_indicator_ids : [],
    created_at: u.created_at,
  };
}

function requireAdmin(req, res, next) {
  const user = db.getUserById(req.user && req.user.id);
  if (!user) return res.status(401).json({ error: "Usuário não encontrado." });
  if (user.role !== "admin") return res.status(403).json({ error: "Acesso restrito a administradores." });
  req.adminUser = user;
  next();
}

function normalizeAllowedIds(v) {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) {
    return v
      .filter((x) => typeof x === "string" && x.trim())
      .map((x) => x.trim());
  }
  return [];
}

router.get("/users", authMiddleware, requireAdmin, (req, res) => {
  const users = db.listUsers().map(sanitizeUser);
  res.json({ users });
});

router.post("/users", authMiddleware, requireAdmin, (req, res) => {
  const { username, password, nome, role, allowed_indicator_ids } = req.body || {};
  if (!username || typeof username !== "string" || !username.trim()) {
    return res.status(400).json({ error: "username é obrigatório." });
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "password é obrigatório." });
  }
  const uname = username.trim();
  if (db.getUserByUsername(uname)) {
    return res.status(409).json({ error: "Usuário já existe." });
  }
  const finalRole = typeof role === "string" && role ? role : "restricted";
  const allowed = normalizeAllowedIds(allowed_indicator_ids);
  const hash = bcrypt.hashSync(password, 10);
  db.addUser(uname, hash, typeof nome === "string" && nome ? nome : uname);
  db.updateUserAccess(uname, { role: finalRole, allowed_indicator_ids: allowed });
  const created = db.getUserByUsername(uname);
  res.status(201).json({ user: sanitizeUser(created) });
});

router.put("/users/:username", authMiddleware, requireAdmin, (req, res) => {
  const uname = String(req.params.username || "").trim();
  if (!uname) return res.status(400).json({ error: "username inválido." });

  const existing = db.getUserByUsername(uname);
  if (!existing) return res.status(404).json({ error: "Usuário não encontrado." });

  const { nome, role, allowed_indicator_ids } = req.body || {};
  const patch = {};
  if (typeof nome === "string" && nome.trim()) patch.nome = nome.trim();
  if (typeof role === "string" && role) patch.role = role;
  if (allowed_indicator_ids !== undefined) patch.allowed_indicator_ids = normalizeAllowedIds(allowed_indicator_ids);

  const updated = db.updateUserAccess(uname, patch);
  res.json({ user: sanitizeUser(updated) });
});

router.put("/users/:username/password", authMiddleware, requireAdmin, (req, res) => {
  const uname = String(req.params.username || "").trim();
  if (!uname) return res.status(400).json({ error: "username inválido." });

  const existing = db.getUserByUsername(uname);
  if (!existing) return res.status(404).json({ error: "Usuário não encontrado." });

  const { password } = req.body || {};
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "password é obrigatório." });
  }
  const hash = bcrypt.hashSync(password, 10);
  const updated = db.updateUserPassword(uname, hash);
  res.json({ user: sanitizeUser(updated) });
});

module.exports = router;

