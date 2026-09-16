# React + Vite

## Banco de dados

O schema PostgreSQL da loja está em [`database/schema.sql`](database/schema.sql). Com o PostgreSQL instalado, crie um banco e execute:

```bash
createdb e_cormeci
psql e_cormeci -f database/schema.sql
```

O frontend atual ainda utiliza dados locais de demonstração. A conexão com o banco deve ser feita por uma API backend; não coloque credenciais ou a senha do banco no código Vite executado no navegador.

## Painéis protegidos

Copie `../.env.example` para `.env` na raiz do projeto e configure `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DELIVERY_EMAIL` e `DELIVERY_PASSWORD`. Essas credenciais ficam somente no servidor.

- `Admin`: cadastra produtos com nome, descrição, preço, estoque e URL da foto.
- `Entregas`: mostra pedidos aguardando entrega, endereço e itens. O entregador confirma a entrega digitando o código de seis números informado pelo cliente.
- O cliente recebe o código na tela depois de finalizar a compra.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
