// ── INICIO: probas da ausencia ──
// A pregunta é unha: se marchas, pasa algo? Ata agora a resposta era
// «non», e iso deixaba as sombras fóra do alcance de quen xoga.

import { TreeEngine } from '@yggdrasil-forge/core'
import { describe, expect, it } from 'vitest'
import { TOPE_AUSENCIA, momentosEntre, poñerAoDia } from './ausencia.js'
import { MOMENTOS_POR_DIA, MOMENTO_MS } from './drives.js'
import { type Familiaridade, comprensionDe, ensinarPalabra, idPalabra } from './linguaxe.js'
import { menteSemente } from './mente-semente.js'
import { ESTADO_INICIAL, type EstadoPolitica, reconciliarAutonomos } from './politica.js'
import { SEN_SOMBRAS, sombrasAcesas, xerarSombras } from './sombras.js'

const T0 = 1_800_000_000_000

function motor(): TreeEngine {
  return new TreeEngine(menteSemente(), {})
}

/** Marcha `momentos` momentos e volve. */
async function marchar(
  engine: TreeEngine,
  politica: EstadoPolitica,
  momentos: number,
): Promise<EstadoPolitica> {
  const r = await poñerAoDia(
    engine,
    politica,
    SEN_SOMBRAS,
    T0,
    T0 + momentos * MOMENTO_MS,
  )
  if (r === null) {
    throw new Error('non pasou nada')
  }
  await xerarSombras(engine, engine.getBudget().resources.soidade ?? 0)
  await reconciliarAutonomos(engine, T0)
  return r.politica
}

describe('canto tempo pasou', () => {
  it('menos dun momento non conta', () => {
    expect(momentosEntre(T0, T0 + MOMENTO_MS - 1)).toBe(0)
  })

  it('e por debaixo diso non se fai nada', async () => {
    expect(await poñerAoDia(motor(), ESTADO_INICIAL, SEN_SOMBRAS, T0, T0 + 100)).toBeNull()
  })
})

describe('marchar ten consecuencias', () => {
  it('as necesidades corren soas mentres non estás', async () => {
    const e = motor()
    const antes = e.getBudget().resources
    await marchar(e, ESTADO_INICIAL, MOMENTOS_POR_DIA)
    const despois = e.getBudget().resources

    expect(despois.fame ?? 0).toBeGreaterThan(antes.fame ?? 0)
    expect(despois.apego ?? 0).toBeLessThan(antes.apego ?? 0)
  })

  it('unha ausencia longa fai nacer as catro sombras', async () => {
    // ESTE é o punto de todo. Antes só se chegaba aquí deixando o xogo
    // aberto mirando como o desatendías; marchar non contaba.
    const e = motor()
    await marchar(e, ESTADO_INICIAL, TOPE_AUSENCIA)
    expect(sombrasAcesas(e)).toHaveLength(4)
  })

  it('unha ausencia curta aínda non deixa cicatrices', async () => {
    const e = motor()
    await marchar(e, ESTADO_INICIAL, 10)
    expect(sombrasAcesas(e)).toHaveLength(0)
  })

  it('ao volver non está a atender a nada: non estabas', async () => {
    const p = await marchar(motor(), { ...ESTADO_INICIAL, atencion: { referente: 'auga', forza: 100 } }, 30)
    expect(p.atencion.referente).toBeNull()
  })

  it('os días avanzan', async () => {
    const p = await marchar(motor(), ESTADO_INICIAL, MOMENTOS_POR_DIA * 2)
    expect(p.dia).toBe(3)
  })
})

describe('o tope', () => {
  it('marchar un mes conta coma marchar tres días', async () => {
    const dunMes = await poñerAoDia(
      motor(),
      ESTADO_INICIAL,
      SEN_SOMBRAS,
      T0,
      T0 + 30 * 24 * 3600 * 1000,
    )
    expect(dunMes?.ausencia.momentos).toBe(TOPE_AUSENCIA)
    expect(dunMes?.ausencia.perdoados).toBeGreaterThan(0)
  })

  it('e por iso unha palabra ben aprendida sobrevive a unhas vacacións', async () => {
    // Sen tope, volver despois dun mes borraría o vocabulario enteiro e
    // o castigo deixaría de ensinar nada.
    const e = motor()
    let familiaridade: Familiaridade = {}
    let ditas: readonly string[] = []
    for (let i = 0; i < 20; i += 1) {
      const r = await ensinarPalabra(
        e,
        { referente: 'auga', forza: 100 },
        familiaridade,
        {},
        ditas,
        'auga',
        i,
      )
      familiaridade = r?.familiaridade ?? familiaridade
      ditas = r?.ditas ?? ditas
    }
    expect(e.getNodeState(idPalabra('auga'))?.currentTier).toBe(3)

    const p = await marchar(e, { ...ESTADO_INICIAL, familiaridade, ditas }, TOPE_AUSENCIA * 10)

    // Perde o rango — xa non a di ben — pero segue aí e recupérase.
    expect(e.getNodeState(idPalabra('auga'))?.currentTier).toBeLessThan(3)
    expect(comprensionDe(p.familiaridade, 'auga')).toBeGreaterThan(50)
  })
})

describe('o que se conta ao volver', () => {
  it('é un resumo, non trescentos «vaille esquecendo»', async () => {
    const r = await poñerAoDia(
      motor(),
      ESTADO_INICIAL,
      SEN_SOMBRAS,
      T0,
      T0 + TOPE_AUSENCIA * MOMENTO_MS,
    )
    expect(r?.acontecementos).toHaveLength(1)
    expect(r?.acontecementos[0]?.tipo).toBe('ausencia')
    expect(r?.acontecementos[0]?.texto).toContain('3 días')
  })
})
// ── FIN: probas da ausencia ──
