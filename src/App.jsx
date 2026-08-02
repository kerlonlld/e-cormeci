import { useState } from 'react'
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
  }
]

export default function App() {
  const [carrinho, setCarrinho] = useState([])

  const adicionarProduto = (produto) => {
    setCarrinho((itens) => [...itens, produto])
  }

  const limparCarrinho = () => {
    setCarrinho([])
  }

  return (
    <div className="loja">
      <header className="cabecalho">
        <h1 className="titulo">Minha Loja Virtual</h1>
        <span className="badge-carrinho">Itens no Carrinho: {carrinho.length}</span>
      </header>

      <main className="conteudo-principal">
        <section className="secao-produtos">
          <h2 className="secao-titulo">Nossos Produtos</h2>

          <div className="grade-produtos">
            {produtos.map((produto) => (
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

        <aside className="sidebar-carrinho">
          <h2 className="secao-titulo">Seu Carrinho</h2>

          {carrinho.length === 0 ? (
            <p className="carrinho-vazio">O carrinho está vazio. Comece a construir sua compra!</p>
          ) : (
            <div className="carrinho-lista">
              {carrinho.map((item, index) => (
                <div key={index} className="carrinho-item">
                  <span className="carrinho-item-nome">{item.nome}</span>
                  <span className="carrinho-item-preco">R$ {item.preco.toFixed(2)}</span>
                </div>
              ))}

              <button onClick={limparCarrinho} className="botao botao-limpar">
                Esvaziar Carrinho
              </button>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}


