const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "data");
const usersPath = path.join(dataDir, "users.json");
const valoresPath = path.join(dataDir, "valores.json");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function readUsers() {
  ensureDataDir();
  if (!fs.existsSync(usersPath)) return [];
  return JSON.parse(fs.readFileSync(usersPath, "utf-8"));
}

function writeUsers(users) {
  ensureDataDir();
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf-8");
}

function readValores() {
  ensureDataDir();
  if (!fs.existsSync(valoresPath)) return {};
  return JSON.parse(fs.readFileSync(valoresPath, "utf-8"));
}

function writeValores(valores) {
  ensureDataDir();
  fs.writeFileSync(valoresPath, JSON.stringify(valores, null, 2), "utf-8");
}

const db = {
  getUserByUsername(username) {
    const users = readUsers();
    return users.find((u) => u.username === username) || null;
  },
  getUserById(id) {
    const users = readUsers();
    return users.find((u) => u.id === id) || null;
  },
  addUser(username, password_hash, nome) {
    const users = readUsers();
    const maxId = users.length ? Math.max(...users.map((u) => u.id)) : 0;
    const newUser = {
      id: maxId + 1,
      username,
      password_hash,
      nome: nome || username,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    writeUsers(users);
    return newUser;
  },
  updateUserPassword(username, password_hash) {
    const users = readUsers();
    const u = users.find((x) => x.username === username);
    if (!u) return null;
    u.password_hash = password_hash;
    writeUsers(users);
    return u;
  },
  getValores() {
    return readValores();
  },
  setValores(updates, updated_at, updated_by) {
    const valores = readValores();
    for (const [id_indicador, valor] of Object.entries(updates)) {
      const v = valor === "" || valor === null || valor === undefined ? null : Number(valor);
      valores[id_indicador] = { valor: v, updated_at, updated_by };
    }
    writeValores(valores);
    return valores;
  },
};

module.exports = { db };
