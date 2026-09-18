import { useEffect, useRef, useState } from 'react'
import './App.css'
import { LocalizacaoMaps } from './LocalizacaoMaps'

const API = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin)

// URL única da API, trocada automaticamente entre desenvolvimento e produção.

// Catálogo local usado como fallback visual quando a API não tem imagem cadastrada.
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
  // Padroniza itens antigos e novos para o mesmo formato usado pelo histórico.
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

    const nomeItem = (item.nome || 'Produto').trim()
    const imagemItem = String(item.img || item.image || item.imagem || '').trim()
    const produtoLocal = PRODUTOS.find((produto) =>
      produto.nome.toLowerCase().trim() === nomeItem.toLowerCase().trim()
    )

    return {
      nome: nomeItem,
      quantidade: Number(item.quantidade || 1),
      img: imagemItem || produtoLocal?.img || '',
    }
  })
}

function normalizarHistoricoCompras(compras) {
  // Converte valores vindos do PostgreSQL para tipos adequados ao React.
  if (!Array.isArray(compras)) return []

  return compras.map((compra) => ({
    ...compra,
    valor: Number(compra.valor || 0),
    data: compra.data || new Date().toISOString(),
    itens: normalizarItensCompra(compra.itens),
  }))
}

// 2. Custom Hook para a funcionalidade de arrastar
function useDraggable(posicaoInicial = { x: 20, y: 100 }) {
  // Hook que permite arrastar o carrinho com mouse ou toque.
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
function Header({ totalItens, onAlternarCarrinho, onSair }) {
  // Cabeçalho exclusivo da loja do cliente.
  return (
    <header className="cabecalho">
      <h1 className="titulo">Minha Loja Virtual</h1>
      <div className="cabecalho-acoes">
        <button type="button" className="botao-acesso" onClick={onSair}>Sair</button>
        <button
          type="button"
          className="badge-carrinho"
          onClick={onAlternarCarrinho}
          disabled={totalItens === 0}
          aria-label="Abrir ou fechar carrinho"
        >
          🛒 {totalItens}
        </button>
      </div>
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

function PagamentoModal({ pedido, onFechar, onSelecionar, onPagamentoConfirmado }) {
  // Exibe escolha do método e acompanha a confirmação do pagamento.
  const [metodoSelecionado, setMetodoSelecionado] = useState('pix')
  const [chaveCopiada, setChaveCopiada] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(() => {
    const fim = new Date(pedido.pagamentoExpiraEm || Date.now() + 600000).getTime()
    return Math.max(0, Math.ceil((fim - Date.now()) / 1000))
  })

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundosRestantes((segundos) => Math.max(0, segundos - 1))
    }, 1000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (!pedido.id || pedido.metodoPagamento !== 'pix') return undefined
    const consultar = async () => {
      const resposta = await fetch(`${API}/api/pedidos/${pedido.id}/pagamento`)
      if (!resposta.ok) return
      const dados = await resposta.json()
      if (dados.statusPagamento === 'pago') onPagamentoConfirmado(dados)
    }

    const intervalo = setInterval(consultar, 5000)
    consultar()
    return () => clearInterval(intervalo)
  }, [pedido.id, onPagamentoConfirmado])

  if (pedido.modo === 'selecao') {
    return (
      <div className="modal-fundo">
        <section className="modal-pagamento">
          <button type="button" className="carrinho-fechar" onClick={onFechar}>×</button>
          <span className="rotulo-cartao">Finalizar compra</span>
          <h2>Escolha o pagamento</h2>
          <strong className="pagamento-total">R$ {Number(pedido.valor).toFixed(2)}</strong>
          <div className="opcoes-pagamento">
            {[
              ['pix', 'PIX', 'Pagamento instantâneo'],
              ['cartao', 'Cartão', 'Crédito ou débito'],
              ['dinheiro', 'Dinheiro', 'Pagamento na entrega'],
            ].map(([valor, titulo, descricao]) => (
              <button
                type="button"
                key={valor}
                className={`opcao-pagamento ${metodoSelecionado === valor ? 'opcao-pagamento-ativa' : ''}`}
                onClick={() => setMetodoSelecionado(valor)}
              >
                <strong>{titulo}</strong><span>{descricao}</span>
              </button>
            ))}
          </div>
          <button type="button" className="botao-confirmar" onClick={() => onSelecionar(metodoSelecionado)}>
            Continuar para pagamento
          </button>
        </section>
      </div>
    )
  }

  const minutos = String(Math.floor(segundosRestantes / 60)).padStart(2, '0')
  const segundos = String(segundosRestantes % 60).padStart(2, '0')
  const metodo = pedido.metodoPagamento === 'pix' ? 'PIX' : pedido.metodoPagamento === 'cartao' ? 'Cartão' : 'Dinheiro'

  const copiarChavePix = async () => {
    try {
      await navigator.clipboard.writeText(pedido.pixCopiaECola || pedido.chavePix)
    } catch {
      const campo = document.createElement('textarea')
      campo.value = pedido.pixCopiaECola || pedido.chavePix
      document.body.appendChild(campo)
      campo.select()
      document.execCommand('copy')
      campo.remove()
    }
    setChaveCopiada(true)
  }

  return (
    <div className="modal-fundo">
      <section className="modal-pagamento">
        <button type="button" className="carrinho-fechar" onClick={onFechar}>×</button>
        <span className="rotulo-cartao">Pagamento do pedido #{pedido.id}</span>
        <h2>{metodo}</h2>
        <strong className="pagamento-total">R$ {Number(pedido.valor).toFixed(2)}</strong>

        {pedido.metodoPagamento === 'pix' && (
          <div className="pix-detalhes">
            <p>Copie o PIX copia e cola. O banco já receberá o valor do pedido.</p>
            <code>{pedido.pixCopiaECola || pedido.chavePix}</code>
            <button type="button" className="botao-confirmar" onClick={copiarChavePix}>
              {chaveCopiada ? 'Chave copiada' : 'Copiar chave PIX'}
            </button>
            <span>Tempo para pagamento: {minutos}:{segundos}</span>
          </div>
        )}

        {pedido.metodoPagamento === 'cartao' && <p>Pagamento registrado. O entregador confirmará na entrega usando o código.</p>}
        {pedido.metodoPagamento === 'dinheiro' && <p>Pagamento na entrega. O entregador confirmará o recebimento usando o código.</p>}
        {pedido.metodoPagamento === 'pix' && <p className="mensagem-pagamento">Aguardando confirmação automática do banco...</p>}
        <button type="button" className="botao-secundario" onClick={onFechar}>Continuar acompanhando</button>
      </section>
    </div>
  )
}

// 4. Componente Principal
export default function App({ usuario, onSair }) {
  // Identificador que impede mistura de dados entre contas diferentes.
  const chaveArmazenamento = (nome) => `${nome}-${usuario.uid}`
  // Estados principais da loja, carrinho, conta e histórico.
  const [produtos, setProdutos] = useState([])
  const [promocoes, setPromocoes] = useState([])
  const [carregandoProdutos, setCarregandoProdutos] = useState(true)
  const [erroProdutos, setErroProdutos] = useState('')
  const [perfil, setPerfil] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(chaveArmazenamento('perfil-e-cormeci'))) || {
        nome: 'Usuário',
        email: 'usuario@email.com',
        telefone: '',
        foto: '',
      }
    } catch {
      return { nome: 'Usuário', email: 'usuario@email.com', telefone: '', foto: '' }
    }
  })
  const [carrinho, setCarrinho] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(chaveArmazenamento('carrinho-e-cormeci'))) || []
    } catch {
      return []
    }
  })
  const [pesquisa, setPesquisa] = useState('')
  const [codigoEntregaAtual, setCodigoEntregaAtual] = useState(() => localStorage.getItem(chaveArmazenamento('codigo-entrega-e-cormeci')) || '')
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [fechadoManualmente, setFechadoManualmente] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState(() => {
    const abaSalva = localStorage.getItem(chaveArmazenamento('aba-ativa-e-cormeci'))
    return ['home', 'compras', 'perfil'].includes(abaSalva) ? abaSalva : 'home'
  })
  const [pagamentoAberto, setPagamentoAberto] = useState(null)
  const [historicoCompras, setHistoricoCompras] = useState(() => {
    try {
      return normalizarHistoricoCompras(JSON.parse(localStorage.getItem(chaveArmazenamento('historico-e-cormeci')))) || []
    } catch {
      return []
    }
  })
  const [localizacaoUsuario, setLocalizacaoUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(chaveArmazenamento('localizacao-e-cormeci')))
        || JSON.parse(localStorage.getItem(chaveArmazenamento('localizacao-atual-e-cormeci')))
        || null
    } catch {
      return null
    }
  })
  const [editandoEndereco, setEditandoEndereco] = useState(false)
  const [dadosPessoaisConfirmados, setDadosPessoaisConfirmados] = useState(() => {
    try {
      return Boolean(JSON.parse(localStorage.getItem(chaveArmazenamento('dados-pessoais-confirmados-e-cormeci'))))
    } catch {
      return false
    }
  })
  const [editandoDadosPessoais, setEditandoDadosPessoais] = useState(() => {
    try {
      return !JSON.parse(localStorage.getItem(chaveArmazenamento('dados-pessoais-confirmados-e-cormeci')))
    } catch {
      return true
    }
  })

  useEffect(() => {
    // Persiste endereço e dados pessoais somente para a conta atual.
    localStorage.setItem(chaveArmazenamento('localizacao-e-cormeci'), JSON.stringify(localizacaoUsuario))
  }, [localizacaoUsuario])

  useEffect(() => {
    // Guarda a aba atual para restaurá-la depois de atualizar a página.
    localStorage.setItem(chaveArmazenamento('dados-pessoais-confirmados-e-cormeci'), JSON.stringify(dadosPessoaisConfirmados))
  }, [dadosPessoaisConfirmados])

  useEffect(() => {
    // Busca produtos disponíveis no banco do backend.
    localStorage.setItem(chaveArmazenamento('aba-ativa-e-cormeci'), abaAtiva)
  }, [abaAtiva])

  useEffect(() => {
    // Sincroniza os pedidos da conta autenticada com o servidor.
    localStorage.setItem(chaveArmazenamento('historico-e-cormeci'), JSON.stringify(historicoCompras))
  }, [historicoCompras])

  useEffect(() => {
    const ultimaCompra = historicoCompras[0]

    if (!ultimaCompra) {
      if (codigoEntregaAtual) {
        setCodigoEntregaAtual('')
        localStorage.removeItem(chaveArmazenamento('codigo-entrega-e-cormeci'))
      }
      return
    }

    if (ultimaCompra.status === 'entregue') {
      if (codigoEntregaAtual) {
        setCodigoEntregaAtual('')
        localStorage.removeItem(chaveArmazenamento('codigo-entrega-e-cormeci'))
      }
      return
    }

    if (!codigoEntregaAtual && ultimaCompra.codigoEntrega) {
      setCodigoEntregaAtual(ultimaCompra.codigoEntrega)
      localStorage.setItem(chaveArmazenamento('codigo-entrega-e-cormeci'), ultimaCompra.codigoEntrega)
    }
  }, [historicoCompras, codigoEntregaAtual])

  const { posicao, iniciarArrasto, duranteArrasto, pararArrasto } = useDraggable()

  const atualizarPerfil = (campo, valor) => {
    setPerfil((perfilAtual) => {
      const perfilAtualizado = { ...perfilAtual, [campo]: valor }
      localStorage.setItem(chaveArmazenamento('perfil-e-cormeci'), JSON.stringify(perfilAtualizado))
      return perfilAtualizado
    })
  }

  const selecionarFoto = (evento) => {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    const leitor = new FileReader()
    leitor.onload = () => atualizarPerfil('foto', leitor.result)
    leitor.readAsDataURL(arquivo)
  }

  useEffect(() => {
    localStorage.setItem(chaveArmazenamento('carrinho-e-cormeci'), JSON.stringify(carrinho))
  }, [carrinho])

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const resposta = await fetch(
          `${API}/api/produtos`
        )

        if (!resposta.ok) {
          throw new Error('Não foi possível carregar os produtos.')
        }

        const produtosDaApi = await resposta.json()
        const produtosNormalizados = produtosDaApi.map((produto) => {
          const produtoLocal = PRODUTOS.find((item) => item.nome === produto.nome)

          return {
            ...produto,
            preco: Number(produto.preco),
            img: produto.img || produtoLocal?.img || '',
          }
        })

        setProdutos(produtosNormalizados)
      } catch (erro) {
        console.error(erro)
        setErroProdutos('Não foi possível carregar os produtos.')
      } finally {
        setCarregandoProdutos(false)
      }
    }

    carregarProdutos()
  }, [])

  useEffect(() => {
    fetch(`${API}/api/promocoes`)
      .then((resposta) => resposta.ok ? resposta.json() : [])
      .then(setPromocoes)
      .catch(() => setPromocoes([]))
  }, [])

  useEffect(() => {
    const carregarHistorico = async () => {
      try {
        const resposta = await fetch(`${API}/api/pedidos?clienteId=${encodeURIComponent(usuario.uid)}`)

        if (!resposta.ok) throw new Error('Não foi possível carregar o histórico.')

        const pedidos = await resposta.json()
        const historicoAtualizado = normalizarHistoricoCompras(pedidos)
        setHistoricoCompras(historicoAtualizado)
        localStorage.setItem(chaveArmazenamento('historico-e-cormeci'), JSON.stringify(historicoAtualizado))
      } catch (erro) {
        console.error(erro)
      }
    }

    carregarHistorico()
    const intervalo = setInterval(carregarHistorico, 10000)

    return () => clearInterval(intervalo)
  }, [])

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
  const localizacaoValida = localizacaoConfirmada
  const valorFrete = localizacaoValida ? 10 : 0
  const totalComFrete = totalCarrinho + valorFrete

  const hoje = new Date()
  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(hoje.getDate() - 6)
  inicioSemana.setHours(0, 0, 0, 0)

  const comprasEntregues = historicoCompras.filter((compra) => compra.status === 'entregue')

  const totalSemana = comprasEntregues
    .filter((compra) => new Date(compra.data) >= inicioSemana)
    .reduce((soma, compra) => soma + Number(compra.valor || 0), 0)

  const totalMes = comprasEntregues
    .filter((compra) => {
      const data = new Date(compra.data)
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear()
    })
    .reduce((soma, compra) => soma + Number(compra.valor || 0), 0)

  const produtosFiltrados = produtos.filter((produto) =>
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
    // Adiciona ou incrementa um produto dentro do carrinho atual.
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

  const cancelarCompra = async (id) => {
    const resposta = await fetch(
      `${API}/api/pedidos/${id}/cancelar`,
      { method: 'POST' }
    )
    const dados = await resposta.json()

    if (!resposta.ok) {
      alert(dados.error || 'Não foi possível cancelar o pedido.')
      return
    }

    setHistoricoCompras((compras) => compras.map((compra) =>
      compra.id === id ? { ...compra, status: 'cancelado' } : compra
    ))
  }

  const finalizarCompra = async () => {
    // Valida endereço e abre a escolha de pagamento antes de criar o pedido.
    if (totalItens === 0) {
      alert('O carrinho está vazio. Adicione produtos antes de finalizar a compra.')
      return
    }

    if (!localizacaoConfirmada) {
      alert('Confirme seu endereço de entrega antes de finalizar a compra.')
      setAbaAtiva('perfil')
      return
    }

    setPagamentoAberto({ modo: 'selecao', valor: totalComFrete })
  }

  const criarPedido = async (metodoPagamento) => {
    // Envia o pedido com a conta do cliente e o método escolhido.
    const valorFinalCompra = totalComFrete

    try {
      const resposta = await fetch(
        `${API}/api/pedidos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteId: usuario.uid,
            email: usuario.email,
            valorTotal: valorFinalCompra,
            metodoPagamento,
            endereco: localizacaoUsuario?.nomeLocal || 'Endereço não informado',
            itens: carrinho.map((item) => ({
              produtoId: item.id,
              nome: item.nome,
              quantidade: item.quantidade,
              preco: item.preco,
              img: item.img,
            })),
          }),
        }
      )

      if (!resposta.ok) throw new Error('Não foi possível salvar a compra.')

      const compraAtual = await resposta.json()
      setHistoricoCompras((comprasAnteriores) => [compraAtual, ...comprasAnteriores])
      setPagamentoAberto({ ...compraAtual, metodoPagamento })
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível salvar a compra no banco de dados.')
      return
    }

    limparCarrinho()
  }

  const pagamentoConfirmado = (dados) => {
    setHistoricoCompras((compras) => compras.map((compra) =>
      compra.id === pagamentoAberto?.id
        ? { ...compra, ...dados, status: dados.status || 'aguardando_entrega' }
        : compra
    ))
    setPagamentoAberto(null)
    alert(`Pagamento confirmado. Transação: ${dados.idTransacao}`)
  }

  return <div
      className="loja"
      onMouseMove={duranteArrasto}
      onMouseUp={pararArrasto}
      onTouchMove={duranteArrasto}
      onTouchEnd={pararArrasto}
    >
      {pagamentoAberto && (
        <PagamentoModal
          pedido={pagamentoAberto}
          onFechar={() => setPagamentoAberto(null)}
          onSelecionar={criarPedido}
          onPagamentoConfirmado={pagamentoConfirmado}
        />
      )}
      <Header
        totalItens={totalItens}
        onAlternarCarrinho={alternarCarrinho}
        onSair={onSair}
      />

      {abaAtiva === 'home' && (
        <main className="conteudo-principal">
          <section className="secao-produtos">
            {!localizacaoConfirmada && (
              <section className="cartao-endereco-home">
                <div>
                  <span className="rotulo-cartao">Entrega</span>
                  <strong>Confirme seu endereço</strong>
                  <p>
                    {localizacaoUsuario?.nomeLocal || 'Defina onde devemos entregar sua compra.'}
                  </p>
                </div>
                <span className="status-endereco">Pendente</span>
              </section>
            )}

            {codigoEntregaAtual && (
              <section className="cartao-codigo-entrega">
                <span className="rotulo-cartao">Código da última entrega</span>
                <strong>{codigoEntregaAtual}</strong>
                <p>Informe este código ao entregador para confirmar o recebimento.</p>
              </section>
            )}

            <h2 className="secao-titulo">Nossos Produtos</h2>

            {promocoes.length > 0 && (
              <section className="secao-ofertas">
                <div className="ofertas-cabecalho">
                  <div><span className="rotulo-cartao">Ofertas da loja</span><h2>Descontos e novidades</h2></div>
                </div>
                <div className="grade-ofertas">
                  {promocoes.map((promocao) => (
                    <article className="card-oferta" key={promocao.id}>
                      {promocao.img && <img src={promocao.img} alt="" />}
                      <div><strong>{promocao.titulo}</strong><p>{promocao.descricao}</p></div>
                      <b>{promocao.tipo === 'desconto' ? `${Number(promocao.valor).toFixed(0)}% OFF` : promocao.tipo === 'oferta' ? `R$ ${Number(promocao.valor).toFixed(2)}` : 'Novidade'}</b>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquise um produto..."
              className="campo-pesquisa"
            />

            <div className="grade-produtos">
              {carregandoProdutos && <p>Carregando produtos...</p>}
              {!carregandoProdutos && erroProdutos && <p>{erroProdutos}</p>}
              {!carregandoProdutos && !erroProdutos && produtosFiltrados.length === 0 && (
                <p>Nenhum produto encontrado.</p>
              )}
              {!carregandoProdutos &&
                !erroProdutos &&
                produtosFiltrados.map((produto) => (
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
                {comprasEntregues.filter((compra) => new Date(compra.data) >= inicioSemana).length} compras entregues
              </span>
            </div>

            <div className="card-estatistica">
              <span className="titulo-estatistica">Mês</span>
              <strong className="valor-estatistica">R$ {totalMes.toFixed(2)}</strong>
              <span className="meta-estatistica">
                {
                  comprasEntregues.filter(
                    (compra) => {
                      const data = new Date(compra.data)
                      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear()
                    }
                  ).length
                } compras entregues
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
                      <span className={`status-compra status-${compra.status || 'aguardando_entrega'}`}>
                        {compra.statusPagamento === 'pendente'
                          ? 'Aguardando pagamento'
                          : compra.status === 'cancelado'
                            ? 'Cancelado'
                            : compra.status === 'entregue'
                              ? 'Entregue'
                              : 'Aguardando entrega'}
                      </span>
                    </div>
                  </div>
                  <div className="compra-acoes">
                    <strong>R$ {compra.valor.toFixed(2)}</strong>
                    {compra.statusPagamento === 'pendente' && (
                      <button type="button" className="botao-confirmar" onClick={() => setPagamentoAberto(compra)}>
                        Pagamento
                      </button>
                    )}
                    {['aguardando_pagamento', 'aguardando_entrega', 'em_entrega'].includes(compra.status) && (
                      <button type="button" className="botao-perigo" onClick={() => cancelarCompra(compra.id)}>
                        Cancelar pedido
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      )}

      {abaAtiva === 'perfil' && (
        <main className="pagina-aba perfil-pagina">
          <div className="perfil-cabecalho">
            <div className="avatar-perfil">
              {perfil.foto ? <img src={perfil.foto} alt="Sua foto de perfil" /> : <span>👤</span>}
              <label className="botao-foto" title="Escolher foto de perfil">
                📷
                <input type="file" accept="image/*" onChange={selecionarFoto} />
              </label>
            </div>
            <div className="perfil-identidade">
              <span className="rotulo-cartao">Minha conta</span>
              <h2>
                {perfil.nome || 'Seu perfil'}
                {dadosPessoaisConfirmados && (
                  <button
                    type="button"
                    className="botao-icon"
                    style={{ marginLeft: '8px', fontSize: '1rem', padding: '4px 8px' }}
                    onClick={() => {
                      setEditandoDadosPessoais(true)
                      setDadosPessoaisConfirmados(false)
                    }}
                    title="Editar dados pessoais"
                    aria-label="Editar dados pessoais"
                  >
                    ✏️
                  </button>
                )}
              </h2>

              {dadosPessoaisConfirmados && !editandoDadosPessoais ? (
                <div className="dados-pessoais-resumo">
                  <p><strong>{perfil.nome || 'Seu nome'}</strong></p>
                  <p>{perfil.email || 'E-mail não informado'}</p>
                  <p>{perfil.telefone || 'Telefone não informado'}</p>
                </div>
              ) : (
                <p>{localizacaoConfirmada ? 'Endereço de entrega confirmado' : 'Complete seus dados'}</p>
              )}
            </div>
          </div>

          {dadosPessoaisConfirmados && !editandoDadosPessoais ? null : (
            <section className="perfil-cartao">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <h3>Dados pessoais</h3>
                {dadosPessoaisConfirmados && (
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={() => {
                      setEditandoDadosPessoais(true)
                      setDadosPessoaisConfirmados(false)
                    }}
                  >
                    ✏️
                  </button>
                )}
              </div>

              <label>
                Nome
                <input value={perfil.nome} onChange={(e) => atualizarPerfil('nome', e.target.value)} />
              </label>
              <label>
                E-mail
                <input type="email" value={perfil.email} onChange={(e) => atualizarPerfil('email', e.target.value)} />
              </label>
              <label>
                Telefone
                <input value={perfil.telefone} onChange={(e) => atualizarPerfil('telefone', e.target.value)} placeholder="(00) 00000-0000" />
              </label>

              <button
                type="button"
                className="botao-confirmar"
                onClick={() => {
                  setDadosPessoaisConfirmados(true)
                  setEditandoDadosPessoais(false)
                }}
                style={{ marginTop: '12px' }}
              >
                Confirmar dados pessoais
              </button>
            </section>
          )}

          <LocalizacaoMaps
            onLocalizacaoChange={setLocalizacaoUsuario}
            editar={editandoEndereco}
            onEdicaoConcluida={() => setEditandoEndereco(false)}
            onEditar={() => setEditandoEndereco(true)}
          />
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
}