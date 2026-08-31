// ── INICIO: probas da linguaxe ──
// O que se proba aquí é o que a v1 non podía facer: entender e falar por
// separado, e non poder dicir unha palabra que aínda entendes mal ou para
// a que che faltan sons.

import { TreeEngine } from '@yggdrasil-forge/core'
import { describe, expect, it } from 'vitest'
import {
  type Atencion,
  type Familiaridade,
  LIMIARES_PALABRA,
  MARXE_ESQUECEMENTO,
  SEN_ATENCION,
  comprensionDe,
  ensinarPalabra,
  esquecer,
  idPalabra,
  idSon,
  rangoDeProducion,
  sonsDominados,
} from './linguaxe.js'
import { menteSemente } from './mente-semente.js'

function motor(): TreeEngine {
  return new TreeEngine(menteSemente(), { audit: { enabled: true } })
}

const ATENTO: Atencion = { referente: 'auga', forza: 100 }

interface Crianza {
  readonly familiaridade: Familiaridade
  readonly ditas: readonly string[]
  readonly producion: number
  readonly comprension: number
  readonly formas: readonly string[]
  readonly perfectas: number
}

/** Ensina a palabra N veces coa atención dada e resume o que pasou. */
async function ensinar(
  e: TreeEngine,
  palabra: string,
  veces: number,
  atencion: Atencion = ATENTO,
): Promise<Crianza> {
  let familiaridade: Familiaridade = {}
  let ditas: readonly string[] = []
  const formas: string[] = []
  let producion = 0
  let comprension = 0
  let perfectas = 0

  for (let i = 0; i < veces; i += 1) {
    const r = await ensinarPalabra(e, atencion, familiaridade, ditas, palabra, i)
    if (r === null) {
      continue
    }
    familiaridade = r.familiaridade
    ditas = r.ditas
    producion = r.producion
    comprension = r.comprension
    formas.push(r.forma)
    if (r.perfecta) {
      perfectas += 1
    }
  }
  return { familiaridade, ditas, producion, comprension, formas, perfectas }
}

describe('capa 0 — os sons entran sempre', () => {
  it('oír unha palabra fai nacer un nodo por cada son', async () => {
    const e = motor()
    await ensinarPalabra(e, SEN_ATENCION, {}, [], 'auga', 1)

    for (const son of ['a', 'u', 'g']) {
      expect(e.getTreeDef().nodes.some((n) => n.id === idSon(son))).toBe(true)
    }
    expect((e.getTreeDef().groups ?? []).some((g) => g.id === 'sons')).toBe(true)
  })

  it('a rexión SONS créase UNHA vez, non unha por son', async () => {
    const e = motor()
    await ensinarPalabra(e, SEN_ATENCION, {}, [], 'auga', 1)
    expect((e.getTreeDef().groups ?? []).filter((g) => g.id === 'sons')).toHaveLength(1)
  })

  it('ensinar SEN atención non é tempo perdido: dá sons', async () => {
    const e = motor()
    const r = await ensinar(e, 'mama', 6, SEN_ATENCION)

    // Cero comprensión…
    expect(comprensionDe(r.familiaridade, 'mama')).toBe(0)
    // …pero os sons si progresaron, e algún xa se domina.
    expect(r.familiaridade[idSon('m')] ?? 0).toBeGreaterThan(0)
    expect(sonsDominados(e).size).toBeGreaterThan(0)
  })

  it('as vogais dóminanse antes cás consoantes difíciles', async () => {
    const e = motor()
    const r = await ensinar(e, 'arroz', 4, SEN_ATENCION)
    expect(r.familiaridade[idSon('a')] ?? 0).toBeGreaterThan(r.familiaridade[idSon('rr')] ?? 0)
  })
})

describe('capa 1 — a atención', () => {
  it('sen atención non se comprende nada, por moito que se repita', async () => {
    const e = motor()
    const r = await ensinar(e, 'auga', 8, SEN_ATENCION)
    expect(comprensionDe(r.familiaridade, 'auga')).toBe(0)
  })

  it('fóra de contexto tampouco: a palabra ten que casar co que se atende', async () => {
    const e = motor()
    const r = await ensinar(e, 'auga', 5, { referente: 'fame', forza: 100 })
    expect(comprensionDe(r.familiaridade, 'auga')).toBe(0)
  })

  it('a atención frouxa ensina menos ca a atención chea', async () => {
    const chea = await ensinar(motor(), 'auga', 1, { referente: 'auga', forza: 100 })
    const frouxa = await ensinar(motor(), 'auga', 1, { referente: 'auga', forza: 25 })

    expect(comprensionDe(chea.familiaridade, 'auga')).toBeGreaterThan(
      comprensionDe(frouxa.familiaridade, 'auga'),
    )
  })
})

describe('capa 2 — entender vai por diante de falar', () => {
  it('unha soa exposición non chega para nada: xa non son tres clics', async () => {
    const r = await ensinar(motor(), 'auga', 1)
    expect(r.producion).toBe(0)
    expect(r.comprension).toBeLessThan(LIMIARES_PALABRA[0])
  })

  it('o rango 3 pide as DÚAS cousas: comprensión chea e todos os sons', () => {
    const todos = new Set(['a', 'u', 'g'])
    expect(rangoDeProducion(100, 'auga', todos)).toBe(3)
    // Enténdea perfectamente pero fáltalle o /g/: queda no 2.
    expect(rangoDeProducion(100, 'auga', new Set(['a', 'u']))).toBe(2)
    expect(rangoDeProducion(65, 'auga', todos)).toBe(1)
    expect(rangoDeProducion(10, 'auga', todos)).toBe(0)
  })

  it('un rango gáñase no limiar pero só se perde por debaixo da marxe', () => {
    const todos = new Set(['a', 'u', 'g'])
    // 90 non chega para gañar o rango 3…
    expect(rangoDeProducion(90, 'auga', todos)).toBe(2)
    // …pero, unha vez gañado, 90 tampouco o quita: iso é a histérese, e
    // é o que evita que a palabra parpadee a cada momento.
    expect(rangoDeProducion(90, 'auga', todos, MARXE_ESQUECEMENTO)).toBe(3)
  })

  it('a palabra que lle sae vai mellorando, non aparece feita', async () => {
    const r = await ensinar(motor(), 'auga', 12)
    expect(r.formas[0]).toBe('')
    expect(r.formas.at(-1)).toBe('auga')
    // E polo medio pasou por formas intermedias distintas das dúas.
    expect(new Set(r.formas).size).toBeGreaterThan(2)
  })

  it('chega a dicila ben, e iso avísase unha soa vez', async () => {
    const e = motor()
    const r = await ensinar(e, 'auga', 16)
    expect(e.getNodeState(idPalabra('auga'))?.currentTier).toBe(3)
    expect(e.getNodeState(idPalabra('auga'))?.state).toBe('maxed')
    expect(r.perfectas).toBe(1)
    expect(r.ditas).toEqual(['auga'])
  })

  it('unha palabra con sons difíciles resístese máis ca unha doada', async () => {
    // Coas MESMAS exposicións: «mama» son dous sons doados; «arroz»
    // leva /rr/ e /z/, dos que máis custan.
    const doada = await ensinar(motor(), 'mama', 10, { referente: 'amor', forza: 100 })
    const dura = await ensinar(motor(), 'arroz', 10, { referente: 'fame', forza: 100 })

    expect(doada.formas.at(-1)).toBe('mama')
    expect(dura.formas.at(-1)).not.toBe('arroz')
    expect(doada.producion).toBeGreaterThan(dura.producion)
  })
})

describe('o esquecemento, agora sobre a comprensión', () => {
  it('a comprensión decae soa', async () => {
    const e = motor()
    const r = await ensinar(e, 'auga', 3)
    const antes = comprensionDe(r.familiaridade, 'auga')
    const despois = await esquecer(e, r.familiaridade, 1)
    expect(comprensionDe(despois.familiaridade, 'auga')).toBeLessThan(antes)
  })

  it('ao caer por baixo do limiar, pérdese o rango de produción', async () => {
    const e = motor()
    const r = await ensinar(e, 'auga', 16)
    expect(e.getNodeState(idPalabra('auga'))?.currentTier).toBe(3)

    let familiaridade = r.familiaridade
    for (let i = 0; i < 40; i += 1) {
      familiaridade = (await esquecer(e, familiaridade, i)).familiaridade
    }
    expect(e.getNodeState(idPalabra('auga'))?.currentTier).toBeLessThan(3)
  })

  it('os SONS non se esquecen: unha vez que sabes facer /a/, sábelo', async () => {
    const e = motor()
    const r = await ensinar(e, 'auga', 16)
    const antes = r.familiaridade[idSon('a')] ?? 0

    let familiaridade = r.familiaridade
    for (let i = 0; i < 40; i += 1) {
      familiaridade = (await esquecer(e, familiaridade, i)).familiaridade
    }
    expect(familiaridade[idSon('a')] ?? 0).toBe(antes)
    expect(sonsDominados(e).has('a')).toBe(true)
  })
})
// ── FIN: probas da linguaxe ──
