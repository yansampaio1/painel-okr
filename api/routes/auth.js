const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "okr-kpi-secret-change-in-production";

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
  }
  const user = db.getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: "Usuário ou senha inválidos." });
  }
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Usuário ou senha inválidos." });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({
    token,
    user: { id: user.id, username: user.username, nome: user.nome || user.username },
  });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Token não informado." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

router.get("/me", authMiddleware, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(401).json({ error: "Usuário não encontrado." });
  }
  res.json({ user: { id: user.id, username: user.username, nome: user.nome || user.username } });
});

module.exports = { router, authMiddleware };
