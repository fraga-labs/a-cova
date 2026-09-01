// ── INICIO: o significado ──
// Capa 3 do deseño da linguaxe. Ata aquí unha palabra tiña UNHA
// situación e a última gañaba: ensinar «papa» comendo e despois «papa»
// nos brazos borraba a primeira en silencio. Non se podía equivocar, e
// por iso tampouco se podía corrixir.
//
// Aquí o significado deixa de ser unha táboa e pasa a ser **o que está
// debuxado no grafo**: arestas da palabra ás situacións nas que a
// aprendeu, cunha forza cada unha. Dúas cousas saen de aí soas:
//
//  · **Sobreextensión.** Se lle dis «papa» comendo e tamén nos brazos,
//    «papa» significa as dúas cousas — e VESE, porque ten dúas arestas.
//    É o erro clásico de chamarlle «can» ao gato, e non é un fallo do
//    xogo: é aprender.
//  · **Exclusividade mutua.** Cando outra palabra se fai claramente
//    dona dunha situación, a que a tiña de prestado retírase. Na
//    pantalla vese unha mente corrixíndose soa, que é a mellor imaxe
//    que pode dar este proxecto.
//
// As situacións son nodos de verdade, na rexión MUNDO: literalmente a
// parede da cova. O bebé non ten máis mundo có que ti lle proxectaches.

import { isOk } from '@yggdrasil-forge/core'
import type { TreeChange, TreeEngine } from '@yggdrasil-forge/core'
import { type Acontecemento, acontecemento } from './acontecementos.js'
import { COR_REXION, PREFIXO, REXIONS, TAG_AUTO } from './rexions.js'
import { ESTIMULOS, type EstimuloId } from './lexico.js'

/** Canto tira unha palabra cara a cada situación. 0-100. */
export type Sentidos = Partial<Record<EstimuloId, number>>

/** O significado de cada palabra, por nodo. */
export type Referentes = Record<string, Sentidos>

/**
 * Por debaixo disto a ligazón non conta: oír unha palabra unha vez
 * mentres pasaba algo non fai que signifique iso.
 */
export const LIMIAR_SENTIDO = 30

/** Canto sobe unha ligazón por exposición, coa atención chea. */
export const GANANCIA_SENTIDO = 22

/**
 * Fracción da forza do dono dunha situación por debaixo da cal unha
 * palabra deixa de reclamala.
 *
 * Non é «a máis forte gaña»: dúas palabras poden significar o mesmo (e
 * de feito é o que fai nacer os conceptos). O que se retira é a
 * reclamación DÉBIL sobre unha situación que xa ten dona clara — e só
 * se á palabra lle queda outro sentido máis seu, para non deixala sen
 * significado ningún.
 */
export const FRACCION_QUE_AGUANTA = 0.5

export function idSituacion(referente: EstimuloId): string {
  return `${PREFIXO.situacion}${referente}`
}

/** As situacións que unha palabra reclama de verdade, de máis a menos forte. */
export function sentidosDe(sentidos: Sentidos | undefined): readonly EstimuloId[] {
  if (sentidos === undefined) {
    return []
  }
  return (Object.entries(sentidos) as [EstimuloId, number][])
    .filter(([, forza]) => forza >= LIMIAR_SENTIDO)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
}

/** A situación que máis tira. `null` se non hai ningunha por riba do limiar. */
export function sentidoPrincipal(sentidos: Sentidos | undefined): EstimuloId | null {
  return sentidosDe(sentidos)[0] ?? null
}

/** `true` se a palabra significa máis dunha cousa á vez. */
export function estaSobreextendida(sentidos: Sentidos | undefined): boolean {
  return sentidosDe(sentidos).length > 1
}

/**
 * Anota unha exposición: a palabra tira un pouco máis cara a esa
 * situación. Non borra as outras — esa é toda a diferenza coa v2.
 */
export function reforzar(
  referentes: Referentes,
  nodeId: string,
  referente: EstimuloId,
  forzaAtencion: number,
): Referentes {
  const previos = referentes[nodeId] ?? {}
  const suba = Math.max(2, Math.round(GANANCIA_SENTIDO * (forzaAtencion / 100)))
  return {
    ...referentes,
    [nodeId]: { ...previos, [referente]: Math.min(100, (previos[referente] ?? 0) + suba) },
  }
}

/**
 * Acepta o formato vello, no que cada palabra tiña unha soa situación
 * (`{'palabra:auga': 'auga'}`).
 *
 * Un bebé gardado antes desta capa —ou exportado por alguén que aínda
 * non a tiña— non pode perder o que sabía. Convértese nunha ligazón
 * forte, que é o que era: a súa única.
 */
export function normalizarReferentes(cru: unknown): Referentes {
  if (typeof cru !== 'object' || cru === null) {
    return {}
  }
  const saida: Referentes = {}
  for (const [nodeId, valor] of Object.entries(cru as Record<string, unknown>)) {
    if (typeof valor === 'string') {
      saida[nodeId] = { [valor as EstimuloId]: 100 }
    } else if (typeof valor === 'object' && valor !== null) {
      saida[nodeId] = valor as Sentidos
    }
  }
  return saida
}

/**
 * A exclusividade mutua: quita as reclamacións débiles sobre situacións
 * que xa teñen unha palabra claramente dona.
 *
 * Devolve os referentes podados. Puro: quen debuxa é `reconciliarSentidos`.
 */
export function podar(referentes: Referentes): Referentes {
  // Que forza ten a mellor palabra de cada situación.
  const mellorPor = new Map<EstimuloId, number>()
  for (const sentidos of Object.values(referentes)) {
    for (const [ref, forza] of Object.entries(sentidos) as [EstimuloId, number][]) {
      mellorPor.set(ref, Math.max(mellorPor.get(ref) ?? 0, forza))
    }
  }

  const saida: Referentes = {}
  for (const [nodeId, sentidos] of Object.entries(referentes)) {
    const meus = sentidosDe(sentidos)
    // Cunha soa situación non hai nada que podar: sería deixar a palabra
    // sen significado, e o obxectivo é estreitalo, non borralo.
    if (meus.length < 2) {
      saida[nodeId] = sentidos
      continue
    }
    const propio: Sentidos = {}
    for (const [ref, forza] of Object.entries(sentidos) as [EstimuloId, number][]) {
      const mellor = mellorPor.get(ref) ?? 0
      const eDebil = forza < mellor * FRACCION_QUE_AGUANTA
      // O sentido máis forte da palabra non se toca nunca.
      const eOSeu = ref === meus[0]
      if (!eDebil || eOSeu) {
        propio[ref] = forza
      }
    }
    saida[nodeId] = propio
  }
  return saida
}

/** As situacións que xa teñen nodo no grafo. */
function situacionsExistentes(engine: TreeEngine): Set<string> {
  return new Set(
    engine
      .getTreeDef()
      .nodes.filter((n) => n.id.startsWith(PREFIXO.situacion))
      .map((n) => n.id),
  )
}

function cambiosDaSituacion(referente: EstimuloId, haiGrupo: boolean): readonly TreeChange[] {
  const nodeId = idSituacion(referente)
  return [
    ...(haiGrupo
      ? []
      : ([
          {
            type: 'add_group',
            group: {
              id: REXIONS.mundo,
              label: { gl: 'MUNDO' },
              color: COR_REXION.mundo,
              anchorNodeId: nodeId,
            },
          },
        ] as const)),
    {
      type: 'add_node',
      node: {
        id: nodeId,
        type: 'cluster',
        group: REXIONS.mundo,
        icon: '◐',
        color: COR_REXION.mundo,
        label: { gl: ESTIMULOS[referente].descricion.replace(/^está (a |n)?/, '') },
        description: {
          gl: `Unha das cousas do mundo do bebé: ${ESTIMULOS[referente].descricion}. Existe porque lla amosaches.`,
        },
        tags: [REXIONS.mundo, 'situacion', TAG_AUTO],
      },
    },
  ]
}

export interface ResultadoSentidos {
  readonly referentes: Referentes
  readonly acontecementos: readonly Acontecemento[]
}

/**
 * Pon o grafo de acordo cos significados: fai nacer as situacións que
 * fagan falta, debuxa as arestas novas e **borra as que xa non tocan**.
 *
 * O borrado é a metade que importa. Unha aresta que desaparece é o bebé
 * decatándose de que esa palabra non significaba iso.
 */
export async function reconciliarSentidos(
  engine: TreeEngine,
  referentes: Referentes,
  agora: number,
): Promise<ResultadoSentidos> {
  const podados = podar(referentes)
  const feitos: Acontecemento[] = []

  const treeDef = engine.getTreeDef()
  const palabras = new Set(
    treeDef.nodes.filter((n) => n.id.startsWith(PREFIXO.palabra)).map((n) => n.id),
  )

  // 1. As situacións que fan falta e aínda non existen.
  const xaHai = situacionsExistentes(engine)
  let haiGrupo = (treeDef.groups ?? []).some((g) => g.id === REXIONS.mundo)
  for (const [nodeId, sentidos] of Object.entries(podados)) {
    if (!palabras.has(nodeId)) {
      continue
    }
    for (const ref of sentidosDe(sentidos)) {
      const id = idSituacion(ref)
      if (xaHai.has(id)) {
        continue
      }
      const r = await engine.applyChanges(cambiosDaSituacion(ref, haiGrupo))
      if (isOk(r)) {
        xaHai.add(id)
        haiGrupo = true
        feitos.push(
          acontecemento('mundo', `o mundo ten agora «${ESTIMULOS[ref].descricion}»`, agora, id),
        )
      }
    }
  }

  // 2. As arestas: as que faltan e as que sobran.
  const arestasAgora = new Set(
    engine
      .getTreeDef()
      .edges.filter((e) => e.id.startsWith('e-sentido-'))
      .map((e) => e.id),
  )
  const deberian = new Map<string, { readonly palabra: string; readonly ref: EstimuloId }>()
  for (const [nodeId, sentidos] of Object.entries(podados)) {
    if (!palabras.has(nodeId)) {
      continue
    }
    for (const ref of sentidosDe(sentidos)) {
      deberian.set(`e-sentido-${nodeId}-${ref}`, { palabra: nodeId, ref })
    }
  }

  const cambios: TreeChange[] = []
  for (const [id, { palabra, ref }] of deberian) {
    if (!arestasAgora.has(id)) {
      cambios.push({
        type: 'add_edge',
        edge: { id, source: palabra, target: idSituacion(ref), type: 'path' },
      })
    }
  }
  for (const id of arestasAgora) {
    if (!deberian.has(id)) {
      cambios.push({ type: 'remove_edge', edgeId: id })
      const palabra = id.slice('e-sentido-'.length).split('-')[0] ?? ''
      feitos.push(
        acontecemento(
          'estreita',
          `«${palabra.slice(PREFIXO.palabra.length)}» xa non significa todo iso`,
          agora,
          palabra,
        ),
      )
    }
  }

  if (cambios.length > 0) {
    await engine.applyChanges(cambios)
  }

  return { referentes: podados, acontecementos: feitos }
}
// ── FIN: o significado ──
