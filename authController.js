/**
 * AuthFlow — Controller de Autenticação
 * ============================================================
 * Arquivo: backend/controllers/authController.js
 *
 * Responsabilidades:
 *   - Validar os dados da requisição
 *   - Chamar o model (UserModel) para operações no banco
 *   - Hash de senhas com bcrypt
 *   - Gerar e validar JWT para autenticação stateless
 *   - Retornar respostas padronizadas
 * ============================================================
 */

const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

/** Chave secreta para o JWT — em produção use variável de ambiente */
const JWT_SECRET  = process.env.JWT_SECRET  || 'authflow_secret_dev_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'; // Token dura 7 dias

/** Custo do bcrypt — 12 é um bom equilíbrio segurança/performance */
const BCRYPT_ROUNDS = 12;

/* ── Helper: resposta padronizada de erro ── */
const erro = (res, status, msg) =>
  res.status(status).json({ sucesso: false, mensagem: msg });

/* ── Helper: resposta padronizada de sucesso ── */
const ok = (res, dados) =>
  res.status(200).json({ sucesso: true, ...dados });

/* ============================================================
   POST /api/auth/cadastro
   Body: { nome, email, senha, confirmarSenha }
   ============================================================ */
exports.cadastro = async (req, res, next) => {
  try {
    const { nome, email, senha, confirmarSenha } = req.body;

    /* ── Validações no servidor (nunca confie só no frontend) ── */
    if (!nome || !email || !senha || !confirmarSenha)
      return erro(res, 400, 'Todos os campos são obrigatórios.');

    if (nome.trim().length < 2)
      return erro(res, 400, 'Nome deve ter pelo menos 2 caracteres.');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email))
      return erro(res, 400, 'Formato de e-mail inválido.');

    if (senha.length < 8)
      return erro(res, 400, 'Senha deve ter pelo menos 8 caracteres.');

    if (senha !== confirmarSenha)
      return erro(res, 400, 'As senhas não coincidem.');

    /* ── Verifica duplicidade de e-mail ── */
    const existente = await UserModel.buscarPorEmail(email);
    if (existente)
      return erro(res, 409, 'Este e-mail já está cadastrado.');

    /* ── Hash da senha com bcrypt ── */
    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

    /* ── Cria o usuário no banco ── */
    const usuario = await UserModel.criar({
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      senhaHash
    });

    /* ── Gera token JWT ── */
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return ok(res, {
      mensagem: 'Conta criada com sucesso!',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, criadoEm: usuario.criadoEm }
    });

  } catch (err) {
    next(err); // Passa para o middleware de erro global
  }
};

/* ============================================================
   POST /api/auth/login
   Body: { email, senha }
   ============================================================ */
exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha)
      return erro(res, 400, 'E-mail e senha são obrigatórios.');

    /* ── Busca usuário ── */
    const usuario = await UserModel.buscarPorEmail(email);
    if (!usuario)
      return erro(res, 401, 'E-mail ou senha incorretos.');

    /* ── Compara a senha com o hash (timing-safe via bcrypt) ── */
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta)
      return erro(res, 401, 'E-mail ou senha incorretos.');

    /* ── Gera token JWT ── */
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return ok(res, {
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, criadoEm: usuario.criadoEm }
    });

  } catch (err) {
    next(err);
  }
};

/* ============================================================
   POST /api/auth/logout
   O JWT é stateless — o cliente descarta o token.
   Para invalidação real, use uma blacklist em Redis.
   ============================================================ */
exports.logout = (req, res) => {
  return ok(res, { mensagem: 'Logout realizado. Descarte o token no cliente.' });
};

/* ============================================================
   GET /api/auth/me  (rota protegida pelo middleware autenticar)
   ============================================================ */
exports.me = async (req, res, next) => {
  try {
    // req.usuarioId é injetado pelo middleware de autenticação
    const usuario = await UserModel.buscarPorId(req.usuarioId);
    if (!usuario)
      return erro(res, 404, 'Usuário não encontrado.');

    return ok(res, {
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, criadoEm: usuario.criadoEm }
    });
  } catch (err) {
    next(err);
  }
};
