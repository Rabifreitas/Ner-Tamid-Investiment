---
description: Deploy Ner Tamid to Production
---
// turbo-all
1. Instalar dependências no servidor: `cd server && npm install && cd ../client && npm install`
2. Executar migrações: `cd server && npm run db:migrate`
3. Realizar build do Backend: `cd server && npm run build`
4. Realizar build do Frontend: `cd client && npm run build`
5. Reiniciar processos via PM2: `pm2 restart all || pm2 start server/dist/index.js --name nertamid`
