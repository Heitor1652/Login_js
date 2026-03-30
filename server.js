/**
 * AuthFlow — Backend Node.js + Express
 * ============================================================
 * Arquivo: backend/server.js
 *
 * Para usar este backend:
 *   1. npm install
 *   2. node server.js
 *   3. Acesse http://localhost:3000
 *
 * O frontend (frontend/index.html) funciona standalone via
 * localStorage, mas este servidor oferece uma API REST real
 * com bcrypt, JWT e persistência em JSON file (db.json).
 * ============================================================
 */

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const authRoutes = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middlewares globais ── */
app.use(cors());                          // Permite requisições cross-origin
app.use(express.json());                  // Parse de JSON no body
app.use(express.urlencoded({ extended: true }));

/* ── Serve os arquivos estáticos do frontend ── */
app.use(express.static(path.join(__dirname, '..', 'frontend')));

/* ── Rotas da API ── */
app.use('/api/auth', authRoutes);

/* ── Rota catch-all: serve o index.html para qualquer rota não encontrada ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

/* ── Middleware global de erros ── */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`\n🔐 AuthFlow rodando em http://localhost:${PORT}\n`);
});

module.exports = app;
