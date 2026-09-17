-- Schema inicial do e-cormeci.
-- Execute em um banco PostgreSQL vazio com:
-- psql "$DATABASE_URL" -f database/schema.sql

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    imagem TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enderecos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    rua VARCHAR(150) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(50),
    bairro VARCHAR(50) NOT NULL,
    cidade VARCHAR(50) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(9) NOT NULL
);

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    cliente_id VARCHAR(128),
    endereco_id INT REFERENCES enderecos(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'aguardando_pagamento',
    valor_total NUMERIC(10, 2) NOT NULL,
    endereco_entrega TEXT,
    codigo_entrega VARCHAR(6),
    entregador_id INT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INT REFERENCES produtos(id) ON DELETE SET NULL,
    quantidade INT NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id
    ON produtos (categoria_id);

CREATE INDEX IF NOT EXISTS idx_enderecos_usuario_id
    ON enderecos (usuario_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id
    ON pedidos (usuario_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_endereco_id
    ON pedidos (endereco_id);

CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id
    ON itens_pedido (pedido_id);

CREATE INDEX IF NOT EXISTS idx_itens_pedido_produto_id
    ON itens_pedido (produto_id);

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_entrega TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_entrega VARCHAR(6);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entregador_id INT;

CREATE INDEX IF NOT EXISTS idx_pedidos_status
    ON pedidos (status);