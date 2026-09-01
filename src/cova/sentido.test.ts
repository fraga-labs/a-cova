// ── INICIO: probas do significado ──
// Capa 3. Dúas cousas que a v2 non podía facer: que unha palabra
// signifique de máis, e que despois se estreite soa.

import { TreeEngine } from '@yggdrasil-forge/core'
import { describe, expect, it } from 'vitest'
import { type Familiaridade, ensinarPalabra, idPalabra } from './linguaxe.js'
import { menteSemente } from './mente-semente.js'
import { PREFIXO, REXIONS } from './rexions.js'
import {
  type Referentes,
  estaSobreextendida,
  idSituacion,
  normalizarReferentes,
  podar,
  reconciliarSentidos,
  reforzar,
  sentidoPrincipal,
  sentidosDe,
} from './sentido.js'

function motor(): TreeEngine {
  return new TreeEngine(menteSemente(), {})
}

/** Ensina `palabra` `veces` veces na situación dada. */
async function ensinar(
  e: TreeEngine,
  estado: { familiaridade: Familiaridade; referentes: Referentes },
  palabra: string,
  referente: 'fame' | 'amor' | 'auga',
  veces: number,
): Promise<void> {
  for (let i = 0; i < veces; i += 1) {
    const r = await ensinarPalabra(
      e,
      { referente, forza: 100 },
      estado.familiaridade,
      estado.referentes,
      [],
      palabra,
      i,
    )
    if (r === null) {
      continue
    }
    estado.familiaridade = r.familiaridade
    estado.referentes = r.referentes
  }
}

describe('unha palabra pode significar de máis', () => {
  it('ensinala en dúas situacións non borra a primeira', async () => {
    // Isto é o que a v2 non podía: `referentes[nodo] = situacion`
    // machacaba a anterior en silencio.
    const e = motor()
    const estado: { familiaridade: Familiaridade; referentes: Referentes } = {
      familiaridade: {},
      referentes: {},
    }
    await ensinar(e, estado, 'papa', 'fame', 4)
    await ensinar(e, estado, 'papa', 'amor', 4)

    const sentidos = estado.referentes[idPalabra('papa')]
    expect(sentidosDe(sentidos)).toHaveLength(2)
    expect(estaSobreextendida(sentidos)).toBe(true)
  })

  it('unha soa exposición non abonda para significar algo', () => {
    const r = reforzar({}, 'palabra:x', 'fame', 100)
    expect(sentidosDe(r['palabra:x'])).toEqual([])
  })

  it('a atención frouxa liga menos', () => {
    const chea = reforzar({}, 'p', 'fame', 100)['p']?.fame ?? 0
    const frouxa = reforzar({}, 'p', 'fame', 25)['p']?.fame ?? 0
    expect(chea).toBeGreaterThan(frouxa)
  })

  it('e o sentido principal é o que máis tira', () => {
    const r = { p: { fame: 90, amor: 40 } }
    expect(sentidoPrincipal(r.p)).toBe('fame')
  })
})

describe('e despois estréitase soa', () => {
  it('unha reclamación débil retírase cando a situación ten dona clara', () => {
    // «papa» significa comer (forte) e agarimo (frouxo). «mama» é
    // claramente a palabra do agarimo. «papa» deixa de reclamalo.
    const antes: Referentes = {
      'palabra:papa': { fame: 90, amor: 33 },
      'palabra:mama': { amor: 88 },
    }
    const despois = podar(antes)
    expect(sentidosDe(despois['palabra:papa'])).toEqual(['fame'])
    expect(sentidosDe(despois['palabra:mama'])).toEqual(['amor'])
  })

  it('pero non se lle quita á palabra o seu propio sentido', () => {
    // «papa» só significa agarimo, aínda que «mama» sexa máis forte:
    // estreitar un significado non é borralo.
    const despois = podar({
      'palabra:papa': { amor: 33 },
      'palabra:mama': { amor: 99 },
    })
    expect(sentidosDe(despois['palabra:papa'])).toEqual(['amor'])
  })

  it('e dúas palabras poden significar o mesmo se as dúas están fortes', () => {
    // Se non, os conceptos —que nacen de palabras que comparten
    // situación— non poderían nacer nunca.
    const despois = podar({
      'palabra:auga': { auga: 90 },
      'palabra:bano': { auga: 85 },
    })
    expect(sentidosDe(despois['palabra:auga'])).toEqual(['auga'])
    expect(sentidosDe(despois['palabra:bano'])).toEqual(['auga'])
  })
})

describe('o que se debuxa no grafo', () => {
  it('a situación faise nodo, na rexión MUNDO', async () => {
    const e = motor()
    const estado: { familiaridade: Familiaridade; referentes: Referentes } = {
      familiaridade: {},
      referentes: {},
    }
    await ensinar(e, estado, 'papa', 'fame', 4)
    await reconciliarSentidos(e, estado.referentes, 1)

    const nodo = e.getTreeDef().nodes.find((n) => n.id === idSituacion('fame'))
    expect(nodo?.group).toBe(REXIONS.mundo)
    expect((e.getTreeDef().groups ?? []).filter((g) => g.id === REXIONS.mundo)).toHaveLength(1)
  })

  it('a sobreextensión VESE: dúas arestas saíndo da mesma palabra', async () => {
    const e = motor()
    const estado: { familiaridade: Familiaridade; referentes: Referentes } = {
      familiaridade: {},
      referentes: {},
    }
    await ensinar(e, estado, 'papa', 'fame', 4)
    await ensinar(e, estado, 'papa', 'amor', 4)
    await reconciliarSentidos(e, estado.referentes, 1)

    const saintes = e
      .getTreeDef()
      .edges.filter((x) => x.source === idPalabra('papa') && x.id.startsWith('e-sentido-'))
    expect(saintes).toHaveLength(2)
  })

  it('e a corrección tamén: a aresta errada desaparece', async () => {
    // A mellor imaxe que pode dar isto — a mente corrixíndose soa.
    const e = motor()
    const estado: { familiaridade: Familiaridade; referentes: Referentes } = {
      familiaridade: {},
      referentes: {},
    }
    await ensinar(e, estado, 'papa', 'fame', 8)
    await ensinar(e, estado, 'papa', 'amor', 2)
    await reconciliarSentidos(e, estado.referentes, 1)
    expect(
      e.getTreeDef().edges.filter((x) => x.source === idPalabra('papa')).length,
    ).toBeGreaterThan(1)

    // Chega «mama», que si é a palabra dos brazos.
    await ensinar(e, estado, 'mama', 'amor', 8)
    const r = await reconciliarSentidos(e, estado.referentes, 2)

    const saintes = e
      .getTreeDef()
      .edges.filter((x) => x.source === idPalabra('papa') && x.id.startsWith('e-sentido-'))
    expect(saintes).toHaveLength(1)
    expect(saintes[0]?.target).toBe(idSituacion('fame'))
    expect(r.acontecementos.some((a) => a.tipo === 'estreita')).toBe(true)
  })

  it('non se repite traballo: reconciliar dúas veces non engade nada', async () => {
    const e = motor()
    const estado: { familiaridade: Familiaridade; referentes: Referentes } = {
      familiaridade: {},
      referentes: {},
    }
    await ensinar(e, estado, 'papa', 'fame', 4)
    const r1 = await reconciliarSentidos(e, estado.referentes, 1)
    const arestas = e.getTreeDef().edges.length
    const r2 = await reconciliarSentidos(e, r1.referentes, 2)

    expect(e.getTreeDef().edges).toHaveLength(arestas)
    expect(r2.acontecementos).toEqual([])
  })

  it('o mundo só ten o que lle amosaches', async () => {
    const e = motor()
    const estado: { familiaridade: Familiaridade; referentes: Referentes } = {
      familiaridade: {},
      referentes: {},
    }
    await ensinar(e, estado, 'papa', 'fame', 4)
    await reconciliarSentidos(e, estado.referentes, 1)

    const situacions = e.getTreeDef().nodes.filter((n) => n.id.startsWith(PREFIXO.situacion))
    expect(situacions).toHaveLength(1)
  })
})

describe('os bebés de antes da capa 3', () => {
  it('non perden o que sabían', () => {
    // Formato vello: unha situación por palabra, como texto.
    const vello = { 'palabra:auga': 'auga', 'palabra:papa': 'fame' }
    const novo = normalizarReferentes(vello)
    expect(sentidoPrincipal(novo['palabra:auga'])).toBe('auga')
    expect(sentidoPrincipal(novo['palabra:papa'])).toBe('fame')
  })

  it('e o formato novo pasa tal cal', () => {
    const novo = { 'palabra:x': { fame: 70, amor: 20 } }
    expect(normalizarReferentes(novo)).toEqual(novo)
  })

  it('e o lixo non rompe nada', () => {
    expect(normalizarReferentes(null)).toEqual({})
    expect(normalizarReferentes(42)).toEqual({})
  })
})
// ── FIN: probas do significado ──
