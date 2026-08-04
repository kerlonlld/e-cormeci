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
  },
  {
   id : 4,
   nome : 'sabão em barra 1kg',
   preco : 4.00,
   img : ' https://cdn.awsli.com.br/2500x2500/1027/1027618/produto/55867977/51206cb51c.jpg'
  }
]

export default function App() {
  const [carrinho, setCarrinho] = useState([])
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

  const finalizarCompra = () => {
    if (totalItens === 0) {
      alert('O carrinho está vazio. Adicione produtos antes de finalizar a compra.')
      return
    }

    alert(`Compra finalizada! Total: R$ ${totalCarrinho.toFixed(2)}`)
    limparCarrinho()
  }

  return (
    <div className="loja">
      <header className="cabecalho">
        <h1 className="titulo">Minha Loja Virtual</h1>
        <span className="badge-carrinho">Itens no Carrinho: {totalItens}</span>
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

          {totalItens === 0 ? (
            <p className="carrinho-vazio">O carrinho está vazio. Comece a construir sua compra!</p>
          ) : (
            <div className="carrinho-lista">
              {carrinho.map((item, index) => (
                <div key={index} className="carrinho-item">
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
                  finalizar Compra 
                </button>
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


