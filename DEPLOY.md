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