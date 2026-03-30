/**
 * AuthFlow — Sistema de Autenticação Completo
 * ============================================================
 * Arquivo: script.js  (Frontend puro + lógica de backend simulado)
 *
 * Funcionalidades:
 *  - Validação em tempo real de formulários
 *  - Hash de senha via SubtleCrypto (Web Crypto API nativa)
 *  - Persistência de usuários no localStorage (simula banco de dados)
 *  - Sessão com token aleatório persistido no sessionStorage
 *  - Proteção de rota: dashboard só acessível com sessão ativa
 *  - Indicador de força de senha
 *  - Toggle mostrar/ocultar senha
 *  - Feedback visual animado (erros por campo + mensagens globais)
 * ============================================================
 */

/* ================================================================
   MÓDULO: UTILITÁRIOS
   ================================================================ */

/**
 * Gera um hash SHA-256 da string fornecida.
 * Usa a Web Crypto API nativa — sem dependências externas.
 * Em produção real, use bcrypt no servidor Node.js.
 *
 * @param {string} str — String para hashing (a senha do usuário)
 * @returns {Promise<string>} — Hash em hexadecimal
 */
async function hashSenha(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gera um token de sessão aleatório (32 bytes = 64 chars hex).
 * @returns {string}
 */
function gerarToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida formato de e-mail com regex RFC 5322 simplificado.
 * @param {string} email
 * @returns {boolean}
 */
function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Formata uma data para pt-BR legível.
 * @param {string} iso — Data em formato ISO
 * @returns {string}
 */
function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

/* ================================================================
   MÓDULO: BANCO DE DADOS (localStorage)
   ================================================================

   Estrutura do "banco":
   localStorage['authflow_users'] = JSON.stringify([
     {
       id: "uuid-like-string",
       nome: "João Silva",
       email: "joao@email.com",
       senha: "hash-sha256",
       criadoEm: "2024-01-15T10:30:00.000Z"
     },
     ...
   ])
*/

const DB_KEY = 'authflow_users';

/** Lê todos os usuários do localStorage */
function dbLerUsuarios() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || [];
  } catch {
    return [];
  }
}

/** Salva a lista de usuários no localStorage */
function dbSalvarUsuarios(lista) {
  localStorage.setItem(DB_KEY, JSON.stringify(lista));
}

/**
 * Busca usuário por e-mail (case-insensitive).
 * @param {string} email
 * @returns {object|undefined}
 */
function dbBuscarPorEmail(email) {
  return dbLerUsuarios().find(u => u.email.toLowerCase() === email.toLowerCase().trim());
}

/**
 * Cria um novo usuário no banco.
 * @param {object} dados — { nome, email, senhaHash }
 * @returns {object} — Usuário criado (sem a senha)
 */
function dbCriarUsuario({ nome, email, senhaHash }) {
  const usuarios = dbLerUsuarios();
  const novoUsuario = {
    id: gerarToken().slice(0, 16),
    nome: nome.trim(),
    email: email.toLowerCase().trim(),
    senha: senhaHash,
    criadoEm: new Date().toISOString()
  };
  usuarios.push(novoUsuario);
  dbSalvarUsuarios(usuarios);
  // Retorna o usuário SEM a senha (boas práticas)
  const { senha, ...seguro } = novoUsuario;
  return seguro;
}

/* ================================================================
   MÓDULO: SESSÃO (sessionStorage)
   ================================================================

   sessionStorage['authflow_session'] = JSON.stringify({
     token: "hex-random",
     userId: "id do usuário",
     nome: "João Silva",
     email: "joao@email.com",
     criadoEm: "ISO date string"
   })

   Usando sessionStorage: a sessão expira ao fechar a aba/browser.
   Para sessão persistente entre abas, usaria localStorage + expiração.
*/

const SESSION_KEY = 'authflow_session';

/** Lê a sessão ativa */
function sessaoLer() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

/** Cria uma nova sessão */
function sessaoCriar(usuario) {
  const sessao = { token: gerarToken(), ...usuario };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
  return sessao;
}

/** Destrói a sessão (logout) */
function sessaoDestruir() {
  sessionStorage.removeItem(SESSION_KEY);
}

/* ================================================================
   MÓDULO: AVALIAÇÃO DE FORÇA DE SENHA
   ================================================================ */

/**
 * Avalia a força de uma senha de 0 a 4.
 * Critérios: comprimento, minúsculas, maiúsculas, números, especiais.
 *
 * @param {string} senha
 * @returns {{ nivel: number, texto: string }}
 */
function avaliarForca(senha) {
  if (!senha) return { nivel: 0, texto: '' };

  let pontos = 0;
  if (senha.length >= 8)  pontos++;
  if (senha.length >= 12) pontos++;
  if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) pontos++;
  if (/\d/.test(senha))   pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;

  // Normaliza para escala 1–4
  const nivel = Math.min(4, Math.max(1, Math.round(pontos * 4 / 5)));
  const textos = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];

  return { nivel, texto: textos[nivel] };
}

/* ================================================================
   MÓDULO: UI — Feedback Visual
   ================================================================ */

/**
 * Exibe erro em um campo específico.
 * @param {string} fieldId — ID do .field wrapper
 * @param {string} msg     — Mensagem de erro
 */
function mostrarErroCampo(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('has-error');
  field.classList.remove('has-success');
  const errEl = field.querySelector('.field-error');
  if (errEl) errEl.textContent = msg;
}

/** Marca campo como válido (estilo verde). */
function marcarCampoValido(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('has-error');
  field.classList.add('has-success');
  const errEl = field.querySelector('.field-error');
  if (errEl) errEl.textContent = '';
}

/** Limpa o estado visual de um campo. */
function limparCampo(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('has-error', 'has-success');
  const errEl = field.querySelector('.field-error');
  if (errEl) errEl.textContent = '';
}

/**
 * Exibe mensagem global no formulário (erro ou sucesso).
 * @param {string} elId  — ID do .form-message
 * @param {'error'|'success'} tipo
 * @param {string} msg
 */
function mostrarMensagem(elId, tipo, msg) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.className = 'form-message ' + tipo;
  el.textContent = msg;
}

/** Limpa a mensagem global. */
function limparMensagem(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.className = 'form-message';
  el.textContent = '';
}

/**
 * Coloca o botão em estado de carregamento (loader).
 * @param {string} btnId
 * @param {boolean} carregando
 */
function setBotaoCarregando(btnId, carregando) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = carregando;
  btn.querySelector('.btn-text').hidden = carregando;
  btn.querySelector('.btn-loader').hidden = !carregando;
}

/* ================================================================
   MÓDULO: NAVEGAÇÃO (troca de telas)
   ================================================================ */

/**
 * Exibe uma tela e oculta todas as outras.
 * @param {string} screenId — ID da tela a mostrar
 */
function mostrarTela(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.toggle('hidden', s.id !== screenId);
  });
}

/* ================================================================
   MÓDULO: VALIDAÇÃO — Login
   ================================================================ */

/**
 * Valida os campos do formulário de login.
 * Retorna true se tudo estiver correto, false caso contrário.
 */
function validarFormLogin() {
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;
  let valido = true;

  // Valida e-mail
  limparCampo('field-login-email');
  if (!email.trim()) {
    mostrarErroCampo('field-login-email', 'Informe seu e-mail.');
    valido = false;
  } else if (!emailValido(email)) {
    mostrarErroCampo('field-login-email', 'Formato de e-mail inválido.');
    valido = false;
  } else {
    marcarCampoValido('field-login-email');
  }

  // Valida senha
  limparCampo('field-login-senha');
  if (!senha) {
    mostrarErroCampo('field-login-senha', 'Informe sua senha.');
    valido = false;
  } else {
    marcarCampoValido('field-login-senha');
  }

  return valido;
}

/* ================================================================
   MÓDULO: VALIDAÇÃO — Cadastro
   ================================================================ */

/**
 * Valida os campos do formulário de cadastro.
 * Retorna true se tudo estiver correto, false caso contrário.
 */
function validarFormCadastro() {
  const nome      = document.getElementById('cad-nome').value;
  const email     = document.getElementById('cad-email').value;
  const senha     = document.getElementById('cad-senha').value;
  const confirmar = document.getElementById('cad-confirmar').value;
  let valido = true;

  // Nome
  limparCampo('field-cad-nome');
  if (!nome.trim()) {
    mostrarErroCampo('field-cad-nome', 'Informe seu nome.');
    valido = false;
  } else if (nome.trim().length < 2) {
    mostrarErroCampo('field-cad-nome', 'Nome muito curto (mínimo 2 caracteres).');
    valido = false;
  } else {
    marcarCampoValido('field-cad-nome');
  }

  // E-mail
  limparCampo('field-cad-email');
  if (!email.trim()) {
    mostrarErroCampo('field-cad-email', 'Informe seu e-mail.');
    valido = false;
  } else if (!emailValido(email)) {
    mostrarErroCampo('field-cad-email', 'Formato de e-mail inválido.');
    valido = false;
  } else {
    marcarCampoValido('field-cad-email');
  }

  // Senha
  limparCampo('field-cad-senha');
  if (!senha) {
    mostrarErroCampo('field-cad-senha', 'Crie uma senha.');
    valido = false;
  } else if (senha.length < 8) {
    mostrarErroCampo('field-cad-senha', 'A senha deve ter pelo menos 8 caracteres.');
    valido = false;
  } else {
    marcarCampoValido('field-cad-senha');
  }

  // Confirmação
  limparCampo('field-cad-confirmar');
  if (!confirmar) {
    mostrarErroCampo('field-cad-confirmar', 'Confirme sua senha.');
    valido = false;
  } else if (confirmar !== senha) {
    mostrarErroCampo('field-cad-confirmar', 'As senhas não coincidem.');
    valido = false;
  } else if (senha.length >= 8) {
    marcarCampoValido('field-cad-confirmar');
  }

  return valido;
}

/* ================================================================
   MÓDULO: AÇÕES DO DASHBOARD
   ================================================================ */

/**
 * Preenche os dados do dashboard com as informações da sessão.
 * @param {object} sessao
 */
function preencherDashboard(sessao) {
  // Inicial do avatar
  const inicial = sessao.nome.charAt(0).toUpperCase();
  document.getElementById('dash-avatar').textContent = inicial;

  // Nome e email no header
  document.getElementById('dash-username').textContent = sessao.nome;

  // Boas vindas
  document.getElementById('dash-nome').textContent = sessao.nome.split(' ')[0];

  // Email truncado
  const emailEl = document.getElementById('dash-email-display');
  if (emailEl) emailEl.textContent = sessao.email;

  // Data de cadastro
  const dataEl = document.getElementById('dash-data');
  if (dataEl && sessao.criadoEm) {
    dataEl.textContent = formatarData(sessao.criadoEm);
  }
}

/* ================================================================
   INICIALIZAÇÃO — Event Listeners
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Proteção de rota: verifica sessão ativa ao carregar ── */
  const sessaoAtiva = sessaoLer();
  if (sessaoAtiva) {
    preencherDashboard(sessaoAtiva);
    mostrarTela('screen-dashboard');
  } else {
    mostrarTela('screen-login');
  }

  /* ── 2. Navegação entre telas (botões "troca de tela") ── */
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      const alvo = btn.dataset.goto;
      mostrarTela(alvo);
      // Limpa formulários e mensagens ao trocar de tela
      document.querySelectorAll('form').forEach(f => f.reset());
      document.querySelectorAll('.field').forEach(f => {
        f.classList.remove('has-error', 'has-success');
        const err = f.querySelector('.field-error');
        if (err) err.textContent = '';
      });
      limparMensagem('login-message');
      limparMensagem('cadastro-message');
      // Reseta barra de força
      const fill = document.getElementById('strength-fill');
      const label = document.getElementById('strength-label');
      if (fill) { fill.style.width = '0'; fill.removeAttribute('data-level'); }
      if (label) label.textContent = '';
    });
  });

  /* ── 3. Toggle mostrar/ocultar senha ── */
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      // Alterna tipo do input
      input.type = input.type === 'password' ? 'text' : 'password';
      // Muda ícone
      btn.querySelector('.eye').textContent = input.type === 'password' ? '👁' : '🙈';
    });
  });

  /* ── 4. Indicador de força de senha (cadastro) ── */
  document.getElementById('cad-senha')?.addEventListener('input', (e) => {
    const { nivel, texto } = avaliarForca(e.target.value);
    const fill  = document.getElementById('strength-fill');
    const label = document.getElementById('strength-label');
    if (fill)  { fill.setAttribute('data-level', nivel); }
    if (label) { label.textContent = texto; }
  });

  /* ── 5. Validação em tempo real — blur nos campos de login ── */
  document.getElementById('login-email')?.addEventListener('blur', () => {
    const v = document.getElementById('login-email').value;
    if (!v) return;
    if (!emailValido(v)) mostrarErroCampo('field-login-email', 'E-mail inválido.');
    else marcarCampoValido('field-login-email');
  });

  /* ── 6. Validação em tempo real — blur nos campos de cadastro ── */
  document.getElementById('cad-email')?.addEventListener('blur', () => {
    const v = document.getElementById('cad-email').value;
    if (!v) return;
    if (!emailValido(v)) mostrarErroCampo('field-cad-email', 'E-mail inválido.');
    else marcarCampoValido('field-cad-email');
  });

  document.getElementById('cad-confirmar')?.addEventListener('input', () => {
    const senha     = document.getElementById('cad-senha').value;
    const confirmar = document.getElementById('cad-confirmar').value;
    if (!confirmar) return;
    if (confirmar !== senha) mostrarErroCampo('field-cad-confirmar', 'As senhas não coincidem.');
    else marcarCampoValido('field-cad-confirmar');
  });

  /* ═══════════════════════════════════════════════════════════
     7. SUBMIT — FORMULÁRIO DE LOGIN
  ═══════════════════════════════════════════════════════════ */
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparMensagem('login-message');

    // Valida campos visuais
    if (!validarFormLogin()) return;

    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const senha = document.getElementById('login-senha').value;

    // Simula latência de rede (UX realista)
    setBotaoCarregando('btn-login', true);
    await new Promise(r => setTimeout(r, 800));

    try {
      // Busca usuário no "banco"
      const usuario = dbBuscarPorEmail(email);

      if (!usuario) {
        mostrarMensagem('login-message', 'error', 'E-mail não encontrado. Verifique ou crie uma conta.');
        return;
      }

      // Compara o hash da senha fornecida com o hash armazenado
      const hashDigitado = await hashSenha(senha);
      if (hashDigitado !== usuario.senha) {
        mostrarMensagem('login-message', 'error', 'Senha incorreta. Tente novamente.');
        mostrarErroCampo('field-login-senha', 'Senha incorreta.');
        return;
      }

      // Cria sessão (sem expor a senha)
      const { senha: _, ...dadosSeguros } = usuario;
      const sessao = sessaoCriar(dadosSeguros);

      // Feedback de sucesso e redireciona
      mostrarMensagem('login-message', 'success', 'Login realizado! Redirecionando...');
      await new Promise(r => setTimeout(r, 700));
      preencherDashboard(sessao);
      mostrarTela('screen-dashboard');

    } finally {
      setBotaoCarregando('btn-login', false);
    }
  });

  /* ═══════════════════════════════════════════════════════════
     8. SUBMIT — FORMULÁRIO DE CADASTRO
  ═══════════════════════════════════════════════════════════ */
  document.getElementById('form-cadastro')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparMensagem('cadastro-message');

    // Valida campos visuais
    if (!validarFormCadastro()) return;

    const nome      = document.getElementById('cad-nome').value.trim();
    const email     = document.getElementById('cad-email').value.trim().toLowerCase();
    const senha     = document.getElementById('cad-senha').value;

    // Simula latência de rede
    setBotaoCarregando('btn-cadastro', true);
    await new Promise(r => setTimeout(r, 900));

    try {
      // Verifica se e-mail já está cadastrado (evitar duplicatas)
      if (dbBuscarPorEmail(email)) {
        mostrarMensagem('cadastro-message', 'error', 'Este e-mail já está cadastrado. Faça login.');
        mostrarErroCampo('field-cad-email', 'E-mail já em uso.');
        return;
      }

      // Hash da senha antes de armazenar
      const senhaHash = await hashSenha(senha);

      // Persiste o novo usuário
      const novoUsuario = dbCriarUsuario({ nome, email, senhaHash });

      // Inicia sessão automaticamente após cadastro
      const sessao = sessaoCriar(novoUsuario);

      mostrarMensagem('cadastro-message', 'success', 'Conta criada com sucesso! Entrando...');
      await new Promise(r => setTimeout(r, 700));
      preencherDashboard(sessao);
      mostrarTela('screen-dashboard');

    } finally {
      setBotaoCarregando('btn-cadastro', false);
    }
  });

  /* ═══════════════════════════════════════════════════════════
     9. LOGOUT
  ═══════════════════════════════════════════════════════════ */
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    sessaoDestruir();
    // Limpa tudo e volta para login
    document.querySelectorAll('form').forEach(f => f.reset());
    mostrarTela('screen-login');
  });

}); // fim DOMContentLoaded
