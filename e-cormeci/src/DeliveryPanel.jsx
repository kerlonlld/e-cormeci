import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin)

export function DeliveryPanel({ onVoltar }) {
  // Sessão exclusiva do entregador e lista dos pedidos liberados para entrega.
  const [token, setToken] = useState(() => localStorage.getItem('delivery-token-e-cormeci') || '')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [pedidos, setPedidos] = useState([])
  const [codigos, setCodigos] = useState({})
  const [mensagem, setMensagem] = useState('')

  const carregarPedidos = async () => {
    // Atualiza os pedidos liberados pelo pagamento ou pelo método presencial.
    const resposta = await fetch(`${API}/api/entregas/pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (resposta.status === 401) {
      localStorage.removeItem('delivery-token-e-cormeci')
      setToken('')
      setMensagem('Sua sessão expirou. Entre novamente para continuar.')
      return
    }

    if (!resposta.ok) throw new Error('Não foi possível carregar os pedidos.')
    setPedidos(await resposta.json())
  }

  useEffect(() => {
    if (!token) return

    carregarPedidos().catch(() => setMensagem('Não foi possível carregar os pedidos.'))
    const intervalo = setInterval(() => {
      carregarPedidos().catch(() => setMensagem('Não foi possível carregar os pedidos.'))
    }, 10000)

    return () => clearInterval(intervalo)
  }, [token])

  const entrar = async (evento) => {
    evento.preventDefault()
    const resposta = await fetch(`${API}/api/acesso/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'entregador', email, senha }),
    })
    const dados = await resposta.json()
    if (!resposta.ok) return setMensagem(dados.error || 'Não foi possível entrar.')
    localStorage.setItem('delivery-token-e-cormeci', dados.token)
    setToken(dados.token)
  }

  const confirmar = async (id) => {
    // Confirma recebimento do dinheiro/cartão e entrega usando o código do cliente.
    const resposta = await fetch(`${API}/api/entregas/pedidos/${id}/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ codigo: codigos[id] || '' }),
    })
    const dados = await resposta.json()
    setMensagem(resposta.ok ? 'Entrega confirmada.' : dados.error || 'Código inválido.')
    if (resposta.ok) setPedidos((lista) => lista.filter((pedido) => pedido.id !== id))
  }

  const cancelar = async (id) => {
    const resposta = await fetch(`${API}/api/entregas/pedidos/${id}/cancelar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const dados = await resposta.json()
    setMensagem(resposta.ok ? 'Pedido cancelado.' : dados.error || 'Não foi possível cancelar o pedido.')
    if (resposta.ok) setPedidos((lista) => lista.filter((pedido) => pedido.id !== id))
  }

  if (!token) {
    return (
      <main className="painel-acesso">
        <form className="painel-login" onSubmit={entrar}>
          <button type="button" className="botao-voltar" onClick={onVoltar}>← Voltar</button>
          <span className="rotulo-cartao">Área de entregas</span>
          <h2>Entrar como entregador</h2>
          <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
          <button className="botao-confirmar" type="submit">Entrar</button>
          {mensagem && <p className="mensagem-erro">{mensagem}</p>}
        </form>
      </main>
    )
  }

  return (
    <main className="painel-admin painel-entregas">
      <div className="painel-topo">
        <div><span className="rotulo-cartao">Operação de rua</span><h1>Pedidos para entregar</h1></div>
        <div className="painel-acoes"><button className="botao-secundario" onClick={onVoltar}>Loja</button><button className="botao-secundario" onClick={() => { localStorage.removeItem('delivery-token-e-cormeci'); setToken('') }}>Sair</button></div>
      </div>
      {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}
      <section className="lista-entregas">
        {pedidos.length === 0 && <div className="perfil-cartao"><p className="texto-vazio">Nenhum pedido aguardando entrega.</p></div>}
        {pedidos.map((pedido) => (
          <article className="card-entrega" key={pedido.id}>
            <div className="entrega-cabecalho"><strong>Pedido #{pedido.id}</strong><span>{new Date(pedido.data).toLocaleString('pt-BR')}</span></div>
            <h3>Endereço</h3>
            <p>{pedido.endereco || 'Endereço não informado'}</p>
            <p className="itens-entrega">{pedido.itens.map((item) => `${item.nome} x${item.quantidade}`).join(', ')}</p>
            <div className="confirmacao-entrega">
              <input inputMode="numeric" maxLength="6" placeholder="Código do cliente" value={codigos[pedido.id] || ''} onChange={(e) => setCodigos({ ...codigos, [pedido.id]: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
              <button className="botao-confirmar" onClick={() => confirmar(pedido.id)}>Confirmar entrega</button>
              <button className="botao-perigo" onClick={() => cancelar(pedido.id)}>Cancelar pedido</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
