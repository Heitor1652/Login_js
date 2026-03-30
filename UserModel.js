/**
 * AuthFlow — Model de Usuário
 * ============================================================
 * Arquivo: backend/models/UserModel.js
 *
 * Simula um banco de dados usando um arquivo JSON local (db.json).
 * Em produção, substitua por MongoDB (mongoose) ou PostgreSQL (pg/prisma).
 *
 * Interface do modelo:
 *   UserModel.criar({ nome, email, senhaHash })  → usuario
 *   UserModel.buscarPorEmail(email)              → usuario | null
 *   UserModel.buscarPorId(id)                   → usuario | null
 *   UserModel.listar()                          → [usuarios]
 * ============================================================
 */

const fs   = require('fs');
const path = require('path');

/** Caminho para o arquivo JSON que funciona como banco de dados */
const DB_PATH = path.join(__dirname, '..', 'db.json');

/* ── Helpers de I/O ── */

/** Lê e retorna todos os usuários do arquivo JSON */
function lerBanco() {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const conteudo = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(conteudo) || [];
  } catch {
    return [];
  }
}

/** Salva a lista de usuários no arquivo JSON */
function salvarBanco(usuarios) {
  fs.writeFileSync(DB_PATH, JSON.stringify(usuarios, null, 2), 'utf-8');
}

/** Gera um ID único simples (timestamp + random) */
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ── Model API ── */
const UserModel = {

  /**
   * Cria e persiste um novo usuário.
   * @param {{ nome: string, email: string, senhaHash: string }} dados
   * @returns {Promise<object>} usuário criado (com senha)
   */
  criar: async ({ nome, email, senhaHash }) => {
    const usuarios = lerBanco();
    const novoUsuario = {
      id:       gerarId(),
      nome,
      email,
      senha:    senhaHash,   // armazenamos o hash, nunca a senha pura
      criadoEm: new Date().toISOString()
    };
    usuarios.push(novoUsuario);
    salvarBanco(usuarios);
    return novoUsuario;
  },

  /**
   * Busca um usuário pelo e-mail (case-insensitive).
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  buscarPorEmail: async (email) => {
    const usuarios = lerBanco();
    return usuarios.find(u =>
      u.email.toLowerCase() === email.toLowerCase().trim()
    ) ?? null;
  },

  /**
   * Busca um usuário pelo ID.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  buscarPorId: async (id) => {
    const usuarios = lerBanco();
    return usuarios.find(u => u.id === id) ?? null;
  },

  /**
   * Lista todos os usuários (sem senhas).
   * @returns {Promise<object[]>}
   */
  listar: async () => {
    return lerBanco().map(({ senha, ...rest }) => rest);
  }
};

module.exports = UserModel;
