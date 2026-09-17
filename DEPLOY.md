# Docker e Render

## Docker local

Crie um arquivo `.env` na raiz com as credenciais da aplicação e execute:

```bash
docker compose up --build
```

A loja ficará em `http://localhost:3001`. O PostgreSQL local ficará em `localhost:5432`.

Para parar os serviços:

```bash
docker compose down
```

## Render

1. Envie este repositório para o GitHub.
2. No Render, escolha **New +** e depois **Blueprint**.
3. Selecione o repositório. O arquivo `render.yaml` criará o Web Service Docker e o PostgreSQL.
4. Preencha os valores secretos de `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DELIVERY_EMAIL` e `DELIVERY_PASSWORD` quando o Render solicitar.
5. Faça o deploy.

O `DATABASE_URL` é ligado automaticamente ao PostgreSQL do Render. O servidor cria as tabelas usando `e-cormeci/database/schema.sql` na primeira inicialização.

Não envie o arquivo `.env` para o GitHub. Os segredos devem ser cadastrados em **Environment** no Render.

## Autenticação na Vercel

No Firebase Console, ative os provedores **Google** e **E-mail/senha** em Authentication.
Depois cadastre o domínio da Vercel em Authentication > Settings > Authorized domains.

Na Vercel, adicione estas variáveis para o frontend:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Três sites separados

Crie três projetos na Vercel usando a mesma branch `fullstack-render-completo` e configure `VITE_SITE_ROLE`:

- Loja do cliente: `VITE_SITE_ROLE=cliente`
- Painel administrativo: `VITE_SITE_ROLE=admin`
- Painel do entregador: `VITE_SITE_ROLE=entregador`

Todos os três precisam de `VITE_API_URL` apontando para a API do Render. O site do cliente usa também as variáveis do Firebase. Admin e entregador exibem apenas seus próprios formulários de acesso e não dependem do login do cliente.

Esses valores ficam na configuração do aplicativo Web do Firebase. Eles podem estar no frontend; as senhas dos usuários são processadas pelo Firebase e não devem ser colocadas neste projeto.