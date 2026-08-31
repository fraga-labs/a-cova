// ── INICIO: useCova ──
// O nervio: xunta o motor (TreeEngine), o reloxo do corpo e a política
// de crecemento nun só hook. Toda a lóxica de regras vive en
// `politica.ts`; aquí só está o cableado con React.

import { TreeEngine } from '@yggdrasil-forge/core'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  DRIVE_SPECS,
  MOMENTOS_POR_DIA,
  MOMENTO_MS,
  type RecursoId,
  SOIDADE,
} from './drives.js'
import type { EstimuloId } from './lexico.js'
import { menteSemente } from './mente-semente.js'
import { gardar, recuperar } from './persistencia.js'
import {
  type Acontecemento,
  DURACION_ESTIMULO,
  ESTADO_INICIAL,
  type EstadoPolitica,
  acontecemento,
  ensinarPalabra,
  esquecer,
  limparCaca,
  medirSoidade,
  nacerMemoria,
  programarDixestion,
  reconciliarAutonomos,
  xerarConceptos,
} from './politica.js'
import { type Modificadores, modificadores, sombrasAcesas, xerarSombras } from './sombras.js'

const MAX_ACONTECEMENTOS = 60

export type AccionId = 'alimentar' | 'limpar' | 'xogar' | 'aloumiñar' | 'durmir'

export interface Accion {
  readonly id: AccionId
  readonly etiqueta: string
  readonly icona: string
  readonly estimulo: EstimuloId
  /** Deltas que a acción aplica aos recursos. */
  readonly deltas: Partial<Record<RecursoId, number>>
  readonly di: string
}

export const ACCIONS: readonly Accion[] = [
  {
    id: 'alimentar',
    etiqueta: 'ALIMENTAR',
    icona: '🍼',
    estimulo: 'fame',
    deltas: { fame: -38, enerxia: +8, soidade: -4 },
    di: 'deuslle de comer',
  },
  {
    id: 'limpar',
    etiqueta: 'LIMPAR',
    icona: '🧼',
    estimulo: 'auga',
    deltas: { sucidade: -100, apego: +5, soidade: -4 },
    di: 'limpáchelo',
  },
  {
    id: 'xogar',
    etiqueta: 'XOGAR',
    icona: '🎈',
    estimulo: 'xogo',
    deltas: { curiosidade: +20, enerxia: -10, fame: +6, apego: +6, soidade: -6 },
    di: 'xogastes xuntos',
  },
  {
    id: 'aloumiñar',
    etiqueta: 'ALOUMIÑAR',
    icona: '🤗',
    estimulo: 'amor',
    deltas: { apego: +14, curiosidade: +4, soidade: -8 },
    di: 'un aloumiño',
  },
  {
    id: 'durmir',
    etiqueta: 'DORMIR',
    icona: '🌙',
    estimulo: 'sono',
    deltas: { enerxia: +42, fame: +12, soidade: -2 },
    di: 'botou un sono',
  },
]

export interface Cova {
  readonly engine: TreeEngine
  readonly drives: Readonly<Record<string, number>>
  readonly politica: EstadoPolitica
  readonly acontecementos: readonly Acontecemento[]
  readonly nome: string
  readonly seleccionado: string | null
  readonly di: string | null
  readonly ocupado: boolean
  /** O que as leccións da ausencia lle cambian ao mundo. */
  readonly mods: Modificadores
  readonly facer: (id: AccionId) => void
  readonly ensinar: (palabra: string) => void
  readonly seleccionar: (nodeId: string | null) => void
  readonly renomear: (nome: string) => void
}

function agora(): number {
  return Date.now()
}

export function useCova(): Cova {
  const gardadoRef = useRef(recuperar())

  const [engine] = useState(() => {
    const g = gardadoRef.current
    if (g !== null) {
      return new TreeEngine(g.tree, { audit: { enabled: true }, initialState: g.state })
    }
    return new TreeEngine(menteSemente(), { audit: { enabled: true } })
  })

  const [politica, setPolitica] = useState<EstadoPolitica>(
    () => gardadoRef.current?.politica ?? ESTADO_INICIAL,
  )
  const [acontecementos, setAcontecementos] = useState<readonly Acontecemento[]>(
    () => gardadoRef.current?.acontecementos ?? [],
  )
  const [nome, setNome] = useState(() => gardadoRef.current?.nome ?? 'Meco')
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [di, setDi] = useState<string | null>(null)

  // A política ten DÚAS caras: o `ref` é a fonte de verdade (síncrona) e o
  // `state` existe só para pintar. Isto non é un espello por comodidade —
  // é necesario: as accións corren nunha cola de promesas, e dúas
  // seguidas execútanse antes de que React chegue a renderizar. Se a cola
  // lese o state, a segunda acción vería o mundo anterior á primeira
  // (e, por exemplo, ensinar xusto despois de alimentar diría «fóra de
  // contexto» cando si estaba en contexto).
  const politicaRef = useRef(politica)

  const mudarPolitica = useCallback((fn: (p: EstadoPolitica) => EstadoPolitica): void => {
    politicaRef.current = fn(politicaRef.current)
    setPolitica(politicaRef.current)
  }, [])

  // Un só carril de mutación: as accións son async (o motor tamén) e
  // dúas á vez deixarían o estado a medias. `ocupado` é a porta.
  const [ocupado, setOcupado] = useState(false)
  const carril = useRef<Promise<void>>(Promise.resolve())

  const subscribe = useCallback((l: () => void) => engine.subscribe(l), [engine])
  const snapshot = useCallback(() => engine.getBudget(), [engine])
  const budget = useSyncExternalStore(subscribe, snapshot, snapshot)
  const drives = budget.resources

  // As sombras acesas cambian as regras do mundo. Recalcúlanse en cada
  // render (dependen do estado do motor, que xa é reactivo) e gárdanse
  // nun ref para que a cola de promesas as poida ler sen esperar a React.
  const mods = useMemo(() => modificadores(sombrasAcesas(engine)), [engine, drives])
  const modsRef = useRef(mods)
  modsRef.current = mods

  const rexistrar = useCallback((novos: readonly Acontecemento[]) => {
    if (novos.length === 0) {
      return
    }
    // `novos` vén en orde cronolóxica (o primeiro que pasou, primeiro) e a
    // lista amósase ao revés (o máis recente arriba). Sen o `reverse`, un
    // lote de varios acontecementos aparecía do revés entre si: «di auga
    // 3/3» saía por riba de «DIXO auga!» cando pasou antes.
    setAcontecementos((vellos) =>
      [...novos].reverse().concat(vellos).slice(0, MAX_ACONTECEMENTOS),
    )
  }, [])

  // Ao nacer: acender os nodos que xa existen ao abrir os ollos.
  const nacido = useRef(false)
  useEffect(() => {
    if (nacido.current) {
      return
    }
    nacido.current = true
    if (gardadoRef.current !== null) {
      return
    }
    void (async () => {
      for (const id of ['eu', 'verbo', 'memoria:nacemento']) {
        await engine.unlock(id)
      }
      rexistrar([acontecemento('nace-memoria', 'abriu os ollos', agora(), 'memoria:nacemento')])
    })()
  }, [engine, rexistrar])

  /** Serializa unha mutación no carril único. */
  const enfileirar = useCallback((traballo: () => Promise<void>) => {
    setOcupado(true)
    carril.current = carril.current
      .then(traballo)
      .catch(() => undefined)
      .finally(() => {
        setOcupado(false)
      })
  }, [])

  /** Tras calquera mutación: a mente reacomódase soa. */
  const reacomodar = useCallback(async (): Promise<readonly Acontecemento[]> => {
    const t = agora()
    const autos = await reconciliarAutonomos(engine, t)
    const conceptos = await xerarConceptos(engine, t)
    return [...autos, ...conceptos]
  }, [engine])

  // ── O reloxo do corpo ──
  useEffect(() => {
    const id = window.setInterval(() => {
      enfileirar(async () => {
        const t = agora()
        const m = modsRef.current
        for (const spec of DRIVE_SPECS) {
          const deriva = spec.id === 'enerxia' ? spec.deriva + m.derivaEnerxia : spec.deriva
          if (deriva !== 0) {
            await engine.grantResource(spec.id, deriva)
          }
        }

        // A conta da ausencia. Vai despois da deriva para que mida o
        // mundo tal e como queda neste momento, non como estaba antes.
        await engine.grantResource(SOIDADE, medirSoidade(engine.getBudget().resources, m.soidadeExtra))
        // `tick()` do motor: caduca o que teña que caducar. Hoxe non
        // usamos `timeConstraints`, pero o reloxo do corpo é o sitio
        // onde vai — non un `setTimeout` solto.
        engine.tick()

        // Facer NACER as leccións da ausencia; acendelas é traballo da
        // regra 1, coma con calquera outro nodo `auto`. Por iso aquí non
        // se rexistra nada: senón sairía dúas veces na liña temporal.
        await xerarSombras(engine, engine.getBudget().resources.soidade ?? 0)

        const feitos: Acontecemento[] = [...(await reacomodar())]

        // O avance do reloxo calcúlase FÓRA do updater: un `feitos.push`
        // dentro del correría no render seguinte, é dicir despois do
        // `rexistrar(feitos)` de máis abaixo, e o «amenceu o día N»
        // perderíase. O `ref` é sempre a política vixente.
        const previa = politicaRef.current
        const momentos = previa.momentos + 1
        const dia = Math.floor(momentos / MOMENTOS_POR_DIA) + 1
        if (dia !== previa.dia) {
          feitos.push(acontecemento('dia', `amenceu o día ${dia}`, t))
        }
        const estimulo = momentos >= previa.estimuloAte ? 'nada' : previa.estimulo
        mudarPolitica((p) => ({ ...p, momentos, dia, estimulo }))

        const olvido = await esquecer(engine, politicaRef.current.frescuras, t)
        mudarPolitica((p) => ({ ...p, frescuras: olvido.frescuras }))
        feitos.push(...olvido.acontecementos)

        rexistrar(feitos)
      })
    }, MOMENTO_MS)
    return () => {
      window.clearInterval(id)
    }
  }, [engine, enfileirar, mudarPolitica, reacomodar, rexistrar])

  // ── Accións do coidador ──
  const facer = useCallback(
    (id: AccionId) => {
      const accion = ACCIONS.find((a) => a.id === id)
      if (accion === undefined) {
        return
      }
      enfileirar(async () => {
        const t = agora()
        const m = modsRef.current
        for (const [recurso, delta] of Object.entries(accion.deltas)) {
          await engine.grantResource(recurso, axustar(recurso, delta, m))
        }
        if (id === 'alimentar' && m.sucidadeExtra > 0) {
          await engine.grantResource('sucidade', m.sucidadeExtra)
        }

        const feitos: Acontecemento[] = [acontecemento('accion', accion.di, t)]

        if (id === 'alimentar') {
          await programarDixestion(engine, t)
          feitos.push(...(await nacerMemoria(engine, 'primeira-comida', 'primeira comida', 'A primeira vez que alguén lle deu de comer.', t)))
        }
        if (id === 'limpar') {
          await limparCaca(engine)
          feitos.push(...(await nacerMemoria(engine, 'primeiro-bano', 'primeiro baño', 'Auga morna e mans coñecidas.', t)))
        }
        if (id === 'xogar') {
          feitos.push(...(await nacerMemoria(engine, 'xogo-coidado', 'xogo coidado', 'Alguén tivo tempo para el.', t)))
        }

        feitos.push(...(await reacomodar()))

        mudarPolitica((p) => ({
          ...p,
          estimulo: accion.estimulo,
          estimuloAte: p.momentos + DURACION_ESTIMULO,
        }))
        rexistrar(feitos)
      })
    },
    [engine, enfileirar, mudarPolitica, reacomodar, rexistrar],
  )

  const ensinar = useCallback(
    (palabra: string) => {
      enfileirar(async () => {
        const t = agora()
        const r = await ensinarPalabra(engine, politicaRef.current, palabra, t)
        if (r === null) {
          return
        }
        const feitos: Acontecemento[] = [...r.acontecementos]

        if (r.dita) {
          setDi(palabra)
          window.setTimeout(() => {
            setDi(null)
          }, 4000)
          if (politicaRef.current.ditas.length === 0) {
            feitos.push(
              ...(await nacerMemoria(
                engine,
                'primeira-palabra',
                'primeira palabra ★',
                `A primeira palabra que dixo foi «${palabra}».`,
                t,
              )),
            )
          }
        }

        feitos.push(...(await reacomodar()))
        mudarPolitica((p) => ({ ...p, frescuras: r.frescuras, ditas: r.ditas }))
        setSeleccionado(r.nodeId)
        rexistrar(feitos)
      })
    },
    [engine, enfileirar, mudarPolitica, reacomodar, rexistrar],
  )

  // ── Gardado ──
  useEffect(() => {
    gardar({
      nome,
      tree: engine.getTreeDef(),
      state: engine.getSnapshot(),
      politica,
      acontecementos,
    })
  }, [engine, nome, politica, acontecementos])

  return useMemo(
    () => ({
      engine,
      drives,
      politica,
      acontecementos,
      nome,
      seleccionado,
      di,
      ocupado,
      mods,
      facer,
      ensinar,
      seleccionar: setSeleccionado,
      renomear: setNome,
    }),
    [
      engine,
      drives,
      politica,
      acontecementos,
      nome,
      seleccionado,
      di,
      ocupado,
      mods,
      facer,
      ensinar,
    ],
  )
}
/**
 * Aplica as sombras a un delta dunha acción. Só toca o que unha lección
 * da ausencia cambia de verdade: o apego que consegues dar (menos, se
 * aprendeu a calmarse só) e o que quita a fame unha comida (máis, se
 * come coma se non fose haber máis).
 */
function axustar(recurso: string, delta: number, m: Modificadores): number {
  if (recurso === 'apego' && delta > 0) {
    return Math.round(delta * m.gananciaApego)
  }
  if (recurso === 'fame' && delta < 0) {
    return Math.round(delta * m.saciedade)
  }
  return delta
}
// ── FIN: useCova ──
