import { cloneElement, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

export function AuthGate({ children }) {
  // Mantém o usuário Firebase e controla os estados da tela de login.
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [modoCadastro, setModoCadastro] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)

  useEffect(() => onAuthStateChanged(auth, (usuarioAtual) => {
    // O Firebase restaura automaticamente a sessão salva no navegador.
    setUsuario(usuarioAtual)
    setCarregando(false)
  }), [])

  const entrarComGoogle = async () => {
    // Abre o fluxo seguro de autenticação Google.
    setErro('')
    setProcessando(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      setErro(error.code === 'auth/popup-blocked'
        ? 'O navegador bloqueou a janela de login. Permita pop-ups e tente novamente.'
        : 'Não foi possível entrar com Google.')
    } finally {
      setProcessando(false)
    }
  }

  const entrarComEmail = async (evento) => {
    // Faz login ou cria uma conta usando e-mail e senha.
    evento.preventDefault()
    setErro('')
    setProcessando(true)
    try {
      if (modoCadastro) {
        await createUserWithEmailAndPassword(auth, email, senha)
      } else {
        await signInWithEmailAndPassword(auth, email, senha)
      }
    } catch (error) {
      const mensagens = {
        'auth/invalid-credential': 'E-mail ou senha inválidos.',
        'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
        'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
        'auth/invalid-email': 'Digite um e-mail válido.',
      }
      setErro(mensagens[error.code] || 'Não foi possível concluir o acesso.')
    } finally {
      setProcessando(false)
    }
  }

  if (carregando) return <main className="painel-acesso"><p>Carregando acesso...</p></main>
  if (usuario) {
    // Só libera a loja depois que o usuário estiver autenticado.
    return (
      <>
        {cloneElement(children, { usuario, onSair: () => signOut(auth) })}
      </>
    )
  }

  return (
    <main className="painel-acesso login-cliente">
      <section className="painel-login">
        <span className="rotulo-cartao">Acesso obrigatório</span>
        <h1>Entre para comprar</h1>
        <p className="texto-vazio">Use sua conta Google ou entre com e-mail e senha.</p>
        <button type="button" className="botao-google" onClick={entrarComGoogle} disabled={processando}>
          {processando ? 'Aguarde...' : 'Continuar com Google'}
        </button>
        <div className="separador-login"><span>ou</span></div>
        <form onSubmit={entrarComEmail}>
          <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Senha<input type="password" minLength="6" value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
          <button type="submit" className="botao-confirmar" disabled={processando}>
            {modoCadastro ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
        <button type="button" className="botao-link-login" onClick={() => { setModoCadastro(!modoCadastro); setErro('') }}>
          {modoCadastro ? 'Já tenho uma conta' : 'Criar conta com e-mail'}
        </button>
        {erro && <p className="mensagem-erro">{erro}</p>}
      </section>
    </main>
  )
}
