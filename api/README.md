# API OKR/KPI

API de autenticação e persistência dos valores dos indicadores para o dashboard OKR/KPI. Usa arquivos JSON em `api/data/` (users.json, valores.json) para persistência; não requer banco de dados nem módulos nativos.

## Desenvolvimento

1. Instalar dependências: `npm install`
2. Criar primeiro usuário: `node seed-user.js [usuario] [senha]` (padrão: admin / admin123)
3. Iniciar a API: `npm start` (porta 3001)
4. Abrir no navegador: http://localhost:3001/okr-kpi.html (a API também serve os arquivos estáticos do projeto)

## Produção

- Defina a variável de ambiente `JWT_SECRET` com um valor forte e aleatório.
- Altere a senha do usuário admin (ou crie usuários e desative o admin).
- Se o front for hospedado em outro domínio, o CORS já permite qualquer origem (`cors({ origin: true })`). Para restringir, altere em `server.js` para `cors({ origin: 'https://seu-dominio.com' })`.
- Na página OKR/KPI, se a API estiver em outro host, defina antes do carregamento do script: `window.API_BASE = 'https://url-da-sua-api.com';`
