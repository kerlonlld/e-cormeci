import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pg from 'pg'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const { Pool } = pg
const porta = process.env.PORT || 3001
const diretorioAtual = path.dirname(fileURLToPath(import.meta.url))
const diretorioFrontend = path.join(diretorioAtual, 'e-cormeci', 'dist')
const arquivoSchema = path.join(diretorioAtual, 'e-cormeci', 'database', 'schema.sql')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static(diretorioFrontend))

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

const sessoes = new Map()
const adminEmail = process.env.ADMIN_EMAIL || ''
const adminSenha = process.env.ADMIN_PASSWORD || ''
const entregadorEmail = process.env.DELIVERY_EMAIL || ''
const entregadorSenha = process.env.DELIVERY_PASSWORD || ''

function exigirSessao(tipo) {
    return (req, res, next) => {
        const token = req.headers.authorization?.replace('Bearer ', '')
        const sessao = token ? sessoes.get(token) : null

        if (!sessao || sessao.tipo !== tipo) {
            return res.status(401).json({ error: 'Acesso não autorizado' })
        }

        req.sessao = sessao
        next()
    }
}

function criarCodigoEntrega() {
    return crypto.randomInt(100000, 1000000).toString()
}

function criarIdTransacao() {
    return `TRX-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

async function criarCobrancaPixMercadoPago({ pedidoId, valor, email }) {
    if (!process.env.MP_ACCESS_TOKEN) return null

    const resposta = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `pedido-${pedidoId}`,
        },
        body: JSON.stringify({
            transaction_amount: Number(valor),
            description: `Pedido e-cormeci #${pedidoId}`,
            payment_method_id: 'pix',
            payer: { email: email || process.env.ADMIN_EMAIL },
            external_reference: String(pedidoId),
            notification_url: process.env.MP_WEBHOOK_URL,
        }),
    })

    const dados = await resposta.json()
    if (!resposta.ok) throw new Error(dados.message || 'Mercado Pago recusou a cobrança PIX')

    return {
        id: String(dados.id),
        status: dados.status,
        copiaECola: dados.point_of_interaction?.transaction_data?.qr_code || '',
        qrCodeBase64: dados.point_of_interaction?.transaction_data?.qr_code_base64 || '',
    }
}

app.post('/api/acesso/login', (req, res) => {
    const { tipo, email, senha } = req.body
    const credenciais = tipo === 'admin'
        ? { email: adminEmail, senha: adminSenha }
        : { email: entregadorEmail, senha: entregadorSenha }

    if (!credenciais.email || !credenciais.senha) {
        return res.status(503).json({ error: 'Credenciais não configuradas no servidor' })
    }

    if (email !== credenciais.email || senha !== credenciais.senha) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    sessoes.set(token, { tipo, email })
    res.json({ token, tipo })
})

app.get('/api/produtos', async (_req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, nome, descricao, preco, estoque, imagem AS img
            FROM produtos
            WHERE ativo = true
            ORDER BY nome
        `)

        res.json(resultado.rows)
    } catch (error) {
        console.error('Erro ao buscar produtos:', error)
        res.status(500).json({ error: 'Erro interno do servidor' })
    }
})

app.post('/api/admin/produtos', exigirSessao('admin'), async (req, res) => {
    const { nome, descricao = '', preco, estoque = 0, imagem = '' } = req.body

    if (!nome?.trim() || !Number.isFinite(Number(preco)) || Number(preco) < 0) {
        return res.status(400).json({ error: 'Nome e preço são obrigatórios' })
    }

    try {
        const resultado = await pool.query(
            `INSERT INTO produtos (nome, descricao, preco, estoque, imagem)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, nome, descricao, preco, estoque, imagem AS img`,
            [nome.trim(), descricao.trim(), Number(preco), Number(estoque), imagem.trim()]
        )
        res.status(201).json(resultado.rows[0])
    } catch (error) {
        console.error('Erro ao criar produto:', error)
        res.status(500).json({ error: 'Erro ao criar produto' })
    }
})

app.put('/api/admin/produtos/:id', exigirSessao('admin'), async (req, res) => {
    const { nome, descricao = '', preco, estoque = 0, imagem = '', ativo = true } = req.body

    try {
        const resultado = await pool.query(
            `UPDATE produtos
             SET nome = $1, descricao = $2, preco = $3, estoque = $4, imagem = $5, ativo = $6
             WHERE id = $7
             RETURNING id, nome, descricao, preco, estoque, imagem AS img, ativo`,
            [nome.trim(), descricao.trim(), Number(preco), Number(estoque), imagem.trim(), Boolean(ativo), req.params.id]
        )

        if (resultado.rowCount === 0) return res.status(404).json({ error: 'Produto não encontrado' })
        res.json(resultado.rows[0])
    } catch (error) {
        console.error('Erro ao atualizar produto:', error)
        res.status(500).json({ error: 'Erro ao atualizar produto' })
    }
})

app.delete('/api/admin/produtos/:id', exigirSessao('admin'), async (req, res) => {
    try {
        await pool.query('UPDATE produtos SET ativo = false WHERE id = $1', [req.params.id])
        res.status(204).end()
    } catch (error) {
        console.error('Erro ao remover produto:', error)
        res.status(500).json({ error: 'Erro ao remover produto' })
    }
})

app.get('/api/pedidos', async (req, res) => {
    try {
        const clienteId = String(req.query.clienteId || '').trim()
        if (!clienteId) return res.json([])
        const resultado = await pool.query(`
            SELECT
                pedidos.id,
                pedidos.valor_total AS valor,
                pedidos.criado_em AS data,
                pedidos.status,
                pedidos.metodo_pagamento AS "metodoPagamento",
                pedidos.status_pagamento AS "statusPagamento",
                pedidos.id_transacao AS "idTransacao",
                pedidos.chave_pix AS "chavePix",
                pedidos.pagamento_expira_em AS "pagamentoExpiraEm",
                pedidos.pix_copia_e_cola AS "pixCopiaECola",
                pedidos.pix_qr_code_base64 AS "pixQrCodeBase64",
                pedidos.endereco_entrega AS endereco,
                pedidos.codigo_entrega AS "codigoEntrega",
                COALESCE(
                    json_agg(
                        json_build_object(
                            'nome', produtos.nome,
                            'quantidade', itens_pedido.quantidade,
                            'preco', itens_pedido.preco_unitario,
                            'img', produtos.imagem
                        )
                        ORDER BY itens_pedido.id
                    ) FILTER (WHERE itens_pedido.id IS NOT NULL),
                    '[]'::json
                ) AS itens
            FROM pedidos
            LEFT JOIN itens_pedido ON itens_pedido.pedido_id = pedidos.id
            LEFT JOIN produtos ON produtos.id = itens_pedido.produto_id
            WHERE pedidos.cliente_id = $1
            GROUP BY pedidos.id
            ORDER BY pedidos.criado_em DESC
        `, [clienteId])

        res.json(resultado.rows)
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error)
        res.status(500).json({ error: 'Erro interno do servidor' })
    }
})

app.post('/api/pedidos', async (req, res) => {
    const { clienteId, email, valorTotal, itens, endereco, metodoPagamento } = req.body
    const metodosPagamento = ['cartao', 'pix', 'dinheiro']

    if (!clienteId || !Number.isFinite(Number(valorTotal)) || !Array.isArray(itens) || itens.length === 0 || !metodosPagamento.includes(metodoPagamento)) {
        return res.status(400).json({ error: 'Pedido inválido' })
    }
    if (metodoPagamento === 'pix' && !process.env.MP_ACCESS_TOKEN) {
        return res.status(503).json({ error: 'PIX automático ainda não está configurado no servidor' })
    }

    const cliente = await pool.connect()

    try {
        await cliente.query('BEGIN')

        const codigoEntrega = criarCodigoEntrega()
        const pedido = await cliente.query(
            `INSERT INTO pedidos
                     (cliente_id, valor_total, endereco_entrega, codigo_entrega, status, metodo_pagamento, status_pagamento, id_transacao, chave_pix, pagamento_expira_em)
                     VALUES ($1, $2, $3, $4,
                         CASE WHEN $5 = 'pix' THEN 'aguardando_pagamento' ELSE 'aguardando_entrega' END,
                         $5,
                         CASE WHEN $5 = 'pix' THEN 'pendente' ELSE 'pago' END,
                         $6, $7, NOW() + INTERVAL '10 minutes')
             RETURNING id, valor_total AS valor, criado_em AS data, status, endereco_entrega AS endereco,
                       metodo_pagamento AS "metodoPagamento", status_pagamento AS "statusPagamento",
                       id_transacao AS "idTransacao", chave_pix AS "chavePix", pagamento_expira_em AS "pagamentoExpiraEm"`,
            [clienteId, Number(valorTotal), endereco?.trim() || 'Endereço não informado', codigoEntrega, metodoPagamento, criarIdTransacao(), process.env.PIX_KEY || '38998625393']
        )

        for (const item of itens) {
            await cliente.query(
                `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
                 VALUES ($1, $2, $3, $4)`,
                [pedido.rows[0].id, item.produtoId, Number(item.quantidade), Number(item.preco)]
            )
        }

        let cobrancaPix = null
        if (metodoPagamento === 'pix') {
            cobrancaPix = await criarCobrancaPixMercadoPago({
                pedidoId: pedido.rows[0].id,
                valor: valorTotal,
                email,
            })
            if (cobrancaPix) {
                await cliente.query(
                    `UPDATE pedidos
                     SET gateway_pagamento_id = $1, pix_copia_e_cola = $2, pix_qr_code_base64 = $3
                     WHERE id = $4`,
                    [cobrancaPix.id, cobrancaPix.copiaECola, cobrancaPix.qrCodeBase64, pedido.rows[0].id]
                )
            }
        }

        await cliente.query('COMMIT')
        res.status(201).json({
            ...pedido.rows[0],
            codigoEntrega,
            itens,
            pixCopiaECola: cobrancaPix?.copiaECola || pedido.rows[0].chavePix,
            pixQrCodeBase64: cobrancaPix?.qrCodeBase64 || '',
        })
    } catch (error) {
        await cliente.query('ROLLBACK')
        console.error('Erro ao salvar pedido:', error)
        res.status(500).json({ error: 'Erro ao salvar pedido' })
    } finally {
        cliente.release()
    }
})

app.post('/api/pagamentos/mercadopago/webhook', async (req, res) => {
    res.sendStatus(200)

    const pagamentoId = req.body?.data?.id || req.query['data.id']
    if (!pagamentoId || !process.env.MP_ACCESS_TOKEN) return

    try {
        const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
            headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
        })
        const pagamento = await resposta.json()
        if (!resposta.ok || pagamento.status !== 'approved') return

        await pool.query(
            `UPDATE pedidos
             SET status_pagamento = 'pago', status = 'aguardando_entrega', pago_em = NOW()
             WHERE id = $1 AND status_pagamento = 'pendente'`,
            [pagamento.external_reference]
        )
    } catch (error) {
        console.error('Erro no webhook do Mercado Pago:', error)
    }
})

app.get('/api/pedidos/:id/pagamento', async (req, res) => {
    try {
        const resultado = await pool.query(
                `SELECT id, status, status_pagamento AS "statusPagamento", metodo_pagamento AS "metodoPagamento",
                    id_transacao AS "idTransacao", chave_pix AS "chavePix", pagamento_expira_em AS "pagamentoExpiraEm",
                    pix_copia_e_cola AS "pixCopiaECola", pix_qr_code_base64 AS "pixQrCodeBase64"
             FROM pedidos WHERE id = $1`,
            [req.params.id]
        )
        if (resultado.rowCount === 0) return res.status(404).json({ error: 'Pedido não encontrado' })
        res.json(resultado.rows[0])
    } catch (error) {
        console.error('Erro ao consultar pagamento:', error)
        res.status(500).json({ error: 'Erro ao consultar pagamento' })
    }
})

app.get('/api/admin/pagamentos', exigirSessao('admin'), async (_req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT id, valor_total AS valor, criado_em AS data, status, metodo_pagamento AS "metodoPagamento",
                    status_pagamento AS "statusPagamento", id_transacao AS "idTransacao", chave_pix AS "chavePix"
             FROM pedidos WHERE status_pagamento = 'pendente' ORDER BY criado_em ASC`
        )
        res.json(resultado.rows)
    } catch (error) {
        console.error('Erro ao buscar pagamentos:', error)
        res.status(500).json({ error: 'Erro ao buscar pagamentos' })
    }
})

app.get('/api/admin/resumo-compras', exigirSessao('admin'), async (_req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE criado_em >= CURRENT_DATE AND status <> 'cancelado')::int AS compras_dia,
                COALESCE(SUM(valor_total) FILTER (WHERE criado_em >= CURRENT_DATE AND status <> 'cancelado'), 0) AS valor_dia,
                COUNT(*) FILTER (WHERE criado_em >= CURRENT_DATE - INTERVAL '6 days' AND status <> 'cancelado')::int AS compras_semana,
                COALESCE(SUM(valor_total) FILTER (WHERE criado_em >= CURRENT_DATE - INTERVAL '6 days' AND status <> 'cancelado'), 0) AS valor_semana,
                COUNT(*) FILTER (WHERE criado_em >= date_trunc('month', CURRENT_DATE) AND status <> 'cancelado')::int AS compras_mes,
                COALESCE(SUM(valor_total) FILTER (WHERE criado_em >= date_trunc('month', CURRENT_DATE) AND status <> 'cancelado'), 0) AS valor_mes,
                COUNT(*) FILTER (WHERE criado_em >= CURRENT_DATE AND status = 'entregue')::int AS entregues_dia,
                COUNT(*) FILTER (WHERE criado_em >= CURRENT_DATE - INTERVAL '6 days' AND status = 'entregue')::int AS entregues_semana,
                COUNT(*) FILTER (WHERE criado_em >= date_trunc('month', CURRENT_DATE) AND status = 'entregue')::int AS entregues_mes
            FROM pedidos
        `)
        res.json(resultado.rows[0])
    } catch (error) {
        console.error('Erro ao buscar resumo de compras:', error)
        res.status(500).json({ error: 'Erro ao buscar resumo de compras' })
    }
})

app.post('/api/admin/pedidos/:id/confirmar-pagamento', exigirSessao('admin'), async (req, res) => {
    try {
        const resultado = await pool.query(
            `UPDATE pedidos
             SET status_pagamento = 'pago', status = 'aguardando_entrega', pago_em = NOW()
             WHERE id = $1 AND status_pagamento = 'pendente'
             RETURNING id, status, status_pagamento AS "statusPagamento", id_transacao AS "idTransacao"`,
            [req.params.id]
        )
        if (resultado.rowCount === 0) return res.status(400).json({ error: 'Pagamento já confirmado ou pedido inválido' })
        res.json(resultado.rows[0])
    } catch (error) {
        console.error('Erro ao confirmar pagamento:', error)
        res.status(500).json({ error: 'Erro ao confirmar pagamento' })
    }
})

app.post('/api/pedidos/:id/cancelar', async (req, res) => {
    try {
        const resultado = await pool.query(
            `UPDATE pedidos
             SET status = 'cancelado'
             WHERE id = $1 AND status IN ('aguardando_pagamento', 'aguardando_entrega', 'em_entrega')
             RETURNING id, status`,
            [req.params.id]
        )

        if (resultado.rowCount === 0) {
            return res.status(400).json({ error: 'Este pedido não pode mais ser cancelado' })
        }

        res.json(resultado.rows[0])
    } catch (error) {
        console.error('Erro ao cancelar pedido:', error)
        res.status(500).json({ error: 'Erro ao cancelar pedido' })
    }
})

app.get('/api/entregas/pedidos', exigirSessao('entregador'), async (_req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT pedidos.id, pedidos.valor_total AS valor, pedidos.criado_em AS data,
                   pedidos.status, pedidos.endereco_entrega AS endereco,
                   COALESCE(json_agg(json_build_object(
                       'nome', produtos.nome,
                       'quantidade', itens_pedido.quantidade,
                       'img', produtos.imagem
                   ) ORDER BY itens_pedido.id) FILTER (WHERE itens_pedido.id IS NOT NULL), '[]'::json) AS itens
            FROM pedidos
            LEFT JOIN itens_pedido ON itens_pedido.pedido_id = pedidos.id
            LEFT JOIN produtos ON produtos.id = itens_pedido.produto_id
            WHERE pedidos.status IN ('aguardando_entrega', 'em_entrega')
            GROUP BY pedidos.id
            ORDER BY pedidos.criado_em ASC
        `)
        res.json(resultado.rows)
    } catch (error) {
        console.error('Erro ao buscar entregas:', error)
        res.status(500).json({ error: 'Erro ao buscar entregas' })
    }
})

app.post('/api/entregas/pedidos/:id/confirmar', exigirSessao('entregador'), async (req, res) => {
    const codigo = String(req.body.codigo || '').trim()

    if (!/^\d{6}$/.test(codigo)) return res.status(400).json({ error: 'Digite o código de 6 números' })

    try {
        const resultado = await pool.query(
            `UPDATE pedidos
             SET status = 'entregue', entregador_id = NULL
             WHERE id = $1 AND codigo_entrega = $2 AND status IN ('aguardando_entrega', 'em_entrega')
             RETURNING id, status`,
            [req.params.id, codigo]
        )

        if (resultado.rowCount === 0) return res.status(400).json({ error: 'Código incorreto ou pedido já entregue' })
        res.json(resultado.rows[0])
    } catch (error) {
        console.error('Erro ao confirmar entrega:', error)
        res.status(500).json({ error: 'Erro ao confirmar entrega' })
    }
})

app.post('/api/entregas/pedidos/:id/cancelar', exigirSessao('entregador'), async (req, res) => {
    try {
        const resultado = await pool.query(
            `UPDATE pedidos
             SET status = 'cancelado'
             WHERE id = $1 AND status IN ('aguardando_entrega', 'em_entrega')
             RETURNING id, status`,
            [req.params.id]
        )

        if (resultado.rowCount === 0) return res.status(400).json({ error: 'Este pedido não pode mais ser cancelado' })
        res.json(resultado.rows[0])
    } catch (error) {
        console.error('Erro ao cancelar entrega:', error)
        res.status(500).json({ error: 'Erro ao cancelar entrega' })
    }
})

app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        return res.sendFile(path.join(diretorioFrontend, 'index.html'))
    }
    next()
})

async function iniciarServidor() {
    await pool.query(fs.readFileSync(arquivoSchema, 'utf8'))
    await pool.query(`
        ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem TEXT;
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_entrega TEXT;
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_id VARCHAR(128);
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_entrega VARCHAR(6);
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entregador_id INT;
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS metodo_pagamento VARCHAR(20);
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS status_pagamento VARCHAR(20) NOT NULL DEFAULT 'pago';
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS id_transacao VARCHAR(80);
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS chave_pix TEXT;
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagamento_expira_em TIMESTAMP;
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pago_em TIMESTAMP;
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS gateway_pagamento_id VARCHAR(100);
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pix_copia_e_cola TEXT;
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pix_qr_code_base64 TEXT;
        CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos (status);
    `)

    app.listen(porta, '0.0.0.0', () => {
        console.log(`API rodando na porta ${porta}`)
    })
}

iniciarServidor().catch((error) => {
    console.error('Não foi possível preparar o banco de dados:', error)
    process.exit(1)
})
