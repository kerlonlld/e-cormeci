import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin)

export function AdminPanel({ onVoltar }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin-token-e-cormeci') || '')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [produtos, setProdutos] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [resumoCompras, setResumoCompras] = useState(null)
  const [promocoes, setPromocoes] = useState([])
  const [promocao, setPromocao] = useState({ titulo: '', descricao: '', tipo: 'desconto', valor: '', imagem: '' })
  const [produto, setProduto] = useState({ nome: '', descricao: '', preco: '', estoque: '', imagem: '' })
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [mensagem, setMensagem] = useState('')

  const encerrarSessaoExpirada = (resposta) => {
    if (resposta.status !== 401) return false
    localStorage.removeItem('admin-token-e-cormeci')
    setToken('')
    setMensagem('Sua sessão expirou. Entre novamente para continuar.')
    return true
  }

  const carregarProdutos = async () => {
    const resposta = await fetch(`${API}/api/produtos`)
    if (resposta.ok) setProdutos(await resposta.json())
  }

  const carregarPagamentos = async () => {
    const resposta = await fetch(`${API}/api/admin/pagamentos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (encerrarSessaoExpirada(resposta)) return
    if (resposta.ok) setPagamentos(await resposta.json())
  }

  const carregarResumoCompras = async () => {
    const resposta = await fetch(`${API}/api/admin/resumo-compras`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (encerrarSessaoExpirada(resposta)) return
    if (resposta.ok) setResumoCompras(await resposta.json())
  }

  const carregarPromocoes = async () => {
    const resposta = await fetch(`${API}/api/promocoes`)
    if (resposta.ok) setPromocoes(await resposta.json())
  }

  useEffect(() => {
    if (!token) return
    carregarProdutos().catch(() => setMensagem('Não foi possível carregar os produtos.'))
    carregarPagamentos().catch(() => setMensagem('Não foi possível carregar os pagamentos.'))
    carregarResumoCompras().catch(() => setMensagem('Não foi possível carregar o resumo de compras.'))
    carregarPromocoes().catch(() => setMensagem('Não foi possível carregar as ofertas.'))
    const intervalo = setInterval(() => {
      carregarPagamentos().catch(() => {})
      carregarResumoCompras().catch(() => {})
    }, 10000)
    return () => clearInterval(intervalo)
  }, [token])

  const confirmarPagamento = async (id) => {
    const resposta = await fetch(`${API}/api/admin/pedidos/${id}/confirmar-pagamento`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const dados = await resposta.json()
    if (encerrarSessaoExpirada(resposta)) return
    if (!resposta.ok) return setMensagem(dados.error || 'Não foi possível confirmar o pagamento.')
    setPagamentos((lista) => lista.filter((pagamento) => pagamento.id !== id))
    setMensagem(`Pagamento confirmado. Transação: ${dados.idTransacao}`)
  }

  const salvarPromocao = async (evento) => {
    evento.preventDefault()
    const resposta = await fetch(`${API}/api/admin/promocoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...promocao, valor: Number(promocao.valor || 0) }),
    })
    const dados = await resposta.json()
    if (encerrarSessaoExpirada(resposta)) return
    if (!resposta.ok) return setMensagem(dados.error || 'Não foi possível criar a oferta.')
    setPromocoes((lista) => [dados, ...lista])
    setPromocao({ titulo: '', descricao: '', tipo: 'desconto', valor: '', imagem: '' })
    setMensagem('Oferta/anúncio publicado.')
  }

  const removerPromocao = async (id) => {
    const resposta = await fetch(`${API}/api/admin/promocoes/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    if (encerrarSessaoExpirada(resposta)) return
    if (resposta.ok) setPromocoes((lista) => lista.filter((item) => item.id !== id))
  }

  const entrar = async (evento) => {
    evento.preventDefault()
    setMensagem('')
    const resposta = await fetch(`${API}/api/acesso/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'admin', email, senha }),
    })
    const dados = await resposta.json()
    if (!resposta.ok) return setMensagem(dados.error || 'Não foi possível entrar.')
    localStorage.setItem('admin-token-e-cormeci', dados.token)
    setToken(dados.token)
  }

  const salvarProduto = async (evento) => {
    evento.preventDefault()
    const resposta = await fetch(`${API}/api/admin/produtos${produtoEditando ? `/${produtoEditando}` : ''}`, {
      method: produtoEditando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...produto, preco: Number(produto.preco), estoque: Number(produto.estoque || 0) }),
    })
    const dados = await resposta.json()
    if (encerrarSessaoExpirada(resposta)) return
    if (!resposta.ok) return setMensagem(dados.error || 'Não foi possível adicionar o produto.')
    setProdutos((lista) => {
      const atualizada = produtoEditando
        ? lista.map((item) => item.id === produtoEditando ? dados : item)
        : [...lista, dados]
      return atualizada.sort((a, b) => a.nome.localeCompare(b.nome))
    })
    setProduto({ nome: '', descricao: '', preco: '', estoque: '', imagem: '' })
    setProdutoEditando(null)
    setMensagem(produtoEditando ? 'Produto atualizado.' : 'Produto adicionado.')
  }

  const removerProduto = async (id) => {
    const resposta = await fetch(`${API}/api/admin/produtos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (encerrarSessaoExpirada(resposta)) return
    if (resposta.ok) setProdutos((lista) => lista.filter((item) => item.id !== id))
  }

  if (!token) {
    return (
      <main className="painel-acesso">
        <form className="painel-login" onSubmit={entrar}>
          <button type="button" className="botao-voltar" onClick={onVoltar}>← Voltar</button>
          <span className="rotulo-cartao">Área restrita</span>
          <h2>Entrar como administrador</h2>
          <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
          <button className="botao-confirmar" type="submit">Entrar</button>
          {mensagem && <p className="mensagem-erro">{mensagem}</p>}
        </form>
      </main>
    )
  }

  return (
    <main className="painel-admin">
      <div className="painel-topo">
        <div><span className="rotulo-cartao">Painel protegido</span><h1>Administração</h1></div>
        <div className="painel-acoes"><button className="botao-secundario" onClick={onVoltar}>Loja</button><button className="botao-secundario" onClick={() => { localStorage.removeItem('admin-token-e-cormeci'); setToken('') }}>Sair</button></div>
      </div>
      <section className="perfil-cartao pagamentos-admin">
        <h2>Pagamentos aguardando confirmação</h2>
        {pagamentos.length === 0 && <p className="texto-vazio">Nenhum pagamento pendente.</p>}
        {pagamentos.map((pagamento) => (
          <div className="linha-pagamento" key={pagamento.id}>
            <div>
              <strong>Pedido #{pagamento.id} · R$ {Number(pagamento.valor).toFixed(2)}</strong>
              <span>{pagamento.metodoPagamento} · {pagamento.idTransacao}</span>
            </div>
            <button className="botao-confirmar" onClick={() => confirmarPagamento(pagamento.id)}>Confirmar pagamento</button>
          </div>
        ))}
      </section>
      {resumoCompras && (
        <section className="perfil-cartao resumo-compras-admin">
          <h2>Resumo de compras</h2>
          <div className="tabela-resumo-scroll">
            <table className="tabela-resumo">
              <thead><tr><th>Período</th><th>Compras</th><th>Valor</th><th>Entregues</th></tr></thead>
              <tbody>
                <tr><th>Hoje</th><td>{resumoCompras.compras_dia}</td><td>R$ {Number(resumoCompras.valor_dia).toFixed(2)}</td><td>{resumoCompras.entregues_dia}</td></tr>
                <tr><th>Últimos 7 dias</th><td>{resumoCompras.compras_semana}</td><td>R$ {Number(resumoCompras.valor_semana).toFixed(2)}</td><td>{resumoCompras.entregues_semana}</td></tr>
                <tr><th>Este mês</th><td>{resumoCompras.compras_mes}</td><td>R$ {Number(resumoCompras.valor_mes).toFixed(2)}</td><td>{resumoCompras.entregues_mes}</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className="perfil-cartao promocoes-admin">
        <h2>Ofertas, descontos e anúncios</h2>
        <form className="form-promocao" onSubmit={salvarPromocao}>
          <input placeholder="Título" value={promocao.titulo} onChange={(e) => setPromocao({ ...promocao, titulo: e.target.value })} required />
          <input placeholder="Descrição" value={promocao.descricao} onChange={(e) => setPromocao({ ...promocao, descricao: e.target.value })} />
          <select value={promocao.tipo} onChange={(e) => setPromocao({ ...promocao, tipo: e.target.value })}>
            <option value="desconto">Desconto (%)</option><option value="oferta">Oferta (valor)</option><option value="anuncio">Anúncio</option>
          </select>
          <input type="number" min="0" step="0.01" placeholder="Valor" value={promocao.valor} onChange={(e) => setPromocao({ ...promocao, valor: e.target.value })} />
          <input type="url" placeholder="URL da imagem (opcional)" value={promocao.imagem} onChange={(e) => setPromocao({ ...promocao, imagem: e.target.value })} />
          <button className="botao-confirmar" type="submit">Publicar</button>
        </form>
        <div className="lista-promocoes-admin">
          {promocoes.map((item) => <div className="linha-pagamento" key={item.id}><div><strong>{item.titulo}</strong><span>{item.tipo} · {item.descricao}</span></div><button className="botao-perigo" onClick={() => removerPromocao(item.id)}>Remover</button></div>)}
        </div>
      </section>
      <section className="painel-grid">
        <form className="perfil-cartao" onSubmit={salvarProduto}>
          <h2>{produtoEditando ? 'Editar produto' : 'Adicionar produto'}</h2>
          <label>Nome<input value={produto.nome} onChange={(e) => setProduto({ ...produto, nome: e.target.value })} required /></label>
          <label>Descrição<input value={produto.descricao} onChange={(e) => setProduto({ ...produto, descricao: e.target.value })} /></label>
          <label>Preço<input type="number" min="0" step="0.01" value={produto.preco} onChange={(e) => setProduto({ ...produto, preco: e.target.value })} required /></label>
          <label>Estoque<input type="number" min="0" value={produto.estoque} onChange={(e) => setProduto({ ...produto, estoque: e.target.value })} /></label>
          <label>URL da foto<input type="url" placeholder="https://..." value={produto.imagem} onChange={(e) => setProduto({ ...produto, imagem: e.target.value })} /></label>
          <button className="botao-confirmar" type="submit">{produtoEditando ? 'Salvar alterações' : 'Adicionar produto'}</button>
          {produtoEditando && <button type="button" className="botao-secundario" onClick={() => { setProdutoEditando(null); setProduto({ nome: '', descricao: '', preco: '', estoque: '', imagem: '' }) }}>Cancelar edição</button>}
          {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}
        </form>
        <section className="perfil-cartao">
          <h2>Produtos cadastrados</h2>
          <div className="lista-admin-produtos">
            {produtos.map((item) => (
              <div className="linha-admin-produto" key={item.id}>
                {item.img ? <img src={item.img} alt="" /> : <span className="produto-sem-foto">◎</span>}
                <div><strong>{item.nome}</strong><span>R$ {Number(item.preco).toFixed(2)} · estoque {item.estoque}</span></div>
                <button className="botao-secundario" onClick={() => { setProdutoEditando(item.id); setProduto({ nome: item.nome, descricao: item.descricao || '', preco: item.preco, estoque: item.estoque, imagem: item.img || '' }) }}>Editar</button>
                <button className="botao-perigo" onClick={() => removerProduto(item.id)}>Remover</button>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
