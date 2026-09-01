// ── INICIO: a linguaxe ──
// CAPAS 0, 1 e 2 do deseño (docs/design/LINGUAXE.md).
//
// A v1 tiña unha soa regra —palabra + estímulo, tres veces, xa a sabe— e
// mesturaba cinco cousas nun contador. Isto sepáraas:
//
//   SONS         cada fonema é un nodo cos seus rangos. As palabras que
//                lle saen están limitadas polos sons que domina.
//   ATENCIÓN     non hai temporizador: hai unha cousa á que se atende, e
//                a atención DECAE. Ensinar canto antes vale máis.
//   COMPRENSIÓN  0-100 por palabra. Continua, decae.
//   PRODUCIÓN    `currentTier` do nodo. Discreta, son fitos.
//
// A idea era levar as dúas pistas no propio nodo: `progress` para a
// comprensión e `currentTier` para a produción. Non se puido: o
// `ProgressManager` do motor gárdase unha copia da TreeDef ao construírse
// e non ve os nodos que nacen despois, así que `setProgress` devolve
// NODE_NOT_FOUND en todo o que medra en runtime — que é TODO o desta
// capa (ver docs/ACHADOS.md, achado 7, o primeiro que nos cambia o
// deseño). Os RANGOS si funcionan e quedan no motor; a familiaridade e a
// comprensión viven en `EstadoPolitica.familiaridade` e persístense ao
// lado. En canto o motor arranxe iso, isto volve ao seu sitio.

import type { TreeEngine } from '@yggdrasil-forge/core'
import { isOk } from '@yggdrasil-forge/core'
import { comoDi, dia, gananciaSon, segmentar } from './fonoloxia.js'
import { type EstimuloId, normalizar } from './lexico.js'
import { PREFIXO, REXIONS } from './mente-semente.js'
import { type Acontecemento, acontecemento } from './acontecementos.js'
import { type Referentes, reforzar } from './sentido.js'

export const PREFIXO_SON = 'son:'

// ── Limiares ──

/** Familiaridade cun son a partir da cal se acada cada rango. */
export const LIMIARES_SON = [20, 55, 90] as const

/** Comprensión a partir da cal se acada cada rango de produción. */
export const LIMIARES_PALABRA = [35, 70, 95] as const

/**
 * Histérese: un rango gáñase ao chegar ao limiar, pero só se PERDE ao
 * caer esta marxe por debaixo. Sen ela, unha palabra recén aprendida
 * oscilaba entre «dío ben» e «vaille esquecendo» a cada momento, porque
 * o esquecemento baixáballe un punto xusto despois de gañala.
 */
export const MARXE_ESQUECEMENTO = 12

/** Comprensión que dá unha exposición perfecta (atención ao 100). */
const GANANCIA_BASE = 30

/**
 * Comprensión que se perde por momento sen reforzo, segundo o ben
 * asentada que estea a palabra.
 *
 * Non é o mesmo esquecer algo que acabas de oír ca algo que xa dis ben.
 * Cun só número, un vocabulario de douscentas palabras derretíase enteiro
 * á vez —vímolo: a liña temporal enchíase de «xa non lle sae»—, e iso
 * non é como funciona a memoria: o que está consolidado aguanta.
 */
export const ESQUECEMENTO_POR_RANGO = [1.2, 0.8, 0.4, 0.15] as const

export function esquecementoDe(producion: number): number {
  return ESQUECEMENTO_POR_RANGO[Math.min(producion, 3)] ?? 1
}

/** Canto decae a atención por momento. Oito momentos ata cero. */
export const DECAEMENTO_ATENCION = 12

/**
 * Canto sabe o bebé de cada nodo, indexado por `nodeId`: familiaridade
 * nos sons, comprensión nas palabras. Vive fóra do motor por obriga, non
 * por gusto (achado 7).
 */
export type Familiaridade = Record<string, number>

/**
 * O significado de cada palabra vive en `sentido.ts` desde a capa 3:
 * xa non é UNHA situación senón canto tira a palabra cara a cada unha,
 * que é o que permite significar de máis e despois estreitarse.
 * Reexpórtase aquí porque `ensinarPalabra` segue sendo quen o alimenta.
 */
export type { Referentes, Sentidos } from './sentido.js'


export interface Atencion {
  /** A que se está atendendo agora mesmo. `null` = a nada. */
  readonly referente: EstimuloId | null
  /** 0-100. Ensinar con pouca atención ensina pouco. */
  readonly forza: number
}

export const SEN_ATENCION: Atencion = { referente: null, forza: 0 }

export function idPalabra(palabra: string): string {
  return `${PREFIXO.palabra}${normalizar(palabra)}`
}

export function idSon(son: string): string {
  return `${PREFIXO_SON}${son}`
}

// ── CAPA 0: os sons ──

/** Sons que o bebé xa é quen de dicir (rango 3). */
export function sonsDominados(engine: TreeEngine): ReadonlySet<string> {
  const dominados = new Set<string>()
  for (const nodo of engine.getTreeDef().nodes) {
    if (!nodo.id.startsWith(PREFIXO_SON)) {
      continue
    }
    if ((engine.getNodeState(nodo.id)?.currentTier ?? 0) >= 3) {
      dominados.add(nodo.id.slice(PREFIXO_SON.length))
    }
  }
  return dominados
}

/**
 * Oír unha palabra. Isto pasa SEMPRE, con atención ou sen ela: aínda que
 * o bebé non saiba que significa, os sons entran. Por iso ensinar fóra
 * de contexto deixa de ser tempo perdido.
 */
async function oirSons(
  engine: TreeEngine,
  familiaridade: Familiaridade,
  palabra: string,
  agora: number,
): Promise<{ familiaridade: Familiaridade; acontecementos: readonly Acontecemento[] }> {
  const feitos: Acontecemento[] = []
  const seguinte: Familiaridade = { ...familiaridade }
  let haiGrupo = (engine.getTreeDef().groups ?? []).some((g) => g.id === REXIONS.sons)

  // Sen repetir: oír «mama» conta unha vez por /m/ e unha por /a/, non dúas.
  const sons = [...new Set(segmentar(palabra))]

  for (const son of sons) {
    const nodeId = idSon(son)
    const existe = engine.getTreeDef().nodes.some((n) => n.id === nodeId)

    if (!existe) {
      const nacemento = await engine.applyChanges([
        // O grupo nace co primeiro son, non na semente: unha rexión
        // baleira sería unha promesa antes de tempo.
        ...(haiGrupo
          ? []
          : ([
              {
                type: 'add_group',
                group: {
                  id: REXIONS.sons,
                  label: { gl: 'SONS' },
                  color: '#c8a15a',
                  anchorNodeId: nodeId,
                },
              },
            ] as const)),
        {
          type: 'add_node',
          node: {
            id: nodeId,
            type: 'small',
            group: REXIONS.sons,
            icon: son,
            color: '#c8a15a',
            label: { gl: son },
            description: { gl: 'Un son. Óeo, distíngueo e ao final sabe dicilo.' },
            maxTier: 3,
            tags: [REXIONS.sons, 'son'],
          },
        },
        {
          type: 'add_edge',
          edge: { id: `e-verbo-${nodeId}`, source: 'verbo', target: nodeId, type: 'path' },
        },
      ])
      if (!isOk(nacemento)) {
        continue
      }
      // Á primeira que sae ben, o grupo xa está: se non se marca aquí, a
      // segunda volta do bucle tenta crealo outra vez, a transacción
      // rexéitase e o resto dos sons non chegan a nacer nunca.
      haiGrupo = true
    }

    const antes = seguinte[nodeId] ?? 0
    const despois = Math.min(100, antes + gananciaSon(son))
    seguinte[nodeId] = despois

    const rangoAntes = engine.getNodeState(nodeId)?.currentTier ?? 0
    const rangoAgora = rangoPara(despois, LIMIARES_SON)
    for (let t = rangoAntes; t < rangoAgora; t += 1) {
      await engine.unlock(nodeId)
    }
    if (rangoAgora > rangoAntes && rangoAgora === 3) {
      feitos.push(acontecemento('son', `xa sabe dicir o son «${son}»`, agora, nodeId))
    }
  }

  return { familiaridade: seguinte, acontecementos: feitos }
}

/** A que rango corresponde un progreso dado. */
function rangoPara(progreso: number, limiares: readonly number[]): number {
  let rango = 0
  for (const limiar of limiares) {
    if (progreso >= limiar) {
      rango += 1
    }
  }
  return rango
}

// ── CAPA 2: ensinar ──

export interface ResultadoEnsinanza {
  readonly acontecementos: readonly Acontecemento[]
  readonly familiaridade: Familiaridade
  readonly referentes: Referentes
  readonly nodeId: string
  /** 0-100. */
  readonly comprension: number
  /** 0-3. */
  readonly producion: number
  /** Como lle sae a palabra hoxe. `''` = aínda non lle sae. */
  readonly forma: string
  /** `true` se NESTA ensinanza chegou a dicila ben por primeira vez. */
  readonly perfecta: boolean
  readonly ditas: readonly string[]
}

export async function ensinarPalabra(
  engine: TreeEngine,
  atencion: Atencion,
  familiaridade: Familiaridade,
  referentes: Referentes,
  ditas: readonly string[],
  palabraCru: string,
  agora: number,
): Promise<ResultadoEnsinanza | null> {
  const palabra = normalizar(palabraCru)
  if (palabra.length === 0 || segmentar(palabra).length === 0) {
    return null
  }

  const feitos: Acontecemento[] = []

  // 1. Os sons entran sempre.
  const oido = await oirSons(engine, familiaridade, palabra, agora)
  feitos.push(...oido.acontecementos)
  const seguinte: Familiaridade = { ...oido.familiaridade }

  // 2. O nodo-palabra nace á primeira, aínda que non signifique nada
  //    aínda. Un nodo a 0% de comprensión é exactamente iso: unha
  //    palabra que oíu e non entende. E vese no grafo.
  const nodeId = idPalabra(palabra)
  if (!engine.getTreeDef().nodes.some((n) => n.id === nodeId)) {
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
          description: { gl: `Unha palabra que lle ensinaches.` },
          maxTier: 3,
          tags: [REXIONS.linguaxe, 'palabra'],
        },
      },
      {
        type: 'add_edge',
        edge: { id: `e-verbo-${nodeId}`, source: 'verbo', target: nodeId, type: 'dependency' },
      },
    ])
    if (!isOk(nacemento)) {
      return null
    }
    feitos.push(acontecemento('nace-palabra', `oíu por primeira vez «${palabra}»`, agora, nodeId))
  }

  // 3. CAPA 1: comprender é ligar a palabra ao que se está a atender.
  //
  // Antes esixíase ademais que a palabra estivese na táboa do léxico
  // (`casaConEstimulo`). Iso era un teito escondido: só 28 palabras do
  // mundo podían chegar a significar algo, e todo o demais rebotaba
  // para sempre. Un bebé non funciona así — aprende a palabra que lle
  // digas mentres mira o que ti miras, sexa cal sexa.
  //
  // O que se perde é a posibilidade de EQUIVOCARSE ao ligar, e iso non
  // se perde: recupérase na capa 3 do deseño como sobreextensión, que é
  // como se equivoca de verdade (chamarlle «can» ao gato), non
  // rebotando.
  const enContexto = atencion.referente !== null && atencion.forza > 0

  const antes = seguinte[nodeId] ?? 0
  let comprension = antes
  // A situación na que se aprendeu. Só se anota cando hai atención: unha
  // palabra oída no baleiro non pertence a ningunha situación.
  //
  // REFORZA, non substitúe. Antes a última situación borraba a anterior
  // en silencio, así que unha palabra non se podía equivocar de
  // significado — nin, polo tanto, corrixirse.
  const seguintesReferentes =
    enContexto && atencion.referente !== null
      ? reforzar(referentes, nodeId, atencion.referente, atencion.forza)
      : referentes

  if (enContexto) {
    // Rendementos decrecentes: as primeiras veces ensinan moito máis cás
    // últimas, e a atención frouxa ensina menos.
    const ganancia = Math.max(
      2,
      Math.round(GANANCIA_BASE * (atencion.forza / 100) * (1 - antes / 140)),
    )
    comprension = Math.min(100, antes + ganancia)
    seguinte[nodeId] = comprension
    // Se xa estaba ao 100 non hai nada que contar: senón a liña temporal
    // enchíase de «vai entendendo (100%)» unha e outra vez.
    if (comprension > antes) {
      feitos.push(
        acontecemento(
          'entende',
          `vai entendendo «${palabra}» (${Math.round(comprension)}%)`,
          agora,
          nodeId,
        ),
      )
    }
  } else {
    feitos.push(
      acontecemento(
        'oe',
        `oíu «${palabra}», pero non estabades a nada`,
        agora,
        nodeId,
      ),
    )
  }

  // 4. A produción: pide comprensión E ter os sons.
  const dominados = sonsDominados(engine)
  const forma = comoDi(palabra, dominados)
  const producionAntes = engine.getNodeState(nodeId)?.currentTier ?? 0
  const producionQuere = rangoDeProducion(comprension, palabra, dominados)

  for (let t = producionAntes; t < producionQuere; t += 1) {
    await engine.unlock(nodeId)
  }
  const producion = engine.getNodeState(nodeId)?.currentTier ?? producionAntes

  if (producion > producionAntes) {
    feitos.push(
      acontecemento(
        producion >= 3 ? 'di' : 'entende',
        textoProducion(producion, palabra, forma),
        agora,
        nodeId,
      ),
    )
  }

  const perfecta = producion >= 3 && producionAntes < 3
  return {
    acontecementos: feitos,
    familiaridade: seguinte,
    referentes: seguintesReferentes,
    nodeId,
    comprension,
    producion,
    forma,
    perfecta,
    ditas: perfecta ? [...ditas, palabra] : ditas,
  }
}

/**
 * O rango de produción que lle corresponde. O terceiro (dicila ben) pide
 * as dúas cousas: comprensión completa E ter todos os sons. Por iso
 * «rr» ou «ll» atrasan unha palabra que xa entende perfectamente.
 */
export function rangoDeProducion(
  comprension: number,
  palabra: string,
  dominados: ReadonlySet<string>,
  marxe = 0,
): number {
  const porComprension = rangoPara(
    comprension,
    LIMIARES_PALABRA.map((l) => l - marxe),
  )
  if (porComprension < 3) {
    return porComprension
  }
  return dia(palabra, dominados) ? 3 : 2
}

function textoProducion(producion: number, palabra: string, forma: string): string {
  if (producion >= 3) {
    return `DI «${palabra}» ben!`
  }
  if (forma === '') {
    return `intenta dicir «${palabra}» e sáelle un balbucido`
  }
  return `intenta dicir «${palabra}» e sáelle «${forma}»`
}

// ── O esquecemento, agora sobre a comprensión ──

/**
 * A comprensión decae soa. Cando cae por baixo do limiar dun rango, o
 * rango pérdese: primeiro deixa de dicila ben, despois deixa de dicila.
 * Os SONS non se esquecen — unha vez que sabes facer /r/, sabes facelo.
 */
export async function esquecer(
  engine: TreeEngine,
  familiaridade: Familiaridade,
  agora: number,
): Promise<{ familiaridade: Familiaridade; acontecementos: readonly Acontecemento[] }> {
  const feitos: Acontecemento[] = []
  const seguinte: Familiaridade = { ...familiaridade }
  const dominados = sonsDominados(engine)

  for (const nodo of engine.getTreeDef().nodes) {
    if (!nodo.id.startsWith(PREFIXO.palabra)) {
      continue
    }
    const antes = seguinte[nodo.id] ?? 0
    if (antes <= 0) {
      continue
    }
    const palabra = nodo.id.slice(PREFIXO.palabra.length)
    const producionAntes = engine.getNodeState(nodo.id)?.currentTier ?? 0

    // Redondeado: o esquecemento graduado ten decimais (0,15 · 0,4 …) e
    // sen isto saía «ENTENDE 97.3999999» na pantalla. Acumúlase o resto
    // para que un decaemento de 0,15 non se perda ao redondear.
    const despois = Math.max(0, Math.round((antes - esquecementoDe(producionAntes)) * 100) / 100)
    seguinte[nodo.id] = despois
    // Ao PERDER, os limiares baixan pola marxe de histérese.
    const producionAgora = rangoDeProducion(despois, palabra, dominados, MARXE_ESQUECEMENTO)

    for (let t = producionAntes; t > producionAgora; t -= 1) {
      await engine.lockOneTier(nodo.id)
    }
    if (producionAgora < producionAntes) {
      feitos.push(
        acontecemento(
          'esquece',
          producionAgora === 0 ? `xa non lle sae «${palabra}»` : `vaille esquecendo «${palabra}»`,
          agora,
          nodo.id,
        ),
      )
    }
  }

  // Cun vocabulario grande poden caer moitas á vez, e a liña temporal
  // convértese nunha lista de esquecementos onde xa non se ve nada máis.
  // A partir de tres, resúmese nunha soa liña.
  if (feitos.length > 2) {
    return {
      familiaridade: seguinte,
      acontecementos: [
        acontecemento('esquece', `vanlle esquecendo ${feitos.length} palabras`, agora),
      ],
    }
  }

  return { familiaridade: seguinte, acontecementos: feitos }
}

/** Canto entende dunha palabra, 0-100. */
export function comprensionDe(familiaridade: Familiaridade, palabra: string): number {
  return familiaridade[idPalabra(palabra)] ?? 0
}

/** Unha palabra tal e como está agora. Para a lista do panel. */
export interface PalabraEnCurso {
  readonly palabra: string
  readonly nodeId: string
  readonly comprension: number
  readonly producion: number
  readonly forma: string
}

/**
 * As palabras nas que paga a pena traballar agora, primeiro as que están
 * máis preto de dar o seguinte paso.
 *
 * Existe porque a repetición é o corazón do xogo e ata agora custaba
 * reescribir a palabra enteira cada vez. Repetir ten que ser un clic.
 */
export function palabrasEnCurso(
  engine: TreeEngine,
  familiaridade: Familiaridade,
  recentes: readonly string[] = [],
  limite = 8,
): readonly PalabraEnCurso[] {
  const dominados = sonsDominados(engine)
  const todas: PalabraEnCurso[] = []

  for (const nodo of engine.getTreeDef().nodes) {
    if (!nodo.id.startsWith(PREFIXO.palabra)) {
      continue
    }
    const palabra = nodo.id.slice(PREFIXO.palabra.length)
    todas.push({
      palabra,
      nodeId: nodo.id,
      comprension: Math.round(familiaridade[nodo.id] ?? 0),
      producion: engine.getNodeState(nodo.id)?.currentTier ?? 0,
      forma: comoDi(palabra, dominados),
    })
  }

  // A RECENCIA manda. Ordenar só por «canto lle falta» funcionaba con
  // dez palabras e rompía con douscentas: a que acababas de ensinar
  // afundíase entre as vellas e non podías repetila. O que estás a
  // traballar é o que acabas de tocar, non o que ten mellor nota.
  const orde = new Map(recentes.map((id, i) => [id, i]))
  return todas
    .sort((a, b) => {
      const ra = orde.get(a.nodeId) ?? Number.POSITIVE_INFINITY
      const rb = orde.get(b.nodeId) ?? Number.POSITIVE_INFINITY
      if (ra !== rb) {
        return ra - rb
      }
      if (a.producion >= 3 !== b.producion >= 3) {
        return a.producion >= 3 ? 1 : -1
      }
      return b.comprension - a.comprension
    })
    .slice(0, limite)
}
// ── FIN: a linguaxe ──
