/**
 * AuthFlow — Middleware de Autenticação (JWT)
 * ============================================================
 * Arquivo: backend/middlewares/autenticar.js
 *
 * Protege rotas privadas verificando o Bearer Token no header
 * Authorization. Se válido, injeta req.usuarioId e req.usuarioEmail.
 *
 * Uso:
 *   router.get('/rota-privada', autenticar, controller.handler)
 * ============================================================
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'authflow_secret_dev_2024';

/**
 * Middleware que verifica o token JWT no header Authorization.
 *
 * Header esperado:
 *   Authorization: Bearer <token>
 */
exports.autenticar = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  /* ── Verifica se o header existe e está no formato correto ── */
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Acesso negado. Token não fornecido.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    /* ── Verifica assinatura e expiração do token ── */
    const payload = jwt.verify(token, JWT_SECRET);

    /* ── Injeta dados do usuário na requisição ── */
    req.usuarioId    = payload.id;
    req.usuarioEmail = payload.email;

    next(); // Passa para o próximo handler

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Sessão expirada. Faça login novamente.'
      });
    }
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token inválido.'
    });
  }
};
