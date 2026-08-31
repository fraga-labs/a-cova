// ── INICIO: a colocación ──
// Onde vai cada nodo na mente.
//
// Ata aquí usábase o layout `clustered-radial` do motor, que coloca os
// membros dun grupo nun ARCO ao redor da áncora. Vale para dez; con
// douscentos é unha mancha branca — medido: 3.463 pares de nodos
// pisándose (`npm run estres`). Unha mente que non se pode ler non é
// unha mente que medra diante de ti, é un borrón.
//
// Aquí calcúlanse as posicións á man e o motor usa o layout `custom`
// (IdentityLayout), que se limita a ler `NodeDef.position`. Tres ideas:
//
//  1. **Filotaxe** (a espiral do xirasol, ángulo áureo). A separación
//     entre veciños é constante independentemente de cantos haxa: nunca
//     se pisan, nin con dez nin con mil.
//  2. **Sub-grupos dentro de LINGUAXE**: as palabras agrúpanse polo son
//     co que empezan. Non é só un truco de espazo — un léxico organízase
//     tamén por veciñanza fonolóxica, e fai que douscentos nodos sexan
//     vinte moreas lexibles en vez dunha mancha.
//  3. **O anel medra**: a distancia do centro ás rexións depende do
//     tamaño da máis grande, en chanzos, para que non baile a cada
//     palabra nova.

import type { NodeDef, Position, TreeChange, TreeDef, TreeEngine } from '@yggdrasil-forge/core'
import { segmentar } from './fonoloxia.js'
import { PREFIXO, REXIONS, type RexionId } from './rexions.js'

/** Ángulo áureo. O que fai que a espiral non deixe ocos nin se solape. */
const ANGULO_AUREO = Math.PI * (3 - Math.sqrt(5))

/** Separación entre veciños dentro dunha morea. Un nodo mide uns 36. */
const ESPALLAMENTO = 58

/** Separación MÍNIMA entre as moreas de palabras. Medra coa maior delas. */
const ESPALLAMENTO_MOREAS = 165

/** Radio mínimo do anel das rexións, para que unha mente nova non quede apertada. */
const ANEL_MINIMO = 300

/** O anel medra a chanzos para non bailar cada vez que nace unha palabra. */
const CHANZO_ANEL = 80

/** Orde das rexións arredor do centro. Fixa: que non salten de sitio. */
const ORDE: readonly RexionId[] = [
  REXIONS.corpo,
  REXIONS.sons,
  REXIONS.linguaxe,
  REXIONS.afectos,
  REXIONS.conceptos,
  REXIONS.memorias,
  REXIONS.sombra,
]

/** Punto k da espiral de xirasol, ao redor de (0,0). */
function filotaxe(k: number, espallamento: number): Position {
  const r = espallamento * Math.sqrt(k)
  const a = k * ANGULO_AUREO
  return { x: r * Math.cos(a), y: r * Math.sin(a) }
}

/** Raio que ocupa unha morea de `n` elementos colocados en filotaxe. */
function raioDe(n: number, espallamento: number): number {
  return n <= 1 ? 0 : espallamento * Math.sqrt(n - 1)
}

/** O son co que empeza a palabra. É a clave da súa morea. */
export function moreaDe(nodeId: string): string {
  const palabra = nodeId.slice(PREFIXO.palabra.length)
  return segmentar(palabra)[0] ?? '?'
}

/**
 * Coloca os membros dunha rexión arredor do seu centro.
 *
 * LINGUAXE vai por moreas (as palabras que empezan polo mesmo son);
 * as demais rexións son pequenas e van nunha soa espiral.
 */
function colocarRexion(
  rexion: RexionId,
  membros: readonly string[],
): { readonly posicions: Map<string, Position>; readonly raio: number } {
  const posicions = new Map<string, Position>()

  if (rexion !== REXIONS.linguaxe || membros.length <= 12) {
    membros.forEach((id, k) => {
      posicions.set(id, filotaxe(k, ESPALLAMENTO))
    })
    return { posicions, raio: raioDe(membros.length, ESPALLAMENTO) }
  }

  // Moreas por son inicial, na orde en que apareceu a primeira palabra
  // de cada unha: así unha morea nova non move as vellas.
  const moreas = new Map<string, string[]>()
  for (const id of membros) {
    const clave = id.startsWith(PREFIXO.palabra) ? moreaDe(id) : '·'
    const morea = moreas.get(clave)
    if (morea === undefined) {
      moreas.set(clave, [id])
    } else {
      morea.push(id)
    }
  }

  // A separación entre moreas ten que ser polo menos o diámetro da máis
  // grande: se non, unha morea de vinte palabras métese dentro da veciña.
  // (Foi o que quedaba: de 3.463 pares pisados baixaramos a 34, e eran
  // todos moreas chocando entre si.)
  const maiorMorea = Math.max(...[...moreas.values()].map((m) => raioDe(m.length, ESPALLAMENTO)))
  const separacion = Math.max(ESPALLAMENTO_MOREAS, maiorMorea * 2 + ESPALLAMENTO)

  let raio = 0
  let k = 0
  for (const [, morea] of moreas) {
    const centro = filotaxe(k, separacion)
    morea.forEach((id, j) => {
      const p = filotaxe(j, ESPALLAMENTO)
      posicions.set(id, { x: centro.x + p.x, y: centro.y + p.y })
    })
    raio = Math.max(
      raio,
      Math.hypot(centro.x, centro.y) + raioDe(morea.length, ESPALLAMENTO),
    )
    k += 1
  }

  return { posicions, raio }
}

/**
 * Calcula a posición de TODOS os nodos. Determinista: a mesma árbore dá
 * sempre o mesmo debuxo, e engadir unha palabra non move as demais
 * (agás cando o anel cambia de chanzo).
 */
export function colocar(treeDef: TreeDef): Map<string, Position> {
  const posicions = new Map<string, Position>()
  posicions.set(treeDef.rootNodeId ?? 'eu', { x: 0, y: 0 })

  // Orde de aparición na TreeDef = orde de nacemento. Estable.
  const porRexion = new Map<RexionId, string[]>()
  for (const nodo of treeDef.nodes) {
    const g = nodo.group as RexionId | undefined
    if (g === undefined) {
      continue
    }
    const lista = porRexion.get(g)
    if (lista === undefined) {
      porRexion.set(g, [nodo.id])
    } else {
      lista.push(nodo.id)
    }
  }

  const rexions = ORDE.filter((r) => (porRexion.get(r)?.length ?? 0) > 0)
  const colocadas = rexions.map((rexion) => ({
    rexion,
    ...colocarRexion(rexion, porRexion.get(rexion) ?? []),
  }))

  // O anel é onde EMPEZA cada rexión, non onde está o seu centro: cada
  // unha despráza-se cara a fóra o seu propio raio. Se en vez diso se
  // centrasen no anel, o anel tería que ser máis grande cá rexión maior
  // para non tapar a `eu`, e unha soa rexión grande inflaba o lenzo ao
  // dobre (medímolo: 7534 unidades de alto fronte a 4300).
  const perimetro = colocadas.reduce((suma, c) => suma + 2 * c.raio, 0) * 1.25
  const anelCru = Math.max(ANEL_MINIMO, perimetro / (2 * Math.PI))
  const anel = Math.ceil(anelCru / CHANZO_ANEL) * CHANZO_ANEL

  // Cada rexión leva unha tallada angular proporcional ao seu tamaño:
  // a que ten douscentos nodos precisa moito máis sitio ca a que ten un.
  const total = colocadas.reduce((suma, c) => suma + Math.max(c.raio, ESPALLAMENTO), 0)
  let acumulado = 0
  for (const c of colocadas) {
    const peso = Math.max(c.raio, ESPALLAMENTO)
    const tallada = (peso / total) * Math.PI * 2
    const angulo = -Math.PI / 2 + acumulado + tallada / 2
    acumulado += tallada

    const dist = anel + c.raio
    const centro = { x: dist * Math.cos(angulo), y: dist * Math.sin(angulo) }
    for (const [id, p] of c.posicions) {
      posicions.set(id, { x: centro.x + p.x, y: centro.y + p.y })
    }
  }

  return posicions
}

/** Dous puntos son o mesmo sitio se non se moveron nin medio píxel. */
function mesmoSitio(a: Position | undefined, b: Position): boolean {
  return a !== undefined && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5
}

/**
 * Cambios necesarios para poñer cada nodo no seu sitio. Devolve SÓ os
 * que se moveron: nun nacemento normal iso é un nodo, non douscentos.
 */
export function cambiosDeColocacion(treeDef: TreeDef): readonly TreeChange[] {
  const posicions = colocar(treeDef)
  const cambios: TreeChange[] = []
  for (const nodo of treeDef.nodes) {
    const destino = posicions.get(nodo.id)
    if (destino === undefined || mesmoSitio(nodo.position, destino)) {
      continue
    }
    cambios.push({ type: 'modify_node', nodeId: nodo.id, changes: { position: destino } })
  }
  return cambios
}

/** Aplica as posicións a unha TreeDef estática (para a mente semente). */
export function conPosicions(treeDef: TreeDef): TreeDef {
  const posicions = colocar(treeDef)
  return {
    ...treeDef,
    nodes: treeDef.nodes.map((n): NodeDef => {
      const p = posicions.get(n.id)
      return p === undefined ? n : { ...n, position: p }
    }),
  }
}

/**
 * Pon no seu sitio o que se moveu. Chámase despois de cada mutación: un
 * nodo recén nacido non ten posición, e o IdentityLayout deixaríao no
 * centro enriba de `eu`.
 */
export async function recolocar(engine: TreeEngine): Promise<void> {
  const cambios = cambiosDeColocacion(engine.getTreeDef())
  if (cambios.length > 0) {
    await engine.applyChanges(cambios)
  }
}
// ── FIN: a colocación ──
