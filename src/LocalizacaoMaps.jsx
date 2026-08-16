import { useState } from 'react'

export function LocalizacaoMaps({ onLocalizacaoChange }) {
  const [endereco, setEndereco] = useState('')
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

    alert('Endereço confirmado com sucesso.')
  }

  const abrirLocalizacaoAtual = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (posicao) => {
          const { latitude, longitude } = posicao.coords
          atualizarLocalizacao(latitude, longitude, 'Minha localização atual')

          const url = `https://www.google.com/maps?q=${latitude},${longitude}`
          window.open(url, '_blank')
        },
        () => {
          alert('Não foi possível obter sua localização. Verifique se o GPS está ativado.')
        }
      )
    } else {
      alert('Seu navegador não suporta geolocalização.')
    }
  }

  const abrirEnderecoDigitado = async (e) => {
    e.preventDefault()

    if (!endereco.trim()) {
      alert('Digite um endereço ou CEP primeiro.')
      return
    }

    try {
      const resposta = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(endereco)}`,
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

      const { lat, lon, display_name } = dados[0]
      atualizarLocalizacao(Number(lat), Number(lon), display_name)

      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
      window.open(url, '_blank')
    } catch (erro) {
      alert('Erro ao consultar o endereço. Tente novamente.')
    }
  }

  return (
    <div className="container-localizacao">
      <h3 className="titulo-localizacao">📍 Endereço de Entrega</h3>

      <button type="button" onClick={abrirLocalizacaoAtual} className="botao-gps">
        🎯 Usar minha localização atual (GPS)
      </button>

      <div className="divisor">
        <span>ou digite abaixo</span>
      </div>

      <form onSubmit={abrirEnderecoDigitado} className="form-endereco">
        <input
          type="text"
          placeholder="Digite seu CEP, rua ou bairro..."
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          className="input-endereco"
        />
        <button type="submit" className="botao-busca">
          Ver no Mapa
        </button>
      </form>

      {localizacaoAtual && (
        <div className="resumo-endereco">
          <p className="texto-endereco">
            {localizacaoAtual.nomeLocal}
          </p>
          <button type="button" onClick={confirmarEndereco} className="botao-confirmar">
            {enderecoConfirmado ? 'Endereço confirmado' : 'Confirmar meu endereço'}
          </button>
        </div>
      )}
    </div>
  )
}