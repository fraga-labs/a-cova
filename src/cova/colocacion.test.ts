// ── INICIO: probas da colocación ──
// Unha soa pregunta, e é a que fallaba: hai dous nodos tocándose?
//
// A medida vella era `distancia < 36` cun radio inventado a ollo. Daba
// cero mentres o navegador ensinaba as dúas primeiras memorias
// solapadas. Aquí cada nodo mide o que de verdade mide.

import { TreeEngine } from '@yggdrasil-forge/core'
import { describe, expect, it } from 'vitest'
import { colocar, raioVisual } from './colocacion.js'
import { ensinarPalabra } from './linguaxe.js'
import { menteSemente } from './mente-semente.js'
import { nacerMemoria, xerarConceptos } from './politica.js'
import { xerarSombras } from './sombras.js'

/** Pares de nodos cuxas figuras se pisan, co canto se pisan. */
function pisados(engine: TreeEngine): readonly string[] {
  const treeDef = engine.getTreeDef()
  const posicions = colocar(treeDef)
  const nodos = treeDef.nodes.map((n) => ({
    id: n.id,
    r: raioVisual(n),
    p: posicions.get(n.id),
  }))
  const fóra: string[] = []
  for (let i = 0; i < nodos.length; i += 1) {
    for (let j = i + 1; j < nodos.length; j += 1) {
      const a = nodos[i]
      const b = nodos[j]
      if (a?.p === undefined || b?.p === undefined) {
        continue
      }
      const folgura = Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y) - (a.r + b.r)
      if (folgura < 0) {
        fóra.push(`${a.id} ↔ ${b.id} (${folgura.toFixed(0)})`)
      }
    }
  }
  return fóra
}

function motor(): TreeEngine {
  return new TreeEngine(menteSemente(), {})
}

describe('canto ocupa un nodo', () => {
  it('un cadrado ocupa máis ca o seu radio: a esquina chega a r·√2', () => {
    // `milestone` (as memorias) é o único cadrado do renderer, e é o que
    // facía que dúas memorias a 58 unidades se pisasen 7.
    const memoria = { id: 'm', label: 'm', type: 'milestone' } as never
    expect(raioVisual(memoria)).toBeCloseTo(24 * Math.SQRT2, 3)
  })

  it('un octógono ocupa o seu radio, non máis', () => {
    // As sombras: `keystone` (34) cun `shape` propio.
    const sombra = { id: 's', label: 's', type: 'keystone', shape: 'octagon' } as never
    expect(raioVisual(sombra)).toBe(34)
  })

  it('un `size` declarado manda por riba do tipo', () => {
    expect(raioVisual({ id: 'x', label: 'x', type: 'small', size: 99 } as never)).toBe(99)
  })
})

describe('ninguén se pisa', () => {
  it('na mente que acaba de nacer', () => {
    expect(pisados(motor())).toEqual([])
  })

  it('nunha mente con memorias, conceptos e sombras', async () => {
    // Este é o caso que estaba roto: as rexións pequenas están cheas de
    // nodos grandes (o cadrado das memorias, o octógono das sombras) e
    // colocábanse coa separación pensada para unha palabra.
    const e = motor()
    let familiaridade = {}
    let referentes = {}
    let ditas: readonly string[] = []
    for (const [palabra, referente] of [
      ['papa', 'fame'],
      ['leite', 'fame'],
      ['auga', 'auga'],
      ['toalla', 'auga'],
      ['pelota', 'xogo'],
      ['bicicleta', 'xogo'],
    ] as const) {
      for (let i = 0; i < 16; i += 1) {
        const r = await ensinarPalabra(
          e,
          { referente, forza: 100 },
          familiaridade,
          referentes,
          ditas,
          palabra,
          i,
        )
        if (r === null) {
          break
        }
        familiaridade = r.familiaridade
        referentes = r.referentes
        ditas = r.ditas
      }
    }
    await xerarConceptos(e, referentes, 1)
    for (const m of ['primeira-comida', 'primeira-palabra', 'primeiro-bano', 'xogo-coidado']) {
      await nacerMemoria(e, m, m, `a memoria ${m}`, 1)
    }
    // Soidade ao máximo: as catro sombras dunha vez.
    await xerarSombras(e, 100)

    const treeDef = e.getTreeDef()
    expect(treeDef.nodes.filter((n) => n.id.startsWith('sombra:'))).toHaveLength(4)
    expect(treeDef.nodes.filter((n) => n.id.startsWith('memoria:')).length).toBeGreaterThan(4)
    expect(pisados(e)).toEqual([])
  })
})

describe('e as palabras non pagan o tamaño dos nodos grandes', () => {
  it('unha morea de palabras mantén a separación mínima', async () => {
    // Se a separación saíse do nodo máis grande da REXIÓN, `verbo` e
    // `mais` (que viven en LINGUAXE) inflarían as douscentas palabras un
    // 31 %. Cada morea leva a súa, e as palabras son todas do mesmo
    // tamaño, así que quedan á distancia que manda a etiqueta: 58.
    const e = motor()
    let familiaridade = {}
    let referentes = {}
    let ditas: readonly string[] = []
    for (let k = 0; k < 20; k += 1) {
      const r = await ensinarPalabra(
        e,
        { referente: 'auga', forza: 100 },
        familiaridade,
        referentes,
        ditas,
        `mata${k}`,
        k,
      )
      if (r === null) {
        continue
      }
      familiaridade = r.familiaridade
      referentes = r.referentes
      ditas = r.ditas
    }

    const posicions = colocar(e.getTreeDef())
    const palabras = e
      .getTreeDef()
      .nodes.filter((n) => n.id.startsWith('palabra:mata'))
      .map((n) => posicions.get(n.id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined)

    let minima = Number.POSITIVE_INFINITY
    for (let i = 0; i < palabras.length; i += 1) {
      for (let j = i + 1; j < palabras.length; j += 1) {
        const a = palabras[i]
        const b = palabras[j]
        if (a === undefined || b === undefined) {
          continue
        }
        minima = Math.min(minima, Math.hypot(a.x - b.x, a.y - b.y))
      }
    }
    expect(minima).toBeCloseTo(58, 0)
  })
})
// ── FIN: probas da colocación ──
