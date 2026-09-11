import { useState } from 'react'

export function LocalizacaoMaps({ onLocalizacaoChange, editar = false, onEdicaoConcluida, onEditar }) {
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState('')
  const [numero, setNumero] = useState('')
  const [referencia, setReferencia] = useState('')
  const [localizacaoAtual, setLocalizacaoAtual] = useState(null)
  const [enderecoConfirmado, setEnderecoConfirmado] = useState(false)

  const atualizarLocalizacao = (latitude, longitude, nomeLocal = 'Localização selecionada') => {
    const localizacao = {
      latitude,
      longitude,
      nomeLocal,
      confirmado: false,
    }

    setLocalizacaoAtual(localizacao)
    setEnderecoConfirmado(false)

    if (onLocalizacaoChange) {
      onLocalizacaoChange(localizacao)
    }
  }

  const formatarCep = (valor) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 8)
    return numeros.length > 5 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros
  }

  const confirmarEndereco = () => {
    if (!localizacaoAtual) {
      alert('Primeiro use o GPS ou busque um endereço para confirmar.')
      return
    }

    const localizacaoConfirmada = {
      ...localizacaoAtual,
      confirmado: true,
    }

    setEnderecoConfirmado(true)
    if (onLocalizacaoChange) {
      onLocalizacaoChange(localizacaoConfirmada)
    }

    onEdicaoConcluida?.()

    alert('Endereço confirmado com sucesso.')
  }

  const verificarEndereco = () => {
    if (!localizacaoAtual) return

    const url = `https://www.google.com/maps/search/?api=1&query=${localizacaoAtual.latitude},${localizacaoAtual.longitude}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const abrirEnderecoDigitado = async (e) => {
    e.preventDefault()
    const cepNumerico = cep.replace(/\D/g, '')

    if (cepNumerico.length !== 8) {
      alert('Digite um CEP válido com 8 números.')
      return
    }

    if (!endereco.trim()) {
      alert('Digite sua rua, número e bairro para localizar o endereço exato.')
      return
    }

    if (!numero.trim()) {
      alert('Digite o número da casa para localizar o endereço exato.')
      return
    }

    try {
      const enderecoInformado = endereco.trim()
      const referenciaInformada = referencia.trim()
      const respostaCep = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`)
      const dadosCep = await respostaCep.json()

      if (dadosCep.erro) {
        alert('CEP não encontrado. Confira o número digitado.')
        return
      }

      const consulta = [
        enderecoInformado,
        numero.trim(),
        referenciaInformada,
        dadosCep.logradouro,
        dadosCep.bairro,
        dadosCep.localidade,
        dadosCep.uf,
        cep,
        'Brasil',
      ].filter(Boolean).join(', ')
      const resposta = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=br&q=${encodeURIComponent(consulta)}`,
        {
          headers: {
            'Accept-Language': 'pt-BR',
          },
        }
      )

      const dados = await resposta.json()

      if (!dados || dados.length === 0) {
        alert('Não foi possível localizar este endereço. Tente outro valor.')
        return
      }

      const { lat, lon } = dados[0]
      const cepEncontrado = formatarCep(dados[0].address?.postcode || cep)
      const nomeLocal = `${enderecoInformado}, ${numero.trim()}${referenciaInformada ? ` - Ref.: ${referenciaInformada}` : ''} - CEP ${cepEncontrado}`

      setCep(formatarCep(dados[0].address?.postcode || cep))
      setEndereco(enderecoInformado)
      atualizarLocalizacao(Number(lat), Number(lon), nomeLocal)

    } catch {
      alert('Erro ao consultar o endereço. Tente novamente.')
    }
  }

  return (
    <div className="container-localizacao">
      {enderecoConfirmado && !editar ? (
        <div className="endereco-recolhido">
          <div>
            <span className="rotulo-cartao">Endereço de entrega</span>
            <strong>{localizacaoAtual.nomeLocal}</strong>
          </div>
          <button
            type="button"
            className="botao-secundario"
            onClick={() => onEditar?.()}
          >
            Editar endereço
          </button>
        </div>
      ) : (
        <>
      <h3 className="titulo-localizacao">📍 Endereço de Entrega</h3>

      <label className="rotulo-endereco" htmlFor="cep-entrega">CEP</label>
      <div className="linha-cep">
        <input
          id="cep-entrega"
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(formatarCep(e.target.value))}
          className="input-endereco"
        />
      </div>

      <div className="divisor">
        <span>Depois informe seu endereço</span>
      </div>

      <form onSubmit={abrirEnderecoDigitado} className="form-endereco">
        <input
          type="text"
          placeholder="Rua e bairro..."
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          className="input-endereco"
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Número"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          className="input-endereco"
        />
        <input
          type="text"
          placeholder="Referência (opcional)"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          className="input-endereco"
        />
        <button type="submit" className="botao-busca">
          Encontrar endereço exato
        </button>
      </form>

      {localizacaoAtual && (
        <div className="resumo-endereco">
          <p className="texto-endereco">
            {localizacaoAtual.nomeLocal}
          </p>
          <div className="acoes-endereco">
            <button type="button" onClick={verificarEndereco} className="botao-verificar">
              Verificar no mapa
            </button>
            <button type="button" onClick={confirmarEndereco} className="botao-confirmar">
              {enderecoConfirmado ? 'Endereço confirmado' : 'Confirmar meu endereço'}
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}