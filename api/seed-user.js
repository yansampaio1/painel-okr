/**
 * Cria o primeiro usuário (admin).
 * Uso: node seed-user.js [username] [password]
 * Exemplo: node seed-user.js admin minhaSenha123
 */
const bcrypt = require("bcryptjs");
const { db } = require("./db");

const username = process.argv[2] || "admin";
const password = process.argv[3] || "admin123";

const existing = db.getUserByUsername(username);
if (existing) {
  console.log("Usuário '" + username + "' já existe.");
  process.exit(0);
  return;
}

const hash = bcrypt.hashSync(password, 10);
db.addUser(username, hash, username);
console.log("Usuário '" + username + "' criado com sucesso.");
console.log("Altere a senha em produção e use JWT_SECRET forte.");
