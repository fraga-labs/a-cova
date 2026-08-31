// ── INICIO: a franxa inferior ──
// «ÚLTIMOS ACONTECEMENTOS» e «O QUE APRENDÍN HOXE». Horas REAIS, non
// ticks abstractos (decisión que o mockup pinna).

import type { JSX } from 'react'
import { PREFIXO } from '../cova/mente-semente.js'
import type { Acontecemento } from '../cova/acontecementos.js'
import type { Cova } from '../cova/useCova.js'

function hora(ms: number): string {
  return new Date(ms).toLocaleTimeString('gl-ES', { hour: '2-digit', minute: '2-digit' })
}

const ICONA: Readonly<Record<Acontecemento['tipo'], string>> = {
  accion: '·',
  caca: '💩',
  chorar: '😢',
  'nace-palabra': '✦',
  son: '🔉',
  oe: '👂',
  entende: '💡',
  di: '💬',
  dia: '☀',
  'nace-concepto': '◇',
  'nace-memoria': '★',
  esquece: '…',
  auto: '⚡',
  sombra: '🕳',
}

export function Acontecementos({ cova }: { readonly cova: Cova }): JSX.Element {
  const resumo = resumirODia(cova)

  return (
    <section className="franxa" aria-label="Acontecementos">
      <div className="franxa__col">
        <h2 className="titulo">ÚLTIMOS ACONTECEMENTOS</h2>
        <ol className="liña-temporal">
          {cova.acontecementos.slice(0, 8).map((a) => (
            <li key={a.id}>
              <span className="liña-temporal__hora">{hora(a.cando)}</span>
              <span className="liña-temporal__icona" aria-hidden="true">
                {ICONA[a.tipo]}
              </span>
              <button
                type="button"
                className="liña-temporal__texto"
                disabled={a.nodeId === undefined}
                onClick={() => {
                  if (a.nodeId !== undefined) {
                    cova.seleccionar(a.nodeId)
                  }
                }}
              >
                {a.texto}
              </button>
            </li>
          ))}
          {cova.acontecementos.length === 0 ? <li className="baleiro">aínda non pasou nada</li> : null}
        </ol>
      </div>

      <div className="franxa__col franxa__col--resumo">
        <h2 className="titulo">O QUE APRENDÍN HOXE</h2>
        <p className="resumo">{resumo}</p>
      </div>
    </section>
  )
}

function resumirODia(cova: Cova): string {
  const nodos = cova.engine.getTreeDef().nodes
  const palabras = nodos.filter((n) => n.id.startsWith(PREFIXO.palabra))
  const ditas = palabras.filter((n) => cova.engine.getNodeState(n.id)?.state === 'maxed')
  const conceptos = nodos.filter(
    (n) =>
      n.id.startsWith(PREFIXO.concepto) &&
      cova.engine.getNodeState(n.id)?.state !== undefined &&
      cova.engine.getNodeState(n.id)?.state !== 'locked',
  )
  const aloumiños = cova.acontecementos.filter((a) => a.texto === 'un aloumiño').length

  const pezas: string[] = []
  pezas.push(`${palabras.length} ${palabras.length === 1 ? 'palabra oída' : 'palabras oídas'}`)
  if (ditas.length > 0) {
    pezas.push(`${ditas.length} que xa di`)
  }
  if (conceptos.length > 0) {
    pezas.push(`${conceptos.length} ${conceptos.length === 1 ? 'concepto' : 'conceptos'}`)
  }
  if (aloumiños > 0) {
    pezas.push(`${aloumiños} ${aloumiños === 1 ? 'achuchón' : 'achuchóns'} ❤`)
  }
  if (pezas.length === 1 && palabras.length === 0) {
    return 'Aínda nada. Todo o que saiba, saberao por ti.'
  }
  return `+${pezas.join(' · ')}`
}
// ── FIN: a franxa inferior ──
