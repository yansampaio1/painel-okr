const express = require("express");
const { db } = require("../db");
const { authMiddleware } = require("./auth");

const router = express.Router();

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
