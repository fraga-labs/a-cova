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
import {
  DIXESTION_MS,
  FUTURO_LONXANO,
  LIMIAR_APEGO_CRITICO,
  LIMIAR_ENERXIA_CRITICA,
  LIMIAR_FAME_CRITICA,
  LIMIAR_SUCIDADE,
  SOIDADE_POR_DESATENCION,
  SOIDADE_QUE_SANDA,
} from './drives.js'
import { type Acontecemento, acontecemento } from './acontecementos.js'
import { CAMPOS, camposDe } from './lexico.js'
import { type Atencion, type Familiaridade, SEN_ATENCION } from './linguaxe.js'
import { PREFIXO, REXIONS, TAG_AUTO } from './mente-semente.js'
import { PREFIXO_SOMBRA, SOMBRAS } from './sombras.js'

// ── Estado da política (o que o motor non ten onde gardar) ──

export interface EstadoPolitica {
  /** Momentos de reloxo transcorridos desde o nacemento. */
  readonly momentos: number
  /** Día da cova (1-indexado). */
  readonly dia: number
  /**
   * A que se está atendendo, e canta atención queda. Substitúe o
   * temporizador de estímulo da v1: agora a atención DECAE, e ensinar
   * axiña vale máis ca ensinar tarde (docs/design/LINGUAXE.md, capa 1).
   */
  readonly atencion: Atencion
  /**
   * Canto sabe de cada nodo: familiaridade nos sons, comprensión nas
   * palabras. Debería vivir no motor (`progress`), pero non se pode
   * — ver docs/ACHADOS.md, achado 7.
   */
  readonly familiaridade: Familiaridade
  /** Palabras (normalizadas) que xa chegou a dicir ben algunha vez. */
  readonly ditas: readonly string[]
}

export const ESTADO_INICIAL: EstadoPolitica = {
  momentos: 0,
  dia: 1,
  atencion: SEN_ATENCION,
  familiaridade: {},
  ditas: [],
}

// Os acontecementos viven en `acontecementos.ts`: emítenos tanto este
// módulo como `linguaxe.ts`, e telos aquí faría un ciclo de imports.

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
        const ehSombra = nodeDef.id.startsWith(PREFIXO_SOMBRA)
        feitos.push(
          acontecemento(ehSombra ? 'sombra' : 'auto', textoAceso(nodeDef.id), agora, nodeDef.id),
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
  if (nodeId.startsWith(PREFIXO_SOMBRA)) {
    const sombra = SOMBRAS.find((x) => `${PREFIXO_SOMBRA}${x.id}` === nodeId)
    return sombra?.leccion ?? 'aprendeu algo da ausencia'
  }
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

// As regras 2 e 3 (nacemento de palabras, sons, comprensión e
// produción) viven en `linguaxe.ts`.

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

// A regra 5 (esquecemento) vive agora en `linguaxe.ts`: o que decae é a
// COMPRENSIÓN da palabra, non un contador aparte.

// ── A conta da ausencia ──

/**
 * Canto sobe (ou baixa) a soidade neste momento. Unha necesidade
 * crítica sen atender suma; un momento no que todo está ben resta —
 * pero moito menos. Aprender a estar só é rápido, desaprendelo non.
 *
 * Puro: recibe os drives, devolve un número. Fácil de probar e de tocar.
 */
export function medirSoidade(
  drives: Readonly<Record<string, number>>,
  extra = 0,
): number {
  const criticas = [
    (drives.fame ?? 0) >= LIMIAR_FAME_CRITICA,
    (drives.sucidade ?? 0) >= LIMIAR_SUCIDADE,
    (drives.apego ?? 100) <= LIMIAR_APEGO_CRITICO,
    (drives.enerxia ?? 100) <= LIMIAR_ENERXIA_CRITICA,
  ].filter(Boolean).length

  if (criticas === 0) {
    return -SOIDADE_QUE_SANDA
  }
  return criticas * SOIDADE_POR_DESATENCION + extra
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
