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
    nome: 'Sabão em pó 250g',
    preco: 5.0,
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbJcOIAU3ZiREyaRkZhSUwhjUZYLLNbtCHHHdP6m5shA&s=10',
  },
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
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-wide">Minha Loja Virtual 🛒</h1>
        <span className="bg-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
          Itens no Carrinho: {carrinho.length}
        </span>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Nossos Produtos</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {produtos.map((produto) => (
              <div key={produto.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                <img src={produto.img} alt={produto.nome} className="w-full h-40 object-cover rounded-lg mb-3" />
                <div>
                  <h3 className="font-semibold text-lg text-gray-700">{produto.nome}</h3>
                  <p className="text-blue-600 font-bold mt-1">R$ {produto.preco.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => adicionarProduto(produto)}
                  className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition-colors"
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Seu Carrinho</h2>

          {carrinho.length === 0 ? (
            <p className="text-gray-500 text-sm">O carrinho está vazio. Comece a construir sua compra!</p>
          ) : (
            <div className="space-y-3">
              {carrinho.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-2 text-sm">
                  <span className="text-gray-600">{item.nome}</span>
                  <span className="font-semibold text-gray-800">R$ {item.preco.toFixed(2)}</span>
                </div>
              ))}

              <button
                onClick={limparCarrinho}
                className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition-colors"
              >
                Esvaziar Carrinho
              </button>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}


