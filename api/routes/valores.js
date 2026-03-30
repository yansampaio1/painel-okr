const express = require("express");
const { db } = require("../db");
const { authMiddleware } = require("./auth");

const router = express.Router();

function canEditIndicator(user, indicatorId) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const allowed = Array.isArray(user.allowed_indicator_ids) ? user.allowed_indicator_ids : [];
  return allowed.includes(indicatorId);
}

function sendValores(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  const raw = db.getValores();
  const map = {};
  for (const [id_indicador, obj] of Object.entries(raw)) {
    map[id_indicador] = {
      valor: obj.valor,
      updated_at: obj.updated_at,
      updated_by: obj.updated_by,
    };
  }
  res.json({ valores: map });
}

router.get("/public", (req, res) => sendValores(res));

router.get("/", (req, res) => sendValores(res));

router.put("/", authMiddleware, (req, res) => {
  const { valores } = req.body || {};
  if (!valores || typeof valores !== "object") {
    return res.status(400).json({ error: "Envie { valores: { id_indicador: valor, ... } }." });
  }
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(401).json({ error: "Usuário não encontrado." });
  }
  const attemptedIds = Object.keys(valores);
  const forbiddenIds = attemptedIds.filter((id) => !canEditIndicator(user, id));
  if (forbiddenIds.length) {
    return res.status(403).json({
      error: "Sem permissão para editar um ou mais indicadores.",
      forbidden_indicator_ids: forbiddenIds,
    });
  }
  const now = new Date().toISOString();
  const userId = req.user.id;
  db.setValores(valores, now, userId);
  const raw = db.getValores();
  const map = {};
  for (const [id_indicador, obj] of Object.entries(raw)) {
    map[id_indicador] = {
      valor: obj.valor,
      updated_at: obj.updated_at,
      updated_by: obj.updated_by,
    };
  }
  res.json({ valores: map });
});

module.exports = router;
