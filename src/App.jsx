import { useState, useRef } from 'react'
import './App.css'

const produtos = [
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
    nome: 'sabão em barra 1kg',
    preco: 4.00,
    img: 'https://cdn.awsli.com.br/2500x2500/1027/1027618/produto/55867977/51206cb51c.jpg'
  },
  {
    id: 5,
    nome: 'Desinfetante 500ml',
    preco: 6.00,
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe5HMtc5Tp6TNxK7OUoB2NKh7GZCXdn4MrmyULeMbWNg&s=10'
  },
  {
    id: 6,
    nome: 'Limpador Multiuso 1L',
    preco: 8.00,
    img: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQeqgj2sJcMABCrffllbbia3jB9x1hwhPA_HtQlzs9zDByf4ubMWtelp1Gr_VhREnSoetxvXnpEZU-IVtOkdyqxhvMbw9Au8_yQR27rl00x8_b6T61xKj6F3aMIh6GTU5gnozS7Pdg&usqp=CAc'
  }
]

export default function App() {
  const [carrinho, setCarrinho] = useState([])
  const [pesquisa, setPesquisa] = useState('')

  // Estados para controlar o movimento do carrinho na tela
  const [posicao, setPosicao] = useState({ x: 20, y: 100 })
  const [arrastando, setArrastando] = useState(false)
  const offset = useRef({ x: 0, y: 0 })

  const totalItens = carrinho?.length ?? 0

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
  }

  const limparCarrinho = () => {
    setCarrinho([])
  }

  const totalCarrinho = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0)
  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(pesquisa.toLowerCase())
  )

  const finalizarCompra = () => {
    if (totalItens === 0) {
      alert('O carrinho está vazio. Adicione produtos antes de finalizar a compra.')
      return
    }

    alert(`Compra finalizada! Total: R$ ${totalCarrinho.toFixed(2)}`)
    limparCarrinho()
  }

  // --- Funções para Arrastar o Carrinho ---
  const iniciarArrasto = (e) => {
    setArrastando(true)
    offset.current = {
      x: e.clientX - posicao.x,
      y: e.clientY - posicao.y,
    }
  }

  const duranteArrasto = (e) => {
    if (!arrastando) return
    setPosicao({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    })
  }

  const pararArrasto = () => {
    setArrastando(false)
  }

  return (
    <div 
      className="loja"
      onMouseMove={duranteArrasto}
      onMouseUp={pararArrasto}
    >
      <header className="cabecalho">
        <h1 className="titulo">Minha Loja Virtual</h1>
        <span className="badge-carrinho">Itens no Carrinho: {totalItens}</span>
      </header>

      <main className="conteudo-principal">
        <section className="secao-produtos">
          <h2 className="secao-titulo">Nossos Produtos</h2>

          <input
            type="text"
            value={pesquisa}
            onChange={(event) => setPesquisa(event.target.value)}
            placeholder="Pesquise um produto..."
            className="campo-pesquisa"
          />

          <div className="grade-produtos">
            {produtosFiltrados.map((produto) => (
              <div key={produto.id} className="card-produto">
                <img src={produto.img} alt={produto.nome} className="produto-imagem" />
                <div>
                  <h3 className="produto-nome">{produto.nome}</h3>
                  <p className="produto-preco">R$ {produto.preco.toFixed(2)}</p>
                </div>
                <button onClick={() => adicionarProduto(produto)} className="botao">
                  Adicionar ao Carrinho
                </button>
              </div>
            ))}
          </div>
        </section>

        {totalItens > 0 && (
          <aside
            className="sidebar-carrinho"
            style={{
              left: `${posicao.x}px`,
              top: `${posicao.y}px`,
            }}
          >
            <div 
              className="carrinho-cabecalho-arrastavel"
              onMouseDown={iniciarArrasto}
            >
              <h2 className="secao-titulo" style={{ margin: 0, cursor: 'grab' }}>
                🛒 Seu Carrinho <span style={{ fontSize: '0.8rem' }}>(Arraste aqui)</span>
              </h2>
            </div>

            <div className="carrinho-lista">
              {carrinho.map((item) => (
                <div key={item.id} className="carrinho-item">
                  <span className="carrinho-item-nome">
                    {item.nome} x{item.quantidade}
                  </span>
                  <span className="carrinho-item-preco">
                    R$ {(item.preco * item.quantidade).toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="carrinho-item">
                <span className="carrinho-item-nome">Total</span>
                <span className="carrinho-item-precos">R$ {totalCarrinho.toFixed(2)}</span>
              </div>
              <button onClick={finalizarCompra} className="botao botao-finalizar">
                Finalizar Compra
              </button>
              <button onClick={limparCarrinho} className="botao botao-limpar">
                Esvaziar Carrinho
              </button>
            </div>
          </aside>
        )}
      </main>
    </div>
  )
}