import { useEffect, useState } from 'react'

export function LocalizacaoMaps({ onLocalizacaoChange, editar = false, onEdicaoConcluida, onEditar }) {
  const [cidade, setCidade] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('endereco-cidade-e-cormeci')) || ''
    } catch {
      return ''
    }
  })
  const [endereco, setEndereco] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('endereco-rua-e-cormeci')) || ''
    } catch {
      return ''
    }
  })
  const [numero, setNumero] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('endereco-numero-e-cormeci')) || ''
    } catch {
      return ''
    }
  })
  const [referencia, setReferencia] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('endereco-referencia-e-cormeci')) || ''
    } catch {
      return ''
    }
  })
  const [localizacaoAtual, setLocalizacaoAtual] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('localizacao-atual-e-cormeci')) || null
    } catch {
      return null
    }
  })
  const [enderecoConfirmado, setEnderecoConfirmado] = useState(() => {
    try {
      return Boolean(JSON.parse(localStorage.getItem('endereco-confirmado-e-cormeci')))
    } catch {
      return false
    }
  })

  useEffect(() => {
    localStorage.setItem('endereco-cidade-e-cormeci', JSON.stringify(cidade))
    localStorage.setItem('endereco-rua-e-cormeci', JSON.stringify(endereco))
    localStorage.setItem('endereco-numero-e-cormeci', JSON.stringify(numero))
    localStorage.setItem('endereco-referencia-e-cormeci', JSON.stringify(referencia))
  }, [cidade, endereco, numero, referencia])

  useEffect(() => {
    localStorage.setItem('localizacao-atual-e-cormeci', JSON.stringify(localizacaoAtual))
    localStorage.setItem('endereco-confirmado-e-cormeci', JSON.stringify(enderecoConfirmado))
  }, [localizacaoAtual, enderecoConfirmado])

  const montarNomeLocal = () => {
    const rua = endereco.trim()
    const numeroFormatado = numero.trim()
    const referenciaFormatada = referencia.trim()
    const cidadeFormatada = cidade.trim()

    return [
      rua || 'Endereço informado',
      numeroFormatado ? `Nº ${numeroFormatado}` : '',
      referenciaFormatada ? `Ref.: ${referenciaFormatada}` : '',
      cidadeFormatada ? `${cidadeFormatada}` : '',
    ].filter(Boolean).join(' • ')
  }

  const confirmarEndereco = async () => {
    if (!cidade.trim()) {
      alert('Digite o nome da cidade para confirmar a entrega.')
      return
    }

    if (!endereco.trim()) {
      alert('Digite a rua do endereço para confirmar a entrega.')
      return
    }

    if (!numero.trim()) {
      alert('Digite o número da casa para confirmar o endereço.')
      return
    }

    const enderecoInformado = endereco.trim()
    const referenciaInformada = referencia.trim()
    const cidadeInformada = cidade.trim()
    const nomeLocal = `${enderecoInformado}, ${numero.trim()}${referenciaInformada ? ` - Ref.: ${referenciaInformada}` : ''} - ${cidadeInformada}`

    let latitude = -15.72625
    let longitude = -43.9172778

    try {
      const consulta = [
        enderecoInformado,
        numero.trim(),
        referenciaInformada,
        cidadeInformada,
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

      if (dados && dados.length > 0) {
        latitude = Number(dados[0].lat)
        longitude = Number(dados[0].lon)
      }
    } catch {
      // Mantém fallback para que o endereço continue confirmado mesmo se a API externa falhar.
    }

    const localizacaoConfirmada = {
      latitude,
      longitude,
      nomeLocal,
      confirmado: true,
    }

    setCidade(cidadeInformada)
    setEndereco(enderecoInformado)
    setLocalizacaoAtual(localizacaoConfirmada)
    setEnderecoConfirmado(true)

    if (onLocalizacaoChange) {
      onLocalizacaoChange(localizacaoConfirmada)
    }

    onEdicaoConcluida?.()
    alert('Endereço confirmado com sucesso.')
  }

  const abrirEnderecoDigitado = async (e) => {
    e.preventDefault()
    await confirmarEndereco()
  }

  return (
    <div className="container-localizacao">
      {enderecoConfirmado && !editar ? (
        <div className="endereco-recolhido">
          <div>
            <span className="rotulo-cartao">Endereço de entrega</span>
            <strong>{localizacaoAtual?.nomeLocal}</strong>
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

          <label className="rotulo-endereco" htmlFor="cidade-entrega">Cidade</label>
          <input
            id="cidade-entrega"
            type="text"
            placeholder="Nome da cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="input-endereco"
          />

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
          </form>

          <div className="resumo-endereco">
            <p className="texto-endereco">
              {localizacaoAtual?.nomeLocal || montarNomeLocal()}
            </p>
            <div className="acoes-endereco">
              <button type="button" onClick={confirmarEndereco} className="botao-confirmar">
                {enderecoConfirmado ? 'Endereço confirmado' : 'Confirmar meu endereço'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}