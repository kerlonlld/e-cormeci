import { useState, useRef } from 'react'
import './App.css'
import { LocalizacaoMaps } from './LocalizacaoMaps'

// 1. Dados dos produtos (Fora do componente para evitar recriação na render)
const PRODUTOS = [
  {
    id: 1,
    nome: 'Detergente',
    preco: 3.5,
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaFEp606PGe0O9VeKk7YVyevQMslt0ATk6Z5KutXqc_g&s=10',
  },
  {
    id: 2,
    nome: 'Sabão em pó 800g',
    preco: 5.0,
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbJcOIAU3ZiREyaRkZhSUwhjUZYLLNbtCHHHdP6m5shA&s=10',
  },
  {
    id: 3,
    nome: 'Amaciante 2L',
    preco: 7.5,
    img: 'https://shoppr.com.br/cdn/shop/products/7896098902400_amaciante_ype_01_1024x1024.jpg?v=1448634028',
  },
  {
    id: 4,
    nome: 'Sabão em barra 1kg',
    preco: 4.0,
    img: 'https://cdn.awsli.com.br/2500x2500/1027/1027618/produto/55867977/51206cb51c.jpg',
  },
  {
    id: 5,
    nome: 'Desinfetante 500ml',
    preco: 6.0,
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe5HMtc5Tp6TNxK7OUoB2NKh7GZCXdn4MrmyULeMbWNg&s=10',
  },
  {
    id: 6,
    nome: 'Limpador Multiuso 1L',
    preco: 8.0,
    img: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQeqgj2sJcMABCrffllbbia3jB9x1hwhPA_HtQlzs9zDByf4ubMWtelp1Gr_VhREnSoetxvXnpEZU-IVtOkdyqxhvMbw9Au8_yQR27rl00x8_b6T61xKj6F3aMIh6GTU5gnozS7Pdg&usqp=CAc',
  },
]

const COMPRAS_INICIAIS = [
  {
    id: 1,
    valor: 48.9,
    data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    itens: [
      { nome: 'Detergente', quantidade: 1, img: PRODUTOS[0].img },
      { nome: 'Sabão em pó 800g', quantidade: 1, img: PRODUTOS[1].img },
    ],
  },
  {
    id: 2,
    valor: 72.5,
    data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    itens: [
      { nome: 'Amaciante 2L', quantidade: 2, img: PRODUTOS[2].img },
      { nome: 'Desinfetante 500ml', quantidade: 1, img: PRODUTOS[4].img },
    ],
  },
  {
    id: 3,
    valor: 134.0,
    data: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    itens: [
      { nome: 'Limpador Multiuso 1L', quantidade: 2, img: PRODUTOS[5].img },
      { nome: 'Sabão em barra 1kg', quantidade: 3, img: PRODUTOS[3].img },
    ],
  },
  {
    id: 4,
    valor: 89.0,
    data: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    itens: [
      { nome: 'Detergente', quantidade: 2, img: PRODUTOS[0].img },
      { nome: 'Amaciante 2L', quantidade: 1, img: PRODUTOS[2].img },
    ],
  },
  {
    id: 5,
    valor: 210.5,
    data: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    itens: [
      { nome: 'Sabão em pó 800g', quantidade: 3, img: PRODUTOS[1].img },
      { nome: 'Desinfetante 500ml', quantidade: 2, img: PRODUTOS[4].img },
    ],
  },
]

const LOJA_COORDENADAS = {
  latitude: -15.72625,
  longitude: -43.9172778,
}

function calcularDistanciaEmKm(lat1, lon1, lat2, lon2) {
  const paraRadiano = (valor) => (valor * Math.PI) / 180

  const dLat = paraRadiano(lat2 - lat1)
  const dLon = paraRadiano(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(paraRadiano(lat1)) *
      Math.cos(paraRadiano(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return 6371 * c
}

function normalizarItensCompra(itens) {
  if (!Array.isArray(itens)) return []

  return itens.map((item) => {
    if (typeof item === 'string') {
      const [nome, quantidadeTexto] = item.split(' x')
      const quantidade = Number(quantidadeTexto || 1)
      const produto = PRODUTOS.find(
        (produtoAtual) => produtoAtual.nome.toLowerCase() === nome.toLowerCase()
      )

      return {
        nome,
        quantidade,
        img: produto?.img || '',
      }
    }

    return {
      nome: item.nome || 'Produto',
      quantidade: Number(item.quantidade || 1),
      img: item.img || '',
    }
  })
}

// 2. Custom Hook para a funcionalidade de arrastar
function useDraggable(posicaoInicial = { x: 20, y: 100 }) {
  const [posicao, setPosicao] = useState(posicaoInicial)
  const [arrastando, setArrastando] = useState(false)
  const offset = useRef({ x: 0, y: 0 })

  const obterCoordenadas = (e) => {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  const iniciarArrasto = (e) => {
    setArrastando(true)
    const coords = obterCoordenadas(e)
    offset.current = {
      x: coords.x - posicao.x,
      y: coords.y - posicao.y,
    }
  }

  const duranteArrasto = (e) => {
    if (!arrastando) return
    const coords = obterCoordenadas(e)
    setPosicao({
      x: coords.x - offset.current.x,
      y: coords.y - offset.current.y,
    })
  }

  const pararArrasto = () => {
    setArrastando(false)
  }

  return {
    posicao,
    iniciarArrasto,
    duranteArrasto,
    pararArrasto,
  }
}

// 3. Subcomponentes
function Header({ totalItens, onAlternarCarrinho }) {
  return (
    <header className="cabecalho">
      <h1 className="titulo">Minha Loja Virtual</h1>
      <button
        type="button"
        className="badge-carrinho"
        onClick={onAlternarCarrinho}
        disabled={totalItens === 0}
        aria-label="Abrir ou fechar carrinho"
      >
        🛒 {totalItens}
      </button>
    </header>
  )
}

function CardProduto({ produto, onAdicionar }) {
  return (
    <div className="card-produto">
      <img src={produto.img} alt={produto.nome} className="produto-imagem" />

      <div className="produto-info">
        <h3 className="produto-nome">{produto.nome}</h3>
        <p className="produto-preco">R$ {produto.preco.toFixed(2)}</p>
        <button onClick={() => onAdicionar(produto)} className="botao">
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  )
}

function ItemCarrinho({ item, onAumentar, onDiminuir, onRemover }) {
  return (
    <div className="carrinho-item carrinho-item-quantidade">
      <div className="carrinho-item-info">
        <div className="carrinho-item-principal">
          <img src={item.img} alt={item.nome} className="carrinho-item-imagem" />
          <span className="carrinho-item-nome">{item.nome}</span>
        </div>
        <span className="carrinho-item-preco">
          R$ {(item.preco * item.quantidade).toFixed(2)}
        </span>
      </div>

      <div className="carrinho-controles">
        <div className="carrinho-quantidade">
          <button type="button" onClick={() => onDiminuir(item.id)}>-</button>
          <span>{item.quantidade}</span>
          <button type="button" onClick={() => onAumentar(item.id)}>+</button>
        </div>

        <button
          type="button"
          className="carrinho-remover"
          onClick={() => onRemover(item.id)}
        >
          Remover
        </button>
      </div>
    </div>
  )
}

function SidebarCarrinho({
  carrinho,
  posicao,
  totalCarrinho,
  valorFrete,
  distanciaKm,
  totalComFrete,
  localizacaoDefinida,
  onFechar,
  onIniciarArrasto,
  onAumentar,
  onDiminuir,
  onRemover,
  onFinalizar,
  onLimpar,
}) {
  return (
    <aside
      className="sidebar-carrinho"
      style={{ left: `${posicao.x}px`, top: `${posicao.y}px` }}
    >
      <button
        type="button"
        className="carrinho-fechar"
        onClick={onFechar}
        aria-label="Fechar carrinho"
      >
        ×
      </button>

      <div
        className="carrinho-cabecalho-arrastavel"
        onMouseDown={onIniciarArrasto}
        onTouchStart={onIniciarArrasto}
      >
        <h2 className="secao-titulo" style={{ margin: 0 }}>
          🛒 Seu Carrinho <span style={{ fontSize: '0.8rem' }}>(Arraste aqui)</span>
        </h2>
      </div>

      <div className="carrinho-lista">
        {carrinho.map((item) => (
          <ItemCarrinho
            key={item.id}
            item={item}
            onAumentar={onAumentar}
            onDiminuir={onDiminuir}
            onRemover={onRemover}
          />
        ))}

        <div className="carrinho-item">
          <span className="carrinho-item-nome">Subtotal</span>
          <span className="carrinho-item-precos">R$ {totalCarrinho.toFixed(2)}</span>
        </div>

        {localizacaoDefinida ? (
          <>
            <div className="carrinho-item">
              <span className="carrinho-item-nome">Distância</span>
              <span className="carrinho-item-precos">{distanciaKm.toFixed(1)} km</span>
            </div>

            <div className="carrinho-item">
              <span className="carrinho-item-nome">Entrega</span>
              <span className="carrinho-item-precos">
                {valorFrete > 0 ? `R$ ${valorFrete.toFixed(2)}` : 'Entrega indisponível'}
              </span>
            </div>
          </>
        ) : (
          <div className="carrinho-item">
            <span className="carrinho-item-nome">Entrega</span>
            <span className="carrinho-item-precos">Defina o endereço</span>
          </div>
        )}

        <div className="carrinho-item">
          <span className="carrinho-item-nome">Total</span>
          <span className="carrinho-item-precos">R$ {totalComFrete.toFixed(2)}</span>
        </div>

        <button onClick={onFinalizar} className="botao botao-finalizar">
          Finalizar Compra
        </button>
        <button onClick={onLimpar} className="botao botao-limpar">
          Esvaziar Carrinho
        </button>
      </div>
    </aside>
  )
}

// 4. Componente Principal
export default function App() {
  const [carrinho, setCarrinho] = useState([])
  const [pesquisa, setPesquisa] = useState('')
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [fechadoManualmente, setFechadoManualmente] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('home')
  const [historicoCompras, setHistoricoCompras] = useState(COMPRAS_INICIAIS)
  const [localizacaoUsuario, setLocalizacaoUsuario] = useState(null)

  const { posicao, iniciarArrasto, duranteArrasto, pararArrasto } = useDraggable()

  const totalItens = carrinho.length
  const totalCarrinho = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0)

  const distanciaKm = localizacaoUsuario
    ? calcularDistanciaEmKm(
        localizacaoUsuario.latitude,
        localizacaoUsuario.longitude,
        LOJA_COORDENADAS.latitude,
        LOJA_COORDENADAS.longitude
      )
    : 0

  const localizacaoConfirmada = Boolean(localizacaoUsuario && localizacaoUsuario.confirmado)
  const localizacaoValida = localizacaoConfirmada && distanciaKm <= 20
  const valorFrete = localizacaoValida ? 10 : 0
  const totalComFrete = totalCarrinho + valorFrete

  const hoje = new Date()
  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(hoje.getDate() - 6)
  inicioSemana.setHours(0, 0, 0, 0)

  const totalSemana = historicoCompras
    .filter((compra) => new Date(compra.data) >= inicioSemana)
    .reduce((soma, compra) => soma + compra.valor, 0)

  const totalMes = historicoCompras
    .filter((compra) => {
      const data = new Date(compra.data)
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear()
    })
    .reduce((soma, compra) => soma + compra.valor, 0)

  const produtosFiltrados = PRODUTOS.filter((produto) =>
    produto.nome.toLowerCase().includes(pesquisa.toLowerCase())
  )

  // Gerenciadores de estado do Carrinho
  const alternarCarrinho = () => {
    if (totalItens === 0) return
    setFechadoManualmente(false)
    setCarrinhoAberto((aberto) => !aberto)
  }

  const fecharCarrinho = () => {
    setCarrinhoAberto(false)
    setFechadoManualmente(true)
  }

  const adicionarProduto = (produtoAdicionado) => {
    setCarrinho((itensAtuais) => {
      const produtoExistente = itensAtuais.find((item) => item.id === produtoAdicionado.id)

      if (produtoExistente) {
        return itensAtuais.map((item) =>
          item.id === produtoAdicionado.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      }

      return [...itensAtuais, { ...produtoAdicionado, quantidade: 1 }]
    })

    if (!fechadoManualmente || carrinho.length === 0) {
      setCarrinhoAberto(true)
    }
  }

  const limparCarrinho = () => {
    setCarrinho([])
    setCarrinhoAberto(false)
    setFechadoManualmente(true)
  }

  const aumentarQuantidade = (id) => {
    setCarrinho((itensAtuais) =>
      itensAtuais.map((item) =>
        item.id === id ? { ...item, quantidade: item.quantidade + 1 } : item
      )
    )
  }

  const diminuirQuantidade = (id) => {
    setCarrinho((itensAtuais) =>
      itensAtuais
        .map((item) =>
          item.id === id ? { ...item, quantidade: item.quantidade - 1 } : item
        )
        .filter((item) => item.quantidade > 0)
    )
  }

  const removerProduto = (id) => {
    setCarrinho((itensAtuais) => itensAtuais.filter((item) => item.id !== id))
  }

  const finalizarCompra = () => {
    if (totalItens === 0) {
      alert('O carrinho está vazio. Adicione produtos antes de finalizar a compra.')
      return
    }

    if (!localizacaoConfirmada) {
      alert('Confirme seu endereço de entrega antes de finalizar a compra.')
      setAbaAtiva('perfil')
      return
    }

    if (distanciaKm > 20) {
      alert('Entrega indisponível: seu endereço está fora do raio de 20 km da loja.')
      return
    }

    const valorFinalCompra = totalComFrete

    const compraAtual = {
      id: Date.now(),
      valor: valorFinalCompra,
      data: new Date().toISOString(),
      itens: carrinho.map((item) => ({
        nome: item.nome,
        quantidade: item.quantidade,
        img: item.img,
      })),
    }

    setHistoricoCompras((comprasAnteriores) => [compraAtual, ...comprasAnteriores])
    alert(`Compra finalizada! Total: R$ ${valorFinalCompra.toFixed(2)}`)
    limparCarrinho()
  }

  return (
    <div
      className="loja"
      onMouseMove={duranteArrasto}
      onMouseUp={pararArrasto}
      onTouchMove={duranteArrasto}
      onTouchEnd={pararArrasto}
    >
      <Header totalItens={totalItens} onAlternarCarrinho={alternarCarrinho} />

      {abaAtiva === 'home' && (
        <main className="conteudo-principal">
          <section className="secao-produtos">
            <h2 className="secao-titulo">Nossos Produtos</h2>

            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquise um produto..."
              className="campo-pesquisa"
            />

            <div className="grade-produtos">
              {produtosFiltrados.map((produto) => (
                <CardProduto
                  key={produto.id}
                  produto={produto}
                  onAdicionar={adicionarProduto}
                />
              ))}
            </div>
          </section>

          {totalItens > 0 && carrinhoAberto && (
            <SidebarCarrinho
              carrinho={carrinho}
              posicao={posicao}
              totalCarrinho={totalCarrinho}
              valorFrete={valorFrete}
              distanciaKm={distanciaKm}
              totalComFrete={totalComFrete}
              localizacaoDefinida={localizacaoConfirmada}
              onFechar={fecharCarrinho}
              onIniciarArrasto={iniciarArrasto}
              onAumentar={aumentarQuantidade}
              onDiminuir={diminuirQuantidade}
              onRemover={removerProduto}
              onFinalizar={finalizarCompra}
              onLimpar={limparCarrinho}
            />
          )}
        </main>
      )}

      {abaAtiva === 'compras' && (
        <main className="pagina-aba">
          <h2>Histórico de compras</h2>

          <div className="cards-compras">
            <div className="card-estatistica">
              <span className="titulo-estatistica">Semana</span>
              <strong className="valor-estatistica">R$ {totalSemana.toFixed(2)}</strong>
              <span className="meta-estatistica">
                {historicoCompras.filter((compra) => new Date(compra.data) >= inicioSemana).length} compras
              </span>
            </div>

            <div className="card-estatistica">
              <span className="titulo-estatistica">Mês</span>
              <strong className="valor-estatistica">R$ {totalMes.toFixed(2)}</strong>
              <span className="meta-estatistica">
                {
                  historicoCompras.filter(
                    (compra) => {
                      const data = new Date(compra.data)
                      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear()
                    }
                  ).length
                } compras
              </span>
            </div>
          </div>

          <div className="lista-compras">
            {historicoCompras.slice(0, 5).map((compra) => {
              const dataCompra = new Date(compra.data)
              const itensCompra = normalizarItensCompra(compra.itens)

              return (
                <div key={compra.id} className="item-compra">
                  <div className="item-compra-conteudo">
                    <div className="miniaturas-compra">
                      {itensCompra.slice(0, 3).map((item, index) => (
                        <img
                          key={`${compra.id}-${item.nome}-${index}`}
                          src={item.img}
                          alt={item.nome}
                          className="miniatura-compra"
                        />
                      ))}
                    </div>

                    <div className="item-compra-detalhes">
                      <span className="item-compra-data">
                        {dataCompra.toLocaleDateString('pt-BR')} às {' '}
                        {dataCompra.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="item-compra-itens">
                        {itensCompra.length > 0
                          ? itensCompra.map((item) => `${item.nome} x${item.quantidade}`).join(', ')
                          : 'Compra realizada'}
                      </span>
                    </div>
                  </div>
                  <strong>R$ {compra.valor.toFixed(2)}</strong>
                </div>
              )
            })}
          </div>
        </main>
      )}

      {abaAtiva === 'perfil' && (
        <main className="pagina-aba">
          <h2>Meu Perfil</h2>
          <p>Nome: Usuário</p>
          <p>Email: usuario@email.com</p>

          <LocalizacaoMaps onLocalizacaoChange={setLocalizacaoUsuario} />
        </main>
      )}

      <nav className="menu-inferior">
        <button
          type="button"
          className={`item-menu ${abaAtiva === 'home' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('home')}
        >
          <span className="icone">🏠</span>
          <span className="texto">Inicio</span>
        </button>

        <button
          type="button"
          className={`item-menu ${abaAtiva === 'compras' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('compras')}
        >
          <span className="icone">🧾</span>
          <span className="texto">Histórico</span>
        </button>

        <button
          type="button"
          className={`item-menu ${abaAtiva === 'perfil' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('perfil')}
        >
          <span className="icone">👤</span>
          <span className="texto">Perfil</span>
        </button>
      </nav>
    </div>
  )
}