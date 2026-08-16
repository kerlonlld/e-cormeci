import { useState, useRef } from 'react'
import './App.css'
import { useState } from 'react'

export default function App() {
  // Estado para saber qual aba está selecionada
  const [abaAtiva, setAbaAtiva] = useState('home')

  return (
    <div className="loja">
      {/* 1. Exibição condicional baseada na aba ativa */}
      {abaAtiva === 'home' && (
        <main className="conteudo-principal">
          {/* Coloque aqui toda a sua seção de produtos existente */}
        </main>
      )}

      {abaAtiva === 'saldo' && (
        <div className="pagina-aba">
          <h2>Seu Saldo</h2>
          <p className="saldo-valor">R$ 150,00</p>
        </div>
      )}

      {abaAtiva === 'perfil' && (
        <div className="pagina-aba">
          <h2>Meu Perfil</h2>
          <p>Nome: Usuário</p>
          <p>Email: usuario@email.com</p>
        </div>
      )}

      {/* 2. Barra de Navegação Inferior */}
      <nav className="menu-inferior">
        <button
          className={`item-menu ${abaAtiva === 'home' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('home')}
        >
          <span className="icone">🏠</span>
          <span className="texto">Inicio</span>
        </button>

        <button
          className={`item-menu ${abaAtiva === 'saldo' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('saldo')}
        >
          <span className="icone">$</span>
          <span className="texto">Saldo</span>
        </button>

        <button
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