const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

const metasPath = path.join(__dirname, "..", "metas.json");
app.get("/api/metas", (req, res) => {
  if (!fs.existsSync(metasPath)) {
    return res.status(404).json({ error: "metas.json não encontrado." });
  }
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  const data = JSON.parse(fs.readFileSync(metasPath, "utf-8"));
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`API OKR/KPI rodando em http://localhost:${PORT}`);
});
