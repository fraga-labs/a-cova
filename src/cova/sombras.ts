// ── INICIO: as sombras ──
// O que o bebé aprende cando NON vas.
//
// Ata aquí o abandono só quitaba (esquecía palabras, baixaba o apego).
// Iso é un burato no propio principio do proxecto: se a mente é o rexistro
// da crianza, a ausencia tamén deixa rexistro. As sombras son leccións de
// supervivencia — adaptacións, non castigos. Cada unha DÁ algo e QUITA
// algo, porque así funcionan as adaptacións.
//
// Mecanicamente non hai aparello novo: son nodos que nacen en runtime
// (`applyChanges`) cunha rexión propia, e teñen tag `auto`, así que a
// mesma regra 1 que acende o malestar acéndeas a elas cando a soidade
// pasa o seu limiar, e apágaas cando baixa.
//
// **Nunca desaparecen.** Coidar ao bebé apágaas (volven a `locked`), pero
// o nodo queda na mente para sempre e viaxa no documento exportado. Unha
// cicatriz apagada segue sendo unha cicatriz.
//
// Aviso honesto: isto NON é un modelo de apego infantil nin pretende
// dicir nada sobre nenos reais. Son etiquetas nun grafo, escollidas
// porque fan un bo bucle de xogo.

import type { TreeEngine } from '@yggdrasil-forge/core'
import { isOk } from '@yggdrasil-forge/core'
import { REXIONS, TAG_AUTO } from './mente-semente.js'

export const PREFIXO_SOMBRA = 'sombra:'

export interface Sombra {
  readonly id: string
  /**
   * Nome do NODO. Curto a propósito: un nodo do grafo non aguanta unha
   * frase. A frase enteira vai en `leccion` (liña temporal) e en
   * `aviso` (panel do bebé), que si teñen sitio.
   */
  readonly etiqueta: string
  readonly icona: string
  /** Que aprendeu, dito sen adornos. */
  readonly descricion: string
  /** Soidade a partir da cal se acende. */
  readonly limiar: number
  /** Liña para a liña temporal cando nace. */
  readonly leccion: string
  /** Liña para o panel do bebé mentres está acesa. */
  readonly aviso: string
}

export const SOMBRAS: readonly Sombra[] = [
  {
    id: 'auto-consolo',
    etiqueta: 'calmarse só',
    icona: '🫂',
    descricion: 'Aprendeu a acougar sen ninguén. Xa non te precisa tanto — e nótase.',
    limiar: 30,
    leccion: 'aprendeu a calmarse só',
    aviso: 'Aprendeu a calmarse só: os aloumiños valen menos ca antes.',
  },
  {
    id: 'garda',
    etiqueta: 'ollo aberto',
    icona: '👁',
    descricion: 'Non descansa do todo. Está pendente por se acaso.',
    limiar: 50,
    leccion: 'dorme cun ollo aberto',
    aviso: 'Dorme cun ollo aberto: perde enerxía máis rápido.',
  },
  {
    id: 'acaparar',
    etiqueta: 'acaparar',
    icona: '🥣',
    descricion: 'Aproveita cada comida ata o final. Sáelle mellor a fame e peor todo o demais.',
    limiar: 65,
    leccion: 'come coma se non fose haber máis',
    aviso: 'Come coma se non fose haber máis: sacia mellor, ensucia moito máis.',
  },
  {
    id: 'silencio',
    etiqueta: 'non chamar',
    icona: '🤐',
    descricion: 'Xa non chora. Non porque estea ben: porque deixou de agardar que veñas.',
    limiar: 85,
    leccion: 'deixou de chamar',
    aviso: 'Xa non chora. Non porque estea ben.',
  },
]

export function idSombra(id: string): string {
  return `${PREFIXO_SOMBRA}${id}`
}

/** O grupo da rexión SOMBRA. Non está na semente: nace coa primeira lección. */
export function grupoSombra(primeiraSombraId: string) {
  return {
    id: REXIONS.sombra,
    label: { gl: 'SOMBRA' },
    color: '#8a8f9c',
    anchorNodeId: idSombra(primeiraSombraId),
  } as const
}

/** As sombras que están acesas agora mesmo. */
export function sombrasAcesas(engine: TreeEngine): readonly Sombra[] {
  return SOMBRAS.filter((s) => {
    const estado = engine.getNodeState(idSombra(s.id))?.state
    return estado === 'unlocked' || estado === 'maxed'
  })
}

/**
 * O que as sombras acesas lle cambian ao mundo. Datos, non condicionais
 * espallados: quen aplica isto é `useCova`, e é doado de ler e de probar.
 */
export interface Modificadores {
  /** Multiplicador do apego que dan as accións. */
  readonly gananciaApego: number
  /** Enerxía extra que se perde por momento (negativa). */
  readonly derivaEnerxia: number
  /** Multiplicador do que alimenta unha comida. */
  readonly saciedade: number
  /** Sucidade de máis que deixa unha comida. */
  readonly sucidadeExtra: number
  /** Soidade de máis por momento. */
  readonly soidadeExtra: number
  /** Deixou de chamar: o malestar segue aí, pero xa non pide axuda. */
  readonly cala: boolean
}

export const SEN_SOMBRAS: Modificadores = {
  gananciaApego: 1,
  derivaEnerxia: 0,
  saciedade: 1,
  sucidadeExtra: 0,
  soidadeExtra: 0,
  cala: false,
}

export function modificadores(acesas: readonly Sombra[]): Modificadores {
  const ten = (id: string): boolean => acesas.some((s) => s.id === id)
  return {
    gananciaApego: ten('auto-consolo') ? 0.45 : 1,
    derivaEnerxia: ten('garda') ? -1 : 0,
    saciedade: ten('acaparar') ? 1.35 : 1,
    sucidadeExtra: ten('acaparar') ? 15 : 0,
    soidadeExtra: ten('silencio') ? 1 : 0,
    cala: ten('silencio'),
  }
}

/**
 * Fai nacer as sombras cuxo limiar de soidade xa se acadou. Non as
 * acende: diso encárgase `reconciliarAutonomos`, coma con calquera outro
 * nodo `auto`. Devolve os ids nacidos nesta pasada.
 */
export async function xerarSombras(
  engine: TreeEngine,
  soidade: number,
): Promise<readonly Sombra[]> {
  const nacidas: Sombra[] = []
  const xaHaiGrupo = (engine.getTreeDef().groups ?? []).some((g) => g.id === REXIONS.sombra)

  for (const sombra of SOMBRAS) {
    if (soidade < sombra.limiar) {
      continue
    }
    const nodeId = idSombra(sombra.id)
    if (engine.getTreeDef().nodes.some((n) => n.id === nodeId)) {
      continue
    }

    const r = await engine.applyChanges([
      // O grupo nace coa primeira lección. Non se declara na semente
      // porque unha rexión baleira sería unha promesa que quizais nunca
      // se cumpra: un bebé ben coidado non chega a ver esta rexión.
      ...(xaHaiGrupo || nacidas.length > 0
        ? []
        : ([{ type: 'add_group', group: grupoSombra(sombra.id) }] as const)),
      {
        type: 'add_node',
        node: {
          id: nodeId,
          type: 'keystone',
          group: REXIONS.sombra,
          icon: sombra.icona,
          color: '#8a8f9c',
          shape: 'octagon',
          label: { gl: sombra.etiqueta },
          description: { gl: sombra.descricion },
          tags: [REXIONS.sombra, 'sombra', TAG_AUTO],
          prerequisites: { type: 'resource_min', resourceId: 'soidade', amount: sombra.limiar },
        },
      },
      {
        type: 'add_edge',
        edge: {
          id: `e-eu-${nodeId}`,
          source: 'eu',
          target: nodeId,
          type: 'path',
          style: { dashPattern: [4, 4] },
        },
      },
    ])

    if (isOk(r)) {
      nacidas.push(sombra)
    }
  }

  return nacidas
}
// ── FIN: as sombras ──
