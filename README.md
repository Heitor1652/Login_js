#  Sistema de Login Web (AuthFlow)

Um sistema de autenticação moderno desenvolvido com **HTML, CSS e JavaScript puro**, com simulação de backend e foco em boas práticas de segurança e experiência do usuário.

O projeto possui interface elegante, validações em tempo real e gerenciamento completo de sessão — ideal para estudos e portfólio.

# Demonstração

Interface moderna com múltiplas telas:
- Login
- Cadastro
- Dashboard (área protegida)

Com transições suaves, feedback visual e design responsivo.

# Tecnologias utilizadas

- **HTML5** — Estrutura das páginas  
- **CSS3** — Estilização moderna e responsiva  
- **JavaScript (Vanilla)** — Lógica completa do sistema  
- **Web Crypto API** — Hash de senha (SHA-256)  
- **localStorage** — Simulação de banco de dados  
- **sessionStorage** — Gerenciamento de sessão  

# Funcionalidades

- Autenticação
- Login com e-mail e senha  
- Cadastro de novos usuários  
- Validação de credenciais  

# Segurança
- Hash de senha com SHA-256  
- Tokens de sessão aleatórios  
- Proteção de rotas (dashboard)  
- Simulação de JWT no backend  

#  Validação de Formulários
- Validação em tempo real  
- Verificação de e-mail válido  
- Confirmação de senha  
- Feedback visual por campo  

# Sessão do Usuário
- Persistência com `sessionStorage`  
- Logout funcional  
- Redirecionamento automático  

# Experiência do Usuário
- Indicador de força de senha  
- Mostrar/ocultar senha  
- Mensagens de erro e sucesso 

# Estrutura do projeto 

/project
  /frontend
    index.html
    style.css
    script.js
  /backend
    server.js
    routes/
    controllers/
    models/

# Autor

Projeto desenvolvido por Heitor José Ferraz como prática de desenvolvimento web e autenticação.
