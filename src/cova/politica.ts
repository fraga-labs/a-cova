// ── INICIO: a política de crecemento — FASE A ──
// O único corazón NOVO do proxecto. Todo o demais (drives, tiers, tempo,
// audit, share) é aparello verificado de Yggdrasil Forge; isto non o
// regala ningún plugin.
//
// Regras, deterministas, sen LLM:
//   1. AUTONOMÍA   — un nodo con tag `auto` acéndese só en canto o seu
//                    prerequisito se cumpre, e apágase só cando deixa de
//                    cumprirse. O motor non fai isto (achado 1).
//   2. NACEMENTO   — unha palabra nova nace como nodo (`applyChanges`).
//   3. TIERS       — 1/3 oíuna · 2/3 compréndea (repetición EN CONTEXTO)
//                    · 3/3 dia.
//   4. CONCEPTOS   — dúas palabras a 3/3 do mesmo campo semántico fan
//                    nacer un nodo-concepto que as require (`all`).
//   5. ESQUECEMENTO— frescura que decae por momento sen reforzo; ao
//                    chegar a cero, a palabra baixa un tier (ou pérdese).
//
// Este módulo é CASE PURO: recibe o engine e devolve o que pasou. Non
// toca React nin o DOM. Por iso é testable sen navegador.

import type { TreeEngine } from '@yggdrasil-forge/core'
import { isOk } from '@yggdrasil-forge/core'
import { DIXESTION_MS, FUTURO_LONXANO } from './drives.js'
import { CAMPOS, type EstimuloId, camposDe, casaConEstimulo, normalizar } from './lexico.js'
import { PREFIXO, REXIONS, TAG_AUTO } from './mente-semente.js'

// ── Estado da política (o que o motor non ten onde gardar) ──

/**
 * Frescura dunha palabra: 0-100. Decae por momento. Ao chegar a 0, a
 * palabra esquécese (baixa un tier). Vive aquí e non no `TreeState`
 * porque non hai API pública para escribir estado por-nodo do
 * consumidor (achado 3).
 */
export type Frescuras = Record<string, number>

export interface EstadoPolitica {
  /** Momentos de reloxo transcorridos desde o nacemento. */
  readonly momentos: number
  /** Día da cova (1-indexado). */
  readonly dia: number
  /** Que está a pasar agora mesmo. Define a «repetición en contexto». */
  readonly estimulo: EstimuloId
  /** Momento no que o estímulo actual deixa de estar activo. */
  readonly estimuloAte: number
  readonly frescuras: Frescuras
  /** Palabras (normalizadas) que xa chegaron a 3/3 algunha vez. */
  readonly ditas: readonly string[]
}

export const ESTADO_INICIAL: EstadoPolitica = {
  momentos: 0,
  dia: 1,
  estimulo: 'nada',
  estimuloAte: 0,
  frescuras: {},
  ditas: [],
}

/**
 * Momentos que dura un estímulo activo tras unha acción do coidador.
 * Oito (uns 32 s) porque o coidador ten que escribir a palabra: con
 * catro chegaba tarde sempre e a regra do contexto parecía rota.
 */
export const DURACION_ESTIMULO = 8

/** Canto decae a frescura dunha palabra por momento. */
export const DECAEMENTO = 4

/** Frescura que recupera unha palabra ao ser ensinada de novo. */
export const REFORZO = 100

// ── Acontecementos ──

export type TipoAcontecemento =
  | 'accion'
  | 'caca'
  | 'chorar'
  | 'nace-palabra'
  | 'tier'
  | 'dia'
  | 'nace-concepto'
  | 'nace-memoria'
  | 'esquece'
  | 'auto'

export interface Acontecemento {
  readonly id: string
  readonly tipo: TipoAcontecemento
  /** Hora real, como no mockup: horas de verdade, non ticks abstractos. */
  readonly cando: number
  readonly texto: string
  /** Nodo implicado, se o hai. Permite acender o nodo no grafo. */
  readonly nodeId?: string
}

let contadorAcontecemento = 0

export function acontecemento(
  tipo: TipoAcontecemento,
  texto: string,
  agora: number,
  nodeId?: string,
): Acontecemento {
  contadorAcontecemento += 1
  return {
    id: `ac-${agora}-${contadorAcontecemento}`,
    tipo,
    cando: agora,
    texto,
    ...(nodeId !== undefined && { nodeId }),
  }
}

// ── Regra 1: autonomía ──

/**
 * Percorre os nodos con tag `auto` e sincroniza o seu estado co seu
 * prerequisito: acéndeos cando se cumpre, apágaos cando deixa de
 * cumprirse. É a regra que fai que o malestar apareza SÓ.
 *
 * Devolve os acontecementos xerados.
 */
export async function reconciliarAutonomos(
  engine: TreeEngine,
  agora: number,
): Promise<readonly Acontecemento[]> {
  const feitos: Acontecemento[] = []
  const treeDef = engine.getTreeDef()

  for (const nodeDef of treeDef.nodes) {
    if (!(nodeDef.tags ?? []).includes(TAG_AUTO)) {
      continue
    }
    const instancia = engine.getNodeState(nodeDef.id)
    const aceso = instancia?.state === 'unlocked' || instancia?.state === 'maxed'
    // `explainUnlock` (e non `canUnlock`) a propósito: aquí só nos
    // interesa se o PREREQUISITO se cumpre. `canUnlock` devolvería
    // `false` nun nodo xa acendido (maxTier acadado) e faríanos apagalo
    // no seguinte momento — o pantasma que nos costou o primeiro test.
    const explicacion = engine.explainUnlock(nodeDef.id)
    const cumpre = isOk(explicacion) && explicacion.value.satisfied

    if (!aceso && cumpre) {
      const r = await engine.unlock(nodeDef.id)
      if (isOk(r)) {
        feitos.push(
          acontecemento('auto', textoAceso(nodeDef.id), agora, nodeDef.id),
        )
      }
      continue
    }

    // Apagado: só para os que poden volver á sombra. A caca non se apaga
    // soa (o seu `time_after` segue certo para sempre) — apágaa `limpar`.
    if (aceso && !cumpre && nodeDef.id !== 'caca') {
      await engine.lock(nodeDef.id)
    }
  }

  return feitos
}

function textoAceso(nodeId: string): string {
  switch (nodeId) {
    case 'caca':
      return 'caca!'
    case 'malestar':
      return 'chora: leva tempo sucio e ninguén o limpou'
    case 'ledicia':
      return 'está contento'
    case 'tristura':
      return 'está triste'
    default:
      return `acendeuse «${nodeId}» soa`
  }
}

// ── Regra 2 e 3: nacemento de palabra e tiers ──

export interface ResultadoEnsinanza {
  readonly acontecementos: readonly Acontecemento[]
  readonly frescuras: Frescuras
  readonly ditas: readonly string[]
  /** Id do nodo-palabra tocado (para seleccionalo no grafo). */
  readonly nodeId: string
  /** Tier no que quedou a palabra tras esta ensinanza. */
  readonly tier: number
  /** `true` se a palabra chegou a 3/3 NESTA ensinanza. */
  readonly dita: boolean
}

export function idPalabra(palabra: string): string {
  return `${PREFIXO.palabra}${normalizar(palabra)}`
}

/**
 * Ensinar unha palabra. Se non existe, NACE (nodo + aresta desde a voz).
 * Se existe, sobe un tier — pero só se hai repetición EN CONTEXTO
 * (a palabra casa co estímulo activo). Se non, o bebé só a oe outra vez.
 */
export async function ensinarPalabra(
  engine: TreeEngine,
  estado: EstadoPolitica,
  palabraCru: string,
  agora: number,
): Promise<ResultadoEnsinanza | null> {
  const palabra = normalizar(palabraCru)
  if (palabra.length === 0) {
    return null
  }

  const nodeId = idPalabra(palabra)
  const feitos: Acontecemento[] = []
  const existe = engine.getTreeDef().nodes.some((n) => n.id === nodeId)

  if (!existe) {
    const nacemento = await engine.applyChanges([
      {
        type: 'add_node',
        node: {
          id: nodeId,
          type: 'small',
          group: REXIONS.linguaxe,
          icon: '🗣',
          color: '#a97ae0',
          shape: 'hexagon',
          label: { gl: palabra },
          description: { gl: `Unha palabra que lle ensinaches o día ${estado.dia}.` },
          maxTier: 3,
          tags: [REXIONS.linguaxe, 'palabra'],
        },
      },
      {
        type: 'add_edge',
        edge: {
          id: `e-verbo-${nodeId}`,
          source: 'verbo',
          target: nodeId,
          type: 'dependency',
        },
      },
    ])
    if (!isOk(nacemento)) {
      return null
    }
    feitos.push(acontecemento('nace-palabra', `naceu a palabra «${palabra}»`, agora, nodeId))
  }

  const instancia = engine.getNodeState(nodeId)
  const tierActual = instancia?.currentTier ?? 0
  const enContexto = casaConEstimulo(palabra, estado.estimulo)

  // 1/3 sempre se pode acadar: oíla non require contexto.
  // 2/3 e 3/3 SÓ con repetición en contexto. Esa é a regra.
  const podeSubir = tierActual === 0 || enContexto
  let tierFinal = tierActual

  if (podeSubir && tierActual < 3) {
    const subida = await engine.unlock(nodeId)
    if (isOk(subida)) {
      tierFinal = subida.value.tier
      feitos.push(
        acontecemento('tier', `${textoTier(tierFinal)} «${palabra}» ${tierFinal}/3`, agora, nodeId),
      )
    }
  } else if (tierActual >= 3) {
    feitos.push(acontecemento('tier', `repetiu «${palabra}» — xa a sabe`, agora, nodeId))
  } else {
    feitos.push(acontecemento('tier', `oíu «${palabra}» fóra de contexto`, agora, nodeId))
  }

  const frescuras: Frescuras = { ...estado.frescuras, [nodeId]: REFORZO }
  const dita = tierFinal === 3 && tierActual < 3
  const ditas = dita ? [...estado.ditas, palabra] : estado.ditas

  if (dita) {
    feitos.push(acontecemento('tier', `DIXO «${palabra}»!`, agora, nodeId))
  }

  return { acontecementos: feitos, frescuras, ditas, nodeId, tier: tierFinal, dita }
}

function textoTier(tier: number): string {
  switch (tier) {
    case 1:
      return 'oíu'
    case 2:
      return 'entendeu'
    default:
      return 'di'
  }
}

// ── Regra 4: nacemento de conceptos ──

/**
 * Busca campos semánticos con DÚAS OU MÁIS palabras a 3/3 e fai nacer o
 * nodo-concepto correspondente, que require esas palabras (`all`).
 * A mente gaña un piso.
 */
export async function xerarConceptos(
  engine: TreeEngine,
  agora: number,
): Promise<readonly Acontecemento[]> {
  const feitos: Acontecemento[] = []
  const treeDef = engine.getTreeDef()

  const maxadas = treeDef.nodes
    .filter((n) => n.id.startsWith(PREFIXO.palabra))
    .filter((n) => engine.getNodeState(n.id)?.state === 'maxed')
    .map((n) => n.id.slice(PREFIXO.palabra.length))

  for (const campo of CAMPOS) {
    const nodeId = `${PREFIXO.concepto}${campo.id}`
    if (treeDef.nodes.some((n) => n.id === nodeId)) {
      continue
    }
    const soporte = maxadas.filter((p) => camposDe(p).some((c) => c.id === campo.id))
    if (soporte.length < 2) {
      continue
    }

    const requisitos = soporte.map(
      (p) => ({ type: 'node_maxed', nodeId: `${PREFIXO.palabra}${p}` }) as const,
    )

    const nacemento = await engine.applyChanges([
      {
        type: 'add_node',
        node: {
          id: nodeId,
          type: 'notable',
          group: REXIONS.conceptos,
          icon: campo.icona,
          color: '#6fbf73',
          shape: 'diamond',
          label: { gl: campo.etiqueta },
          description: {
            gl: `Naceu de xuntar ${soporte.map((p) => `«${p}»`).join(' e ')}.`,
          },
          tags: [REXIONS.conceptos, 'concepto', TAG_AUTO],
          prerequisites: { type: 'all', conditions: requisitos },
        },
      },
      { type: 'add_edge', edge: { id: `e-nocion-${nodeId}`, source: 'nocion', target: nodeId, type: 'dependency' } },
      ...soporte.map((p) => ({
        type: 'add_edge' as const,
        edge: {
          id: `e-${nodeId}-${p}`,
          source: nodeId,
          target: `${PREFIXO.palabra}${p}`,
          type: 'path' as const,
          style: { dashPattern: [6, 4] },
        },
      })),
    ])

    if (isOk(nacemento)) {
      feitos.push(
        acontecemento('nace-concepto', `naceu o concepto «${campo.etiqueta}»`, agora, nodeId),
      )
    }
  }

  return feitos
}

// ── Memorias: destiladas, non inventadas ──

/**
 * Fai nacer un nodo-memoria. As memorias destílanse de acontecementos
 * que xa ocorreron (o audit log do motor é a fonte de verdade); non se
 * inventan.
 */
export async function nacerMemoria(
  engine: TreeEngine,
  id: string,
  etiqueta: string,
  descricion: string,
  agora: number,
): Promise<readonly Acontecemento[]> {
  const nodeId = `${PREFIXO.memoria}${id}`
  if (engine.getTreeDef().nodes.some((n) => n.id === nodeId)) {
    return []
  }

  const r = await engine.applyChanges([
    {
      type: 'add_node',
      node: {
        id: nodeId,
        type: 'milestone',
        group: REXIONS.memorias,
        icon: '★',
        color: '#5aa9e0',
        label: { gl: etiqueta },
        description: { gl: descricion },
        tags: [REXIONS.memorias, 'memoria'],
      },
    },
    {
      type: 'add_edge',
      edge: {
        id: `e-memoria-${nodeId}`,
        source: 'memoria:nacemento',
        target: nodeId,
        type: 'path',
      },
    },
  ])
  if (!isOk(r)) {
    return []
  }
  await engine.unlock(nodeId)
  return [acontecemento('nace-memoria', `gardou unha memoria: ${etiqueta}`, agora, nodeId)]
}

// ── Regra 5: o esquecemento ──

/**
 * Decae a frescura de todas as palabras. As que chegan a cero baixan un
 * tier (`lockOneTier`); se xa estaban en 1/3, apáganse de todo. Non hai
 * maxia: é a curva do esquecemento como configuración.
 */
export async function esquecer(
  engine: TreeEngine,
  frescuras: Frescuras,
  agora: number,
): Promise<{ frescuras: Frescuras; acontecementos: readonly Acontecemento[] }> {
  const feitos: Acontecemento[] = []
  const seguintes: Frescuras = {}

  for (const [nodeId, valor] of Object.entries(frescuras)) {
    const instancia = engine.getNodeState(nodeId)
    if (instancia === null || instancia.currentTier === 0) {
      continue
    }
    const novo = valor - DECAEMENTO
    if (novo > 0) {
      seguintes[nodeId] = novo
      continue
    }

    const r = await engine.lockOneTier(nodeId)
    const palabra = nodeId.slice(PREFIXO.palabra.length)
    if (isOk(r)) {
      const restante = engine.getNodeState(nodeId)?.currentTier ?? 0
      feitos.push(
        acontecemento(
          'esquece',
          restante === 0
            ? `esqueceu «${palabra}» de todo`
            : `vaille esquecendo «${palabra}» (${restante}/3)`,
          agora,
          nodeId,
        ),
      )
      if (restante > 0) {
        seguintes[nodeId] = REFORZO
      }
    }
  }

  return { frescuras: seguintes, acontecementos: feitos }
}

// ── A dixestión: programar a caca ──

/**
 * Reescribe o `time_after` do nodo `caca` para que se acenda soa dentro
 * de `DIXESTION_MS`. Isto é o `modify_node` do motor usado como reloxo
 * biolóxico: o que entra, sae.
 */
export async function programarDixestion(engine: TreeEngine, agora: number): Promise<void> {
  await engine.applyChanges([
    {
      type: 'modify_node',
      nodeId: 'caca',
      changes: { prerequisites: { type: 'time_after', timestamp: agora + DIXESTION_MS } },
    },
  ])
}

/** Cancela a dixestión pendente e apaga a caca. Chámaa `limpar`. */
export async function limparCaca(engine: TreeEngine): Promise<void> {
  const estado = engine.getNodeState('caca')?.state
  if (estado === 'unlocked' || estado === 'maxed') {
    await engine.lock('caca')
  }
  await engine.applyChanges([
    {
      type: 'modify_node',
      nodeId: 'caca',
      changes: { prerequisites: { type: 'time_after', timestamp: FUTURO_LONXANO } },
    },
  ])
}
// ── FIN: a política de crecemento — FASE A ──
