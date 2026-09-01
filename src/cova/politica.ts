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
import { type EstimuloId, conceptoDe } from './lexico.js'
import { type Atencion, type Familiaridade, type Referentes, SEN_ATENCION } from './linguaxe.js'
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
  /**
   * A situación na que se aprendeu cada palabra. É o que fai nacer os
   * conceptos: dúas palabras da mesma situación teñen algo en común.
   */
  readonly referentes: Referentes
  /**
   * Os últimos nodos-palabra tocados, do máis recente ao máis vello.
   * É o que goberna as fichas de repetición: «o que estou a traballar»
   * é unha pregunta de recencia, non de puntuación.
   */
  readonly recentes: readonly string[]
  /** Palabras (normalizadas) que xa chegou a dicir ben algunha vez. */
  readonly ditas: readonly string[]
}

export const ESTADO_INICIAL: EstadoPolitica = {
  momentos: 0,
  dia: 1,
  atencion: SEN_ATENCION,
  familiaridade: {},
  referentes: {},
  recentes: [],
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
 * Fai nacer un concepto por cada SITUACIÓN na que o bebé xa di dúas
 * palabras ou máis. «auga» e «baño» aprendéronse as dúas no baño: iso
 * que teñen en común é un concepto, e a mente gaña un piso.
 *
 * Antes isto dependía dunha táboa pechada de campos semánticos con 28
 * palabras. Cando o vocabulario deixou de estar limitado a esa lista, os
 * conceptos deixaron de nacer: a regra miraba unha táboa que xa non
 * gobernaba nada. Agora mira o que pasou de verdade.
 */
export async function xerarConceptos(
  engine: TreeEngine,
  referentes: Referentes,
  agora: number,
): Promise<readonly Acontecemento[]> {
  const feitos: Acontecemento[] = []
  const treeDef = engine.getTreeDef()

  // Palabras que xa di ben, agrupadas pola situación na que as aprendeu.
  const porSituacion = new Map<EstimuloId, string[]>()
  for (const nodo of treeDef.nodes) {
    if (!nodo.id.startsWith(PREFIXO.palabra)) {
      continue
    }
    if (engine.getNodeState(nodo.id)?.state !== 'maxed') {
      continue
    }
    const referente = referentes[nodo.id]
    if (referente === undefined || referente === 'nada') {
      continue
    }
    const lista = porSituacion.get(referente)
    if (lista === undefined) {
      porSituacion.set(referente, [nodo.id])
    } else {
      lista.push(nodo.id)
    }
  }

  for (const [referente, palabras] of porSituacion) {
    const concepto = conceptoDe(referente)
    if (concepto === null || palabras.length < 2) {
      continue
    }
    const nodeId = `${PREFIXO.concepto}${concepto.id}`
    const xaExiste = treeDef.nodes.some((n) => n.id === nodeId)

    // As arestas ás palabras que o sosteñen: engádense tamén despois, a
    // medida que máis palabras da mesma situación chegan a 3/3. Así o
    // concepto vaise enchendo en vez de quedar conxelado no que tiña o
    // día que naceu.
    const arestas = palabras
      .filter((p) => !treeDef.edges.some((e) => e.id === `e-${nodeId}-${p}`))
      .map((p) => ({
        type: 'add_edge' as const,
        edge: {
          id: `e-${nodeId}-${p}`,
          source: nodeId,
          target: p,
          type: 'path' as const,
          style: { dashPattern: [6, 4] },
        },
      }))

    if (xaExiste) {
      if (arestas.length > 0) {
        await engine.applyChanges(arestas)
      }
      continue
    }

    const nomes = palabras.map((p) => `«${p.slice(PREFIXO.palabra.length)}»`)
    const nacemento = await engine.applyChanges([
      {
        type: 'add_node',
        node: {
          id: nodeId,
          type: 'notable',
          group: REXIONS.conceptos,
          icon: concepto.icona,
          color: '#6fbf73',
          shape: 'diamond',
          label: { gl: concepto.etiqueta },
          description: {
            gl: `Naceu do que teñen en común ${nomes.join(' e ')}: aprendéronse na mesma situación.`,
          },
          tags: [REXIONS.conceptos, 'concepto', TAG_AUTO],
          prerequisites: {
            type: 'all',
            conditions: palabras.map((p) => ({ type: 'node_maxed', nodeId: p }) as const),
          },
        },
      },
      {
        type: 'add_edge',
        edge: { id: `e-nocion-${nodeId}`, source: 'nocion', target: nodeId, type: 'dependency' },
      },
      ...arestas,
    ])

    if (isOk(nacemento)) {
      feitos.push(
        acontecemento('nace-concepto', `naceu o concepto «${concepto.etiqueta}»`, agora, nodeId),
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

/**
 * Volve meter os recursos dentro do seu `max`.
 *
 * Fai falta porque hai DÚAS portas de escritura e só unha respecta o
 * tope: `grantResource` clampea, e os `effects` declarativos dun nodo
 * non (ver `docs/ACHADOS.md`, achado 9). Cando a caca acende, o seu
 * efecto mete +45 nunha sucidade que xa ía por 100 e déixaa en 145 —
 * unha barra ao 145 %, ata que o seguinte `grantResource` a devolve a
 * 100 de golpe e sen explicación.
 *
 * Non se usa `grantResource(id, 0)` a propósito: iso sería confiar outra
 * vez no clamp. Réstase o exceso, que non depende de nada.
 */
export async function reclamparRecursos(engine: TreeEngine): Promise<void> {
  const recursos = engine.getTreeDef().resources ?? []
  const actuais = engine.getBudget().resources
  for (const r of recursos) {
    if (r.max === undefined) {
      continue
    }
    const exceso = (actuais[r.id] ?? 0) - r.max
    if (exceso > 0) {
      await engine.grantResource(r.id, -exceso)
    }
  }
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
