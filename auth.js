/**
 * AuthFlow — Rotas de Autenticação
 * ============================================================
 * Arquivo: backend/routes/auth.js
 *
 * Endpoints disponíveis:
 *   POST /api/auth/cadastro  — Cria nova conta
 *   POST /api/auth/login     — Autentica usuário
 *   POST /api/auth/logout    — Invalida o token (stateless: apenas orientativo)
 *   GET  /api/auth/me        — Retorna dados do usuário autenticado
 * ============================================================
 */

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/authController');
const { autenticar } = require('../middlewares/autenticar');

/* Rota pública: cadastro */
router.post('/cadastro', controller.cadastro);

/* Rota pública: login */
router.post('/login', controller.login);

/* Rota pública: logout (client-side invalida o token) */
router.post('/logout', controller.logout);

/* Rota protegida: perfil do usuário autenticado */
router.get('/me', autenticar, controller.me);

module.exports = router;
